"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Brain, Send, FileText, Lightbulb, Clipboard } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: string;
}

export default function AIDocumentAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, newUserMessage]);
    setInputValue("");

    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputValue),
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <Card className="w-full h-full flex flex-col bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Document Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Suggested Questions:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                "What are the dimensions of section A?",
                "When was the last revision made?",
                "Who approved this document?",
              ].map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setInputValue(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about this document..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const initialMessages: Message[] = [
  {
    id: "1",
    content:
      "Hello! I'm your AI document assistant. I can answer questions about this engineering drawing and help you extract information. What would you like to know?",
    sender: "assistant",
    timestamp: "10:30 AM",
  },
];

// Simple mock function to simulate AI responses
function getAIResponse(question: string): string {
  const responses = {
    dimensions:
      "Section A has dimensions of 120cm x 85cm x 45cm according to the latest revision (v2.1).",
    revision:
      "The last revision (v2.1) was made on May 2, 2023 by John Smith. The changes included minor adjustments to dimensions and fixing annotation errors.",
    approval:
      "This document was approved by Emily Davis (Project Manager) on May 5, 2023. The approval status is valid until the next scheduled review in November 2023.",
    material:
      "The specified material for the main components is ASTM A36 structural steel with a minimum yield strength of 36,000 psi.",
    default:
      "I don't have specific information about that in this document. Would you like me to search for related information or help with something else?",
  };

  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes("dimension") ||
    lowerQuestion.includes("size") ||
    lowerQuestion.includes("section a")
  ) {
    return responses.dimensions;
  } else if (
    lowerQuestion.includes("revision") ||
    lowerQuestion.includes("update") ||
    lowerQuestion.includes("change")
  ) {
    return responses.revision;
  } else if (
    lowerQuestion.includes("approve") ||
    lowerQuestion.includes("sign") ||
    lowerQuestion.includes("authorize")
  ) {
    return responses.approval;
  } else if (
    lowerQuestion.includes("material") ||
    lowerQuestion.includes("steel") ||
    lowerQuestion.includes("component")
  ) {
    return responses.material;
  } else {
    return responses.default;
  }
}
