import { useState, useRef, useEffect } from "react";
import { File as FileType } from "@/lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { formatDate, formatFileSize } from "@/lib/file-utils";
import { FileIcon } from "./FileIcon";
import { SettingsRegular } from "@fluentui/react-icons";
import { useUser } from "@supabase/auth-helpers-react"; // Import useUser hook

interface AIFileExpertProps {
  selectedFile: FileType | null;
  setActiveTab: (tab: string) => void;
}

export const AIFileExpert = ({
  selectedFile,
  setActiveTab,
}: AIFileExpertProps) => {
  const [aiQuery, setAiQuery] = useState("");
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "ai"; content: string }>
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useUser(); // Get user object

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle AI query submission
  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;

    try {
      // Add user message to chat
      setMessages((prev) => [...prev, { type: "user", content: aiQuery }]);
      setIsAiLoading(true);
      const currentQuery = aiQuery; // Store query before clearing
      setAiQuery(""); // Clear input field immediately

      // Call the backend API endpoint
      const response = await fetch("/api/expert-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: currentQuery,
          userId: user?.id, // Send user ID
          fileId: selectedFile?.id, // Send selected file ID if available
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to chat
      // Check if the response is nested under 'output' as seen in n8n
      const aiResponseContent = data.output || data.content || "Received an empty or unexpected response structure.";
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: aiResponseContent },
      ]);

    } catch (error) {
      console.error("Error processing AI query:", error);
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: error instanceof Error ? error.message : "Sorry, I encountered an error processing your request.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      {selectedFile ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
            <FileIcon fileType={selectedFile.file_type} />
            <div>
              <h3 className="text-lg font-medium">{selectedFile.name}</h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)} • Last updated{" "}
                {formatDate(selectedFile.updated_at || selectedFile.created_at)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">AI File Expert</h3>
            <p className="mb-4">
              Ask me anything about this file or how to work with it.
            </p>

            <div className="flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-lg bg-gray-50">
                {messages.length === 0 && !isAiLoading && (
                  <div className="p-4 bg-blue-50 rounded-lg mb-4">
                    <p className="font-medium text-blue-700">File Analysis</p>
                    <p className="text-sm mt-2">
                      This appears to be a{" "}
                      {selectedFile.file_type.toUpperCase()} file. I can help
                      you understand its contents or answer questions about it.
                    </p>
                  </div>
                )}

                {messages.length === 0 && !isAiLoading && (
                  <div className="p-4 border rounded-lg mb-4">
                    <p className="font-medium">Suggested Questions</p>
                    <ul className="mt-2 space-y-2">
                      <li
                        className="text-sm text-blue-600 cursor-pointer hover:underline"
                        onClick={() => {
                          setAiQuery(
                            "What information does this file contain?",
                          );
                          handleAiQuery();
                        }}
                      >
                        What information does this file contain?
                      </li>
                      <li
                        className="text-sm text-blue-600 cursor-pointer hover:underline"
                        onClick={() => {
                          setAiQuery("How can I extract data from this file?");
                          handleAiQuery();
                        }}
                      >
                        How can I extract data from this file?
                      </li>
                      <li
                        className="text-sm text-blue-600 cursor-pointer hover:underline"
                        onClick={() => {
                          setAiQuery(
                            "What are the key points in this document?",
                          );
                          handleAiQuery();
                        }}
                      >
                        What are the key points in this document?
                      </li>
                    </ul>
                  </div>
                )}

                {/* Chat messages */}
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${message.type === "user" ? "bg-blue-100 ml-12" : "bg-gray-100 mr-12"}`}
                    >
                      <p className="font-medium text-sm mb-1">
                        {message.type === "user" ? "You" : "AI Assistant"}
                      </p>
                      <div className="text-sm whitespace-pre-line">
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="p-3 rounded-lg bg-gray-100 mr-12">
                      <p className="font-medium text-sm mb-1">AI Assistant</p>
                      <div className="flex items-center space-x-2">
                        <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full"></div>
                        <div
                          className="animate-bounce h-2 w-2 bg-gray-400 rounded-full"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="animate-bounce h-2 w-2 bg-gray-400 rounded-full"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Ask a question about this file..."
                  className="flex-1 p-2 border rounded-md"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAiLoading && aiQuery.trim()) {
                      handleAiQuery();
                    }
                  }}
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleAiQuery}
                  disabled={isAiLoading || !aiQuery.trim()}
                >
                  {isAiLoading ? "Processing..." : "Ask AI"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <SettingsRegular className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-medium mb-2">AI File Expert</h3>
          <p className="text-gray-500 mb-6">
            Select a file from the explorer to analyze it with AI
          </p>
          <Button
            onClick={() => setActiveTab("all")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Browse Files
          </Button>
        </div>
      )}
    </div>
  );
};
