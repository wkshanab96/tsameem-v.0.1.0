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

export default function TestWebhookPage() {
  const [webhookUrl, setWebhookUrl] = useState(
    "http://localhost:5678/webhook-test/expertschat",
  );
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Add timeout to prevent UI hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `/api/test-webhook?url=${encodeURIComponent(webhookUrl)}`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({
        success: false,
        error:
          error.name === "AbortError"
            ? "Request timed out after 15 seconds"
            : error.message || "An unknown error occurred",
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
          <h1 className="text-2xl font-bold mb-6">Test Webhook Connection</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Webhook Connection Tester</CardTitle>
              <CardDescription>
                Test the connection to your n8n webhook endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="Enter webhook URL to test"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={testWebhook} disabled={loading}>
                {loading ? "Testing..." : "Test Connection"}
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
                    ? "Connection Successful"
                    : "Connection Failed"}
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
                      <li>
                        Make sure your n8n instance is running at localhost:5678
                      </li>
                      <li>Check that the webhook path is correct</li>
                      <li>
                        Verify there are no network issues or firewalls blocking
                        the connection
                      </li>
                      <li>Check the n8n logs for any errors</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ResponsiveLayout>
    </div>
  );
}
