"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ResponsiveLayout } from "@/components/responsive-layout";

export default function TestFileDownloadPage() {
  const [fileId, setFileId] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAuthToken = async () => {
    try {
      const response = await fetch("/api/file-download-token");
      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
      } else {
        setTestResult({
          success: false,
          error: "Failed to fetch auth token",
          details: data.error || "Unknown error",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: "Error fetching auth token",
        details: error.message,
      });
    }
  };

  const testDownload = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Test the simple test file download first
      const testResponse = await fetch("/api/test-file-download");
      if (!testResponse.ok) {
        throw new Error(`Test file download failed: ${testResponse.status}`);
      }

      // If file ID is provided, test the actual file download
      if (fileId) {
        const fileResponse = await fetch(
          `/api/file-download?fileId=${encodeURIComponent(fileId)}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        if (!fileResponse.ok) {
          const errorText = await fileResponse.text();
          throw new Error(
            `File download failed: ${fileResponse.status} - ${errorText}`,
          );
        }

        setTestResult({
          success: true,
          message: "File download successful",
          contentType: fileResponse.headers.get("Content-Type"),
          contentDisposition: fileResponse.headers.get("Content-Disposition"),
        });
      } else {
        setTestResult({
          success: true,
          message: "Test file download successful",
          note: "Enter a file ID to test downloading an actual file",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="settings" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <h1 className="text-2xl font-bold mb-6">Test File Download</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>File Download Tester</CardTitle>
              <CardDescription>
                Test the file download functionality for n8n integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-token">Authentication Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="auth-token"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="Enter authentication token"
                      className="flex-1"
                    />
                    <Button onClick={fetchAuthToken}>Fetch Token</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-id">File ID (Optional)</Label>
                  <Input
                    id="file-id"
                    value={fileId}
                    onChange={(e) => setFileId(e.target.value)}
                    placeholder="Enter file ID to test actual file download"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={testDownload} disabled={loading}>
                {loading ? "Testing..." : "Test Download"}
              </Button>
            </CardFooter>
          </Card>

          {testResult && (
            <Card className={testResult.success ? "bg-green-50" : "bg-red-50"}>
              <CardHeader>
                <CardTitle
                  className={
                    testResult.success ? "text-green-700" : "text-red-700"
                  }
                >
                  {testResult.success
                    ? "Download Successful"
                    : "Download Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                  {JSON.stringify(testResult, null, 2)}
                </pre>

                {!testResult.success && (
                  <div className="mt-4 p-4 bg-yellow-100 rounded-md text-yellow-800">
                    <h3 className="font-bold mb-2">Troubleshooting Tips:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Make sure the file ID exists in your database</li>
                      <li>Verify that the authentication token is correct</li>
                      <li>Check that the file exists in Supabase storage</li>
                      <li>Check the server logs for more detailed errors</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>n8n Integration Guide</CardTitle>
              <CardDescription>
                How to configure n8n to download files from your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">
                    Step 1: Get Authentication Token
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Use the "Fetch Token" button above to get your
                    authentication token. This token will be used to
                    authenticate n8n requests to your application.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-lg">
                    Step 2: Configure n8n HTTP Request
                  </h3>
                  <p className="text-gray-600 mt-1">
                    In your n8n workflow, use an HTTP Request node with the
                    following settings:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                    <li>Method: GET</li>
                    <li>
                      URL:{" "}
                      {`${window.location.origin}/api/file-download?fileId=YOUR_FILE_ID`}
                    </li>
                    <li>Authentication: Header Auth</li>
                    <li>Header Auth: Bearer YOUR_AUTH_TOKEN</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-lg">
                    Step 3: Process the Downloaded File
                  </h3>
                  <p className="text-gray-600 mt-1">
                    The response will contain the file data which you can then
                    process in your n8n workflow. For binary files, make sure to
                    set "Response Format" to "File" in the HTTP Request node.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>
    </div>
  );
}
