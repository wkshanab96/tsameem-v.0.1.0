"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { File as FileType } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/file-utils";
import { FileIcon } from "./FileIcon";
import {
  SearchRegular,
  SettingsRegular,
  DocumentRegular,
  InfoRegular,
} from "@fluentui/react-icons";
import axios from "axios";

interface AISearchProps {
  files: FileType[];
  onFileSelect: (file: FileType) => void;
}

interface SearchResponse {
  results: {
    fileId: string;
    score: number;
    excerpt?: string;
    metadata?: Record<string, any>;
  }[];
  suggestion?: string;
  error?: string;
}

export const AISearch = ({ files, onFileSelect }: AISearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FileType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchExcerpts, setSearchExcerpts] = useState<Record<string, string>>(
    {},
  );
  const [isRagEnabled, setIsRagEnabled] = useState(true);

  // Handle search with RAG integration
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchExcerpts({});
      setAiSuggestion(null);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setAiSuggestion(null);

    try {
      if (isRagEnabled) {
        // Use the RAG system via n8n webhook
        const response = await axios.post("/api/search", {
          query: searchQuery,
          limit: 10,
          includeExcerpts: true,
        });

        const data = response.data as SearchResponse;

        if (data.error) {
          throw new Error(data.error);
        }

        // Map the search results to files
        const resultMap = new Map<
          string,
          { score: number; excerpt?: string }
        >();
        data.results.forEach((result) => {
          resultMap.set(result.fileId, {
            score: result.score,
            excerpt: result.excerpt,
          });
        });

        // Find the matching files and sort by score
        const matchedFiles = files
          .filter((file) => resultMap.has(file.id))
          .sort((a, b) => {
            const scoreA = resultMap.get(a.id)?.score || 0;
            const scoreB = resultMap.get(b.id)?.score || 0;
            return scoreB - scoreA; // Higher score first
          });

        // Extract excerpts
        const excerpts: Record<string, string> = {};
        matchedFiles.forEach((file) => {
          const excerpt = resultMap.get(file.id)?.excerpt;
          if (excerpt) {
            excerpts[file.id] = excerpt;
          }
        });

        setSearchResults(matchedFiles);
        setSearchExcerpts(excerpts);

        // Set AI suggestion if provided
        if (data.suggestion) {
          setAiSuggestion(data.suggestion);
        } else if (matchedFiles.length === 0) {
          setAiSuggestion(
            `No results found for "${searchQuery}". Try searching for related terms like "document", "report", or "drawing".`,
          );
        } else if (matchedFiles.length > 5) {
          setAiSuggestion(
            `Found ${matchedFiles.length} results. Try refining your search with more specific terms.`,
          );
        }
      } else {
        // Fallback to basic search if RAG is disabled
        console.log("Using basic search (RAG disabled)");

        // Basic search implementation
        const results = files.filter(
          (file) =>
            file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (file.metadata?.extractedText &&
              file.metadata.extractedText
                .toLowerCase()
                .includes(searchQuery.toLowerCase())),
        );

        setSearchResults(results);

        // Generate AI suggestion
        if (results.length === 0) {
          setAiSuggestion(
            `No results found for "${searchQuery}". Try searching for related terms like "document", "report", or "drawing".`,
          );
        } else if (results.length > 5) {
          setAiSuggestion(
            `Found ${results.length} results. Try refining your search with more specific terms.`,
          );
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        error instanceof Error
          ? `Search failed: ${error.message}`
          : "Search failed due to an unknown error",
      );

      // Fallback to basic search on error
      const results = files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSearchResults(results);
      setAiSuggestion(
        "AI search is currently unavailable. Showing basic results instead.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">AI-Powered Search</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">RAG Search</span>
              <button
                onClick={() => setIsRagEnabled(!isRagEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isRagEnabled ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRagEnabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
          <p className="mb-4">
            Search across your documents using natural language. Our AI will
            help find the most relevant files based on content and metadata.
          </p>

          <div className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Search for documents..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSearching) {
                  handleSearch();
                }
              }}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <SearchRegular className="h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchError && (
            <div className="p-4 bg-red-50 rounded-lg mb-4 flex items-start gap-2">
              <InfoRegular className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700">Search Error</p>
                <p className="text-sm mt-1">{searchError}</p>
              </div>
            </div>
          )}

          {aiSuggestion && (
            <div className="p-4 bg-blue-50 rounded-lg mb-4 flex items-start gap-2">
              <SettingsRegular className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-700">AI Suggestion</p>
                <p className="text-sm mt-1">{aiSuggestion}</p>
              </div>
            </div>
          )}

          {isSearching ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Searching documents with AI...</p>
              </div>
            </div>
          ) : searchQuery && searchResults.length === 0 && !aiSuggestion ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-2">
                Found {searchResults.length} results for "{searchQuery}"
              </p>
              {searchResults.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col p-3 hover:bg-gray-50 hover:border-orange-400 border border-transparent rounded-lg cursor-pointer transition-all"
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileIcon fileType={file.file_type} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {file.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • Last updated{" "}
                          {formatDate(file.updated_at || file.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Show excerpt if available */}
                  {searchExcerpts[file.id] && (
                    <div className="mt-2 ml-12 p-2 bg-gray-50 border-l-2 border-blue-400 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <DocumentRegular className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs italic">
                          {searchExcerpts[file.id]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Search Tips</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>Use natural language to describe what you're looking for</li>
            <li>
              Include specific terms related to your engineering documents
            </li>
            <li>
              Search for content inside PDFs and other supported documents
            </li>
            <li>Try searching by date, file type, or project name</li>
            <li>Use quotes for exact phrase matching</li>
            <li className="text-blue-600">
              Toggle RAG Search to use our advanced AI search capabilities
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
