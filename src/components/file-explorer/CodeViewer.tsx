"use client";

import { useState, useEffect } from "react";
import { File as FileType } from "@/lib/types";
import { createClient } from "../../../supabase/client";

interface CodeViewerProps {
  file: FileType;
}

export const CodeViewer = ({ file }: CodeViewerProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine language based on file extension
  const getLanguageClass = (fileType: string) => {
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

  useEffect(() => {
    const fetchCodeContent = async () => {
      if (!file || !file.storage_path) {
        setError("File information is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const supabase = createClient();

        // Try to download the file from storage
        const { data, error: downloadError } = await supabase.storage
          .from("documents")
          .download(file.storage_path);

        if (downloadError) {
          console.error("Error downloading code file:", downloadError);
          setError("Failed to download file");
          setIsLoading(false);
          return;
        }

        // Convert blob to text
        const text = await data.text();
        setContent(text);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching code content:", err);
        setError("Failed to load code content");
        setIsLoading(false);
      }
    };

    fetchCodeContent();
  }, [file]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  const languageClass = getLanguageClass(file.file_type);

  return (
    <div className="w-full h-full overflow-auto bg-gray-900 p-4">
      <pre className={`${languageClass} text-sm`}>
        <code className="text-gray-200">{content}</code>
      </pre>
    </div>
  );
};
