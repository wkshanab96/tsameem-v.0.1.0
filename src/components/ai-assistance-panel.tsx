"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid"; // Using Heroicons for send icon

type ExpertType =
  | "electrical"
  | "mechanical"
  | "civil"
  | "structural"
  | "general";

interface Expert {
  type: ExpertType;
  name: string;
  title: string;
  description: string;
  icon?: React.ReactNode; // Make icon optional
  specialties: string[];
}

// Simplified experts array
const experts: Expert[] = [
  { type: "electrical", name: "Dr. Elena Volts", title: "Electrical Expert", description: "Specialized in power systems...", specialties: [] },
  { type: "mechanical", name: "Prof. Marcus Gears", title: "Mechanical Expert", description: "Expert in mechanical systems...", specialties: [] },
  { type: "civil", name: "Dr. Sarah Bridges", title: "Civil Expert", description: "Specialized in structural analysis...", specialties: [] },
  { type: "structural", name: "Prof. Alex Beams", title: "Structural Expert", description: "Expert in building structures...", specialties: [] },
  { type: "general", name: "AI Assistant", title: "General Assistant", description: "Versatile AI assistant...", specialties: [] },
];

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  expertType?: ExpertType;
}

export function AIAssistancePanel() {
  const [activeExpert, setActiveExpert] = useState<ExpertType>("general");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for textarea auto-resize

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    }
  }, [query]);


  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const currentQuery = query.trim();
    if (!currentQuery || isGenerating) return;

    setIsGenerating(true);
    const userMessage: Message = { id: `${Date.now()}-user`, type: "user", content: currentQuery };
    setMessages((prev) => [...prev, userMessage]);
    setQuery(""); // Clear input

    // Reset textarea height after sending
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, 0);


    try {
      const { sanitizedWebhookUrls } = await import("@/lib/n8n-service");
      const webhookUrl = sanitizedWebhookUrls.expert;

      console.log(`Sending request to webhook URL: ${webhookUrl}`);
      const payload = { expertType: activeExpert, query: currentQuery, timestamp: new Date().toISOString() };
      console.log("Sending payload:", payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      console.log("Webhook response status:", response.status);

      let aiContent = "Sorry, I encountered an error. Please try again.";
      if (response.ok) {
        try {
          const responseText = await response.text();
          console.log("Raw response text:", responseText);
          const data = JSON.parse(responseText);
          console.log("Parsed JSON response:", data);
          aiContent = data?.output || data?.response || (typeof data === 'string' ? data : aiContent);
        } catch (parseError) {
          console.error("Error parsing webhook response:", parseError);
          aiContent = "Received a response, but couldn't process the content.";
        }
      } else {
        const errorText = await response.text();
        console.error(`Webhook error ${response.status}: ${errorText}`);
        aiContent = `Error: Communication failed (Status ${response.status}).`;
      }

      const aiMessage: Message = { id: `${Date.now()}-ai`, type: "ai", content: aiContent, expertType: activeExpert };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error sending message to webhook:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const aiErrorMessage: Message = { id: `${Date.now()}-error`, type: "ai", content: `Error: Unable to communicate with the AI service. ${errorMessage}`, expertType: activeExpert };
      setMessages((prev) => [...prev, aiErrorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentExpertDetails = experts.find((e) => e.type === activeExpert) || experts[4];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm">
        <h2 className="text-lg font-semibold ml-2">AI Engineering Experts</h2>
        <div className="flex items-center gap-2">
           <Label htmlFor="expert-select" className="text-sm font-medium text-gray-600 dark:text-gray-400">Expert:</Label>
           <select
             id="expert-select"
             className="p-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
             value={activeExpert}
             onChange={(e) => {
                 setActiveExpert(e.target.value as ExpertType);
                 setMessages([]); // Clear chat when expert changes
             }}
           >
             {experts.map((expert) => (
               <option key={expert.type} value={expert.type}>
                 {expert.name}
               </option>
             ))}
           </select>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.type === "user" ? "justify-end" : ""
              }`}
            >
              {/* AI Avatar */}
              {message.type === "ai" && (
                <Avatar className="w-8 h-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                    {message.expertType?.substring(0, 1).toUpperCase() || 'AI'}
                  </AvatarFallback>
                </Avatar>
              )}
              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm shadow-md transition-all duration-300 ease-out ${
                  message.type === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
              {/* User Avatar */}
               {message.type === "user" && (
                 <Avatar className="w-8 h-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                   <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold">U</AvatarFallback>
                 </Avatar>
               )}
            </div>
          ))}
          {/* Loading Indicator */}
          {isGenerating && (
             <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                   <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                     {activeExpert?.substring(0, 1).toUpperCase() || 'AI'}
                   </AvatarFallback>
                 </Avatar>
                 <div className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-bl-none">
                    <div className="flex items-center space-x-1.5">
                       <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                       <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                       <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                 </div>
             </div>
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
         {/* Initial state message - More Gemini like */}
         {messages.length === 0 && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 pt-16">
                 <Avatar className="w-16 h-16 mb-4 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                   <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                     {activeExpert?.substring(0, 1).toUpperCase() || 'AI'}
                   </AvatarFallback>
                 </Avatar>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Hello!</p>
                <p className="text-lg mt-1">How can I help you today?</p>
                <p className="text-sm mt-2">You are chatting with {currentExpertDetails.name}.</p>
            </div>
         )}
      </ScrollArea>

      {/* Input Area - Gemini Style */}
      <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-2 border border-transparent focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all duration-200">
          {/* Optional: Add attachment button like Gemini */}
          {/* <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
             <PaperclipIcon className="w-5 h-5" />
          </Button> */}
          <Textarea
            ref={textareaRef}
            id="query"
            placeholder={`Message ${currentExpertDetails.name}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none resize-none outline-none focus:ring-0 text-sm placeholder-gray-500 dark:placeholder-gray-400 px-2 py-1.5 max-h-32 overflow-y-auto" // Added max-h
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
             type="submit"
             size="icon"
             className="rounded-lg w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors duration-200"
             disabled={isGenerating || !query.trim()}
             aria-label="Send message"
           >
            {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
