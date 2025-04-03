import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

/**
 * This endpoint handles expert chat requests and forwards them to the n8n expert agent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { chatInput, fileId } = body; // Expect chatInput and optional fileId

    // Validate chatInput
    if (!chatInput || typeof chatInput !== "string") {
      return NextResponse.json({ error: "Invalid chatInput" }, { status: 400 });
    }

    // Get the n8n expert chat webhook URL from environment variables
    const n8nWebhookUrl =
      process.env.NEXT_PUBLIC_EXPERT_CHAT_N8N_WEBHOOK_URL || // Use a specific env var for this webhook
      ""; // Provide a fallback or handle error if not set

    if (!n8nWebhookUrl) {
      console.error(
        "NEXT_PUBLIC_EXPERT_CHAT_N8N_WEBHOOK_URL environment variable not set",
      );
      return NextResponse.json(
        { error: "Expert chat service not configured" },
        { status: 503 }, // Service Unavailable
      );
    }

    console.log(`Using expert chat webhook URL: ${n8nWebhookUrl}`);

    try {
      // Forward the chat request to n8n
      console.log(`Sending expert chat request to: ${n8nWebhookUrl}`);
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: chatInput,
          userId: user.id,
          fileId: fileId, // Pass fileId if provided
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `N8N expert chat webhook returned status ${response.status}: ${errorText}`,
        );
        throw new Error(
          `Expert chat service failed with status ${response.status}`,
        );
      }

      // Get raw response text first for debugging
      const rawResponseText = await response.text();
      console.log("Raw response text from n8n:", rawResponseText);

      let data: any = {};
      let n8nContent: string | null = null;

      try {
        data = JSON.parse(rawResponseText);
        console.log("Parsed JSON data from n8n:", data);
        // Prioritize 'output' as seen in n8n test data, then check other common fields
        n8nContent = data.output || data.content || data.suggestion || null;
      } catch (parseError) {
        console.error("Failed to parse n8n response as JSON:", parseError);
        // If JSON parsing fails but the response was ok (status 2xx),
        // maybe n8n sent plain text? Use the raw text.
        if (response.ok && rawResponseText.trim()) {
            n8nContent = rawResponseText.trim();
            console.log("Using raw text response as content.");
        } else {
             console.log("N8N response was not valid JSON and not plain text.");
        }
      }

      // Prepare payload for the frontend, ensuring the key matches frontend expectation
      const responsePayload = {
        // Use 'output' key as primary expectation in frontend now
        output: n8nContent || "Received response, but no message content found.",
      };
      console.log("Sending payload to frontend:", responsePayload);
      return NextResponse.json(responsePayload);

    } catch (n8nError) {
      console.error("Error calling n8n expert chat webhook:", n8nError);
      return NextResponse.json(
        {
          error:
            n8nError instanceof Error
              ? n8nError.message
              : "Failed to communicate with expert chat service",
          content: "Sorry, the AI expert is currently unavailable.", // Provide a fallback content
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in expert-chat API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
        content: "An unexpected error occurred.", // Provide a fallback content
      },
      { status: 500 },
    );
  }
}
