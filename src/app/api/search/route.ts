import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import axios from "axios";

/**
 * This endpoint handles search requests and forwards them to the n8n RAG system
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
    // Expect 'chatInput' instead of 'query' from the frontend request
    const { chatInput, limit = 10, includeExcerpts = true } = body;

    // Validate 'chatInput'
    if (!chatInput || typeof chatInput !== "string") {
      return NextResponse.json({ error: "Invalid chatInput" }, { status: 400 });
    }

    // Get the n8n search webhook URL from environment variables
    // Try both NEXT_PUBLIC_ and legacy variables
    const n8nWebhookUrl =
      process.env.NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL ||
      process.env.NEXT_SEARCH_N8N_WEBHOOK_URL ||
      "https://jsonplaceholder.typicode.com/posts";

    console.log("Using search webhook URL:", n8nWebhookUrl);
    console.log(
      "NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL:",
      process.env.NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL,
    );
    console.log(
      "NEXT_SEARCH_N8N_WEBHOOK_URL:",
      process.env.NEXT_SEARCH_N8N_WEBHOOK_URL,
    );

    // Only use fallback search if URL is explicitly localhost or not set
    if (
      !n8nWebhookUrl ||
      n8nWebhookUrl.includes("127.0.0.1") ||
      n8nWebhookUrl.includes("localhost") ||
      n8nWebhookUrl.includes("n8n.tempolabs.ai")
    ) {
      console.warn(
        "NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL environment variable not set",
      );

      // Fallback to basic search if webhook URL is not configured
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("id, name, file_type, metadata")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false });

      if (filesError) {
        console.error("Error fetching files:", filesError);
        return NextResponse.json(
          { error: "Failed to fetch files" },
          { status: 500 },
        );
      }

      // Perform basic search
      const results = files
        .filter((file) => {
          const nameMatch = file.name
            .toLowerCase()
            .includes(chatInput.toLowerCase()); // Use chatInput for fallback search
          const contentMatch =
            file.metadata?.extractedText &&
            file.metadata.extractedText
              .toLowerCase()
              .includes(chatInput.toLowerCase()); // Use chatInput for fallback search
          return nameMatch || contentMatch;
        })
        .map((file) => ({
          fileId: file.id,
          score: 1.0, // Default score
          excerpt: file.metadata?.extractedText
            ? extractRelevantText(file.metadata.extractedText, chatInput, 200) // Use chatInput for fallback excerpt
            : undefined,
        }))
        .slice(0, limit);

      return NextResponse.json({
        results,
        suggestion:
          "Using basic search. Configure NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL for AI-powered search.",
      });
    }

    try {
      // Forward the search request to n8n
      console.log(`Sending search request to: ${n8nWebhookUrl}`);
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: chatInput, // Use the received chatInput variable
          userId: user.id,
          limit,
          includeExcerpts,
        }),
      });

      if (!response.ok) {
        throw new Error(`N8N webhook returned status ${response.status}`);
      }

      // Get raw response text first for debugging
      const responseText = await response.text();
      console.log("Raw search response text from n8n:", responseText);

      try {
          // Attempt to parse the JSON
          const data = JSON.parse(responseText);
          console.log("Parsed search response from n8n:", data);

          // Basic validation: Check if the expected structure (e.g., results array) exists
          // Adjust this check based on the actual expected successful response structure from n8n
          if (!data || typeof data !== 'object') {
              throw new Error("Invalid data structure received from search service.");
          }

          // Return the parsed data
          return NextResponse.json(data);

      } catch (parseError) {
          console.error("Failed to parse n8n search response as JSON:", parseError);
          // Return a specific error indicating invalid response from the webhook
          return NextResponse.json(
              { error: "Received invalid response from AI search service.", results: [] },
              { status: 502 } // 502 Bad Gateway seems appropriate here
          );
      }

    } catch (n8nError) {
      // This outer catch handles network errors or non-ok statuses from fetch
      console.error("Error calling n8n webhook:", n8nError);

      // Fallback to basic search if n8n call fails
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("id, name, file_type, metadata")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false });

      if (filesError) {
        throw new Error(`Failed to fetch files: ${filesError.message}`);
      }

      // Perform basic search
      const results = files
        .filter((file) => {
          const nameMatch = file.name
            .toLowerCase()
            .includes(chatInput.toLowerCase()); // Use chatInput for fallback search
          const contentMatch =
            file.metadata?.extractedText &&
            file.metadata.extractedText
              .toLowerCase()
              .includes(chatInput.toLowerCase()); // Use chatInput for fallback search
          return nameMatch || contentMatch;
        })
        .map((file) => ({
          fileId: file.id,
          score: 1.0, // Default score
          excerpt: file.metadata?.extractedText
            ? extractRelevantText(file.metadata.extractedText, chatInput, 200) // Use chatInput for fallback excerpt
            : undefined,
        }))
        .slice(0, limit);

      return NextResponse.json({
        results,
        suggestion: "N8N webhook call failed. Using basic search as fallback.",
      });
    }
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        results: [],
      },
      { status: 500 },
    );
  }
}

/**
 * Extract relevant text around the search term in a document
 */
function extractRelevantText(
  text: string,
  searchTerm: string, // Renamed parameter
  maxLength: number = 200,
): string {
  const lowerText = text.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase(); // Use renamed parameter
  const index = lowerText.indexOf(lowerSearchTerm); // Use renamed parameter

  if (index === -1) return text.substring(0, maxLength) + "...";

  // Get text around the match
  const start = Math.max(0, index - maxLength / 2);
  const end = Math.min(text.length, index + searchTerm.length + maxLength / 2); // Use renamed parameter
  let excerpt = text.substring(start, end);

  // Add ellipsis if needed
  if (start > 0) excerpt = "..." + excerpt;
  if (end < text.length) excerpt = excerpt + "...";

  return excerpt;
}
