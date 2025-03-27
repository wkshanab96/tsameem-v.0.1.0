import { File as FileType } from "@/lib/types";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  MoreHorizontalRegular,
  SettingsRegular,
  ArrowDownloadRegular,
  HistoryRegular,
  EditRegular,
  StarRegular,
  CopyRegular,
  CutRegular,
  DeleteRegular,
} from "@fluentui/react-icons";

interface FileContextMenuProps {
  file: FileType;
  handleFileSelection: (file: FileType) => void;
  handleDownloadFile: (file: FileType) => void;
  viewRevisions: (file: FileType) => void;
  openRenameDialog: (item: FileType, type: "file") => void;
  handleToggleStarred: (id: string, type: "file") => void;
  copyItem: (item: FileType, type: "file") => void;
  cutItem: (item: FileType, type: "file") => void;
  handleDeleteItem: (id: string, type: "file") => void;
}

export const FileContextMenu = ({
  file,
  handleFileSelection,
  handleDownloadFile,
  viewRevisions,
  openRenameDialog,
  handleToggleStarred,
  copyItem,
  cutItem,
  handleDeleteItem,
}: FileContextMenuProps) => {
  return (
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelection(file);
          }}
        >
          <SettingsRegular className="h-4 w-4 mr-2" /> Analyze with AI
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadFile(file);
          }}
        >
          <ArrowDownloadRegular className="h-4 w-4 mr-2" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            viewRevisions(file);
          }}
        >
          <HistoryRegular className="h-4 w-4 mr-2" /> Revisions
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            openRenameDialog(file, "file");
          }}
        >
          <EditRegular className="h-4 w-4 mr-2" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStarred(file.id, "file");
          }}
        >
          <StarRegular className="h-4 w-4 mr-2" />
          {file.starred ? "Unstar" : "Star"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            copyItem(file, "file");
          }}
        >
          <CopyRegular className="h-4 w-4 mr-2" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            cutItem(file, "file");
          }}
        >
          <CutRegular className="h-4 w-4 mr-2" /> Cut
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteItem(file.id, "file");
          }}
        >
          <DeleteRegular className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
