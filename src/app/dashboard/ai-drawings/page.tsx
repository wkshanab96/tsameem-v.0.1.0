import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ResponsiveLayout } from "@/components/responsive-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AIDrawingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="ai-drawings" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <h1 className="text-2xl font-bold mb-6">AI Engineering Drawings</h1>
          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[80vh]">
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="generate">Generate Drawing</TabsTrigger>
                <TabsTrigger value="convert">Convert Sketch</TabsTrigger>
              </TabsList>

              <TabsContent value="generate">
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
                          <option value="electrical">
                            Electrical Schematic
                          </option>
                          <option value="mechanical">
                            Mechanical Assembly
                          </option>
                          <option value="civil">Civil Site Plan</option>
                          <option value="structural">Structural Detail</option>
                          <option value="piping">
                            Piping & Instrumentation
                          </option>
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
              </TabsContent>

              <TabsContent value="convert">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Convert Sketch to Professional Drawing
                    </CardTitle>
                    <CardDescription>
                      Upload your hand-drawn sketch or rough diagram, and our AI
                      will convert it into a professional engineering drawing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <label
                          htmlFor="sketch-upload"
                          className="cursor-pointer block"
                        >
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
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            Drag and drop your sketch here, or{" "}
                            <span className="text-blue-600 font-medium">
                              browse
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Support for JPG, PNG, PDF, and SVG files
                          </p>
                          <Input
                            id="sketch-upload"
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf,.svg"
                          />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="conversion-type">
                          Output Drawing Type
                        </Label>
                        <select
                          id="conversion-type"
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="electrical">
                            Electrical Schematic
                          </option>
                          <option value="mechanical">Mechanical Drawing</option>
                          <option value="civil">Civil Engineering Plan</option>
                          <option value="architectural">
                            Architectural Drawing
                          </option>
                          <option value="piping">Piping Diagram</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="conversion-notes">
                          Additional Notes
                        </Label>
                        <Textarea
                          id="conversion-notes"
                          placeholder="Add any specific instructions or details about your sketch..."
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button>Convert Sketch</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
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
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
}
