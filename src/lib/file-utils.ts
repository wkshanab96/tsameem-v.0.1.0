import { File as FileType, FileRevision, Folder } from "./types";
import { createClient } from "../../supabase/client";
import { v4 as uuidv4 } from "uuid";
import { processDocumentWithN8n, ProcessDocumentResponse } from "./n8n-service";
import { saveAs } from "file-saver";
import { getMimeTypeFromFileName } from "./file-utils-mime";

const BUCKET_NAME = "documents";

// File type to icon mapping
export const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return "pdf";
    case "dwg":
    case "dxf":
    case "dwf":
      return "code";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
      return "image";
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return "document";
    case "xls":
    case "xlsx":
    case "csv":
      return "table";
    case "ppt":
    case "pptx":
      return "presentation";
    case "zip":
    case "rar":
    case "7z":
      return "archive";
    case "mp3":
    case "wav":
    case "ogg":
      return "audio";
    case "mp4":
    case "avi":
    case "mov":
      return "video";
    default:
      return "document";
  }
};

// Get thumbnail based on file type
export const getFileThumbnail = (fileType: string) => {
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

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Re-export getMimeTypeFromFileName from file-utils-mime
export { getMimeTypeFromFileName } from "./file-utils-mime";

// Initialize Supabase storage bucket
export const initializeStorage = async () => {
  // Use regular client for initial operations
  const supabase = createClient();

  // Create admin client for operations that require bypassing RLS
  let adminClient;
  try {
    const { createAdminClient } = await import("./admin-client");
    adminClient = createAdminClient();
    console.log("Admin client created successfully");
  } catch (adminError) {
    console.warn("Failed to create admin client:", adminError);
    // Continue with regular client as fallback
  }

  try {
    console.log("Initializing storage bucket (skipping runtime permission setup)...");

    // We're using metadata.extractedText for storing document text
    console.log("Using metadata.extractedText for document content storage");

    // Assume bucket doesn't exist and try to create it directly
    console.log("Attempting to create bucket directly: " + BUCKET_NAME);
    const bucketExists = false; // Assuming check is removed or handled differently

    if (!bucketExists) { // Simplified logic, assuming we always try to ensure it exists
      console.log(`Ensuring bucket exists: ${BUCKET_NAME}`);

      // Try using RPC function first with admin client if available
      try {
        const client = adminClient || supabase;
        const { error: rpcError } = await client.rpc(
          "create_bucket_if_not_exists",
        );
        if (rpcError) {
          console.warn(
            "RPC method failed, falling back to direct creation:",
            rpcError,
          );
          // Fall through to direct creation
        } else {
          console.log(`Bucket ensured/created successfully via RPC: ${BUCKET_NAME}`);
          console.log("Skipping runtime storage permission setup after RPC creation.");
          // It's assumed permissions are set via migrations or one-time setup
          return true; // Exit early if successful
        }
      } catch (rpcError) {
        console.warn(
          "RPC method failed with exception, falling back to direct creation:",
          rpcError,
        );
        // Fall through to direct creation
      }

      // Direct creation as fallback using admin client if available
      try {
        const client = adminClient || supabase;
        const { data, error } = await client.storage.createBucket(BUCKET_NAME, {
          public: true, // Make bucket public to allow direct access to files
          fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
        });

        if (error && !error.message.includes('already exists')) { // Ignore "already exists" error
          console.error("Error creating bucket:", error);
          // Try with minimal options instead of throwing
          try {
            console.log("Trying with minimal options...");
            const client = adminClient || supabase;
            const { error: minimalError } = await client.storage.createBucket(
              BUCKET_NAME,
              {
                public: true,
              },
            );
            if (minimalError && !minimalError.message.includes('already exists')) {
              console.error(
                "Error creating bucket with minimal options:",
                minimalError,
              );
              console.warn("Continuing despite bucket creation errors");
            } else {
              console.log(
                `Bucket ensured/created successfully with minimal options: ${BUCKET_NAME}`,
              );
            }
          } catch (minimalError) {
            console.error("Error with minimal bucket creation:", minimalError);
            console.warn("Continuing despite all bucket creation errors");
          }
        } else {
          console.log(
            `Bucket ensured/created successfully via direct API: ${BUCKET_NAME}`,
          );
        }
        console.log("Skipping runtime storage permission setup after direct creation.");

      } catch (createError) {
        console.error(
          "Detailed bucket creation error:",
          JSON.stringify(createError, null, 2),
        );
         console.log("Skipping runtime storage permission setup after minimal creation attempt.");
         console.warn(
            "Continuing despite all bucket creation attempts failing",
          );
      }
    } else {
      console.log(`Bucket already exists: ${BUCKET_NAME}`);
    }

    // Verify bucket exists after creation attempt
    const { data: verifyBuckets, error: verifyError } =
      await supabase.storage.listBuckets();

    if (verifyError) {
      console.error("Error verifying buckets:", verifyError);
      console.warn("Continuing despite error verifying buckets");
    }

    const bucketVerified = verifyBuckets?.some(
      (bucket) => bucket.name === BUCKET_NAME,
    );
    if (!bucketVerified) {
      console.error(`Bucket ${BUCKET_NAME} was not created successfully`);
      console.warn("Continuing despite bucket verification failure");
    } else {
      // Update bucket to be public if it exists (this might still be slow but less frequent)
      try {
        const client = adminClient || supabase;
        const { error: updateError } = await client.storage.updateBucket(
          BUCKET_NAME,
          {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
          },
        );

        if (updateError) {
          console.warn("Error updating bucket to be public:", updateError);
          console.warn("Continuing despite bucket update error");
        } else {
          console.log(`Bucket updated to be public: ${BUCKET_NAME}`);
           console.log("Skipping runtime storage permission setup after bucket update.");
        }
      } catch (updateError) {
        console.warn("Error updating bucket:", updateError);
        // Continue anyway
      }
    }

    console.log(`Storage initialization complete`);
    return true;
  } catch (error) {
    console.error("Error initializing storage:", error);
    console.warn("Returning false from initializeStorage due to error");
    return false;
  }
};

// Fetch folder contents from database
export const fetchFolderContents = async (folderId: string | null) => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(
      `Fetching folder contents for folderId: ${folderId}, userId: ${userId}`,
    );

    // Fetch folders
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("*")
      .eq("parent_id", folderId)
      .eq("created_by", userId);

    if (foldersError) {
      console.error("Error fetching folders:", foldersError);
      throw foldersError;
    }

    console.log(`Found ${folders?.length || 0} folders`);
    if (folders?.length) {
      console.log("Sample folder:", folders[0]);
    }

    // Fetch files - avoid selecting extracted_text column directly
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select(
        "id, name, folder_id, path, file_type, size, thumbnail, created_at, updated_at, created_by, starred, storage_path, public_url, metadata, file_revisions(*)",
      )
      .eq("folder_id", folderId)
      .eq("created_by", userId);

    if (filesError) {
      console.error("Error fetching files:", filesError);
      throw filesError;
    }

    console.log(`Found ${files?.length || 0} files`);
    if (files?.length) {
      console.log("Sample file:", files[0]);
    }

    // Transform file_revisions to revisions for compatibility
    const transformedFiles =
      files?.map((file) => ({
        ...file,
        revisions: file.file_revisions,
      })) || [];

    return {
      folders: folders || [],
      files: transformedFiles,
    };
  } catch (error) {
    console.error("Error in fetchFolderContents:", error);
    throw error;
  }
};

