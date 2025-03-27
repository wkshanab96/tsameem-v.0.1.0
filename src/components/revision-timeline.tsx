"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Calendar, Clock, Download, Eye, RotateCcw, User } from "lucide-react";

interface Revision {
  id: string;
  version: string;
  date: string;
  author: string;
  changes: string;
  thumbnail: string;
}

export default function RevisionTimeline({
  revisions = defaultRevisions,
}: {
  revisions?: Revision[];
}) {
  const [selectedRevisionIndex, setSelectedRevisionIndex] = useState(0);
  const selectedRevision = revisions[selectedRevisionIndex];

  const handleSliderChange = (value: number[]) => {
    setSelectedRevisionIndex(value[0]);
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl">Document Revision History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="relative aspect-[4/3] bg-gray-100 mb-4 rounded-md overflow-hidden">
              <img
                src={selectedRevision.thumbnail}
                alt={`Version ${selectedRevision.version}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                v{selectedRevision.version}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <Button variant="outline" size="sm" className="gap-1">
                <Eye className="h-4 w-4" /> View Full
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <RotateCcw className="h-4 w-4" /> Restore
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">
                Version {selectedRevision.version}
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{selectedRevision.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {selectedRevision.author}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Changes:</h4>
                <p className="text-sm text-gray-600">
                  {selectedRevision.changes}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Oldest</span>
                <span>Latest</span>
              </div>
              <Slider
                defaultValue={[0]}
                max={revisions.length - 1}
                step={1}
                value={[selectedRevisionIndex]}
                onValueChange={handleSliderChange}
                className="mb-4"
              />
              <div className="flex justify-between">
                {revisions.map((revision, index) => (
                  <div
                    key={revision.id}
                    className={`h-2 w-2 rounded-full ${index <= selectedRevisionIndex ? "bg-blue-600" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const defaultRevisions: Revision[] = [
  {
    id: "1",
    version: "1.0",
    date: "Jan 15, 2023",
    author: "John Smith",
    changes: "Initial document creation with basic layout and dimensions.",
    thumbnail:
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80",
  },
  {
    id: "2",
    version: "1.1",
    date: "Feb 3, 2023",
    author: "Sarah Johnson",
    changes:
      "Updated dimensions for section A and B. Added material specifications.",
    thumbnail:
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80",
  },
  {
    id: "3",
    version: "1.2",
    date: "Mar 20, 2023",
    author: "Michael Brown",
    changes:
      "Revised electrical routing. Added new connection points for power supply.",
    thumbnail:
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80",
  },
  {
    id: "4",
    version: "2.0",
    date: "Apr 15, 2023",
    author: "Emily Davis",
    changes:
      "Major revision with updated specifications to comply with new regulations. Complete redesign of section C.",
    thumbnail:
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80",
  },
  {
    id: "5",
    version: "2.1",
    date: "May 2, 2023",
    author: "John Smith",
    changes: "Minor adjustments to dimensions. Fixed annotation errors.",
    thumbnail:
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80",
  },
];
