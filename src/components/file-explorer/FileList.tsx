import { File as FileType, Folder } from "@/lib/types";
import { Button } from "../ui/button";
import { formatDate, formatFileSize } from "@/lib/file-utils";
import { FileIcon } from "./FileIcon";
import { MoreHorizontalRegular } from "@fluentui/react-icons";
import { FolderIcon } from "./FolderIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FileContextMenu } from "./FileContextMenu";

interface FileListProps {
  folders: Folder[];
  files: FileType[];
  navigateToFolder: (folder: Folder) => void;
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
}

export const FileList = ({
  folders,
  files,
  navigateToFolder,
  handleFileSelection,
  handleDownloadFile,
  viewRevisions,
  openRenameDialog,
  handleToggleStarred,
  copyItem,
  cutItem,
  handleDeleteItem,
}: FileListProps) => {
  return (
    <div className="space-y-2">
      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
        <div className="col-span-5">Name</div>
        <div className="col-span-2 text-center">Type</div>
        <div className="col-span-2 text-center">Size</div>
        <div className="col-span-2 text-center">Modified</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-gray-50 hover:border-orange-400 border border-transparent rounded-lg cursor-pointer transition-all"
          onClick={() => navigateToFolder(folder)}
        >
          <div className="col-span-5 flex items-center gap-3 min-w-0">
            <FolderIcon />
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {folder.name}
              </h4>
              <p className="text-xs text-gray-500 truncate">Folder</p>
            </div>
          </div>
          <div className="col-span-2 text-center text-xs text-gray-600">
            Folder
          </div>
          <div className="col-span-2 text-center text-xs text-gray-600">-</div>
          <div className="col-span-2 text-center text-xs text-gray-600">
            {formatDate(folder.updated_at || folder.created_at)}
          </div>
          <div className="col-span-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    openRenameDialog(folder, "folder");
                  }}
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStarred(folder.id, "folder", e);
                  }}
                >
                  {folder.starred ? "Unstar" : "Star"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    copyItem(folder, "folder");
                  }}
                >
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    cutItem(folder, "folder");
                  }}
                >
                  Cut
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(folder.id, "folder");
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-gray-50 hover:border-orange-400 border border-transparent rounded-lg cursor-pointer transition-all"
          onClick={() => handleFileSelection(file)}
        >
          <div className="col-span-5 flex items-center gap-3 min-w-0">
            <FileIcon fileType={file.file_type} />
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {file.name}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {file.metadata?.description || "No description"}
              </p>
            </div>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-xs font-medium text-gray-700 px-2 py-1 bg-gray-100 rounded-full">
              {file.file_type.toUpperCase()}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              v{file.revisions?.[0]?.version || "1.0"}
            </div>
          </div>
          <div className="col-span-2 text-center text-xs text-gray-600">
            {formatFileSize(file.size)}
          </div>
          <div className="col-span-2 text-center text-xs text-gray-600">
            {formatDate(file.updated_at || file.created_at)}
          </div>
          <div className="col-span-1 flex justify-end">
            <FileContextMenu
              file={file}
              handleFileSelection={handleFileSelection}
              handleDownloadFile={handleDownloadFile}
              viewRevisions={viewRevisions}
              openRenameDialog={openRenameDialog}
              handleToggleStarred={handleToggleStarred}
              copyItem={copyItem}
              cutItem={cutItem}
              handleDeleteItem={handleDeleteItem}
            />
          </div>
        </div>
      ))}

      {/* Empty State */}
      {folders.length === 0 && files.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
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
              className="text-gray-400"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No files yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload files or create folders to get started
          </p>
        </div>
      )}
    </div>
  );
};
