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
    const { query, limit = 10, includeExcerpts = true } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // Get the n8n webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_RAG_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.warn("N8N_RAG_WEBHOOK_URL environment variable not set");

      // Fallback to basic search if webhook URL is not configured
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("id, name, file_type, metadata, extracted_text")
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
            .includes(query.toLowerCase());
          const contentMatch =
            file.extracted_text &&
            file.extracted_text.toLowerCase().includes(query.toLowerCase());
          return nameMatch || contentMatch;
        })
        .map((file) => ({
          fileId: file.id,
          score: 1.0, // Default score
          excerpt: file.extracted_text
            ? extractRelevantText(file.extracted_text, query, 200)
            : undefined,
        }))
        .slice(0, limit);

      return NextResponse.json({
        results,
        suggestion:
          "Using basic search. Configure N8N_RAG_WEBHOOK_URL for AI-powered search.",
      });
    }

    try {
      // Forward the search request to n8n
      const response = await axios.post(n8nWebhookUrl, {
        query,
        userId: user.id,
        limit,
        includeExcerpts,
      });

      // Return the search results
      return NextResponse.json(response.data);
    } catch (n8nError) {
      console.error("Error calling n8n webhook:", n8nError);

      // Fallback to basic search if n8n call fails
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("id, name, file_type, metadata, extracted_text")
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
            .includes(query.toLowerCase());
          const contentMatch =
            file.extracted_text &&
            file.extracted_text.toLowerCase().includes(query.toLowerCase());
          return nameMatch || contentMatch;
        })
        .map((file) => ({
          fileId: file.id,
          score: 1.0, // Default score
          excerpt: file.extracted_text
            ? extractRelevantText(file.extracted_text, query, 200)
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
 * Extract relevant text around the query in a document
 */
function extractRelevantText(
  text: string,
  query: string,
  maxLength: number = 200,
): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text.substring(0, maxLength) + "...";

  // Get text around the match
  const start = Math.max(0, index - maxLength / 2);
  const end = Math.min(text.length, index + query.length + maxLength / 2);
  let excerpt = text.substring(start, end);

  // Add ellipsis if needed
  if (start > 0) excerpt = "..." + excerpt;
  if (end < text.length) excerpt = excerpt + "...";

  return excerpt;
}
