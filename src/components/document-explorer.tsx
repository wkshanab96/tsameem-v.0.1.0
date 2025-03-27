"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { DocumentProcessingStatus } from "./document-processing-status";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
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
  fetchRecentItems,
  fetchRootFolder,
  fetchStarredItems,
  formatDate,
  formatFileSize,
  initializeStorage,
  moveItem,
  renameItem,
  toggleStarred,
  uploadFile,
} from "@/lib/file-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

// Import Fluent UI icons
import {
  DocumentRegular,
  DocumentPdfRegular,
  DocumentTextRegular,
  FolderRegular,
  FolderAddRegular,
  ArrowUploadRegular,
  GridRegular,
  TableRegular,
  SearchRegular,
  FilterRegular,
  MoreHorizontalRegular,
  StarRegular,
  ClockRegular,
  DeleteRegular,
  ChevronRightRegular,
  ChevronLeftRegular,
  HomeRegular,
  ShareRegular,
  EditRegular,
  ArrowUpRightRegular,
  CopyRegular,
  CutRegular,
  ClipboardRegular,
  HistoryRegular,
  ImageRegular,
  CodeRegular,
  TableSimpleRegular,
  ArchiveRegular,
  MusicNote1Regular,
  VideoRegular,
  SettingsRegular,
  ArrowSyncRegular,
} from "@fluentui/react-icons";

