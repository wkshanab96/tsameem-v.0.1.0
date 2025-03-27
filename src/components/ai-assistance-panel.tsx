"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
  icon: React.ReactNode;
  specialties: string[];
}

const experts: Expert[] = [
  {
    type: "electrical",
    name: "Dr. Elena Volts",
    title: "Electrical Engineering Expert",
    description:
      "Specialized in power systems, circuit design, and electrical schematics interpretation.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-yellow-500"
      >
        <path d="M18 16.8a7.14 7.14 0 0 0 2.24-3.22 8.34 8.34 0 0 0 .25-2.08c.04-3.2-2.43-6.32-6.24-7.05a8.18 8.18 0 0 0-7.95 2.61c-1.35 1.55-2.17 3.67-2.17 5.94 0 1.41.28 2.72.94 3.8" />
        <path d="M9 18h12v2H9z" />
        <path d="M15 22v-4" />
      </svg>
    ),
    specialties: [
      "Power Distribution",
      "Circuit Analysis",
      "Electrical Schematics",
      "Control Systems",
    ],
  },
  {
    type: "mechanical",
    name: "Prof. Marcus Gears",
    title: "Mechanical Engineering Expert",
    description:
      "Expert in mechanical systems, HVAC, fluid dynamics, and mechanical component design.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-500"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M14.31 8l5.74 9.94" />
        <path d="M9.69 8h11.48" />
        <path d="M7.38 12l5.74-9.94" />
        <path d="M9.69 16L3.95 6.06" />
        <path d="M14.31 16H2.83" />
        <path d="M16.62 12l-5.74 9.94" />
      </svg>
    ),
    specialties: [
      "HVAC Systems",
      "Fluid Dynamics",
      "Mechanical Design",
      "Thermodynamics",
    ],
  },
  {
    type: "civil",
    name: "Dr. Sarah Bridges",
    title: "Civil Engineering Expert",
    description:
      "Specialized in structural analysis, construction methods, and civil infrastructure planning.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-500"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M17 14v-4" />
        <path d="M7 14v-4" />
        <path d="M12 14v-4" />
        <path d="M2 10h20" />
      </svg>
    ),
    specialties: [
      "Structural Analysis",
      "Construction Methods",
      "Infrastructure Planning",
      "Site Development",
    ],
  },
  {
    type: "structural",
    name: "Prof. Alex Beams",
    title: "Structural Engineering Expert",
    description:
      "Expert in building structures, load analysis, and structural integrity assessments.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-purple-500"
      >
        <path d="M2 20h20" />
        <path d="M5 20v-4h4v4" />
        <path d="M15 20v-4h4v4" />
        <path d="M10 12V8h4v4" />
        <path d="M2 4h20" />
      </svg>
    ),
    specialties: [
      "Building Structures",
      "Load Analysis",
      "Structural Integrity",
      "Seismic Design",
    ],
  },
  {
    type: "general",
    name: "AI Assistant",
    title: "General Engineering Assistant",
    description:
      "A versatile AI assistant for general engineering questions and document analysis.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-500"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
    specialties: [
      "Document Analysis",
      "General Engineering",
      "Technical Support",
      "Research Assistance",
    ],
  },
];

export function AIAssistancePanel() {
  const [activeExpert, setActiveExpert] = useState<ExpertType>("general");
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsGenerating(true);
    setResponse("");

    // Simulate AI response
    setTimeout(() => {
      const expert = experts.find((e) => e.type === activeExpert);
      setResponse(
        `Response from ${expert?.name} (${expert?.title}):\n\nAnalyzing your query about "${query}"...\n\nBased on my expertise in ${expert?.specialties.join(", ")}, I would recommend reviewing the relevant engineering standards and specifications. Would you like me to analyze any specific documents related to this query?`,
      );
      setIsGenerating(false);
    }, 2000);
  };

  const currentExpert =
    experts.find((e) => e.type === activeExpert) || experts[4];

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="experts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="experts">Engineering Experts</TabsTrigger>
          <TabsTrigger value="drawings">Drawings from Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="experts" className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 gap-4 mb-4">
            {experts.map((expert) => (
              <Card
                key={expert.type}
                className={`cursor-pointer transition-all ${activeExpert === expert.type ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"}`}
                onClick={() => setActiveExpert(expert.type)}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-3">
                  <div className="bg-white p-2 rounded-full">{expert.icon}</div>
                  <div>
                    <CardTitle className="text-base">{expert.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {expert.title}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {currentExpert.icon}
                <span>{currentExpert.name}</span>
              </CardTitle>
              <CardDescription>{currentExpert.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-wrap gap-2 mt-2">
                {currentExpert.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Ask {currentExpert.name}</Label>
                <Textarea
                  id="query"
                  placeholder={`Ask about ${currentExpert.specialties[0]} or upload a document for analysis...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline">
                  Upload Document
                </Button>
                <Button type="submit" disabled={isGenerating || !query.trim()}>
                  {isGenerating ? "Generating..." : "Submit"}
                </Button>
              </div>

              {response && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <p className="font-medium mb-2">Response:</p>
                  <div className="whitespace-pre-wrap text-sm">{response}</div>
                </div>
              )}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="drawings" className="flex-1 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle>Generate Engineering Drawings</CardTitle>
              <CardDescription>
                Describe the engineering drawing you need, and our AI will
                generate it for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="drawing-type">Drawing Type</Label>
                  <select
                    id="drawing-type"
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="electrical">Electrical Schematic</option>
                    <option value="mechanical">Mechanical Assembly</option>
                    <option value="civil">Civil Site Plan</option>
                    <option value="structural">Structural Detail</option>
                    <option value="piping">Piping & Instrumentation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawing-description">Description</Label>
                  <Textarea
                    id="drawing-description"
                    placeholder="Describe the drawing you need in detail..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawing-parameters">
                    Additional Parameters
                  </Label>
                  <Input
                    id="drawing-parameters"
                    placeholder="Size, scale, specific standards, etc."
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">View Examples</Button>
              <Button>Generate Drawing</Button>
            </CardFooter>
          </Card>

          <div className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-12 w-12 text-gray-400"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No drawings generated yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Fill out the form above to generate your first engineering
              drawing.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
