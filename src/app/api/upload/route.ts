import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Create a Supabase admin client with the service role key
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or service key not found");
    throw new Error("Supabase credentials not found");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
};

// Get file thumbnail based on file type
const getFileThumbnail = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80";
    case "dwg":
    case "dxf":
    case "dwf":
      return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&q=80";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
      return "https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=500&q=80";
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return "https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=500&q=80";
    case "xls":
    case "xlsx":
    case "csv":
      return "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&q=80";
    case "ppt":
    case "pptx":
      return "https://images.unsplash.com/photo-1590593162201-f67611a18b87?w=500&q=80";
    case "zip":
    case "rar":
    case "7z":
      return "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=500&q=80";
    default:
      return "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80";
  }
};

const BUCKET_NAME = "documents";

export async function POST(request: NextRequest) {
  try {
    console.log("Server-side upload API called");

    // Create admin client
    const supabase = createAdminClient();

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;
    const userId = formData.get("userId") as string;

    if (!file || !folderId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log(
      `Processing upload for ${file.name}, size: ${file.size}, type: ${file.type}`,
    );

    // Get folder path
    let folderPath = "/My Documents";
    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("path")
        .eq("id", folderId)
        .single();

      if (folderError) {
        console.error("Error fetching folder:", folderError);
        return NextResponse.json(
          { error: `Failed to fetch folder: ${folderError.message}` },
          { status: 500 },
        );
      }

      if (folder && folder.path) {
        folderPath = folder.path;
      }
    }

    // Generate unique file ID
    const fileId = uuidv4();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const storagePath = `${userId}/${fileId}.${fileExtension}`;
    const supportedTypes = ["pdf", "doc", "docx", "txt", "dwg", "dxf"];

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

    // Create file record in database
    const newFile = {
      id: fileId,
      name: file.name,
      folder_id: folderId,
      path: `${folderPath}/${file.name}`,
      file_type: fileExtension,
      size: file.size,
      thumbnail: getFileThumbnail(fileExtension),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      starred: false,
      storage_path: storagePath,
      public_url: publicUrl,
      // Remove metadata field if it doesn't exist in the table
    };

    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .insert(newFile)
      .select();

    if (fileError) {
      console.error("Error creating file record:", fileError);
      return NextResponse.json(
        { error: `Failed to create file record: ${fileError.message}` },
        { status: 500 },
      );
    }

    // Create initial revision
    const revisionId = uuidv4();
    const revision = {
      id: revisionId,
      file_id: fileId,
      version: "1.0",
      changes: "Initial upload",
      thumbnail: getFileThumbnail(fileExtension),
      created_at: new Date().toISOString(),
      created_by: userId,
    };

    const { data: revisionData, error: revisionError } = await supabase
      .from("file_revisions")
      .insert(revision)
      .select();

    if (revisionError) {
      console.error("Error creating revision record:", revisionError);
      return NextResponse.json(
        { error: `Failed to create revision record: ${revisionError.message}` },
        { status: 500 },
      );
    }

    // Notify N8N asynchronously ("fire and forget")
    // We don't await the result here to make the upload feel faster
    import("@/lib/n8n-service").then(({ processDocumentWithN8n, sanitizedWebhookUrls }) => {
        console.log(`Notifying N8N asynchronously to store file in vector database: ${fileId}`);
        console.log(`Using store webhook URL: ${sanitizedWebhookUrls.store}`);
        processDocumentWithN8n({
            fileId: fileId,
            userId: userId,
            fileType: fileExtension,
            storagePath: storagePath,
            publicUrl: publicUrl,
        }).then(result => {
            console.log(`Async N8N store notification finished for ${fileId}. Result:`, result ? JSON.stringify(result) : 'No result');
        }).catch(storeError => {
            console.error(`Async error notifying N8N for vector storage for ${fileId}:`, storeError);
            console.log(`Error details: ${storeError.message || JSON.stringify(storeError)}`);
        });
    }).catch(importError => {
        console.error("Failed to import n8n-service for async notification:", importError);
    });


    // Return success immediately with file data
    return NextResponse.json({
      success: true,
      file: {
        ...newFile,
        revisions: [revision], // Assuming you want to return the initial revision
      },
    });
  } catch (error: any) {
    console.error("Unexpected error in upload API:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 },
    );
  }
}
