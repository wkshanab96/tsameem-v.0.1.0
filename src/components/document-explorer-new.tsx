"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
import { Progress } from "./ui/progress";
import { File as FileType, FileRevision, Folder } from "@/lib/types";
import {
  createFolder,
  deleteItem,
  downloadFile,
  fetchFolderContents,
  fetchFolderPath,
  fetchRootFolder,
  formatDate,
  formatFileSize,
  initializeStorage,
  moveItem,
  renameItem,
  toggleStarred,
  uploadFile,
} from "@/lib/file-utils";

// Import modular components
import { AllFiles } from "./file-explorer/AllFiles";
import { AIFileExpert } from "./file-explorer/AIFileExpert";
import { AISearch } from "./file-explorer/AISearch";
import { FilePreviewDialog } from "./file-explorer/FilePreviewDialog";
import {
  SettingsRegular,
  SearchRegular,
  OpenRegular,
} from "@fluentui/react-icons";
import { createClient } from "../../supabase/client";

export default function DocumentExplorerNew() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFileForAI, setSelectedFileForAI] = useState<FileType | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [folderContents, setFolderContents] = useState<{
    folders: Folder[];
    files: FileType[];
  }>({ folders: [], files: [] });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{
    item: Folder | FileType;
    type: "folder" | "file";
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [clipboardItem, setClipboardItem] = useState<{
    item: Folder | FileType;
    type: "folder" | "file";
  } | null>(null);
  const [clipboardAction, setClipboardAction] = useState<"copy" | "cut" | null>(
    null,
  );
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<FileRevision | null>(
    null,
  );
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<FileType | null>(null);

  // Initialize storage and load root folder
  useEffect(() => {
    const init = async () => {
      try {
        // Removed initializeStorage() call from here to prevent running on every load
        const rootFolder = await fetchRootFolder();
        if (rootFolder) { // Check if rootFolder is successfully fetched/created
            setCurrentFolderId(rootFolder.id);
            loadFolderContents(rootFolder.id);
        } else {
             throw new Error("Could not determine root folder.");
        }
      } catch (error) {
        console.error("Error initializing:", error);
        toast({
          title: "Error",
          description: "Failed to initialize storage or load root folder",
          variant: "destructive",
        });
      }
    };

    init();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Load folder contents
  const loadFolderContents = async (folderId: string) => {
    // Prevent loading if folderId is null (e.g., during initial state)
    if (!folderId) {
        console.warn("loadFolderContents called with null folderId");
        return;
    }
    try {
      setIsLoading(true);
      const contents = await fetchFolderContents(folderId);
      setFolderContents(contents);

      // Load folder path
      const path = await fetchFolderPath(folderId);
      setFolderPath(path);
    } catch (error) {
      console.error("Error loading folder contents:", error);
      toast({
        title: "Error",
        description: "Failed to load folder contents",
        variant: "destructive",
      });
      // Optionally reset contents on error
      setFolderContents({ folders: [], files: [] });
      setFolderPath([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // No need to reload here, content is already loaded or handled by specific tabs
  };

  // Navigate to folder
  const navigateToFolder = (folder: Folder) => {
    // Check if already in the target folder to prevent unnecessary loads
    if (folder.id === currentFolderId) return;
    setCurrentFolderId(folder.id);
    loadFolderContents(folder.id); // Still need to load contents for the new folder
  };

  // Navigate to root folder
  const navigateToRoot = async () => {
    try {
      const rootFolder = await fetchRootFolder();
      if (!rootFolder) throw new Error("Could not determine root folder.");
      // Check if already in the root folder
      if (rootFolder.id === currentFolderId) return;
      setCurrentFolderId(rootFolder.id);
      loadFolderContents(rootFolder.id);
    } catch (error) {
      console.error("Error navigating to root:", error);
      toast({
        title: "Error",
        description: "Failed to navigate to root folder",
        variant: "destructive",
      });
    }
  };

  // State for file name conflict resolution
  const [conflictingFile, setConflictingFile] = useState<File | null>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [conflictResolution, setConflictResolution] = useState<
    "rename" | "revision"
  >("revision");
  const [newFileName, setNewFileName] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !currentFolderId) {
      console.log("No files selected or no current folder");
      return;
    }

    console.log(
      `Starting upload for ${files.length} files to folder ${currentFolderId}`,
    );

    // Convert FileList to array for easier handling
    const fileArray = Array.from(files);
    setPendingFiles(fileArray);
    setTotalFiles(fileArray.length);
    setCurrentFileIndex(0);
    setIsUploading(true);
    setUploadProgress(0);
    setIsUploadDialogOpen(true); // Open dialog when starting upload

    // Start processing files
    processNextFile(fileArray, 0, currentFolderId);
  };

  // Process files one by one, checking for conflicts
  const processNextFile = async (
    files: File[],
    index: number,
    folderId: string,
  ) => {
    if (index >= files.length) {
      // All files processed
      console.log("All files processed successfully");
      finishUpload();
      return;
    }

    setCurrentFileIndex(index);
    const file = files[index];
    console.log(`Processing file ${index + 1}/${files.length}: ${file.name}`);

    try {
      // Check if file with same name exists
      const supabase = createClient();
      const { data: existingFiles, error } = await supabase
        .from("files")
        .select("id, name")
        .eq("folder_id", folderId)
        .eq("name", file.name);

      if (error) {
        console.error("Error checking for existing files:", error);
        throw error;
      }

      if (existingFiles && existingFiles.length > 0) {
        // File name conflict found
        console.log(`Conflict found for file: ${file.name}`);
        setConflictingFile(file);
        setNewFileName(file.name);
        setIsConflictDialogOpen(true);
        // Wait for user decision in handleConflictResolution
      } else {
        // No conflict, upload directly
        console.log(`No conflict, uploading file directly: ${file.name}`);
        await uploadFileWithProgress(file, folderId);
        // Process next file after a short delay to allow UI update
        setTimeout(() => processNextFile(files, index + 1, folderId), 100);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing file ${file.name}:`, error);
      toast({
        title: "Error",
        description: `Failed to process ${file.name}: ${errorMessage}`,
        variant: "destructive",
      });
      // Continue with next file despite error after a short delay
      setTimeout(() => processNextFile(files, index + 1, folderId), 100);
    }
  };

  // Handle conflict resolution
  const handleConflictResolution = async () => {
    if (!conflictingFile || !currentFolderId) return;

    const fileToProcess = conflictingFile; // Capture the file being processed
    setIsConflictDialogOpen(false); // Close dialog immediately
    setConflictingFile(null); // Clear conflicting file state

    try {
      if (conflictResolution === "rename" && newFileName) {
        // Create a new file with the renamed file
        const renamedFile = new File([fileToProcess], newFileName, {
          type: fileToProcess.type,
        });
        await uploadFileWithProgress(renamedFile, currentFolderId);
      } else {
        // Upload as a new revision
        await uploadFileWithProgress(
          fileToProcess,
          currentFolderId,
          undefined,
          true,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error resolving file conflict:", error);
      toast({
        title: "Error",
        description: `Failed to resolve file conflict for ${fileToProcess.name}: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      // Process next file regardless of conflict resolution outcome
      processNextFile(pendingFiles, currentFileIndex + 1, currentFolderId);
    }
  };

  // Upload a single file with progress tracking
  const uploadFileWithProgress = async (
    file: File,
    folderId: string,
    customProgressCallback?: (progress: number) => void,
    asRevision = false,
  ) => {
    try {
      console.log(
        `Starting upload for file: ${file.name}, size: ${formatFileSize(file.size)}`,
      );

      if (file.size === 0) throw new Error("File is empty");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const fileBlob = file.slice(0, file.size, file.type);
      const secureFile = new File([fileBlob], file.name, { type: file.type });

      if (customProgressCallback) customProgressCallback(5);
      else setUploadProgress(prev => Math.max(5, prev)); // Show initial progress

      const result = await uploadFile(
        secureFile,
        folderId,
        (progress) => {
          if (customProgressCallback) {
            customProgressCallback(progress);
          } else {
            const fileProgress = progress / 100;
            const overallProgress =
              ((currentFileIndex + fileProgress) / totalFiles) * 100;
            setUploadProgress(Math.min(100, Math.round(overallProgress))); // Ensure progress doesn't exceed 100
          }
        },
        asRevision,
      );

      if (!result) throw new Error("Upload returned no result");

      console.log(`Upload completed successfully for file: ${file.name}`);
      // Optimistically add the uploaded file to the state
      setFolderContents(prev => ({
          ...prev,
          files: [...prev.files, result]
      }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error uploading ${file.name}:`, error);
      toast({
        title: "Upload Error",
        description: `Failed to upload ${file.name}: ${errorMessage}`,
        variant: "destructive",
      });
      throw error; // Re-throw error to be caught by processNextFile
    }
  };

  // Finish the upload process
  const finishUpload = () => {
    const successCount = currentFileIndex; // Index is 0-based, so index is the count of processed files

    toast({
      title: "Upload Complete",
      description: `${successCount} of ${totalFiles} file(s) processed.`, // Adjusted message
    });

    // Optionally reload contents if needed, though optimistic updates handle additions
    // if (currentFolderId) {
    //   loadFolderContents(currentFolderId);
    // }

    // Reset all upload state
    setIsUploading(false);
    setIsUploadDialogOpen(false);
    setPendingFiles([]);
    setTotalFiles(0);
    setCurrentFileIndex(0);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Create new folder (Optimistic UI)
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentFolderId) return;

    const tempId = `temp-${Date.now()}`;
    const parentPath = folderPath.map(f => f.name).join('/') || '/';
    const newFolderOptimistic: Folder = {
        id: tempId,
        name: newFolderName,
        parent_id: currentFolderId,
        path: `${parentPath}/${newFolderName}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: '', // Placeholder
        starred: false,
    };

    // Optimistically add folder
    setFolderContents(prev => ({ ...prev, folders: [...prev.folders, newFolderOptimistic] }));
    const originalFolderName = newFolderName;
    setIsNewFolderDialogOpen(false);
    setNewFolderName("");

    try {
      const createdFolder = await createFolder(originalFolderName, currentFolderId);
      // Update the temporary folder with the real ID from the backend
      setFolderContents(prev => ({
          ...prev,
          folders: prev.folders.map(f => f.id === tempId ? createdFolder : f)
      }));
      toast({
        title: "Success",
        description: `Folder "${originalFolderName}" created successfully`,
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder. Reverting.",
        variant: "destructive",
      });
      // Revert optimistic update
      setFolderContents(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== tempId) }));
    }
  };

  // Delete item (Optimistic UI)
  const handleDeleteItem = async (id: string, type: "folder" | "file") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    const originalContents = { ...folderContents };
    const itemToDelete = type === 'folder'
        ? originalContents.folders.find(f => f.id === id)
        : originalContents.files.find(f => f.id === id);

    if (!itemToDelete) return; // Item not found

    const itemName = itemToDelete.name;

    // Optimistically remove the item from the UI
    setFolderContents((prev) => {
      if (type === "folder") {
        return { ...prev, folders: prev.folders.filter((f) => f.id !== id) };
      } else {
        return { ...prev, files: prev.files.filter((f) => f.id !== id) };
      }
    });

    try {
      // Call the backend delete function
      await deleteItem(id, type);
      toast({
        title: "Success",
        description: `${type === "folder" ? "Folder" : "File"} "${itemName}" deleted successfully`,
      });
      // No need to reload contents here as UI is already updated
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: `Failed to delete ${type} "${itemName}". Reverting changes.`,
        variant: "destructive",
      });
      // Revert the UI change if the delete failed
      setFolderContents(originalContents);
    }
  };

  // Open rename dialog
  const openRenameDialog = (
    item: Folder | FileType,
    type: "folder" | "file",
  ) => {
    setItemToRename({ item, type });
    setNewName(item.name);
    setIsRenameDialogOpen(true);
  };

  // Handle rename (Optimistic UI)
  const handleRename = async () => {
    if (!newName.trim() || !itemToRename) return;

    const originalContents = { ...folderContents };
    const originalName = itemToRename.item.name;
    const { item, type } = itemToRename;
    const itemId = item.id;

    // Optimistically update the name in the UI
     setFolderContents((prev) => {
       if (type === "folder") {
         return { ...prev, folders: prev.folders.map(f => f.id === itemId ? { ...f, name: newName, updated_at: new Date().toISOString() } : f) };
       } else {
         return { ...prev, files: prev.files.map(f => f.id === itemId ? { ...f, name: newName, updated_at: new Date().toISOString() } : f) };
       }
     });

    setIsRenameDialogOpen(false);
    setItemToRename(null);
    // Keep newName state for potential revert

    try {
      await renameItem(itemId, newName, type);
      toast({
        title: "Success",
        description: `${type === "folder" ? "Folder" : "File"} renamed successfully to "${newName}"`,
      });
      // Optionally reload contents if paths need updating (renameItem handles subpaths)
      if (currentFolderId) {
         loadFolderContents(currentFolderId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error renaming item:", error);
      toast({
        title: "Error",
        description: `Failed to rename ${type}: ${errorMessage}. Reverting.`,
        variant: "destructive",
      });
      // Revert optimistic update
      setFolderContents(originalContents);
    } finally {
       setNewName(""); // Clear new name state after attempt
    }
  };

  // Toggle starred status (Optimistic UI)
  const handleToggleStarred = async (
    id: string,
    type: "folder" | "file",
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    const originalContents = { ...folderContents };
    let currentStarredStatus = false;

    // Optimistically update starred status
    setFolderContents(prev => {
        if (type === 'folder') {
            const folderIndex = prev.folders.findIndex(f => f.id === id);
            if (folderIndex === -1) return prev;
            currentStarredStatus = prev.folders[folderIndex].starred;
            const updatedFolders = [...prev.folders];
            updatedFolders[folderIndex] = { ...updatedFolders[folderIndex], starred: !currentStarredStatus, updated_at: new Date().toISOString() };
            return { ...prev, folders: updatedFolders };
        } else {
            const fileIndex = prev.files.findIndex(f => f.id === id);
            if (fileIndex === -1) return prev;
            currentStarredStatus = prev.files[fileIndex].starred;
            const updatedFiles = [...prev.files];
            updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], starred: !currentStarredStatus, updated_at: new Date().toISOString() };
            return { ...prev, files: updatedFiles };
        }
    });

    try {
      const newStarredStatus = await toggleStarred(id, type);
      // Backend confirmed the status, UI is already updated
      toast({
        title: "Success",
        description: `${type === "folder" ? "Folder" : "File"} ${newStarredStatus ? "starred" : "unstarred"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling starred status:", error);
      toast({
        title: "Error",
        description: `Failed to update starred status. Reverting.`,
        variant: "destructive",
      });
      // Revert optimistic update
      setFolderContents(originalContents);
    }
  };

  // Copy item to clipboard
  const copyItem = (item: Folder | FileType, type: "folder" | "file") => {
    setClipboardItem({ item, type });
    setClipboardAction("copy");
    toast({
      title: "Copy",
      description: `${type === "folder" ? "Folder" : "File"} copied to clipboard`,
    });
  };

  // Cut item to clipboard
  const cutItem = (item: Folder | FileType, type: "folder" | "file") => {
    setClipboardItem({ item, type });
    setClipboardAction("cut");
    toast({
      title: "Cut",
      description: `${type === "folder" ? "Folder" : "File"} cut to clipboard`,
    });
  };

  // Paste item from clipboard
  const handlePaste = async () => {
    if (!clipboardItem || !clipboardAction || !currentFolderId) return;

    const itemToPaste = { ...clipboardItem }; // Copy clipboard item details
    setClipboardItem(null); // Clear clipboard optimistically
    setClipboardAction(null);

    try {
      if (clipboardAction === "cut") {
        // Optimistically move item in UI first
        setFolderContents(prev => {
            const folders = itemToPaste.type === 'folder' ? prev.folders.filter(f => f.id !== itemToPaste.item.id) : prev.folders;
            const files = itemToPaste.type === 'file' ? prev.files.filter(f => f.id !== itemToPaste.item.id) : prev.files;
            return { folders, files };
        });

        await moveItem(
          itemToPaste.item.id,
          currentFolderId,
          itemToPaste.type,
        );
        toast({
          title: "Success",
          description: `${itemToPaste.type === "folder" ? "Folder" : "File"} moved successfully`,
        });
        // Reload contents after successful move to get updated item
        loadFolderContents(currentFolderId);

      } else { // Copy operation
        if (itemToPaste.type === "folder") {
          // Create folder optimistically? Maybe too complex, just call backend
          await createFolder(
            `${itemToPaste.item.name} (Copy)`,
            currentFolderId,
          );
          toast({
            title: "Success",
            description: `Folder "${itemToPaste.item.name}" copied successfully`,
          });
          loadFolderContents(currentFolderId); // Reload to show copied folder
        } else {
          toast({
            title: "Info",
            description: `File copy functionality will be fully implemented in the next update`,
          });
           setClipboardItem(itemToPaste); // Restore clipboard if copy failed
           setClipboardAction('copy');
        }
      }
    } catch (error) {
      console.error("Error pasting item:", error);
      toast({
        title: "Error",
        description: `Failed to paste item`,
        variant: "destructive",
      });
      // Revert optimistic changes might be complex here, consider reloading
      if (currentFolderId) loadFolderContents(currentFolderId);
      setClipboardItem(itemToPaste); // Restore clipboard on error
      setClipboardAction(clipboardAction);
    }
  };

  // View file revisions
  const viewRevisions = (file: FileType) => {
    setSelectedFile(file);
    setSelectedRevision(file.revisions?.[0] || null);
    setIsRevisionDialogOpen(true);
  };

  // Download file
  const handleDownloadFile = async (file: FileType) => {
    try {
      await downloadFile(file.id);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  // Handle file selection for preview
  const handleFileSelection = (file: FileType) => {
    setFileToPreview(file);
    setIsPreviewDialogOpen(true);
  };

  // Handle file selection for AI analysis
  const handleFileAnalysis = (file: FileType) => {
    setSelectedFileForAI(file);
    setActiveTab("ai");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Document Explorer</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab("ai")}
              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="AI File Expert"
            >
              <SettingsRegular className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab("search")}
              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="AI Search"
            >
              <SearchRegular className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="ai">AI File Expert</TabsTrigger>
          <TabsTrigger value="search">AI Search</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AllFiles
            currentFolderId={currentFolderId}
            folderPath={folderPath}
            folders={folderContents.folders}
            files={folderContents.files}
            isLoading={isLoading}
            viewMode={viewMode}
            setViewMode={setViewMode}
            navigateToFolder={navigateToFolder}
            navigateToRoot={navigateToRoot}
            handleFileSelection={handleFileSelection}
            handleDownloadFile={handleDownloadFile}
            viewRevisions={viewRevisions}
            openRenameDialog={openRenameDialog}
            handleToggleStarred={handleToggleStarred}
            copyItem={copyItem}
            cutItem={cutItem}
            handleDeleteItem={handleDeleteItem}
            openNewFolderDialog={() => setIsNewFolderDialogOpen(true)}
            openUploadDialog={() => setIsUploadDialogOpen(true)}
            handlePaste={handlePaste}
            clipboardItem={clipboardItem}
            clipboardAction={clipboardAction}
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <AIFileExpert
            selectedFile={selectedFileForAI}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <AISearch
            files={folderContents.files} // Pass all files for potential fallback search
            onFileSelect={handleFileSelection}
          />
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (!isUploading) setIsUploadDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <label htmlFor="file-upload" className="cursor-pointer block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto h-12 w-12 text-gray-400"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop files here, or{" "}
                  <span className="text-blue-600 font-medium">browse</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Support for PDF, DOC, DOCX, TXT, DWG, DXF, JPG, PNG and more
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {isUploading && (
              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    Uploading file {currentFileIndex + 1} of {totalFiles}
                  </span>
                  <span className="text-gray-700 font-medium">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500">
                  {pendingFiles[currentFileIndex]?.name || "Processing..."}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isUploading) {
                  setIsUploadDialogOpen(false);
                }
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isUploading}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              Select Files
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Conflict Resolution Dialog */}
      <Dialog
        open={isConflictDialogOpen}
        onOpenChange={setIsConflictDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Name Conflict</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              A file named "{conflictingFile?.name}" already exists in this
              folder. What would you like to do?
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="revision"
                  name="conflictResolution"
                  value="revision"
                  checked={conflictResolution === "revision"}
                  onChange={() => setConflictResolution("revision")}
                  className="h-4 w-4 text-blue-600"
                />
                <label
                  htmlFor="revision"
                  className="text-sm font-medium text-gray-700"
                >
                  Keep as a new revision
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="rename"
                  name="conflictResolution"
                  value="rename"
                  checked={conflictResolution === "rename"}
                  onChange={() => setConflictResolution("rename")}
                  className="h-4 w-4 text-blue-600"
                />
                <label
                  htmlFor="rename"
                  className="text-sm font-medium text-gray-700"
                >
                  Rename file
                </label>
              </div>
            </div>
            {conflictResolution === "rename" && (
              <Input
                placeholder="New file name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConflictDialogOpen(false);
                // Skip this file and process next
                if (currentFolderId) {
                  processNextFile(
                    pendingFiles,
                    currentFileIndex + 1,
                    currentFolderId,
                  );
                }
              }}
            >
              Skip File
            </Button>
            <Button onClick={handleConflictResolution}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog
        open={isNewFolderDialogOpen}
        onOpenChange={setIsNewFolderDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Rename {itemToRename?.type === "folder" ? "Folder" : "File"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="New name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      {fileToPreview && (
        <FilePreviewDialog
          file={fileToPreview}
          isOpen={isPreviewDialogOpen}
          onClose={() => setIsPreviewDialogOpen(false)}
          onDownload={handleDownloadFile}
          onAnalyzeWithAI={handleFileAnalysis}
        />
      )}

      <Toaster />
    </div>
  );
}
