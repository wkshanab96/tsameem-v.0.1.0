import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

/**
 * This endpoint receives callbacks from n8n after document processing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Handle JSON data only (no more multipart/form-data)
    const data = await request.json();

    // Validate the incoming data
    if (!data.fileId || typeof data.fileId !== "string") {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Extract the processing results
    const {
      fileId,
      extractedText,
      metadata,
      thumbnailUrl,
      processed = true,
    } = data;

    console.log(`Updating file ${fileId} with processing results`);

    // Get current file data first
    const { data: fileData, error: fetchError } = await supabase
      .from("files")
      .select("metadata")
      .eq("id", fileId)
      .single();

    if (fetchError) {
      console.error("Error fetching file:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: 500 },
      );
    }

    // Merge existing metadata with new metadata
    const mergedMetadata = {
      ...(fileData?.metadata || {}),
      ...(metadata || {}),
      processed,
      needsProcessing: false,
      updatedAt: new Date().toISOString(),
    };

    // Update the file in the database with the processing results
    const { error } = await supabase
      .from("files")
      .update({
        extracted_text: extractedText || null,
        metadata: mergedMetadata,
        thumbnail: thumbnailUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    if (error) {
      console.error("Error updating file:", error);
      return NextResponse.json(
        { error: "Failed to update file" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, fileId });
  } catch (error) {
    console.error("Error in n8n webhook handler:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
