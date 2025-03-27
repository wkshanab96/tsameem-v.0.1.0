"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { File as FileType } from "@/lib/types";
import { PdfPreview } from "./PdfPreview";
import { ImageViewer } from "./ImageViewer";
import { TextFileViewer } from "./TextFileViewer";
import { CodeViewer } from "./CodeViewer";
import { FileIcon } from "./FileIcon";
import { formatFileSize, formatDate } from "@/lib/file-utils";
import { Button } from "../ui/button";
import {
  ArrowDownloadRegular,
  ShareRegular,
  OpenRegular,
  SettingsRegular,
} from "@fluentui/react-icons";
import { saveAs } from "file-saver";
import { createClient } from "../../../supabase/client";
import { useState } from "react";
import { toast } from "../ui/use-toast";

interface FilePreviewDialogProps {
  file: FileType | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileType) => void;
  onAnalyzeWithAI?: (file: FileType) => void;
}

export const FilePreviewDialog = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onAnalyzeWithAI,
}: FilePreviewDialogProps) => {
  if (!file) return null;

  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);

  const openInNewTab = () => {
    if (file.public_url) {
      window.open(file.public_url, "_blank");
    }
  };

  const shareFile = () => {
    // In a real implementation, this would open a sharing dialog
    // For now, we'll just copy the URL to clipboard if available
    if (file.public_url) {
      navigator.clipboard.writeText(file.public_url);
      toast({
        title: "Link Copied",
        description: "File URL copied to clipboard!",
      });
    }
  };

  const downloadFile = async () => {
    try {
      console.log(`Attempting to download file: ${file.name}`);
      toast({
        title: "Download Started",
        description: "Preparing your file for download...",
      });

      // Try direct download from public URL first
      if (file.public_url) {
        console.log(`Using public URL: ${file.public_url}`);
        try {
          // Add cache-busting parameter to URL
          const cacheBustUrl = `${file.public_url}?t=${new Date().getTime()}`;
          console.log(`Using cache-busted URL: ${cacheBustUrl}`);

          const response = await fetch(cacheBustUrl);
          if (response.ok) {
            const blob = await response.blob();
            saveAs(blob, file.name);
            console.log("Download successful via public URL");
            toast({
              title: "Download Complete",
              description: `${file.name} has been downloaded successfully.`,
            });
            return;
          } else {
            console.warn(
              `Public URL fetch failed with status: ${response.status}`,
            );
          }
        } catch (fetchError) {
          console.warn("Public URL fetch failed:", fetchError);
        }
      }

      // Try using the browser's direct download capability
      if (file.public_url) {
        try {
          console.log("Trying direct browser download");
          const link = document.createElement("a");
          link.href = file.public_url;
          link.download = file.name;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: "Download Initiated",
            description:
              "If the download doesn't start automatically, check your browser settings.",
          });
          return;
        } catch (directError) {
          console.warn("Direct browser download failed:", directError);
        }
      }

      // Try Supabase storage as fallback
      if (file.storage_path) {
        console.log(`Trying storage path: ${file.storage_path}`);
        const supabase = createClient();

        try {
          const { data, error } = await supabase.storage
            .from("documents")
            .download(file.storage_path);

          if (error) {
            console.error("Storage download error:", error);
            throw error;
          }

          if (data) {
            const mimeType = getMimeTypeFromFileName(file.name);
            console.log(`Using MIME type: ${mimeType} for file: ${file.name}`);

            const blob = new Blob([data], {
              type: mimeType || "application/octet-stream",
            });
            saveAs(blob, file.name);
            console.log("Download successful via storage");
            toast({
              title: "Download Complete",
              description: `${file.name} has been downloaded successfully.`,
            });
            return;
          }
        } catch (storageError) {
          console.error("Storage download failed:", storageError);
        }
      }

      // Use the provided download handler as last resort
      console.log("Using fallback download handler");
      onDownload(file);
      toast({
        title: "Alternative Download Method",
        description: "Using fallback download method...",
      });
    } catch (error) {
      console.error("Error in download process:", error);
      toast({
        title: "Download Failed",
        description: `${error.message || "Unknown error"}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Helper function to determine MIME type
  const getMimeTypeFromFileName = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      dwg: "application/acad",
      dxf: "application/dxf",
    };
    return mimeTypes[ext] || "application/octet-stream";
  };

  // Determine file type category
  const getFileCategory = () => {
    const fileType = file.file_type.toLowerCase();

    // Image types
    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(fileType)
    ) {
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

  // Update file description
  const updateFileDescription = async (description: string) => {
    setIsUpdatingDescription(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("files")
        .update({
          metadata: {
            ...file.metadata,
            description,
          },
        })
        .eq("id", file.id);

      if (error) {
        console.error("Error updating description:", error);
        toast({
          title: "Update Failed",
          description: "Failed to update file description",
          variant: "destructive",
        });
      } else {
        // Update local state
        if (file.metadata) {
          file.metadata.description = description;
        } else {
          file.metadata = { description };
        }
        toast({
          title: "Success",
          description: "File description updated",
        });
      }
    } catch (error) {
      console.error("Error updating description:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update file description",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  // Render the appropriate viewer based on file type
  const renderFileViewer = () => {
    const category = getFileCategory();

    switch (category) {
      case "pdf":
        return <PdfPreview file={file} />;

      case "image":
        return <ImageViewer file={file} />;

      case "text":
        return <TextFileViewer file={file} />;

      case "code":
        return <CodeViewer file={file} />;

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 flex-col gap-4">
            <FileIcon fileType={file.file_type} />
            <p className="text-gray-500">
              Preview not available for this file type
            </p>
            <p className="text-sm text-gray-400">
              You can download the file to view its contents
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileIcon fileType={file.file_type} />
              <div>
                <h3 className="text-lg font-medium">{file.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)} • Last updated{" "}
                  {formatDate(file.updated_at || file.created_at)}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* File Description */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Description</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                const description = prompt(
                  "Enter file description:",
                  file.metadata?.description || "",
                );
                if (description !== null) {
                  updateFileDescription(description);
                }
              }}
              disabled={isUpdatingDescription}
            >
              {isUpdatingDescription ? "Updating..." : "Edit"}
            </Button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 min-h-[60px]">
            {file.metadata?.description ||
              "No description provided. Click 'Edit' to add one."}
          </div>
        </div>

        <div className="flex-1 min-h-[400px] border rounded-lg overflow-hidden">
          {renderFileViewer()}
        </div>

        <div className="flex justify-between mt-4">
          {onAnalyzeWithAI && (
            <Button
              variant="outline"
              onClick={() => onAnalyzeWithAI(file)}
              className="flex items-center gap-2"
            >
              <SettingsRegular className="h-4 w-4" />
              Analyze with AI
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={openInNewTab}
              className="flex items-center gap-2"
              disabled={!file.public_url}
            >
              <OpenRegular className="h-4 w-4" />
              Open in New Tab
            </Button>

            <Button
              variant="outline"
              onClick={downloadFile}
              className="flex items-center gap-2"
            >
              <ArrowDownloadRegular className="h-4 w-4" />
              Download
            </Button>

            <Button
              variant="outline"
              onClick={shareFile}
              className="flex items-center gap-2"
              disabled={!file.public_url}
            >
              <ShareRegular className="h-4 w-4" />
              Share
            </Button>

            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
