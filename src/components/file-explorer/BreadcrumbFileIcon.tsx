"use client";

import {
  DocumentPdfFilled,
  CodeFilled,
  ImageFilled,
  DocumentTextFilled,
  TableSimpleFilled,
  ArchiveFilled,
  MusicNote1Filled,
  VideoFilled,
  SettingsFilled,
  DocumentFilled,
  FolderFilled,
} from "@fluentui/react-icons";

interface BreadcrumbFileIconProps {
  fileType: string;
}

export const BreadcrumbFileIcon = ({ fileType }: BreadcrumbFileIconProps) => {
  // Smaller icon size for breadcrumb
  const iconSize = "h-4 w-4";

  switch (fileType.toLowerCase()) {
    case "pdf":
      return (
        <DocumentPdfFilled
          className={`${iconSize} text-red-600 flex-shrink-0`}
        />
      );
    case "dwg":
    case "dxf":
    case "dwf":
      return (
        <CodeFilled className={`${iconSize} text-blue-600 flex-shrink-0`} />
      );
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
      return (
        <ImageFilled className={`${iconSize} text-green-600 flex-shrink-0`} />
      );
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return (
        <DocumentTextFilled
          className={`${iconSize} text-blue-600 flex-shrink-0`}
        />
      );
    case "xls":
    case "xlsx":
    case "csv":
      return (
        <TableSimpleFilled
          className={`${iconSize} text-green-600 flex-shrink-0`}
        />
      );
    case "ppt":
    case "pptx":
      return (
        <DocumentTextFilled
          className={`${iconSize} text-orange-600 flex-shrink-0`}
        />
      );
    case "zip":
    case "rar":
    case "7z":
      return (
        <ArchiveFilled
          className={`${iconSize} text-yellow-600 flex-shrink-0`}
        />
      );
    case "mp3":
    case "wav":
    case "ogg":
      return (
        <MusicNote1Filled
          className={`${iconSize} text-purple-600 flex-shrink-0`}
        />
      );
    case "mp4":
    case "avi":
    case "mov":
      return (
        <VideoFilled className={`${iconSize} text-pink-600 flex-shrink-0`} />
      );
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return (
        <SettingsFilled
          className={`${iconSize} text-yellow-600 flex-shrink-0`}
        />
      );
    case "json":
      return (
        <CodeFilled className={`${iconSize} text-gray-600 flex-shrink-0`} />
      );
    default:
      return (
        <DocumentFilled className={`${iconSize} text-gray-600 flex-shrink-0`} />
      );
  }
};
