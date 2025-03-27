import { useState } from "react";
import { File as FileType, Folder } from "@/lib/types";
import { Button } from "../ui/button";
import { FileGrid } from "./FileGrid";
import { FileList } from "./FileList";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { DocumentProcessingStatus } from "../document-processing-status";
import {
  GridRegular,
  ListRegular,
  AddRegular,
  ArrowDownloadRegular,
  FolderAddRegular,
  ClipboardPasteRegular,
} from "@fluentui/react-icons";

interface AllFilesProps {
  currentFolderId: string | null;
  folderPath: Folder[];
  folders: Folder[];
  files: FileType[];
  isLoading: boolean;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  navigateToFolder: (folder: Folder) => void;
  navigateToRoot: () => void;
  handleFileSelection: (file: FileType) => void;
  handleDownloadFile: (file: FileType) => void;
  viewRevisions: (file: FileType) => void;
  openRenameDialog: (item: Folder | FileType, type: "folder" | "file") => void;
  handleToggleStarred: (
    id: string,
    type: "folder" | "file",
    e?: React.MouseEvent,
  ) => void;
  copyItem: (item: Folder | FileType, type: "folder" | "file") => void;
  cutItem: (item: Folder | FileType, type: "folder" | "file") => void;
  handleDeleteItem: (id: string, type: "folder" | "file") => void;
  openNewFolderDialog: () => void;
  openUploadDialog: () => void;
  handlePaste: () => void;
  clipboardItem: { item: Folder | FileType; type: "folder" | "file" } | null;
  clipboardAction: "copy" | "cut" | null;
}

export const AllFiles = ({
  currentFolderId,
  folderPath,
  folders,
  files,
  isLoading,
  viewMode,
  setViewMode,
  navigateToFolder,
  navigateToRoot,
  handleFileSelection,
  handleDownloadFile,
  viewRevisions,
  openRenameDialog,
  handleToggleStarred,
  copyItem,
  cutItem,
  handleDeleteItem,
  openNewFolderDialog,
  openUploadDialog,
  handlePaste,
  clipboardItem,
  clipboardAction,
}: AllFilesProps) => {
  // Filter files that need processing
  const processingFiles = files.filter(
    (file) => file.metadata?.needsProcessing && !file.metadata?.processed,
  );

  // Remove duplicate entries from folderPath
  const uniqueFolderPath = folderPath.filter(
    (folder, index, self) =>
      index === self.findIndex((f) => f.id === folder.id),
  );

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        folderPath={uniqueFolderPath}
        navigateToFolder={navigateToFolder}
        navigateToRoot={navigateToRoot}
      />
      {/* Processing Status */}
      {processingFiles.length > 0 && (
        <DocumentProcessingStatus
          files={processingFiles}
          onProcessingComplete={(file) => {
            console.log("File processed:", file.name);
            // In a real implementation, you would update the file in the database
          }}
        />
      )}
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={openNewFolderDialog}
          >
            <FolderAddRegular className="h-4 w-4" />
            New Folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={openUploadDialog}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </Button>
          {clipboardItem && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handlePaste}
            >
              <ClipboardPasteRegular className="h-4 w-4" />
              Paste {clipboardAction === "cut" ? "(Move)" : "(Copy)"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <GridRegular className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
            title="List View"
          >
            <ListRegular className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading files and folders...</p>
          </div>
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <AddRegular className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">This folder is empty.</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={openNewFolderDialog}
            >
              <FolderAddRegular className="h-4 w-4" />
              New Folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={openUploadDialog}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </Button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <FileGrid
          folders={folders}
          files={files}
          navigateToFolder={navigateToFolder}
          handleFileSelection={handleFileSelection}
          handleDownloadFile={handleDownloadFile}
          viewRevisions={viewRevisions}
          openRenameDialog={openRenameDialog}
          handleToggleStarred={handleToggleStarred}
          copyItem={copyItem}
          cutItem={cutItem}
          handleDeleteItem={handleDeleteItem}
          className="w-[1100px]"
        />
      ) : (
        <FileList
          folders={folders}
          files={files}
          navigateToFolder={navigateToFolder}
          handleFileSelection={handleFileSelection}
          handleDownloadFile={handleDownloadFile}
          viewRevisions={viewRevisions}
          openRenameDialog={openRenameDialog}
          handleToggleStarred={handleToggleStarred}
          copyItem={copyItem}
          cutItem={cutItem}
          handleDeleteItem={handleDeleteItem}
        />
      )}
    </div>
  );
};
