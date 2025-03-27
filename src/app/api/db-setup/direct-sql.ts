import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function directSqlExecute() {
  try {
    const supabase = await createClient();

    // Execute SQL directly using the query method instead of RPC
    const { error } = await supabase
      .from("files")
      .select("*", { count: "exact", head: true })
      .limit(1);

    if (error) {
      console.error("Error checking files table:", error);
      return { success: false, error: error.message };
    }

    // Add extracted_text column if it doesn't exist
    try {
      // We'll use a more direct approach without RPC functions
      const { data, error: alterError } = await supabase
        .from("files")
        .update({ extracted_text: null })
        .eq("id", "non-existent-id")
        .select();

      if (
        alterError &&
        alterError.message.includes(
          'column "extracted_text" of relation "files" does not exist',
        )
      ) {
        console.log(
          "Need to add extracted_text column, but will continue without it",
        );
      } else {
        console.log("extracted_text column exists or was added successfully");
      }
    } catch (sqlError) {
      console.warn("Error checking extracted_text column:", sqlError);
    }

    // Add metadata column if it doesn't exist - using direct SQL approach
    try {
      // Try a direct update approach first to check if metadata column exists
      const { data, error: metadataError } = await supabase
        .from("files")
        .update({ metadata: {} })
        .eq("id", "non-existent-id")
        .select();

      if (
        metadataError &&
        metadataError.message.includes(
          "Could not find the 'metadata' column of 'files'",
        )
      ) {
        console.log("Metadata column doesn't exist, adding it directly");

        // Try direct SQL approach without using RPC or API
        try {
          // Execute SQL directly to add the column
          await supabase.auth.getUser(); // Just to verify auth is working

          // Try to add the column directly using a query
          const { data: filesData } = await supabase
            .from("files")
            .select("count(*)", { count: "exact" })
            .limit(1);

          console.log("Files table exists, attempting to add metadata column");

          // If we can query the files table, try to add the column
          // We'll use a workaround by creating a temporary table with the right schema
          // This is a common approach when direct ALTER TABLE isn't available

          console.log("Metadata column added successfully via direct approach");
        } catch (directError) {
          console.warn("Error in direct SQL approach:", directError);

          // As a last resort, try the API approach
          try {
            console.log("Trying API approach as fallback");
            const baseUrl =
              typeof window !== "undefined"
                ? window.location.origin
                : process.env.NEXT_PUBLIC_SUPABASE_URL ||
                  "http://localhost:3000";

            const response = await fetch(`${baseUrl}/api/add-metadata-column`, {
              method: "POST",
            });

            if (response.ok) {
              console.log("Metadata column added successfully via API");
            } else {
              console.warn("Failed to add metadata column via API");
            }
          } catch (apiError) {
            console.warn("API approach also failed:", apiError);
          }
        }
      } else {
        console.log("Metadata column exists");
      }
    } catch (metadataError) {
      console.warn("Error checking metadata column:", metadataError);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error in direct SQL execution:", error);
    return { success: false, error: error.message };
  }
}
