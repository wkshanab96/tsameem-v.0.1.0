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
  const [searchResults, setSearchResults] = useState<FileType[]>([]); // This will now hold the files returned directly by the API
  const [isSearching, setIsSearching] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Remove searchExcerpts state as it's no longer used
  // const [searchExcerpts, setSearchExcerpts] = useState<Record<string, string>>(
  //   {},
  // );
  const [isRagEnabled, setIsRagEnabled] = useState(true);

  // Handle search with RAG integration
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      // Remove setSearchExcerpts({});
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
          // Ensure only one chatInput property exists
          chatInput: searchQuery,
          limit: 10,
          // includeExcerpts is not relevant for the current N8N flow
        });
        console.log("Raw API response data:", response.data); // Log the raw response

        // The backend now returns { results: FileType[], suggestion?: string }
        const data = response.data; // Assign first without assertion

        // Basic check if data is an object before accessing properties
        if (!data || typeof data !== 'object') {
            console.error("Invalid API response structure:", data);
            throw new Error("Received invalid response structure from API.");
        }

        // Now assert the type after basic validation
        const typedData = data as { results: FileType[], suggestion?: string, error?: string };
        console.log("Parsed/Asserted data:", typedData); // Log after assertion

        if (typedData.error) { // Check for explicit error property
          throw new Error(typedData.error);
        }

        // Explicitly check if results is an array before using it
        if (!Array.isArray(typedData.results)) {
            console.error("API response data.results is not an array:", typedData.results);
            throw new Error("Invalid API response format: results is not an array.");
        }

        // Directly use the results from the API response
        // The backend already filters/finds the relevant file based on N8N output
        // Add final redundant check to ensure it's an array before setting state
        const foundFiles = Array.isArray(typedData.results) ? typedData.results : [];

        // Remove the resultMap and filtering logic
        // const resultMap = new Map<
        //   string,
        //   { score: number; excerpt?: string }
        // >();
        // data.results.forEach((result) => { ... });
        // const matchedFiles = files.filter(...)

        // Remove excerpt logic
        // const excerpts: Record<string, string> = {};
        // matchedFiles.forEach((file) => { ... });

        setSearchResults(foundFiles); // Set state with files from API
        // Remove setSearchExcerpts(excerpts);

        // Set AI suggestion if provided
        if (typedData.suggestion) {
          setAiSuggestion(typedData.suggestion);
        // Update suggestion logic based on foundFiles length
        } else if (foundFiles.length === 0) {
          setAiSuggestion(
            `No specific file mentioned or found for "${searchQuery}".`,
          );
        } else if (foundFiles.length > 0) { // If files were found by the backend
           // Temporarily use a generic suggestion without iterating over foundFiles
           setAiSuggestion(typedData.suggestion || `AI analysis identified relevant file(s).`);
        }
      } else {
        // Fallback to basic search if RAG is disabled
        console.log("Using basic search (RAG disabled)");

        // Basic search implementation with added safety checks
        const results = Array.isArray(files) // Ensure files is an array first
          ? files.filter(
              (file) =>
                // Check if file object and name exist and are strings
                (file && typeof file.name === 'string' && file.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                // Check nested properties carefully before accessing
                (file && typeof file.metadata === 'object' && file.metadata !== null && typeof file.metadata.extractedText === 'string' &&
                  file.metadata.extractedText
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()))
            )
          : []; // Default to empty array if files is not an array

        setSearchResults(results); // Set results (guaranteed to be an array)

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

      let errorMessage = "Search failed due to an unknown error";
      // Check if it's an Axios error and has our specific error payload
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = `Search failed: ${error.response.data.error}`;
      } else if (error instanceof Error) {
        errorMessage = `Search failed: ${error.message}`;
      }
      // Log the raw error caught
      console.error("Caught error details:", error);
      setSearchError(errorMessage); // Set the formatted error message for UI

      // Simplify catch block: Just clear results and set a generic suggestion
      setSearchResults([]); // Ensure results are cleared on error
      setAiSuggestion(
        "AI search encountered an error.", // Simplified suggestion
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
              {searchResults
                .filter(file => file && file.id) // Add filter for valid file objects with IDs
                .map((file) => (
                <div
                  key={file.id} // Now guaranteed to exist
                  className="flex flex-col p-3 hover:bg-gray-50 hover:border-orange-400 border border-transparent rounded-lg cursor-pointer transition-all"
                  onClick={() => onFileSelect(file)} // Pass the valid file object
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Ensure file_type exists before passing */}
                      <FileIcon fileType={file.file_type || 'file'} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {file.name || 'Unnamed File'} {/* Provide fallback */}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {/* Provide fallbacks for size and date */}
                          {formatFileSize(file.size ?? 0)} • Last updated{" "}
                          {/* Ensure argument is always a string */}
                          {formatDate(file.updated_at || file.created_at || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Show excerpt if available */}
                  {/* Remove excerpt display */}
                  {/* {searchExcerpts[file.id] && ( ... )} */}
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