// Fetch or create root folder
export const fetchRootFolder = async () => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Fetching root folder for userId: ${userId}`);

    // Check if root folder exists
    const { data: rootFolders, error: fetchError } = await supabase
      .from("folders")
      .select("*")
      .is("parent_id", null)
      .eq("created_by", userId)
      .eq("name", "My Documents");

    if (fetchError) {
      console.error("Error fetching root folder:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${rootFolders?.length || 0} root folders`);

    // If root folder exists, return it
    if (rootFolders && rootFolders.length > 0) {
      console.log(`Returning existing root folder: ${rootFolders[0].id}`);

      // Ensure the path is correct
      if (rootFolders[0].path !== "/My Documents") {
        console.log(
          `Fixing root folder path from ${rootFolders[0].path} to /My Documents`,
        );
        const { error: updateError } = await supabase
          .from("folders")
          .update({ path: "/My Documents" })
          .eq("id", rootFolders[0].id);

        if (updateError) {
          console.error("Error updating root folder path:", updateError);
        } else {
          rootFolders[0].path = "/My Documents";
        }
      }

      return rootFolders[0];
    }

    console.log("No root folder found, creating a new one");

    // Otherwise create a new root folder
    const rootFolderId = uuidv4();
    console.log(`Generated root folder ID: ${rootFolderId}`);

    const rootFolder = {
      id: rootFolderId,
      name: "My Documents",
      parent_id: null,
      path: "/My Documents",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      starred: false,
    };

    console.log(`Creating new root folder with data:`, rootFolder);

    const { data, error: insertError } = await supabase
      .from("folders")
      .insert(rootFolder)
      .select();

    if (insertError) {
      console.error("Error creating root folder:", insertError);
      throw insertError;
    }

    console.log(`Root folder created successfully:`, data);
    return rootFolder;
  } catch (error) {
    console.error("Error in fetchRootFolder:", error);
    throw error;
  }
};

// Fetch folder path
export const fetchFolderPath = async (folderId: string) => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get the current folder
  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folderId)
    .eq("created_by", userId)
    .single();

  if (folderError) {
    console.error("Error fetching folder:", folderError);
    throw folderError;
  }

  if (!folder) {
    throw new Error("Folder not found");
  }

  // Build path recursively
  const path: Folder[] = [folder];
  let currentParentId = folder.parent_id;

  while (currentParentId) {
    const { data: parentFolder, error: parentError } = await supabase
      .from("folders")
      .select("*")
      .eq("id", currentParentId)
      .eq("created_by", userId)
      .single();

    if (parentError) {
      console.error("Error fetching parent folder:", parentError);
      break;
    }

    if (parentFolder) {
      path.unshift(parentFolder);
      currentParentId = parentFolder.parent_id;
    } else {
      break;
    }
  }

  return path;
};

