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

          // Check if the response has the expected 'output' field
          if (data && typeof data === 'object' && typeof data.output === 'string') {
              const suggestionText = data.output;
              let foundFiles = []; // Initialize empty array for results

              // Attempt to extract filename (e.g., "filename.pdf") from the suggestion text
              // This regex looks for quoted strings ending in common document extensions
              const filenameRegex = /"([^"]+\.(?:pdf|docx?|xlsx?|pptx?|txt|md|csv|json|xml|html|css|js|ts|py|java|c|cpp|h|hpp|cs|go|rb|php|sql|sh|bat|ps1))"/i;
              const match = suggestionText.match(filenameRegex);

              if (match && match[1]) {
                  const extractedFilename = match[1];
                  console.log("Extracted filename from suggestion:", extractedFilename);

                  // Query Supabase for this file belonging to the user
                  // Select fields matching the FileType definition exactly
                  const { data: fileData, error: fileError } = await supabase
                      .from("files")
                      // Match FileType: id, name, folder_id, path, file_type, size, thumbnail, created_at, updated_at, created_by, starred, metadata
                      .select("id, name, folder_id, path, file_type, size, thumbnail, created_at, updated_at, created_by, starred, metadata")
                      .eq("created_by", user.id)
                      .eq("name", extractedFilename) // Match by name
                      .limit(1)
                      .maybeSingle(); // Use maybeSingle() to return null instead of error if not found

                  if (fileError) {
                      console.error("Error fetching file by name:", fileError);
                      // Proceed without the file if there's an error
                  } else if (fileData) {
                      console.log("Found matching file in DB:", fileData.name);
                      // Add the full file object directly to the results array.
                      // Ensure 'fileData' structure matches the frontend 'FileType'.
                      // We selected "id, name, file_type, size, created_at, updated_at, metadata, path, is_folder"
                      // Check if FileType requires more/different fields. Assuming it matches for now.
                      foundFiles.push({
                          ...fileData,
                          // Add any default/missing fields required by FileType if necessary
                          // e.g., children: fileData.is_folder ? [] : undefined,
                      });
                  } else {
                      console.log("No matching file found in DB for:", extractedFilename);
                  }
              } else {
                  console.log("No filename found in suggestion text.");
              }

              // Construct the response for the frontend
              const frontendResponse = {
                  results: foundFiles, // Include the found file(s) if any
                  suggestion: suggestionText, // Always include the suggestion text
              };
              console.log("Transformed N8N response for frontend:", frontendResponse);
              return NextResponse.json(frontendResponse);

          } else {
              // Handle unexpected N8N response structure
              console.warn("Received unexpected data structure from n8n:", data);
              throw new Error("Received unexpected data structure from AI search service.");
          }

      } catch (parseError) {
          console.error("Failed to parse or process n8n search response:", parseError);
          // Return a specific error indicating invalid or unprocessable response from the webhook
          return NextResponse.json(
              { error: "Received invalid or unprocessable response from AI search service.", results: [] },
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
