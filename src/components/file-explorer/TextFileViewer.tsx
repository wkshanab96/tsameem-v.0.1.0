"use client";

import { useState, useEffect } from "react";
import { File as FileType } from "@/lib/types";
import { createClient } from "../../../supabase/client";
import { Button } from "../ui/button";
import { RefreshCw, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { getMimeTypeFromFileName } from "@/lib/file-utils-mime";

interface TextFileViewerProps {
  file: FileType;
}

export const TextFileViewer = ({ file }: TextFileViewerProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  useEffect(() => {
    const fetchTextContent = async () => {
      if (!file) {
        setError("File information is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch from public URL first if available
        if (file.public_url) {
          try {
            console.log(
              "Attempting to fetch text from public URL:",
              file.public_url,
            );

            // Try with a simple timestamp for cache busting
            const timestamp = new Date().getTime();
            const url = `${file.public_url}?t=${timestamp}`;

            // First check if the URL is accessible
            const headResponse = await fetch(url, { method: "HEAD" });

            if (headResponse.ok) {
              console.log("URL is accessible, fetching content");
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const text = await response.text();
              setContent(text);
              setIsLoading(false);
              return;
            } else {
              console.log(
                "URL with timestamp not accessible, trying without timestamp",
              );
              // Try without timestamp
              const plainHeadResponse = await fetch(file.public_url, {
                method: "HEAD",
              });

              if (plainHeadResponse.ok) {
                console.log("Plain URL is accessible, fetching content");
                const plainResponse = await fetch(file.public_url);
                if (!plainResponse.ok) {
                  throw new Error(
                    `HTTP error! status: ${plainResponse.status}`,
                  );
                }
                const text = await plainResponse.text();
                setContent(text);
                setIsLoading(false);
                return;
              } else {
                console.error("Both URLs failed, falling back to storage path");
              }
            }
          } catch (publicUrlError) {
            console.error("Error fetching from public URL:", publicUrlError);
            // Fall back to storage path if public URL fails
          }
        }

        // If no public URL or it failed, try storage path
        if (!file.storage_path) {
          throw new Error("No storage path available for this file");
        }

        const supabase = createClient();

        // Try to download the file from storage
        try {
          console.log(
            `Attempting to download text file from path: ${file.storage_path}`,
          );

          // Try to download with multiple attempts
          let data, downloadError;
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            attempts++;
            console.log(
              `Download attempt ${attempts} for ${file.storage_path}`,
            );

            const result = await supabase.storage
              .from("documents")
              .download(file.storage_path);

            data = result.data;
            downloadError = result.error;

            if (!downloadError && data) {
              console.log(`Download successful on attempt ${attempts}`);
              break;
            }

            if (attempts < maxAttempts) {
              console.log(`Retrying download in 1 second...`);
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (downloadError) {
            console.error("Error downloading text file:", downloadError);
            console.log(
              "Detailed error object:",
              JSON.stringify(downloadError, null, 2),
            );
            throw new Error(
              `Download error: ${downloadError.message || JSON.stringify(downloadError)}`,
            );
          }

          if (!data) {
            throw new Error("No data received from storage");
          }

          // Convert blob to text
          const text = await data.text();
          setContent(text);
          setIsLoading(false);
        } catch (downloadErr) {
          console.error("Detailed download error:", downloadErr);
          setError(
            `Failed to download file: ${downloadErr instanceof Error ? downloadErr.message : JSON.stringify(downloadErr)}`,
          );
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error fetching text content:", err);
        setError(
          `Failed to load text content: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setIsLoading(false);
      }
    };

    fetchTextContent();
  }, [file, loadAttempts]);

  const handleRetry = () => {
    setLoadAttempts((prev) => prev + 1);
  };

  const downloadTextFile = async () => {
    try {
      if (file.public_url) {
        saveAs(file.public_url, file.name);
      } else if (file.storage_path) {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from("documents")
          .download(file.storage_path);

        if (error) {
          console.error(
            "Error downloading file:",
            JSON.stringify(error, null, 2),
          );
          throw error;
        }

        // Get the appropriate MIME type for the file
        const mimeType = getMimeTypeFromFileName(file.name) || "text/plain";
        saveAs(new Blob([data], { type: mimeType }), file.name);
      }
    } catch (err) {
      console.error("Error downloading text file:", err);
      setError(
        `Failed to download file: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
      );
    }
  };

  const openInNewTab = () => {
    if (content) {
      // Create a blob from the text content and open in new tab
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Clean up the URL after opening
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else if (file.public_url) {
      window.open(file.public_url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading text content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-600 font-medium mb-2">
            Error Loading Text File
          </h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTextFile}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Instead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end p-2 bg-gray-50 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTextFile}
          className="flex items-center gap-2 mr-2"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openInNewTab}
          className="flex items-center gap-2"
          disabled={!content && !file.public_url}
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
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Open in new tab
        </Button>
      </div>
      <div className="flex-1 overflow-auto bg-white p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
      </div>
    </div>
  );
};