// Create a new folder
export const createFolder = async (name: string, parentId: string | null) => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  console.log(`Creating folder: ${name} with parentId: ${parentId}`);

  // Get parent folder path if parentId is provided
  let parentPath = "/My Documents";
  if (parentId) {
    const { data: parentFolder, error: parentError } = await supabase
      .from("folders")
      .select("path")
      .eq("id", parentId)
      .single();

    if (parentError) {
      console.error("Error fetching parent folder:", parentError);
      throw parentError;
    }

    if (parentFolder && parentFolder.path) {
      parentPath = parentFolder.path;
      console.log(`Parent folder path: ${parentPath}`);
    } else {
      console.warn(
        `Parent folder not found or has no path, using default: ${parentPath}`,
      );
    }
  } else {
    console.log(`No parent ID provided, using root path: ${parentPath}`);
  }

  const folderId = uuidv4();
  console.log(`Generated folder ID: ${folderId}`);

  const newFolder = {
    id: folderId,
    name,
    parent_id: parentId,
    path: parentId ? `${parentPath}/${name}` : `/My Documents/${name}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: userId,
    starred: false,
  };

  console.log(`Creating folder with data:`, newFolder);

  const { data, error } = await supabase
    .from("folders")
    .insert(newFolder)
    .select();

  if (error) {
    console.error("Error creating folder:", error);
    throw error;
  }

  console.log(`Folder created successfully:`, data);
  return newFolder;
};

// Upload a file to storage and database
export const uploadFile = async (
  file: File,
  folderId: string,
  onProgress?: (progress: number) => void,
  asRevision: boolean = false,
) => {
  // Add detailed logging for debugging
  console.log(`==== UPLOAD PROCESS STARTED ====`);
  console.log(
    `uploadFile called with file: ${file.name}, size: ${file.size}, type: ${file.type}`,
  );
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Initialize progress
  if (onProgress) onProgress(0);

  try {
    console.log(
      `Starting upload for file: ${file.name}, size: ${file.size}, folderId: ${folderId}`,
    );

    // Try server-side upload API first to bypass RLS issues
    try {
      console.log("Attempting server-side upload via API...");
      if (onProgress) onProgress(10);

      // Create form data for the API request
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", folderId);
      formData.append("userId", userId);
      if (asRevision) {
        formData.append("asRevision", "true");
      }

      // Send to server-side API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server-side upload failed:", errorData);
        throw new Error(
          `Server upload failed: ${errorData.error || response.statusText}`,
        );
      }

      const result = await response.json();
      console.log("Server-side upload successful:", result);

      if (onProgress) onProgress(100);
      return result.file;
    } catch (apiError) {
      console.warn(
        "Server-side upload failed, falling back to client-side upload:",
        apiError,
      );
      // Continue with client-side upload as fallback
    }

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
        throw folderError;
      }

      if (folder && folder.path) {
        folderPath = folder.path;
        console.log(`Folder path found: ${folderPath}`);
      } else {
        console.warn(
          `Folder not found or has no path, using default: ${folderPath}`,
        );
      }
    } else {
      console.warn("No folder ID provided, using root path");
    }

    // Generate unique file ID
    const fileId = uuidv4();
    console.log(`Generated file ID: ${fileId}`);

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const storagePath = `${userId}/${fileId}.${fileExtension}`;
    const supportedTypes = ["pdf", "doc", "docx", "txt", "dwg", "dxf"];

    console.log(`Uploading to storage path: ${storagePath}`);

    // Verify storage bucket exists before upload
    const { data: buckets } = await supabase.storage.listBuckets();
    const initialBucketExists = buckets?.some(
      (bucket) => bucket.name === BUCKET_NAME,
    );

    if (!initialBucketExists) {
      console.log(`Bucket ${BUCKET_NAME} does not exist, creating it now`);
      await initializeStorage(); // Call initializeStorage if bucket doesn't exist
    }

    // Convert File to ArrayBuffer for upload
    let fileBuffer: ArrayBuffer | null = null; // Initialize as null
    try {
      fileBuffer = await file.arrayBuffer();
      console.log(
        `File converted to ArrayBuffer, size: ${fileBuffer?.byteLength}`,
      );
    } catch (bufferError) {
      console.error("Error converting file to ArrayBuffer:", bufferError);

      // Try alternative method to get file data
      console.log("Trying alternative method to read file...");
      const reader = new FileReader();
      fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => { // Specify ArrayBuffer type
        reader.onload = () => resolve(reader.result as ArrayBuffer); // Cast result
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      console.log(`File read using FileReader, size: ${fileBuffer?.byteLength}`);
    }

    if (!fileBuffer) {
        throw new Error("Failed to read file into buffer.");
    }

    // Upload file to storage bucket
    if (onProgress) onProgress(30);

    // Double check that bucket exists before upload
    const { data: bucketCheck, error: bucketCheckError } =
      await supabase.storage.listBuckets();

    if (bucketCheckError) {
      console.error("Error checking buckets before upload:", bucketCheckError);
      console.warn("Will attempt to create bucket anyway");
      await initializeStorage(); // Call initializeStorage if check fails
    } else {
      const bucketExistsCheck = bucketCheck?.some(
        (bucket) => bucket.name === BUCKET_NAME,
      );

      if (!bucketExistsCheck) {
        console.log(
          `Bucket ${BUCKET_NAME} not found before upload, creating it now`,
        );
        await initializeStorage(); // Call initializeStorage if bucket doesn't exist

        // Verify bucket was created
        const { data: verifyBuckets } = await supabase.storage.listBuckets();
        const bucketVerified = verifyBuckets?.some(
          (bucket) => bucket.name === BUCKET_NAME,
        );

        if (!bucketVerified) {
          console.error(
            `Bucket ${BUCKET_NAME} still not found after initialization attempt`,
          );
          console.warn("Will attempt to create bucket directly");

          try {
            const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
              public: true,
            });
            if (error) {
              console.error("Error creating bucket directly:", error);
            } else {
              console.log(
                `Bucket ${BUCKET_NAME} created directly before upload`,
              );
            }
          } catch (directCreateError) {
            console.error(
              "Error in direct bucket creation:",
              directCreateError,
            );
          }
        }
      }
    }

    console.log(
      `Starting upload to ${BUCKET_NAME}/${storagePath}, file size: ${fileBuffer.byteLength} bytes`,
    );

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, { // Use fileBuffer directly
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
          upsert: true, // Changed to true to overwrite if exists
        });

      if (uploadError) {
        console.error("Error uploading file to storage:", uploadError);
        throw uploadError;
      }

      console.log(
        `File uploaded successfully to storage: ${uploadData?.path || storagePath}`,
      );
    } catch (uploadError) {
      console.error(
        "Detailed upload error:",
        JSON.stringify(uploadError, null, 2),
      );

      // Try alternative upload method with Blob instead of ArrayBuffer
      console.log("Trying alternative upload method with Blob...");
      const blob = new Blob([fileBuffer], { // Use fileBuffer to create Blob
        type: file.type || "application/octet-stream",
      });

      const { data: uploadData, error: retryError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, blob, {
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
          upsert: true,
        });

      if (retryError) {
        console.error("Error on retry upload with Blob:", retryError);
        throw retryError;
      }

      console.log(
        `File uploaded successfully on retry: ${uploadData?.path || storagePath}`,
      );
    }

    // Get public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

    console.log(`Public URL generated: ${publicUrl}`);

    if (onProgress) onProgress(50);

    // Prepare for n8n notification after upload is complete
    // let n8nPromise = Promise.resolve(null); // Removed unused variable
    if (supportedTypes.includes(fileExtension)) {
      console.log(
        `Will notify n8n after upload for file: ${file.name} (${fileExtension})`,
      );
      console.log(`File type for processing: ${fileExtension}`);

      // Enhanced logging for webhook debugging
      console.log("Using hardcoded N8N_WEBHOOK_URL for document processing");
      console.log(`Will send metadata to n8n after upload:`, {
        fileId,
        folderId,
        userId,
        fileType: fileExtension,
        storagePath,
        publicUrl,
      });

      // We'll notify n8n after the file is successfully uploaded to Supabase
      // This is handled later in the code
    }

    // If this is a revision, check for existing file with the same name
    let existingFileId = null;
    if (asRevision) {
      const { data: existingFiles, error: existingError } = await supabase
        .from("files")
        .select("id")
        .eq("folder_id", folderId)
        .eq("name", file.name)
        .eq("created_by", userId);

      if (!existingError && existingFiles && existingFiles.length > 0) {
        existingFileId = existingFiles[0].id;
        console.log(
          `Found existing file with id ${existingFileId} for revision`,
        );
      }
    }

    // Create file record in database (or use existing for revision)
    const newFile = {
      id: existingFileId || fileId,
      name: file.name,
      folder_id: folderId,
      path: `${folderPath}/${file.name}`,
      file_type: fileExtension,
      size: file.size,
      thumbnail: getFileThumbnail(fileExtension), // Default thumbnail
      created_at: existingFileId ? undefined : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      starred: existingFileId ? undefined : false,
      storage_path: storagePath,
      public_url: publicUrl,
      metadata: {
        needsProcessing: supportedTypes.includes(fileExtension),
        processed: false,
        description: "", // Add empty description field
      },
    };

    console.log(`Creating database record for file with data:`, newFile);
    if (onProgress) onProgress(70);

    // Try with regular client first
    let fileData;
    let fileError;
    try {
      let result;

      if (existingFileId) {
        // Update existing file for revision
        console.log(`Updating existing file ${existingFileId} for revision`);
        result = await supabase
          .from("files")
          .update({
            size: newFile.size,
            updated_at: newFile.updated_at,
            storage_path: newFile.storage_path,
            public_url: newFile.public_url,
            metadata: newFile.metadata,
          })
          .eq("id", existingFileId)
          .select();
      } else {
        // Insert new file
        console.log(`Creating new file record with ID ${fileId}`);
        result = await supabase.from("files").insert(newFile).select();
      }

      fileData = result.data;
      fileError = result.error;

      // If we get an RLS error, try with admin client
      if (fileError && fileError.message.includes("row-level security")) {
        console.log("RLS policy error detected, trying with admin client");
        const { createAdminClient } = await import("./admin-client");
        try {
          const adminClient = createAdminClient();
          const adminResult = await adminClient
            .from("files")
            .insert(newFile)
            .select();

          fileData = adminResult.data;
          fileError = adminResult.error;
        } catch (adminError) {
          console.error("Error using admin client:", adminError);
          // Keep the original error if admin client fails
        }
      }
    } catch (error) {
      console.error("Unexpected error inserting file:", error);
      fileError = error;
    }

    if (fileError) {
      console.error("Error creating file record in database:", fileError);
      throw fileError;
    }

    console.log(`Database record created successfully:`, fileData);

    // Create revision
    const revisionId = uuidv4();
    console.log(`Generated revision ID: ${revisionId}`);

    // Get current version number if this is a revision
    let versionNumber = "1.0";
    let changes = "Initial upload";

    if (existingFileId) {
      const { data: existingRevisions, error: revisionsError } = await supabase
        .from("file_revisions")
        .select("version")
        .eq("file_id", existingFileId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (
        !revisionsError &&
        existingRevisions &&
        existingRevisions.length > 0
      ) {
        const lastVersion = existingRevisions[0].version;
        try {
          // Increment version number (e.g., "1.0" -> "1.1")
          const parts = lastVersion.split(".");
          if (parts.length === 2) {
            const major = parseInt(parts[0]);
            const minor = parseInt(parts[1]) + 1;
            versionNumber = `${major}.${minor}`;
          } else {
            // Fallback if version format is unexpected
            versionNumber = `${lastVersion}.1`;
          }
        } catch (e) {
          console.error("Error parsing version number:", e);
          versionNumber = `${lastVersion}.1`;
        }
        changes = `Updated to version ${versionNumber}`;
      }
    }

    const revision = {
      id: revisionId,
      file_id: existingFileId || fileId,
      version: versionNumber,
      changes: changes,
      thumbnail: getFileThumbnail(fileExtension),
      created_at: new Date().toISOString(),
      created_by: userId,
    };

    console.log(`Creating revision record with data:`, revision);

    // Try with regular client first
    let revisionData;
    let revisionError;
    try {
      const result = await supabase
        .from("file_revisions")
        .insert(revision)
        .select();

      revisionData = result.data;
      revisionError = result.error;

      // If we get an RLS error, try with admin client
      if (
        revisionError &&
        revisionError.message.includes("row-level security")
      ) {
        console.log(
          "RLS policy error detected for revision, trying with admin client",
        );
        const { createAdminClient } = await import("./admin-client");
        try {
          const adminClient = createAdminClient();
          const adminResult = await adminClient
            .from("file_revisions")
            .insert(revision)
            .select();

          revisionData = adminResult.data;
          revisionError = adminResult.error;
        } catch (adminError) {
          console.error("Error using admin client for revision:", adminError);
          // Keep the original error if admin client fails
        }
      }
    } catch (error) {
      console.error("Unexpected error inserting revision:", error);
      revisionError = error;
    }

    if (revisionError) {
      console.error("Error creating revision record:", revisionError);
      throw revisionError;
    }

    console.log(`Revision record created successfully:`, revisionData);
    if (onProgress) onProgress(90);

    // Now that the file is uploaded to Supabase, notify n8n with the file metadata
    if (supportedTypes.includes(fileExtension)) {
      console.log(
        `File uploaded to Supabase, now notifying n8n for processing: ${fileId}`,
      );

      // Send metadata to n8n for processing
      // Using IIFE for fire-and-forget with async/await and error handling
        (async () => {
          try {
            const processedData = await processDocumentWithN8n({
              fileId,
              fileName: file.name, // Added fileName
              folderId,
              userId,
            fileType: fileExtension,
            storagePath,
            publicUrl,
          });
          console.log("n8n notification completed:", processedData);
          if (processedData) {
            console.log(
              `Received processed data from n8n, updating file: ${fileId}`,
            );
            // Update the file with processed data
            const { error: updateError } = await supabase
              .from("files")
              .update({
                thumbnail: processedData.thumbnailUrl || newFile.thumbnail,
                metadata: {
                  ...newFile.metadata,
                  ...processedData.metadata,
                  needsProcessing: false,
                  processed: true,
                  extractedText: processedData.extractedText, // Store extracted text in metadata instead
                },
                updated_at: new Date().toISOString(),
              })
              .eq("id", fileId);

            if (updateError) {
               console.error("Error updating file with processed data:", updateError);
            } else {
               console.log(`File ${fileId} updated with processed data.`);
            }
          }
        } catch (error: any) { // Explicitly type error as any
          console.error("Error notifying n8n:", error);
          console.error("Error details:", error.message);
          if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
          }
        }
      })(); // Immediately invoke the async function
    }

    // Complete progress
    if (onProgress) onProgress(100);
    console.log(`Upload process completed successfully for file: ${file.name}`);
    console.log(`==== UPLOAD PROCESS COMPLETED ====`);

    // Return the file with its revision immediately
    return {
      ...newFile,
      revisions: [revision],
    };
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
};

// Download a file
export const downloadFile = async (fileId: string) => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Attempting to download file with ID: ${fileId}`);

    // Get file details
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("name, storage_path, public_url, file_type")
      .eq("id", fileId)
      .eq("created_by", userId)
      .single();

    if (fileError) {
      console.error("Error fetching file details:", fileError);
      throw new Error(`Failed to fetch file details: ${fileError.message}`);
    }

    if (!file) {
      throw new Error("File not found");
    }

    console.log(`File found: ${file.name}, attempting download...`);

    // Try direct browser download first
    if (file.public_url && typeof window !== "undefined") {
      try {
        console.log(`Attempting direct browser download: ${file.public_url}`);
        const link = document.createElement("a");
        link.href = file.public_url;
        link.download = file.name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("Direct browser download initiated");
        return true;
      } catch (directError) {
        console.warn("Direct browser download failed:", directError);
      }
    }

    // Try fetch from public URL
    if (file.public_url) {
      try {
        console.log(
          `Attempting to download from public URL: ${file.public_url}`,
        );
        // Add cache-busting parameter
        const cacheBustUrl = `${file.public_url}?t=${new Date().getTime()}`;
        const response = await fetch(cacheBustUrl);

        if (response.ok) {
          const blob = await response.blob();
          saveAs(blob, file.name);
          console.log("Download successful via public URL");
          return true;
        } else {
          console.warn(
            `Public URL fetch failed with status: ${response.status}`,
          );
        }
      } catch (fetchError) {
        console.warn("Error downloading from public URL:", fetchError);
      }
    }

    // Fall back to storage download
    if (file.storage_path) {
      console.log(`Attempting to download from storage: ${file.storage_path}`);
      try {
        const { data, error: downloadError } = await supabase.storage
          .from("documents")
          .download(file.storage_path);

        if (downloadError) {
          console.error("Storage download error:", downloadError);
          throw new Error(`Storage download failed: ${downloadError.message}`);
        }

        if (!data) {
          throw new Error("No data received from storage");
        }

        // Create a proper blob with the correct MIME type
        const mimeType = getMimeTypeFromFileName(file.name);
        const blob = new Blob([data], {
          type: mimeType || "application/octet-stream",
        });

        saveAs(blob, file.name);
        console.log("Download successful via storage");
        return true;
      } catch (storageError) {
        console.error("Storage download attempt failed:", storageError);

        // Try one more time with a different approach
        try {
          console.log("Trying alternative storage download approach...");
          const { data: publicUrlData } = supabase.storage
            .from("documents")
            .getPublicUrl(file.storage_path);

          if (publicUrlData && publicUrlData.publicUrl) {
            const directUrl = publicUrlData.publicUrl;
            console.log(`Got direct public URL: ${directUrl}`);

            const response = await fetch(directUrl);
            if (response.ok) {
              const blob = await response.blob();
              saveAs(blob, file.name);
              console.log("Download successful via direct public URL");
              return true;
            }
          }
        } catch (alternativeError) {
          console.error(
            "Alternative download approach failed:",
            alternativeError,
          );
        }
      }
    }

    throw new Error("No valid source found for file download");
  } catch (error) {
    console.error("Error in downloadFile function:", error);
    throw error;
  }
};