export default function DocumentExplorer() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clipboard state
  const [clipboard, setClipboard] = useState<{
    item: FileType | Folder;
    action: "copy" | "cut";
    type: "file" | "folder";
  } | null>(null);

  // Selected item for operations
  const [selectedItem, setSelectedItem] = useState<{
    item: FileType | Folder;
    type: "file" | "folder";
  } | null>(null);

  // Dialog states
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState("all");
  const [starredItems, setStarredItems] = useState<{
    folders: Folder[];
    files: FileType[];
  }>({ folders: [], files: [] });
  const [recentItems, setRecentItems] = useState<FileType[]>([]);

  // File upload reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle dropped files
  const handleDroppedFiles = async (droppedFiles: File[]) => {
    if (!currentFolderId || droppedFiles.length === 0) return;

    try {
      setUploadProgress(0);

      for (let i = 0; i < droppedFiles.length; i++) {
        const file = droppedFiles[i];
        console.log(
          `Processing dropped file: ${file.name}, size: ${file.size}`,
        );

        try {
          const uploadedFile = await uploadFile(
            file,
            currentFolderId,
            (progress) => {
              setUploadProgress(progress);
            },
          );

          // Add the uploaded file to the current files list
          setFiles((prevFiles) => [uploadedFile, ...prevFiles]);

          toast({
            title: "File uploaded",
            description: `${file.name} uploaded successfully.`,
          });
        } catch (fileError) {
          console.error(
            `Error uploading dropped file ${file.name}:`,
            fileError,
          );
          toast({
            title: "Upload Error",
            description: `Failed to upload ${file.name}: ${fileError.message || "Unknown error"}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error processing dropped files:", error);
      toast({
        title: "Error",
        description: "Failed to process dropped files",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(null);
    }
  };

  // Initialize with root folder
  useEffect(() => {
    const initializeExplorer = async () => {
      try {
        setIsLoading(true);
        console.log("Starting document explorer initialization");

        // Check database tables first
        const { checkDatabaseTables } = await import("@/lib/db-check");
        const dbStatus = await checkDatabaseTables();
        console.log("Database status:", dbStatus);

        if (!dbStatus.auth?.success) {
          throw new Error("Authentication failed or user not found");
        }

        if (!dbStatus.folders?.exists) {
          console.warn(
            "Folders table not found or empty, creating required tables",
          );
          const { createRequiredTables } = await import("@/lib/db-check");
          await createRequiredTables();
        }

        // Initialize storage bucket
        console.log("Initializing storage bucket");
        await initializeStorage();

        console.log("Fetching root folder");
        const rootFolder = await fetchRootFolder();
        console.log("Root folder fetched:", rootFolder);

        if (rootFolder) {
          setCurrentFolderId(rootFolder.id);
          setCurrentPath([rootFolder]);
          console.log(`Loading contents of folder: ${rootFolder.id}`);
          await loadFolderContents(rootFolder.id);
        } else {
          throw new Error("Failed to fetch or create root folder");
        }
      } catch (error) {
        console.error("Error initializing explorer:", error);
        toast({
          title: "Error",
          description: `Failed to initialize document explorer: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeExplorer();
  }, []);

  // Load folder contents
  const loadFolderContents = async (folderId: string | null) => {
    try {
      setIsLoading(true);
      console.log(`Loading contents for folder ID: ${folderId}`);

      const { folders: folderData, files: fileData } =
        await fetchFolderContents(folderId);

      console.log(
        `Loaded ${folderData.length} folders and ${fileData.length} files`,
      );
      setFolders(folderData);
      setFiles(fileData);
    } catch (error) {
      console.error("Error loading folder contents:", error);
      toast({
        title: "Error",
        description: `Failed to load folder contents: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load starred items
  const loadStarredItems = async () => {
    try {
      setIsLoading(true);
      const items = await fetchStarredItems();
      setStarredItems(items);
    } catch (error) {
      console.error("Error loading starred items:", error);
      toast({
        title: "Error",
        description: "Failed to load starred items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load recent items
  const loadRecentItems = async () => {
    try {
      setIsLoading(true);
      const items = await fetchRecentItems();
      setRecentItems(items);
    } catch (error) {
      console.error("Error loading recent items:", error);
      toast({
        title: "Error",
        description: "Failed to load recent items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "starred") {
      loadStarredItems();
    } else if (value === "recent") {
      loadRecentItems();
    } else if (value === "all" && currentFolderId) {
      loadFolderContents(currentFolderId);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const newFolder = await createFolder(newFolderName, currentFolderId);
      setFolders([newFolder, ...folders]);
      setNewFolderName("");
      setNewFolderDialogOpen(false);
      toast({
        title: "Folder created",
        description: `${newFolderName} has been created successfully.`,
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentFolderId) return;

    try {
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(
          `Starting upload for file: ${file.name}, size: ${file.size}`,
        );

        try {
          const uploadedFile = await uploadFile(
            file as any,
            currentFolderId,
            (progress) => {
              setUploadProgress(progress);
            },
          );

          // Add the uploaded file to the current files list
          setFiles((prevFiles) => [uploadedFile, ...prevFiles]);

          toast({
            title: "File uploaded",
            description: `${file.name} uploaded successfully.`,
          });
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          toast({
            title: "Upload Error",
            description: `Failed to upload ${file.name}: ${fileError.message || "Unknown error"}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      toast({
        title: "Error",
        description: "Failed to process uploads",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Toggle star status
  const handleToggleStarred = async (
    id: string,
    type: "file" | "folder",
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    try {
      const isStarred = await toggleStarred(id, type);

      if (type === "file") {
        setFiles(
          files.map((file) =>
            file.id === id ? { ...file, starred: isStarred } : file,
          ),
        );
      } else {
        setFolders(
          folders.map((folder) =>
            folder.id === id ? { ...folder, starred: isStarred } : folder,
          ),
        );
      }

      // If in starred tab, refresh
      if (activeTab === "starred") {
        loadStarredItems();
      }

      toast({
        title: isStarred ? "Item starred" : "Item unstarred",
        description: `Item has been ${isStarred ? "added to" : "removed from"} starred items.`,
      });
    } catch (error) {
      console.error("Error toggling star:", error);
      toast({
        title: "Error",
        description: "Failed to update starred status",
        variant: "destructive",
      });
    }
  };

  // Delete item
  const handleDeleteItem = async (
    id: string,
    type: "file" | "folder",
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    try {
      await deleteItem(id, type);

      if (type === "file") {
        setFiles(files.filter((file) => file.id !== id));
      } else {
        setFolders(folders.filter((folder) => folder.id !== id));
      }

      toast({
        title: "Item deleted",
        description: `${type === "file" ? "File" : "Folder"} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  // Rename item
  const openRenameDialog = (
    item: FileType | Folder,
    type: "file" | "folder",
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    setSelectedItem({ item, type });
    setNewName(item.name);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!selectedItem || !newName.trim()) return;

    try {
      await renameItem(selectedItem.item.id, newName, selectedItem.type);

      if (selectedItem.type === "file") {
        setFiles(
          files.map((file) =>
            file.id === selectedItem.item.id
              ? { ...file, name: newName }
              : file,
          ),
        );
      } else {
        setFolders(
          folders.map((folder) =>
            folder.id === selectedItem.item.id
              ? { ...folder, name: newName }
              : folder,
          ),
        );
      }

      setRenameDialogOpen(false);
      setSelectedItem(null);
      setNewName("");

      toast({
        title: "Item renamed",
        description: `Item has been renamed to ${newName}.`,
      });
    } catch (error) {
      console.error("Error renaming item:", error);
      toast({
        title: "Error",
        description: "Failed to rename item",
        variant: "destructive",
      });
    }
  };

  // Copy, cut and paste operations
  const copyItem = (
    item: FileType | Folder,
    type: "file" | "folder",
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    setClipboard({ item, action: "copy", type });
    toast({
      title: "Item copied",
      description: `${item.name} copied to clipboard.`,
    });
  };

  const cutItem = (
    item: FileType | Folder,
    type: "file" | "folder",
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    setClipboard({ item, action: "cut", type });
    toast({
      title: "Item cut",
      description: `${item.name} cut to clipboard.`,
    });
  };

  const pasteItem = async () => {
    if (!clipboard || !currentFolderId) return;

    const { item, action, type } = clipboard;

    try {
      // Move or copy the item
      if (action === "cut") {
        await moveItem(item.id, currentFolderId, type);

        // Remove from current view if it was in the same folder
        if (type === "file") {
          setFiles(files.filter((file) => file.id !== item.id));
        } else {
          setFolders(folders.filter((folder) => folder.id !== item.id));
        }

        // Clear clipboard
        setClipboard(null);

        // Reload folder contents
        loadFolderContents(currentFolderId);

        toast({
          title: "Item moved",
          description: `${item.name} has been moved successfully.`,
        });
      } else {
        // For copy, we would need to implement a duplicate function
        toast({
          title: "Copy not implemented",
          description: "File/folder copying is not yet implemented.",
        });
      }
    } catch (error) {
      console.error(
        `Error ${action === "cut" ? "moving" : "copying"} item:`,
        error,
      );
      toast({
        title: "Error",
        description: `Failed to ${action === "cut" ? "move" : "copy"} item`,
        variant: "destructive",
      });
    }
  };

  // Download file
  const handleDownloadFile = async (file: FileType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      await downloadFile(file.id);
      toast({
        title: "File downloaded",
        description: `${file.name} has been downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  // View file revisions
  const viewRevisions = (file: FileType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedItem({ item: file, type: "file" });
    setShowRevisionDialog(true);
  };

  // Navigation functions
  const navigateToFolder = async (folder: Folder) => {
    try {
      setIsLoading(true);
      setCurrentFolderId(folder.id);

      // Update breadcrumb path
      if (
        currentPath.length > 0 &&
        currentPath[currentPath.length - 1].id === folder.parent_id
      ) {
        // If navigating to a child of the current folder
        setCurrentPath([...currentPath, folder]);
      } else {
        // Otherwise fetch the full path
        const path = await fetchFolderPath(folder.id);
        setCurrentPath(path);
      }

      // Load folder contents
      loadFolderContents(folder.id);
    } catch (error) {
      console.error("Error navigating to folder:", error);
      toast({
        title: "Error",
        description: "Failed to navigate to folder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToBreadcrumb = async (index: number) => {
    if (index >= currentPath.length) return;

    const folder = currentPath[index];
    setCurrentFolderId(folder.id);
    setCurrentPath(currentPath.slice(0, index + 1));
    await loadFolderContents(folder.id);
  };

  const navigateUp = async () => {
    if (currentPath.length <= 1 || !currentPath[currentPath.length - 2]) return;

    const parentFolder = currentPath[currentPath.length - 2];
    setCurrentFolderId(parentFolder.id);
    setCurrentPath(currentPath.slice(0, -1));
    await loadFolderContents(parentFolder.id);
  };

  const navigateHome = async () => {
    try {
      const rootFolder = await fetchRootFolder();
      if (rootFolder) {
        setCurrentFolderId(rootFolder.id);
        setCurrentPath([rootFolder]);
        await loadFolderContents(rootFolder.id);
      }
    } catch (error) {
      console.error("Error navigating home:", error);
      toast({
        title: "Error",
        description: "Failed to navigate to home folder",
        variant: "destructive",
      });
    }
  };

  // Filter items based on search query
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Check if clipboard has items
  const canPaste = clipboard !== null;

  // Get file icon component based on file type
  const getFileIconComponent = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return (
          <DocumentPdfRegular className="h-5 w-5 text-red-600 flex-shrink-0" />
        );
      case "dwg":
      case "dxf":
      case "dwf":
        return <CodeRegular className="h-5 w-5 text-blue-600 flex-shrink-0" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "svg":
        return (
          <ImageRegular className="h-5 w-5 text-green-600 flex-shrink-0" />
        );
      case "doc":
      case "docx":
      case "txt":
      case "rtf":
        return (
          <DocumentTextRegular className="h-5 w-5 text-blue-600 flex-shrink-0" />
        );
      case "xls":
      case "xlsx":
      case "csv":
        return (
          <TableSimpleRegular className="h-5 w-5 text-green-600 flex-shrink-0" />
        );
      case "ppt":
      case "pptx":
        return (
          <DocumentTextRegular className="h-5 w-5 text-orange-600 flex-shrink-0" />
        );
      case "zip":
      case "rar":
      case "7z":
        return (
          <ArchiveRegular className="h-5 w-5 text-yellow-600 flex-shrink-0" />
        );
      case "mp3":
      case "wav":
      case "ogg":
        return (
          <MusicNote1Regular className="h-5 w-5 text-purple-600 flex-shrink-0" />
        );
      case "mp4":
      case "avi":
      case "mov":
        return <VideoRegular className="h-5 w-5 text-pink-600 flex-shrink-0" />;
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
        return (
          <SettingsRegular className="h-5 w-5 text-yellow-600 flex-shrink-0" />
        );
      case "json":
        return <CodeRegular className="h-5 w-5 text-gray-600 flex-shrink-0" />;
      default:
        return (
          <DocumentRegular className="h-5 w-5 text-gray-600 flex-shrink-0" />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <Toaster />
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Revision History Dialog */}
      {selectedItem && selectedItem.type === "file" && (
        <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Revision History - {selectedItem.item.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {(selectedItem.item as FileType).revisions &&
              (selectedItem.item as FileType).revisions!.length > 0 ? (
                <div className="space-y-4">
                  {(selectedItem.item as FileType).revisions!.map(
                    (revision, index) => (
                      <div
                        key={revision.id}
                        className="border rounded-lg p-4 flex gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={revision.thumbnail}
                            alt={`Version ${revision.version}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium">
                              Version {revision.version}
                            </h3>
                            <div className="text-sm text-gray-500">
                              {formatDate(revision.created_at)}
                            </div>
                          </div>
                          <p className="mt-2 text-sm">{revision.changes}</p>
                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              <ArrowUpRightRegular className="h-3 w-3" /> View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              <ArrowUploadRegular className="h-3 w-3" />{" "}
                              Download
                            </Button>
                            {index !== 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                <HistoryRegular className="h-3 w-3" /> Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HistoryRegular className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No revision history available for this file.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Header with actions */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
        {/* Drag and Drop Zone */}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-800">Documents</h2>
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateHome}
                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Home"
              >
                <HomeRegular className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateUp}
                disabled={currentPath.length <= 1}
                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Up"
              >
                <ChevronLeftRegular className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab("recent")}
                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Recent"
              >
                <ClockRegular className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab("starred")}
                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Starred"
              >
                <StarRegular className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "hover:bg-blue-50 hover:text-blue-600"} transition-colors`}
              title="Grid View"
            >
              <GridRegular className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "hover:bg-blue-50 hover:text-blue-600"} transition-colors`}
              title="List View"
            >
              <TableRegular className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNewFolderDialogOpen(true)}
              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="New Folder"
            >
              <FolderAddRegular className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Upload Files"
              >
                <ArrowUploadRegular className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
            </div>
            {canPaste && (
              <Button
                variant="ghost"
                size="icon"
                onClick={pasteItem}
                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Paste"
              >
                <ClipboardRegular className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadFolderContents(currentFolderId)}
              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="Refresh"
            >
              <ArrowSyncRegular className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Breadcrumb navigation */}
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            {currentPath.map((folder, index) => (
              <BreadcrumbItem key={folder.id}>
                {index < currentPath.length - 1 ? (
                  <BreadcrumbLink
                    onClick={() => navigateToBreadcrumb(index)}
                    className="cursor-pointer"
                  >
                    {folder.name}
                  </BreadcrumbLink>
                ) : (
                  <span className="font-medium">{folder.name}</span>
                )}
                {index < currentPath.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRightRegular className="h-3 w-3" />
                  </BreadcrumbSeparator>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Search bar */}
        <div className="relative">
          <SearchRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-gray-100 rounded-full"
            >
              <span className="sr-only">Clear search</span>
              <span aria-hidden="true" className="text-gray-400">
                &times;
              </span>
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading files and folders...</p>
                </div>
              </div>
            ) : (
              <div>
                {uploadProgress !== null && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">
                      Uploading file...
                    </p>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Folders */}
                {filteredFolders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Folders
                    </h3>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                          : "space-y-2"
                      }
                    >
                      {filteredFolders.map((folder) =>
                        viewMode === "grid" ? (
                          <Card
                            key={folder.id}
                            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                            onClick={() => navigateToFolder(folder)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <FolderRegular className="h-10 w-10 text-yellow-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {folder.name}
                                    </h4>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-10 w-10 hover:bg-gray-100 rounded-full"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontalRegular className="h-6 w-6" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="w-48"
                                      >
                                        <DropdownMenuItem
                                          onClick={(e) =>
                                            openRenameDialog(
                                              folder,
                                              "folder",
                                              e,
                                            )
                                          }
                                        >
                                          <EditRegular className="h-4 w-4 mr-2" />{" "}
                                          Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) =>
                                            handleToggleStarred(
                                              folder.id,
                                              "folder",
                                              e,
                                            )
                                          }
                                        >
                                          <StarRegular className="h-4 w-4 mr-2" />
                                          {folder.starred ? "Unstar" : "Star"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) =>
                                            copyItem(folder, "folder", e)
                                          }
                                        >
                                          <CopyRegular className="h-4 w-4 mr-2" />{" "}
                                          Copy
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) =>
                                            cutItem(folder, "folder", e)
                                          }
                                        >
                                          <CutRegular className="h-4 w-4 mr-2" />{" "}
                                          Cut
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={(e) =>
                                            handleDeleteItem(
                                              folder.id,
                                              "folder",
                                              e,
                                            )
                                          }
                                        >
                                          <DeleteRegular className="h-4 w-4 mr-2" />{" "}
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(
                                      folder.updated_at || folder.created_at,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div
                            key={folder.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                            onClick={() => navigateToFolder(folder)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FolderRegular className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {folder.name}
                                </h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(
                                  folder.updated_at || folder.created_at,
                                )}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-gray-100 rounded-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontalRegular className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem
                                    onClick={(e) =>
                                      openRenameDialog(folder, "folder", e)
                                    }
                                  >
                                    <EditRegular className="h-4 w-4 mr-2" />{" "}
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) =>
                                      handleToggleStarred(
                                        folder.id,
                                        "folder",
                                        e,
                                      )
                                    }
                                  >
                                    <StarRegular className="h-4 w-4 mr-2" />
                                    {folder.starred ? "Unstar" : "Star"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) =>
                                      copyItem(folder, "folder", e)
                                    }
                                  >
                                    <CopyRegular className="h-4 w-4 mr-2" />{" "}
                                    Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) =>
                                      cutItem(folder, "folder", e)
                                    }
                                  >
                                    <CutRegular className="h-4 w-4 mr-2" /> Cut
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) =>
                                      handleDeleteItem(folder.id, "folder", e)
                                    }
                                  >
                                    <DeleteRegular className="h-4 w-4 mr-2" />{" "}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Files */}
                {filteredFiles.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Files
                    </h3>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                          : "space-y-2"
                      }
                    >
                      {filteredFiles.map((file) =>
                        viewMode === "grid" ? (
                          <Card
                            key={file.id}
                            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                          >
                            <div className="aspect-video bg-gray-100 relative">
                              <img
                                src={file.thumbnail}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                              {file.metadata?.processed === false && (
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-white bg-opacity-90">
                                  <DocumentProcessingStatus
                                    file={file}
                                    onProcessingComplete={(updatedFile) => {
                                      setFiles((prevFiles) =>
                                        prevFiles.map((f) =>
                                          f.id === updatedFile.id
                                            ? updatedFile
                                            : f,
                                        ),
                                      );
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {getFileIconComponent(file.file_type)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {file.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatFileSize(file.size)} •{" "}
                                      {formatDate(
                                        file.updated_at || file.created_at,
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-gray-100 rounded-full"
                                    >
                                      <MoreHorizontalRegular className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => handleDownloadFile(file)}
                                    >
                                      <ArrowUploadRegular className="h-4 w-4 mr-2" />{" "}
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => viewRevisions(file)}
                                    >
                                      <HistoryRegular className="h-4 w-4 mr-2" />{" "}
                                      Revisions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        openRenameDialog(file, "file")
                                      }
                                    >
                                      <EditRegular className="h-4 w-4 mr-2" />{" "}
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleToggleStarred(file.id, "file")
                                      }
                                    >
                                      <StarRegular className="h-4 w-4 mr-2" />
                                      {file.starred ? "Unstar" : "Star"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => copyItem(file, "file")}
                                    >
                                      <CopyRegular className="h-4 w-4 mr-2" />{" "}
                                      Copy
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => cutItem(file, "file")}
                                    >
                                      <CutRegular className="h-4 w-4 mr-2" />{" "}
                                      Cut
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        handleDeleteItem(file.id, "file")
                                      }
                                    >
                                      <DeleteRegular className="h-4 w-4 mr-2" />{" "}
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIconComponent(file.file_type)}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {file.name}
                                </h4>
                                {file.metadata?.processed === false && (
                                  <div className="mt-1">
                                    <DocumentProcessingStatus
                                      file={file}
                                      onProcessingComplete={(updatedFile) => {
                                        setFiles((prevFiles) =>
                                          prevFiles.map((f) =>
                                            f.id === updatedFile.id
                                              ? updatedFile
                                              : f,
                                          ),
                                        );
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(file.updated_at || file.created_at)}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-gray-100 rounded-full"
                                  >
                                    <MoreHorizontalRegular className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadFile(file)}
                                  >
                                    <ArrowUploadRegular className="h-4 w-4 mr-2" />{" "}
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => viewRevisions(file)}
                                  >
                                    <HistoryRegular className="h-4 w-4 mr-2" />{" "}
                                    Revisions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openRenameDialog(file, "file")
                                    }
                                  >
                                    <EditRegular className="h-4 w-4 mr-2" />{" "}
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleStarred(file.id, "file")
                                    }
                                  >
                                    <StarRegular className="h-4 w-4 mr-2" />
                                    {file.starred ? "Unstar" : "Star"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => copyItem(file, "file")}
                                  >
                                    <CopyRegular className="h-4 w-4 mr-2" />{" "}
                                    Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => cutItem(file, "file")}
                                  >
                                    <CutRegular className="h-4 w-4 mr-2" /> Cut
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      handleDeleteItem(file.id, "file")
                                    }
                                  >
                                    <DeleteRegular className="h-4 w-4 mr-2" />{" "}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  filteredFolders.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <DocumentRegular className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No files found in this folder.</p>
                      <p className="text-sm mt-1">
                        Drag and drop files here or use the upload button to add
                        files.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="recent" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading recent files...</p>
                </div>
              </div>
            ) : recentItems.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "space-y-2"
                }
              >
                {recentItems.map((file) =>
                  viewMode === "grid" ? (
                    <Card
                      key={file.id}
                      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="aspect-video bg-gray-100 relative">
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {getFileIconComponent(file.file_type)}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {file.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(file.size)} •{" "}
                                {formatDate(file.updated_at || file.created_at)}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-gray-100 rounded-full"
                              >
                                <MoreHorizontalRegular className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleDownloadFile(file)}
                              >
                                <ArrowUploadRegular className="h-4 w-4 mr-2" />{" "}
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => viewRevisions(file)}
                              >
                                <HistoryRegular className="h-4 w-4 mr-2" />{" "}
                                Revisions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStarred(file.id, "file")
                                }
                              >
                                <StarRegular className="h-4 w-4 mr-2" />
                                {file.starred ? "Unstar" : "Star"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIconComponent(file.file_type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {file.name}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(file.updated_at || file.created_at)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-gray-100 rounded-full"
                            >
                              <MoreHorizontalRegular className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleDownloadFile(file)}
                            >
                              <ArrowUploadRegular className="h-4 w-4 mr-2" />{" "}
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => viewRevisions(file)}
                            >
                              <HistoryRegular className="h-4 w-4 mr-2" />{" "}
                              Revisions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStarred(file.id, "file")
                              }
                            >
                              <StarRegular className="h-4 w-4 mr-2" />
                              {file.starred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ClockRegular className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent files found.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="starred" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading starred items...</p>
                </div>
              </div>
            ) : starredItems.folders.length > 0 ||
              starredItems.files.length > 0 ? (
              <div>
                {/* Starred Folders */}
                {starredItems.folders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Folders
                    </h3>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                          : "space-y-2"
                      }
                    >
                      {starredItems.folders.map((folder) =>
                        viewMode === "grid" ? (
                          <Card
                            key={folder.id}
                            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                            onClick={() => navigateToFolder(folder)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <FolderRegular className="h-10 w-10 text-yellow-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {folder.name}
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-gray-100 rounded-full text-yellow-500"
                                      onClick={(e) =>
                                        handleToggleStarred(
                                          folder.id,
                                          "folder",
                                          e,
                                        )
                                      }
                                    >
                                      <StarRegular className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(
                                      folder.updated_at || folder.created_at,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div
                            key={folder.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                            onClick={() => navigateToFolder(folder)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FolderRegular className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {folder.name}
                                </h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(
                                  folder.updated_at || folder.created_at,
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-gray-100 rounded-full text-yellow-500"
                                onClick={(e) =>
                                  handleToggleStarred(folder.id, "folder", e)
                                }
                              >
                                <StarRegular className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Starred Files */}
                {starredItems.files.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Files
                    </h3>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                          : "space-y-2"
                      }
                    >
                      {starredItems.files.map((file) =>
                        viewMode === "grid" ? (
                          <Card
                            key={file.id}
                            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                          >
                            <div className="aspect-video bg-gray-100 relative">
                              <img
                                src={file.thumbnail}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {getFileIconComponent(file.file_type)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {file.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatFileSize(file.size)} •{" "}
                                      {formatDate(
                                        file.updated_at || file.created_at,
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-gray-100 rounded-full text-yellow-500"
                                  onClick={() =>
                                    handleToggleStarred(file.id, "file")
                                  }
                                >
                                  <StarRegular className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIconComponent(file.file_type)}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {file.name}
                                </h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(file.updated_at || file.created_at)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-gray-100 rounded-full text-yellow-500"
                                onClick={() =>
                                  handleToggleStarred(file.id, "file")
                                }
                              >
                                <StarRegular className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <StarRegular className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No starred items found.</p>
                <p className="text-sm mt-1">
                  Star your favorite files and folders to access them quickly.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);

            if (!currentFolderId) {
              toast({
                title: "Error",
                description: "No folder selected for upload",
                variant: "destructive",
              });
              return;
            }

            const droppedFiles = Array.from(e.dataTransfer.files);
            if (droppedFiles.length === 0) return;

            handleDroppedFiles(droppedFiles);
          }}
        >
          <ArrowUploadRegular className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-1">Drag and drop files here</p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Browse Files
          </Button>
        </div>
      </div>
    </div>
  );
}
