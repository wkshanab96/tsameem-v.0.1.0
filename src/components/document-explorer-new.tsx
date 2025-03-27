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
        await initializeStorage();
        const rootFolder = await fetchRootFolder();
        setCurrentFolderId(rootFolder.id);
        loadFolderContents(rootFolder.id);
      } catch (error) {
        console.error("Error initializing:", error);
        toast({
          title: "Error",
          description: "Failed to initialize storage",
          variant: "destructive",
        });
      }
    };

    init();
  }, []);

  // Load folder contents
  const loadFolderContents = async (folderId: string) => {
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
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all" && currentFolderId) {
      loadFolderContents(currentFolderId);
    }
  };

  // Navigate to folder
  const navigateToFolder = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    loadFolderContents(folder.id);
  };

  // Navigate to root folder
  const navigateToRoot = async () => {
    try {
      const rootFolder = await fetchRootFolder();
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
        // Process next file
        processNextFile(files, index + 1, folderId);
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      toast({
        title: "Error",
        description: `Failed to process ${file.name}: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      // Continue with next file despite error
      processNextFile(files, index + 1, folderId);
    }
  };

  // Handle conflict resolution
  const handleConflictResolution = async () => {
    if (!conflictingFile || !currentFolderId) return;

    try {
      if (conflictResolution === "rename" && newFileName) {
        // Create a new file with the renamed file
        const renamedFile = new File([conflictingFile], newFileName, {
          type: conflictingFile.type,
        });
        await uploadFileWithProgress(renamedFile, currentFolderId);
      } else {
        // Upload as a new revision
        await uploadFileWithProgress(
          conflictingFile,
          currentFolderId,
          undefined,
          true,
        );
      }
    } catch (error) {
      console.error("Error resolving file conflict:", error);
      toast({
        title: "Error",
        description: "Failed to resolve file conflict",
        variant: "destructive",
      });
    } finally {
      setIsConflictDialogOpen(false);
      setConflictingFile(null);
      // Process next file
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

      // Verify file is valid
      if (file.size === 0) {
        throw new Error("File is empty");
      }

      // Add a small delay before starting upload to ensure UI updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create a copy of the file to ensure it's properly accessible
      // This helps with some browser inconsistencies
      const fileBlob = file.slice(0, file.size, file.type);
      const secureFile = new File([fileBlob], file.name, { type: file.type });

      // Show initial progress
      if (customProgressCallback) customProgressCallback(5);
      else setUploadProgress(5);

      const result = await uploadFile(
        secureFile,
        folderId,
        (progress) => {
          if (customProgressCallback) {
            customProgressCallback(progress);
          } else {
            // Calculate overall progress
            const fileProgress = progress / 100;
            const overallProgress =
              ((currentFileIndex + fileProgress) / totalFiles) * 100;
            setUploadProgress(Math.round(overallProgress));
          }
        },
        asRevision,
      );

      if (!result) {
        throw new Error("Upload returned no result");
      }

      console.log(`Upload completed successfully for file: ${file.name}`);
      return result;
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      // Show more detailed error message
      toast({
        title: "Upload Error",
        description: `Failed to upload ${file.name}: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Finish the upload process
  const finishUpload = () => {
    const successCount = Math.max(currentFileIndex, 0);

    toast({
      title: "Upload Complete",
      description: `${successCount} of ${totalFiles} file(s) uploaded successfully`,
    });

    // Reload folder contents
    if (currentFolderId) {
      loadFolderContents(currentFolderId);
    }

    // Reset all upload state
    setIsUploading(false);
    setIsUploadDialogOpen(false);
    setPendingFiles([]);
    setTotalFiles(0);
    setCurrentFileIndex(0);
    setUploadProgress(0);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentFolderId) return;

    try {
      await createFolder(newFolderName, currentFolderId);
      toast({
        title: "Success",
        description: `Folder "${newFolderName}" created successfully`,
      });

      // Reload folder contents
      loadFolderContents(currentFolderId);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    } finally {
      setIsNewFolderDialogOpen(false);
      setNewFolderName("");
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string, type: "folder" | "file") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      await deleteItem(id, type);
      toast({
        title: "Success",
        description: `${type === "folder" ? "Folder" : "File"} deleted successfully`,
      });

      // Reload folder contents
      if (currentFolderId) {
        loadFolderContents(currentFolderId);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: `Failed to delete ${type}`,
        variant: "destructive",
      });
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

  // Handle rename
  const handleRename = async () => {
    if (!newName.trim() || !itemToRename) return;

    try {
      await renameItem(itemToRename.item.id, newName, itemToRename.type);
      toast({
        title: "Success",
        description: `${itemToRename.type === "folder" ? "Folder" : "File"} renamed successfully`,
      });

      // Reload folder contents
      if (currentFolderId) {
        loadFolderContents(currentFolderId);
      }
    } catch (error) {
      console.error("Error renaming item:", error);
      toast({
        title: "Error",
        description: `Failed to rename ${itemToRename.type}`,
        variant: "destructive",
      });
    } finally {
      setIsRenameDialogOpen(false);
      setItemToRename(null);
      setNewName("");
    }
  };

  // Toggle starred status
  const handleToggleStarred = async (
    id: string,
    type: "folder" | "file",
    e?: React.MouseEvent,
  ) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      const newStarredStatus = await toggleStarred(id, type);
      toast({
        title: "Success",
        description: `${type === "folder" ? "Folder" : "File"} ${newStarredStatus ? "starred" : "unstarred"} successfully`,
      });

      // Reload folder contents
      if (currentFolderId) {
        loadFolderContents(currentFolderId);
      }
    } catch (error) {
      console.error("Error toggling starred status:", error);
      toast({
        title: "Error",
        description: `Failed to update starred status`,
        variant: "destructive",
      });
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

    try {
      if (clipboardAction === "cut") {
        await moveItem(
          clipboardItem.item.id,
          currentFolderId,
          clipboardItem.type,
        );
        toast({
          title: "Success",
          description: `${clipboardItem.type === "folder" ? "Folder" : "File"} moved successfully`,
        });
      } else {
        // Copy operation
        if (clipboardItem.type === "folder") {
          await createFolder(
            `${clipboardItem.item.name} (Copy)`,
            currentFolderId,
          );
          toast({
            title: "Success",
            description: `Folder "${clipboardItem.item.name}" copied successfully`,
          });
        } else {
          // For files, we would need a proper file copy function
          // This would involve copying the file in storage and creating a new record
          toast({
            title: "Info",
            description: `File copy functionality will be fully implemented in the next update`,
          });
        }
      }

      // Clear clipboard after paste
      setClipboardItem(null);
      setClipboardAction(null);

      // Reload folder contents
      loadFolderContents(currentFolderId);
    } catch (error) {
      console.error("Error pasting item:", error);
      toast({
        title: "Error",
        description: `Failed to paste item`,
        variant: "destructive",
      });
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
            files={folderContents.files}
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