// Delete an item (file or folder)
export const deleteItem = async (id: string, type: "folder" | "file") => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Deleting ${type} with ID: ${id}`);

    if (type === "file") {
      // Get file storage path before deleting
      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("storage_path")
        .eq("id", id)
        .eq("created_by", userId)
        .single();

      if (fileError) {
        console.error("Error fetching file before deletion:", fileError);
        throw fileError;
      }

      // Delete file from storage if it has a storage path
      if (file && file.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([file.storage_path]);

        if (storageError) {
          console.warn("Error deleting file from storage:", storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete file revisions
      const { error: revisionError } = await supabase
        .from("file_revisions")
        .delete()
        .eq("file_id", id);

      if (revisionError) {
        console.error("Error deleting file revisions:", revisionError);
        throw revisionError;
      }

      // Delete file record
      const { error: deleteError } = await supabase
        .from("files")
        .delete()
        .eq("id", id)
        .eq("created_by", userId);

      if (deleteError) {
        console.error("Error deleting file record:", deleteError);
        throw deleteError;
      }
    } else {
      // For folders, first get all subfolders and files recursively
      const subfolders = await getSubfolders(id, userId);
      const fileIds = await getFilesInFolders(
        [id, ...subfolders.map((f) => f.id)],
        userId,
      );

      // Delete all files in the folders
      for (const fileId of fileIds) {
        await deleteItem(fileId, "file");
      }

      // Delete all subfolders (from deepest to shallowest)
      for (const subfolderId of subfolders.map((f) => f.id).reverse()) {
        const { error: folderError } = await supabase
          .from("folders")
          .delete()
          .eq("id", subfolderId)
          .eq("created_by", userId);

        if (folderError) {
          console.error(
            `Error deleting subfolder ${subfolderId}:`,
            folderError,
          );
          // Continue with other deletions
        }
      }

      // Delete the main folder
      const { error: folderError } = await supabase
        .from("folders")
        .delete()
        .eq("id", id)
        .eq("created_by", userId);

      if (folderError) {
        console.error("Error deleting folder:", folderError);
        throw folderError;
      }
    }

    console.log(`${type} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`Error in deleteItem (${type}):`, error);
    throw error;
  }
};

