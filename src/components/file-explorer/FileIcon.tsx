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

interface FileIconProps {
  fileType: string;
}

export const FileIcon = ({ fileType }: FileIconProps) => {
  // Even larger icon size for file cards
  const iconSize = "h-12 w-12";

  switch (fileType.toLowerCase()) {
    case "pdf":
      return (
        <div className="p-2 rounded-lg">
          <DocumentPdfFilled
            className={
              `${iconSize} text-red-600 flex-shrink-0` + " w-12 h-[12]"
            }
          />
        </div>
      );
    case "dwg":
    case "dxf":
    case "dwf":
      return (
        <div className="bg-blue-100 p-2 rounded-lg">
          <CodeFilled className={`${iconSize} text-blue-600 flex-shrink-0`} />
        </div>
      );
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
      return (
        <div className="p-2 rounded-lg ">
          <ImageFilled className={`${iconSize} text-green-600 flex-shrink-0`} />
        </div>
      );
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return (
        <div className="p-2 rounded-lg bg-white">
          <DocumentTextFilled
            className={`${iconSize} text-blue-600 flex-shrink-0`}
          />
        </div>
      );
    case "xls":
    case "xlsx":
    case "csv":
      return (
        <div className="bg-green-100 p-2 rounded-lg">
          <TableSimpleFilled
            className={`${iconSize} text-green-600 flex-shrink-0`}
          />
        </div>
      );
    case "ppt":
    case "pptx":
      return (
        <div className="bg-orange-100 p-2 rounded-lg">
          <DocumentTextFilled
            className={`${iconSize} text-orange-600 flex-shrink-0`}
          />
        </div>
      );
    case "zip":
    case "rar":
    case "7z":
      return (
        <div className="bg-yellow-100 p-2 rounded-lg">
          <ArchiveFilled
            className={`${iconSize} text-yellow-600 flex-shrink-0`}
          />
        </div>
      );
    case "mp3":
    case "wav":
    case "ogg":
      return (
        <div className="bg-purple-100 p-2 rounded-lg">
          <MusicNote1Filled
            className={`${iconSize} text-purple-600 flex-shrink-0`}
          />
        </div>
      );
    case "mp4":
    case "avi":
    case "mov":
      return (
        <div className="bg-pink-100 p-2 rounded-lg">
          <VideoFilled className={`${iconSize} text-pink-600 flex-shrink-0`} />
        </div>
      );
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return (
        <div className="bg-yellow-100 p-2 rounded-lg">
          <SettingsFilled
            className={`${iconSize} text-yellow-600 flex-shrink-0`}
          />
        </div>
      );
    case "json":
      return (
        <div className="bg-gray-100 p-2 rounded-lg">
          <CodeFilled className={`${iconSize} text-gray-600 flex-shrink-0`} />
        </div>
      );
    default:
      return (
        <div className="bg-gray-100 p-2 rounded-lg">
          <DocumentFilled
            className={`${iconSize} text-gray-600 flex-shrink-0`}
          />
        </div>
      );
  }
};
