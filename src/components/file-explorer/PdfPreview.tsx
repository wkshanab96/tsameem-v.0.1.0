"use client";

import { useState, useEffect, useRef } from "react";
import { File as FileType } from "@/lib/types";
import { Button } from "../ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
} from "lucide-react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";

// Use a consistent PDF.js version throughout the component
const PDF_VERSION = "3.11.174";

// Force the PDF.js version before importing react-pdf components
if (typeof window !== "undefined") {
  // Don't try to set the version property directly
  console.log("Initializing PDF viewer with version:", PDF_VERSION);
}

// Dynamically import Document and Page components with improved error handling
const Document = dynamic(
  () =>
    import("react-pdf")
      .then((mod) => {
        console.log("Successfully loaded react-pdf Document component");
        return mod.Document;
      })
      .catch((err) => {
        console.error("Failed to load Document component:", err);
        return () => (
          <div className="text-red-500">
            PDF viewer failed to load: {err.message}
          </div>
        );
      }),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-sm text-gray-500">Loading PDF viewer...</p>
      </div>
    ),
  },
);

const Page = dynamic(
  () =>
    import("react-pdf")
      .then((mod) => {
        console.log("Successfully loaded react-pdf Page component");
        return mod.Page;
      })
      .catch((err) => {
        console.error("Failed to load Page component:", err);
        return () => (
          <div className="text-red-500">
            PDF page failed to load: {err.message}
          </div>
        );
      }),
  { ssr: false },
);

interface PdfPreviewProps {
  file: FileType;
  className?: string;
}