// Helper function to get all subfolders recursively
const getSubfolders = async (
  folderId: string,
  userId: string,
): Promise<Folder[]> => {
  const supabase = createClient();
  const result: Folder[] = [];
  const folderQueue = [folderId];
  const processedFolders = new Set<string>();

  while (folderQueue.length > 0) {
    const currentFolderId = folderQueue.shift();
    if (!currentFolderId || processedFolders.has(currentFolderId)) continue;
    processedFolders.add(currentFolderId);

    const { data: subfolders, error } = await supabase
      .from("folders")
      .select("*")
      .eq("parent_id", currentFolderId)
      .eq("created_by", userId);

    if (error) {
      console.error("Error fetching subfolders:", error);
      continue;
    }

    if (subfolders && subfolders.length > 0) {
      result.push(...subfolders);
      folderQueue.push(...subfolders.map((f) => f.id));
    }
  }

  return result;
};

// Helper function to get all files in a list of folders
const getFilesInFolders = async (
  folderIds: string[],
  userId: string,
): Promise<string[]> => {
  const supabase = createClient();
  const fileIds: string[] = [];

  for (const folderId of folderIds) {
    const { data: files, error } = await supabase
      .from("files")
      .select("id")
      .eq("folder_id", folderId)
      .eq("created_by", userId);

    if (error) {
      console.error(`Error fetching files for folder ${folderId}:`, error);
      continue;
    }

    if (files && files.length > 0) {
      fileIds.push(...files.map((f) => f.id));
    }
  }

  return fileIds;
};

