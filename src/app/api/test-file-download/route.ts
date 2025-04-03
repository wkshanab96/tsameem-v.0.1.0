import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

/**
 * This endpoint is for testing file downloads
 * It returns a simple test file to verify the download functionality
 */
export async function GET(request: NextRequest) {
  try {
    // Create a simple text file for testing
    const testContent =
      "This is a test file to verify the download functionality.";
    const blob = new Blob([testContent], { type: "text/plain" });
    const buffer = await blob.arrayBuffer();

    // Return the test file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="test-file.txt"`,
      },
    });
  } catch (error) {
    console.error("Error in test file download handler:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
