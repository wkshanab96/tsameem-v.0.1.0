import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

/**
 * This endpoint allows n8n to download files from Supabase storage with authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check for authentication header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const supabase = createClient();

    // Get the auth token from the app_secrets table
    const { data: secretData, error: secretError } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("name", "N8N_AUTH_TOKEN")
      .single();

    if (secretError) {
      console.error("Error fetching N8N_AUTH_TOKEN:", secretError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 },
      );
    }

    const expectedAuthToken = secretData?.value || "default-secure-token";
    const providedToken = authHeader.replace("Bearer ", "");

    if (providedToken !== expectedAuthToken) {
      console.error(
        `Invalid authorization token: '${providedToken}' does not match expected token`,
      );
      return NextResponse.json(
        { error: "Unauthorized access - invalid token" },
        { status: 401 },
      );
    }

    // Get file ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 });
    }

    console.log(`Processing download request for file ID: ${fileId}`);

    // Get file details from database
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("name, storage_path, file_type")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      console.error("Error fetching file details:", fileError);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.log(`Found file: ${file.name}, path: ${file.storage_path}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(file.storage_path);

    if (downloadError || !fileData) {
      console.error("Error downloading file:", downloadError);
      return NextResponse.json(
        { error: "File download failed" },
        { status: 500 },
      );
    }

    console.log(`Successfully downloaded file from storage: ${file.name}`);

    // Determine content type
    let contentType = "application/octet-stream";
    if (file.file_type) {
      switch (file.file_type.toLowerCase()) {
        case "pdf":
          contentType = "application/pdf";
          break;
        case "doc":
        case "docx":
          contentType = "application/msword";
          break;
        case "txt":
          contentType = "text/plain";
          break;
        case "jpg":
        case "jpeg":
          contentType = "image/jpeg";
          break;
        case "png":
          contentType = "image/png";
          break;
        case "dwg":
        case "dxf":
          contentType = "application/acad";
          break;
        // Add more types as needed
      }
    }

    console.log(`Returning file with content type: ${contentType}`);

    // Return file as response
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${file.name}"`,
      },
    });
  } catch (error) {
    console.error("Error in file download handler:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