// Rename an item (file or folder)
export const renameItem = async (
  id: string,
  newName: string,
  type: "folder" | "file",
) => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Renaming ${type} with ID: ${id} to "${newName}"`);

    if (type === "file") {
      // Get current file info
      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("name, path")
        .eq("id", id)
        .eq("created_by", userId)
        .single();

      if (fileError) {
        console.error("Error fetching file for rename:", fileError);
        throw fileError;
      }

      if (!file) {
        throw new Error("File not found");
      }

      // Update path with new name
      const oldPath = file.path;
      const newPath = oldPath.replace(file.name, newName);

      // Update file record
      const { error: updateError } = await supabase
        .from("files")
        .update({
          name: newName,
          path: newPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("created_by", userId);

      if (updateError) {
        console.error("Error updating file name:", updateError);
        throw updateError;
      }
    } else {
      // Get current folder info
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("name, path, parent_id")
        .eq("id", id)
        .eq("created_by", userId)
        .single();

      if (folderError) {
        console.error("Error fetching folder for rename:", folderError);
        throw folderError;
      }

      if (!folder) {
        throw new Error("Folder not found");
      }

      // Update folder path
      const oldPath = folder.path;
      const newPath = oldPath.replace(
        new RegExp(`/${folder.name}(?:/|$)`),
        `/${newName}/`,
      );
      const finalPath = newPath.endsWith("/") ? newPath.slice(0, -1) : newPath;

      // Update folder record
      const { error: updateError } = await supabase
        .from("folders")
        .update({
          name: newName,
          path: finalPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("created_by", userId);

      if (updateError) {
        console.error("Error updating folder name:", updateError);
        throw updateError;
      }

      // Update paths of all subfolders and files
      await updateSubpaths(oldPath, finalPath, userId);
    }

    console.log(`${type} renamed successfully`);
    return true;
  } catch (error) {
    console.error(`Error in renameItem (${type}):`, error);
    throw error;
  }
};

// Helper function to update paths of subfolders and files
const updateSubpaths = async (
  oldPath: string,
  newPath: string,
  userId: string,
) => {
  const supabase = createClient();

  // Update subfolder paths
  const { data: subfolders, error: subfoldersError } = await supabase
    .from("folders")
    .select("id, path")
    .like("path", `${oldPath}/%`)
    .eq("created_by", userId);

  if (subfoldersError) {
    console.error(
      "Error fetching subfolders for path update:",
      subfoldersError,
    );
    // Continue with other updates
  } else if (subfolders && subfolders.length > 0) {
    for (const subfolder of subfolders) {
      const updatedPath = subfolder.path.replace(oldPath, newPath);
      const { error: updateError } = await supabase
        .from("folders")
        .update({ path: updatedPath })
        .eq("id", subfolder.id)
        .eq("created_by", userId);

      if (updateError) {
        console.error(
          `Error updating subfolder ${subfolder.id} path:`,
          updateError,
        );
        // Continue with other updates
      }
    }
  }

  // Update file paths
  const { data: files, error: filesError } = await supabase
    .from("files")
    .select("id, path")
    .like("path", `${oldPath}/%`)
    .eq("created_by", userId);

  if (filesError) {
    console.error("Error fetching files for path update:", filesError);
    // Continue with other updates
  } else if (files && files.length > 0) {
    for (const file of files) {
      const updatedPath = file.path.replace(oldPath, newPath);
      const { error: updateError } = await supabase
        .from("files")
        .update({ path: updatedPath })
        .eq("id", file.id)
        .eq("created_by", userId);

      if (updateError) {
        console.error(`Error updating file ${file.id} path:`, updateError);
        // Continue with other updates
      }
    }
  }
};

// Toggle starred status of an item
export const toggleStarred = async (id: string, type: "folder" | "file") => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Toggling starred status for ${type} with ID: ${id}`);

    // Get current starred status
    const { data: item, error: fetchError } = await supabase
      .from(type === "folder" ? "folders" : "files")
      .select("starred")
      .eq("id", id)
      .eq("created_by", userId)
      .single();

    if (fetchError) {
      console.error(`Error fetching ${type} for starring:`, fetchError);
      throw fetchError;
    }

    if (!item) {
      throw new Error(`${type} not found`);
    }

    // Toggle starred status
    const newStarredStatus = !item.starred;

    // Update item
    const { error: updateError } = await supabase
      .from(type === "folder" ? "folders" : "files")
      .update({
        starred: newStarredStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", userId);

    if (updateError) {
      console.error(`Error updating ${type} starred status:`, updateError);
      throw updateError;
    }

    console.log(`${type} starred status toggled to ${newStarredStatus}`);
    return newStarredStatus;
  } catch (error) {
    console.error(`Error in toggleStarred (${type}):`, error);
    throw error;
  }
};

