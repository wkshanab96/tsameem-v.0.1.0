import { File as FileType, Folder } from "@/lib/types";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { formatDate, formatFileSize } from "@/lib/file-utils";
import { FileIcon } from "./FileIcon";
import { PdfPreview } from "./PdfPreview";
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
import { cn } from "@/lib/utils";

interface FileGridProps {
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

export const FileGrid = ({
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
}: FileGridProps) => {
  return (
    <div className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex content-start flex-wrap justify-start items-start">
      {/* Folders */}
      {folders?.map((folder) => (
        <Card
          key={folder.id}
          className="cursor-pointer hover:shadow-md hover:border-orange-400 border-transparent transition-all overflow-hidden w-[200px] h-[200px] relative group"
          onClick={() => navigateToFolder(folder)}
        >
          <CardContent className="p-4">
            <div className="flex gap-3 justify-center items-center">
              <FolderIcon className="justify-center items-center bg-white opacity-[0%]" />
            </div>
          </CardContent>
          <div className="flex-1 min-w-0 top-6">
            <div className="flex justify-center items-center">
              <h4 className="font-medium text-gray-900 truncate">
                {folder.name}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-100 rounded-full absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <p className="text-xs text-gray-500 mt-1 text-center">
              {formatDate(folder.updated_at || folder.created_at)}
            </p>
          </div>
        </Card>
      ))}
      {/* Files */}
      {files?.map((file) => (
        <Card
          key={file.id}
          className="cursor-pointer hover:shadow-md hover:border-orange-400 border-transparent transition-all overflow-hidden h-[200px] w-[200px] relative group"
          onClick={() => handleFileSelection(file)}
        >
          <div className="aspect-video bg-gray-100 relative h-[120px] overflow-hidden w-[200px]">
            {file.file_type.toLowerCase() === "pdf" ? (
              <PdfPreview file={file} className="h-[100px] w-[200px]" />
            ) : file.public_url &&
              ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(
                file.file_type.toLowerCase(),
              ) ? (
              <img
                src={file.public_url}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileIcon fileType={file.file_type} />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <FileIcon fileType={file.file_type} />
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
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
