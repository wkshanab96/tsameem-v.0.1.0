import { File as FileType } from "./types";
import { createClient } from "../../supabase/client";
import { saveAs } from "file-saver";

/**
 * Categorizes a file based on its file type/extension
 * @param file The file object to categorize
 * @returns The category of the file (pdf, image, text, code, or unknown)
 */
export const getFileCategory = (
  file: FileType,
): "pdf" | "image" | "text" | "code" | "unknown" => {
  const fileType = file.file_type.toLowerCase();

  // Image types
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(fileType)) {
    return "image";
  }

  // PDF
  if (fileType === "pdf") {
    return "pdf";
  }

  // Text files
  if (["txt", "md", "markdown", "rtf"].includes(fileType)) {
    return "text";
  }

  // Code files
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "json",
      "py",
      "java",
      "c",
      "cpp",
      "cs",
      "go",
      "rb",
      "php",
      "swift",
      "sql",
      "yml",
      "yaml",
      "sh",
      "bash",
      "xml",
    ].includes(fileType)
  ) {
    return "code";
  }

  // Default - unknown type
  return "unknown";
};

/**
 * Downloads a file from Supabase storage or public URL
 * @param file The file to download
 */
export const downloadFileContent = async (file: FileType): Promise<void> => {
  try {
    if (file.public_url) {
      // If we have a public URL, use it directly
      saveAs(file.public_url, file.name);
      return;
    }

    if (file.storage_path) {
      // Otherwise download from Supabase storage
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("documents")
        .download(file.storage_path);

      if (error) throw error;
      saveAs(data, file.name);
      return;
    }

    throw new Error("No download path available for this file");
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Fetches the text content of a file from Supabase storage
 * @param file The file to fetch content for
 * @returns The text content of the file
 */
export const fetchFileContent = async (file: FileType): Promise<string> => {
  try {
    if (!file.storage_path) {
      throw new Error("File storage path is missing");
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .download(file.storage_path);

    if (error) throw error;

    // Convert blob to text
    const text = await data.text();
    return text;
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw error;
  }
};

/**
 * Determines the appropriate syntax highlighting language class based on file type
 * @param fileType The file extension/type
 * @returns The CSS class for syntax highlighting
 */
export const getLanguageClass = (fileType: string): string => {
  const type = fileType.toLowerCase();
  switch (type) {
    case "js":
      return "language-javascript";
    case "ts":
      return "language-typescript";
    case "jsx":
    case "tsx":
      return "language-jsx";
    case "html":
      return "language-html";
    case "css":
      return "language-css";
    case "json":
      return "language-json";
    case "py":
      return "language-python";
    case "java":
      return "language-java";
    case "c":
    case "cpp":
    case "h":
      return "language-cpp";
    case "cs":
      return "language-csharp";
    case "go":
      return "language-go";
    case "rb":
      return "language-ruby";
    case "php":
      return "language-php";
    case "swift":
      return "language-swift";
    case "sql":
      return "language-sql";
    case "md":
    case "markdown":
      return "language-markdown";
    case "yml":
    case "yaml":
      return "language-yaml";
    case "sh":
    case "bash":
      return "language-bash";
    default:
      return "language-plaintext";
  }
};
