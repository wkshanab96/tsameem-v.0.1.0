"use client";

import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import {
  FileText,
  Clock,
  User,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Document {
  id: string;
  title: string;
  thumbnail: string;
  updatedAt: string;
  updatedBy: string;
  summary: string;
  role: "master" | "editor" | "viewer";
}

export default function DocumentGrid({
  documents = defaultDocuments,
}: {
  documents?: Document[];
}) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Engineering Documents</h2>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className="overflow-hidden hover:shadow-md hover:border-orange-400 border-transparent transition-all cursor-pointer"
            onClick={() => setSelectedDocument(doc)}
          >
            <div className="relative aspect-[4/3] bg-gray-100">
              <img
                src={doc.thumbnail}
                alt={doc.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <h3 className="text-white font-medium truncate">{doc.title}</h3>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Updated {doc.updatedAt}</span>
              </div>
              <div className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{doc.updatedBy}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {doc.summary}
              </p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {doc.role === "master"
                    ? "Master"
                    : doc.role === "editor"
                      ? "Editor"
                      : "Viewer"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    {(doc.role === "master" || doc.role === "editor") && (
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {doc.role === "master" && (
                      <DropdownMenuItem className="gap-2 text-red-600">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const defaultDocuments: Document[] = [
  {
    id: "1",
    title: "Electrical System Schematic v2.3",
    thumbnail:
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80",
    updatedAt: "2 days ago",
    updatedBy: "John Smith",
    summary:
      "Complete electrical system schematic for the main production facility including power distribution and control systems.",
    role: "master",
  },
  {
    id: "2",
    title: "HVAC Layout Plan",
    thumbnail:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&q=80",
    updatedAt: "1 week ago",
    updatedBy: "Sarah Johnson",
    summary:
      "Heating, ventilation, and air conditioning layout for the new office building with zone controls and duct routing.",
    role: "editor",
  },
  {
    id: "3",
    title: "Foundation Blueprint",
    thumbnail:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80",
    updatedAt: "2 weeks ago",
    updatedBy: "Michael Brown",
    summary:
      "Detailed foundation blueprint showing reinforcement details, dimensions, and material specifications.",
    role: "viewer",
  },
  {
    id: "4",
    title: "Piping & Instrumentation Diagram",
    thumbnail:
      "https://images.unsplash.com/photo-1581093458791-9d09a5c0d6e5?w=500&q=80",
    updatedAt: "3 days ago",
    updatedBy: "Emily Davis",
    summary:
      "P&ID showing process flow, equipment, instrumentation, and control systems for the chemical processing unit.",
    role: "master",
  },
];
