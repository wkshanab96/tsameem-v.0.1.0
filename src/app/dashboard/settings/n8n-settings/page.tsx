"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Copy, RefreshCw } from "lucide-react";

export default function N8nSettingsPage() {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/n8n-auth-token");

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      console.error("Error fetching n8n token:", err);
      setError("Failed to load authentication token. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const generateNewToken = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/n8n-auth-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate new token: ${response.statusText}`);
      }

      const data = await response.json();
      setToken(data.token);
      setSuccess("New authentication token generated successfully!");
    } catch (err) {
      console.error("Error generating new n8n token:", err);
      setError("Failed to generate new token. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    setSuccess("Token copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">n8n Integration Settings</h1>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Token</CardTitle>
          <CardDescription>
            This token is used to authenticate n8n when downloading files from
            your application. Keep this token secure and use it in your n8n
            workflows.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Current Token</Label>
              <div className="flex">
                <Input
                  id="token"
                  value={token}
                  readOnly
                  disabled={loading}
                  className="flex-1 font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  disabled={loading || !token}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>n8n Configuration</Label>
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <p className="text-sm text-slate-700 mb-2">
                  Add this header to your n8n HTTP Request node:
                </p>
                <code className="bg-slate-100 p-2 rounded block text-sm font-mono">
                  Authorization: Bearer {token || "[your-token]"}
                </code>
                <p className="text-sm text-slate-700 mt-4 mb-2">
                  Use this URL to download files:
                </p>
                <code className="bg-slate-100 p-2 rounded block text-sm font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /api/file-download?fileId=YOUR_FILE_ID
                </code>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={generateNewToken}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Generate New Token"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
