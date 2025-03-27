"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "./ui/use-toast";

export function StorageOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runOptimization = async () => {
    try {
      setIsOptimizing(true);
      setResults(null);

      const response = await fetch("/api/optimize-storage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to optimize storage");
      }

      setResults(data);
      toast({
        title: "Storage Optimization Complete",
        description:
          "Your storage structure has been optimized for better performance.",
      });
    } catch (error) {
      console.error("Error optimizing storage:", error);
      toast({
        title: "Optimization Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Optimization</CardTitle>
        <CardDescription>
          Optimize your storage structure for better performance and
          scalability. This will ensure metadata is stored in the database while
          actual files are stored in the cloud storage bucket.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-orange-800 mb-2">
              How this works:
            </h3>
            <ul className="text-sm text-orange-700 space-y-1 list-disc pl-5">
              <li>
                Metadata (drawing numbers, paths, revisions) and extracted text
                are stored in the database
              </li>
              <li>
                Actual drawing files are stored in the cloud storage bucket
              </li>
              <li>This approach combines the strengths of both technologies</li>
              <li>
                Results in a more efficient, scalable, and cost-effective system
              </li>
            </ul>
          </div>

          {results && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                Optimization Results:
              </h3>
              <p className="text-sm text-green-700">{results.message}</p>
              <p className="text-xs text-green-600 mt-2">
                {results.results.filter((r) => r.success).length} operations
                completed successfully
              </p>
              {results.results.some((r) => !r.success) && (
                <p className="text-xs text-amber-600 mt-1">
                  {results.results.filter((r) => !r.success).length} operations
                  had warnings (this is normal if indexes already exist)
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={runOptimization}
          disabled={isOptimizing}
          className="w-full"
        >
          {isOptimizing ? "Optimizing..." : "Run Storage Optimization"}
        </Button>
      </CardFooter>
    </Card>
  );
}
