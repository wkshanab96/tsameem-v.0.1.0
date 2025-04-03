"use client";

import { useState, useEffect } from "react";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { File as FileType } from "@/lib/types";

interface DocumentProcessingStatusProps {
  files: FileType[];
  onProcessingComplete?: (file: FileType) => void;
}

export function DocumentProcessingStatus({
  files,
  onProcessingComplete,
}: DocumentProcessingStatusProps) {
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(files.length);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "pending" | "processing" | "completed" | "failed"
  >("pending");

  // Simulate checking processing status
  useEffect(() => {
    if (files.length === 0) return;

    setTotalFiles(files.length);
    const initialProcessed = files.filter(
      (f) => f.metadata?.processed === true,
    ).length;
    setProcessedCount(initialProcessed);

    if (initialProcessed === files.length) {
      setStatus("completed");
      setProgress(100);
      return;
    }

    setStatus("processing");
    setProgress(Math.round((initialProcessed / files.length) * 100));

    // Simulate processing for remaining files
    const interval = setInterval(() => {
      setProcessedCount((prev) => {
        const newCount = Math.min(prev + 1, files.length);
        const newProgress = Math.round((newCount / files.length) * 100);
        setProgress(newProgress);

        if (newCount === files.length) {
          setStatus("completed");
          clearInterval(interval);

          // Notify parent component that all files are processed
          files.forEach((file) => {
            if (onProcessingComplete && !file.metadata?.processed) {
              onProcessingComplete({
                ...file,
                metadata: { ...file.metadata, processed: true },
              });
            }
          });
        }

        return newCount;
      });
    }, 2000); // Process a file every 2 seconds

    return () => clearInterval(interval);
  }, [files, onProcessingComplete]);

  return (
    <div className="w-full space-y-2 p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {status === "pending" && "Waiting to process files..."}
          {status === "processing" &&
            `Processing files (${processedCount}/${totalFiles})...`}
          {status === "completed" && "All files processed successfully"}
          {status === "failed" && "Some files failed to process"}
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant={status === "failed" ? "destructive" : "outline"}>
                {status === "pending" && <Clock className="h-3 w-3" />}
                {status === "processing" && <span>{progress}%</span>}
                {status === "completed" && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {status === "failed" && <AlertCircle className="h-3 w-3" />}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {status === "pending" && "Files are waiting to be processed"}
              {status === "processing" &&
                `Processing files (${progress}% complete)`}
              {status === "completed" &&
                "All files have been successfully processed"}
              {status === "failed" &&
                "Some files failed to process. Try again."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Progress value={progress} className="h-1" />
    </div>
  );
}
