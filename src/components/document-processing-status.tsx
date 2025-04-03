"use client";

import { useState, useEffect } from "react";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { File as FileType } from "@/lib/types";

interface DocumentProcessingStatusProps {
  file: FileType;
  onProcessingComplete?: (file: FileType) => void;
}

export function DocumentProcessingStatus({
  file,
  onProcessingComplete,
}: DocumentProcessingStatusProps) {
  const [status, setStatus] = useState<
    "pending" | "processing" | "completed" | "failed"
  >("pending");
  const [progress, setProgress] = useState(0);

  // Simulate checking processing status
  // In a real implementation, this would poll an API endpoint or use a WebSocket
  useEffect(() => {
    if (file.metadata?.processed === true) {
      setStatus("completed");
      setProgress(100);
      if (onProcessingComplete) onProcessingComplete(file);
      return;
    }

    // Simulate processing
    setStatus("processing");
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(Math.min(currentProgress, 90)); // Cap at 90% until confirmed complete

      if (currentProgress >= 100) {
        clearInterval(interval);

        // Simulate 80% chance of success
        if (Math.random() > 0.2) {
          setStatus("completed");
          setProgress(100);
          if (onProcessingComplete) {
            const updatedFile = {
              ...file,
              metadata: { ...file.metadata, processed: true },
            };
            onProcessingComplete(updatedFile);
          }
        } else {
          setStatus("failed");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [file, onProcessingComplete]);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {status === "pending" && "Waiting to process..."}
          {status === "processing" && "Processing document..."}
          {status === "completed" && "Processing complete"}
          {status === "failed" && "Processing failed"}
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
              {status === "pending" && "Document is waiting to be processed"}
              {status === "processing" &&
                `Processing document (${progress}% complete)`}
              {status === "completed" &&
                "Document has been successfully processed"}
              {status === "failed" && "Document processing failed. Try again."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Progress value={progress} className="h-1" />
    </div>
  );
}