// Move an item to a different folder
export const moveItem = async (
  id: string,
  targetFolderId: string,
  type: "folder" | "file",
) => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Moving ${type} with ID: ${id} to folder: ${targetFolderId}`);

    // Get target folder path
    const { data: targetFolder, error: targetError } = await supabase
      .from("folders")
      .select("path, name")
      .eq("id", targetFolderId)
      .eq("created_by", userId)
      .single();

    if (targetError) {
      console.error("Error fetching target folder:", targetError);
      throw targetError;
    }

    if (!targetFolder) {
      throw new Error("Target folder not found");
    }

    if (type === "file") {
      // Get current file info
      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("name, path")
        .eq("id", id)
        .eq("created_by", userId)
        .single();

      if (fileError) {
        console.error("Error fetching file for move:", fileError);
        throw fileError;
      }

      if (!file) {
        throw new Error("File not found");
      }

      // Update file record
      const newPath = `${targetFolder.path}/${file.name}`;
      const { error: updateError } = await supabase
        .from("files")
        .update({
          folder_id: targetFolderId,
          path: newPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("created_by", userId);

      if (updateError) {
        console.error("Error updating file location:", updateError);
        throw updateError;
      }
    } else {
      // Prevent moving a folder into itself or its descendants
      if (await isFolderDescendant(targetFolderId, id, userId)) {
        throw new Error("Cannot move a folder into itself or its descendants");
      }

      // Get current folder info
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("name, path")
        .eq("id", id)
        .eq("created_by", userId)
        .single();

      if (folderError) {
        console.error("Error fetching folder for move:", folderError);
        throw folderError;
      }

      if (!folder) {
        throw new Error("Folder not found");
      }

      const oldPath = folder.path;
      const newPath = `${targetFolder.path}/${folder.name}`;

      // Update folder record
      const { error: updateError } = await supabase
        .from("folders")
        .update({
          parent_id: targetFolderId,
          path: newPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("created_by", userId);

      if (updateError) {
        console.error("Error updating folder location:", updateError);
        throw updateError;
      }

      // Update paths of all subfolders and files
      await updateSubpaths(oldPath, newPath, userId);
    }

    console.log(`${type} moved successfully`);
    return true;
  } catch (error) {
    console.error(`Error in moveItem (${type}):`, error);
    throw error;
  }
};

// Helper function to check if a folder is a descendant of another folder
const isFolderDescendant = async (
  folderId: string,
  potentialAncestorId: string,
  userId: string,
): Promise<boolean> => {
  const supabase = createClient();
  let currentFolderId = folderId;

  while (currentFolderId) {
    if (currentFolderId === potentialAncestorId) {
      return true;
    }

    const { data: folder, error } = await supabase
      .from("folders")
      .select("parent_id")
      .eq("id", currentFolderId)
      .eq("created_by", userId)
      .single();

    if (error || !folder) {
      return false;
    }

    currentFolderId = folder.parent_id;
    if (!currentFolderId) {
      return false;
    }
  }

  return false;
};

// Fetch starred items
export const fetchStarredItems = async () => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Fetching starred items for user: ${userId}`);

    // Fetch starred folders
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("*")
      .eq("created_by", userId)
      .eq("starred", true)
      .order("updated_at", { ascending: false });

    if (foldersError) {
      console.error("Error fetching starred folders:", foldersError);
      throw foldersError;
    }

    // Fetch starred files - avoid selecting extracted_text column directly
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select(
        "id, name, folder_id, path, file_type, size, thumbnail, created_at, updated_at, created_by, starred, storage_path, public_url, metadata, file_revisions(*)",
      )
      .eq("created_by", userId)
      .eq("starred", true)
      .order("updated_at", { ascending: false });

    if (filesError) {
      console.error("Error fetching starred files:", filesError);
      throw filesError;
    }

    // Transform file_revisions to revisions for compatibility
    const transformedFiles =
      files?.map((file) => ({
        ...file,
        revisions: file.file_revisions,
      })) || [];

    return {
      folders: folders || [],
      files: transformedFiles,
    };
  } catch (error) {
    console.error("Error in fetchStarredItems:", error);
    throw error;
  }
};

// Fetch recent items
export const fetchRecentItems = async (limit: number = 10) => {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Fetching recent items for user: ${userId}, limit: ${limit}`);

    // Fetch recent files - avoid selecting extracted_text column directly
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select(
        "id, name, folder_id, path, file_type, size, thumbnail, created_at, updated_at, created_by, starred, storage_path, public_url, metadata, file_revisions(*)",
      )
      .eq("created_by", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (filesError) {
      console.error("Error fetching recent files:", filesError);
      throw filesError;
    }

    // Transform file_revisions to revisions for compatibility
    const transformedFiles =
      files?.map((file) => ({
        ...file,
        revisions: file.file_revisions,
      })) || [];

    return transformedFiles;
  } catch (error) {
    console.error("Error in fetchRecentItems:", error);
    throw error;
  }
};
