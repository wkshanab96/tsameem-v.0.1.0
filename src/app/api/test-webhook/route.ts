import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing webhook connection...");

    // Get the webhook URL from the query parameters
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "No webhook URL provided" },
        { status: 400 },
      );
    }

    console.log(`Testing connection to webhook URL: ${url}`);

    // Try to connect to the webhook URL
    try {
      // Add timeout to prevent hanging on connection issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log("Webhook test request timed out after 10 seconds");
      }, 10000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message:
            "This is a test message from the Engineering Document Management System",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`Webhook test response status: ${response.status}`);

      let responseData;
      try {
        const text = await response.text();
        console.log(`Raw response: ${text}`);
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = { text };
        }
      } catch (e) {
        responseData = { error: "Could not read response body" };
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
    } catch (error: any) {
      console.error(`Error testing webhook: ${error.message}`);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.cause
            ? JSON.stringify(error.cause)
            : "No additional details",
          tip: "If you're using localhost, make sure your n8n instance is running and accessible. If using a remote URL, check that it's publicly accessible and CORS is properly configured.",
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error(`Unexpected error in test-webhook API: ${error.message}`);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 },
    );
  }
}
