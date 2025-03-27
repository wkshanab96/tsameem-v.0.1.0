"use client";

import { useState, useEffect, useRef } from "react";
import { File as FileType } from "@/lib/types";
import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Download } from "lucide-react";
import { getMimeTypeFromFileName } from "@/lib/file-utils-mime";
import { createClient } from "../../../supabase/client";
import { saveAs } from "file-saver";

interface ImageViewerProps {
  file: FileType;
}

export const ImageViewer = ({ file }: ImageViewerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setError(null);
      setZoom(1);
      setRotation(0);

      try {
        if (file && file.public_url) {
          // Add a simple timestamp for cache busting
          const timestamp = new Date().getTime();
          const url = `${file.public_url}?t=${timestamp}`;
          console.log("Attempting to load image from URL:", url);

          // Pre-load the image to check if it's accessible
          const img = new Image();

          // Create a promise to handle image loading
          const imageLoadPromise = new Promise<string>((resolve, reject) => {
            img.onload = () => {
              console.log("Image loaded successfully from URL");
              resolve(url);
            };
            img.onerror = (e) => {
              console.error("Error loading image from URL with timestamp:", e);

              // Try without cache busting as fallback
              const plainImg = new Image();
              plainImg.onload = () => {
                console.log("Image loaded successfully from plain URL");
                resolve(file.public_url);
              };
              plainImg.onerror = () => {
                console.error("Error loading image from plain URL too");
                reject(new Error("Failed to load image from public URL"));
              };
              plainImg.src = file.public_url;
            };
          });

          // Start loading the image
          img.src = url;

          // Wait for the image to load or fail
          const resolvedUrl = await imageLoadPromise;
          setImageUrl(resolvedUrl);
          setIsLoading(false);
        } else if (file && file.storage_path) {
          // Try to get the file from storage if public_url is not available
          const supabase = createClient();
          try {
            console.log(
              `Attempting to download image from path: ${file.storage_path}`,
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
              console.error(
                "Error downloading image:",
                JSON.stringify(downloadError),
              );
              throw new Error(
                `Failed to download image: ${downloadError.message || JSON.stringify(downloadError)}`,
              );
            }

            if (!data) {
              throw new Error("No data received from storage");
            }

            // Create a blob URL from the downloaded data with explicit MIME type
            const mimeType = getMimeTypeFromFileName(file.name) || "image/jpeg";
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            console.log("Created blob URL for image:", url);
            setImageUrl(url);
            setIsLoading(false);
          } catch (err) {
            console.error("Error loading image from storage:", err);
            throw err;
          }
        } else {
          throw new Error("Image not available");
        }
      } catch (err) {
        console.error("Error loading image:", err);
        setError(
          `Failed to load image: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setIsLoading(false);
      }
    };

    loadImage();

    // Cleanup function to revoke blob URL when component unmounts or file changes
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [file, loadAttempts]);

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const handleRetry = () => {
    setLoadAttempts((prev) => prev + 1);
  };

  const downloadImage = async () => {
    try {
      if (file.public_url) {
        saveAs(file.public_url, file.name);
      } else if (file.storage_path) {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from("documents")
          .download(file.storage_path);

        if (error) throw error;

        // Use the correct MIME type for the image
        const mimeType = getMimeTypeFromFileName(file.name) || "image/jpeg";
        saveAs(new Blob([data], { type: mimeType }), file.name);
      }
    } catch (err) {
      console.error("Error downloading image:", err);
      setError(
        `Failed to download image: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const openInNewTab = () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    } else if (file.public_url) {
      window.open(file.public_url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading image...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-600 font-medium mb-2">Error Loading Image</h3>
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
              onClick={downloadImage}
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
      <div className="flex justify-center gap-2 p-2 bg-gray-50 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="flex items-center text-sm">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRotate}
          title="Rotate"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadImage}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openInNewTab}
          title="Open in new tab"
          disabled={!imageUrl && !file.public_url}
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
        </Button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-4"
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={file.name}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            className="object-contain"
          />
        )}
      </div>
    </div>
  );
};
