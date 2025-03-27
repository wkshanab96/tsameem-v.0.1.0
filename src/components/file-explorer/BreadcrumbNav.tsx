import { Folder } from "@/lib/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { BreadcrumbFolderIcon } from "./BreadcrumbFolderIcon";
import { BreadcrumbFileIcon } from "./BreadcrumbFileIcon";

interface BreadcrumbNavProps {
  folderPath: Folder[];
  navigateToFolder: (folder: Folder) => void;
  navigateToRoot: () => void;
}

export const BreadcrumbNav = ({
  folderPath,
  navigateToFolder,
  navigateToRoot,
}: BreadcrumbNavProps) => {
  // Filter out the root folder from the path if it's already shown as the first item
  const filteredPath = folderPath.filter(
    (folder, index) => !(index === 0 && folder.name === "My Documents"),
  );

  return (
    <Breadcrumb className="mb-4 transition-all duration-300 ease-in-out">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={navigateToRoot}
            className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
          >
            <BreadcrumbFolderIcon />
            <span className="ml-1">My Documents</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {filteredPath.map((folder, index) => (
          <BreadcrumbItem key={folder.id}>
            <BreadcrumbSeparator />
            <BreadcrumbLink
              onClick={() => navigateToFolder(folder)}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              {folder.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