export const PdfPreview = ({ file, className }: PdfPreviewProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const workerInitialized = useRef(false);

  // Initialize PDF.js worker with better error handling
  useEffect(() => {
    if (workerInitialized.current) return;

    const initPdfWorker = async () => {
      if (typeof window !== "undefined") {
        try {
          // Import pdfjs-dist
          const pdfjs = await import("pdfjs-dist/legacy/build/pdf");

          // Set the worker source to a CDN URL with our consistent version
          const workerSrc = `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/build/pdf.worker.min.js`;
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

          console.log("PDF.js worker initialized with version:", PDF_VERSION);
          workerInitialized.current = true;

          // Create a script element to preload the worker
          const script = document.createElement("script");
          script.src = workerSrc;
          script.async = true;
          script.onload = () => {
            console.log("PDF.js worker script loaded successfully");
          };
          script.onerror = (e) => {
            console.error("Failed to load PDF.js worker script:", e);
            // Try alternative CDN if the first one fails
            const alternativeWorkerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_VERSION}/build/pdf.worker.min.js`;
            console.log(
              "Trying alternative worker source:",
              alternativeWorkerSrc,
            );

            const alternativeScript = document.createElement("script");
            alternativeScript.src = alternativeWorkerSrc;
            alternativeScript.async = true;
            alternativeScript.onload = () => {
              console.log(
                "Alternative PDF.js worker script loaded successfully",
              );
              pdfjs.GlobalWorkerOptions.workerSrc = alternativeWorkerSrc;
            };
            document.head.appendChild(alternativeScript);
          };
          document.head.appendChild(script);
        } catch (error) {
          console.error("Error initializing PDF.js worker:", error);
          setError(
            `Failed to initialize PDF viewer: ${error instanceof Error ? error.message : "Unknown error"}. Please try refreshing the page.`,
          );
          setIsLoading(false);
        }
      }
    };
    initPdfWorker();
  }, []);

  // Load PDF with improved error handling and retry mechanism
  useEffect(() => {
    if (!workerInitialized.current && loadAttempts > 0) {
      setError("PDF viewer not initialized. Please try refreshing the page.");
      setIsLoading(false);
      return;
    }

    // Reset state when file changes
    setIsLoading(true);
    setError(null);
    setNumPages(null);
    setPageNumber(1);
    setScale(1.0);

    // Clean up previous URL if it exists
    if (pdfUrl && pdfUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl);
    }

    const loadPdf = async () => {
      try {
        // Try public_url first as it's more reliable in this environment
        if (file && file.public_url) {
          console.log("Loading PDF from public URL:", file.public_url);

          // Try with a timestamp for cache busting
          try {
            const timestamp = new Date().getTime();
            const url = `${file.public_url}?t=${timestamp}`;
            console.log("Trying URL with cache busting:", url);

            // Try a full fetch instead of just HEAD
            const response = await fetch(url);

            if (response.ok) {
              console.log("URL with cache busting is accessible");
              // Create a blob from the response
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              console.log("Created blob URL from public URL:", blobUrl);
              setPdfUrl(blobUrl);
              setIsLoading(false);
              return;
            } else {
              console.error(
                `HTTP error with cache busting: ${response.status} ${response.statusText}`,
              );
            }
          } catch (fetchError) {
            console.error("Error with cache busting URL:", fetchError);
            // Try direct URL as fallback
            setPdfUrl(file.public_url);
            setIsLoading(false);
            return;
          }
        }

        // Try to get the file from storage as fallback
        if (file && file.storage_path) {
          console.log("Loading PDF from storage path:", file.storage_path);
          const { createClient } = await import("../../../supabase/client");
          const supabase = createClient();

          try {
            const { data, error: downloadError } = await supabase.storage
              .from("documents")
              .download(file.storage_path);

            if (downloadError) {
              console.error(
                "Error downloading PDF from storage:",
                downloadError,
              );
              throw downloadError;
            }

            if (data) {
              // Create a blob URL from the downloaded data
              const blob = new Blob([data], { type: "application/pdf" });
              const url = URL.createObjectURL(blob);
              console.log("Created blob URL for PDF from storage:", url);
              setPdfUrl(url);
              setIsLoading(false);
              return;
            }
          } catch (storageError) {
            console.error("Storage download failed:", storageError);

            // Try getting a public URL from the storage path
            try {
              const { data: urlData } = supabase.storage
                .from("documents")
                .getPublicUrl(file.storage_path);

              if (urlData && urlData.publicUrl) {
                console.log(
                  "Got public URL from storage path:",
                  urlData.publicUrl,
                );
                setPdfUrl(urlData.publicUrl);
                setIsLoading(false);
                return;
              }
            } catch (publicUrlError) {
              console.error("Error getting public URL:", publicUrlError);
            }
          }
        }

        // Last resort - try direct URL without any modifications
        if (file && file.public_url) {
          console.log("Falling back to direct public URL:", file.public_url);
          setPdfUrl(file.public_url);
          setIsLoading(false);
          return;
        }

        throw new Error("No valid PDF source available");
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError(
          `Failed to load PDF: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setIsLoading(false);
      }
    };

    loadPdf();

    // Cleanup function to revoke blob URL when component unmounts or file changes
    return () => {
      if (pdfUrl && pdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [file, loadAttempts]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error);
    setError(`Failed to load PDF: ${error.message}`);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setLoadAttempts((prev) => prev + 1);
    setIsLoading(true);
    setError(null);
  };

  const downloadPdf = async () => {
    try {
      if (file.public_url) {
        saveAs(file.public_url, file.name);
      } else if (file.storage_path) {
        const { createClient } = await import("../../../supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from("documents")
          .download(file.storage_path);

        if (error) throw error;
        saveAs(new Blob([data], { type: "application/pdf" }), file.name);
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError(
        `Failed to download PDF: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const goToPrevPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prevPageNumber) =>
      numPages ? Math.min(prevPageNumber + 1, numPages) : prevPageNumber,
    );
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    } else if (file.public_url) {
      window.open(file.public_url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading PDF...</p>
        <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-600 font-medium mb-2">Error Loading PDF</h3>
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
              onClick={downloadPdf}
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
    <div className={`w-full h-full flex flex-col ${className}`}>
      <div
        ref={pdfContainerRef}
        className="flex-1 overflow-auto flex justify-center bg-gray-100 p-4"
      >
        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center p-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600">Loading PDF content...</p>
              </div>
            }
            error={
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-medium">Failed to render PDF</p>
                <p className="text-sm text-gray-600 mt-1">
                  Try downloading the file instead
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadPdf}
                  className="mt-3 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            }
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/standard_fonts/`,
              workerSrc: `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/build/pdf.worker.min.js`,
              disableWorker: false,
              disableFontFace: false,
              verbosity: 1,
            }}
          >
            <Page
              key={`page_${pageNumber}_scale_${scale}`}
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="flex items-center justify-center h-[500px] w-[400px] bg-gray-50 border border-gray-200 rounded-md">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-2 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              }
              error={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">
                    Failed to render page {pageNumber}
                  </p>
                </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  );
};
