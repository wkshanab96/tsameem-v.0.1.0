import { createClient } from "../../supabase/client";

/**
 * Utility function to check database tables and schema
 */
export const checkDatabaseTables = async () => {
  const supabase = createClient();
  const results: Record<string, any> = {};

  try {
    console.log("Checking database tables...");

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Authentication error:", authError);
      results.auth = { error: authError.message };
      return results;
    }

    if (!user) {
      console.error("No user found");
      results.auth = { error: "No user found" };
      return results;
    }

    results.auth = { userId: user.id, success: true };
    console.log(`Authenticated as user: ${user.id}`);

    // Check folders table
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("count")
      .limit(1);

    if (foldersError) {
      console.error("Error checking folders table:", foldersError);
      results.folders = { error: foldersError.message };
    } else {
      results.folders = { exists: true, count: folders[0]?.count || 0 };
      console.log(`Folders table exists, count: ${folders[0]?.count || 0}`);
    }

    // Check files table
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("count")
      .limit(1);

    if (filesError) {
      console.error("Error checking files table:", filesError);
      results.files = { error: filesError.message };
    } else {
      results.files = { exists: true, count: files[0]?.count || 0 };
      console.log(`Files table exists, count: ${files[0]?.count || 0}`);
    }

    // Check file_revisions table
    const { data: revisions, error: revisionsError } = await supabase
      .from("file_revisions")
      .select("count")
      .limit(1);

    if (revisionsError) {
      console.error("Error checking file_revisions table:", revisionsError);
      results.file_revisions = { error: revisionsError.message };
    } else {
      results.file_revisions = {
        exists: true,
        count: revisions[0]?.count || 0,
      };
      console.log(
        `File_revisions table exists, count: ${revisions[0]?.count || 0}`,
      );
    }

    // Check storage buckets
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error checking storage buckets:", bucketsError);
      results.storage = { error: bucketsError.message };
    } else {
      const bucketNames = buckets?.map((b) => b.name) || [];
      results.storage = { buckets: bucketNames };
      console.log(`Storage buckets: ${bucketNames.join(", ")}`);
    }

    return results;
  } catch (error) {
    console.error("Error checking database:", error);
    results.error = error.message;
    return results;
  }
};

/**
 * Create required database tables if they don't exist
 */
export const createRequiredTables = async () => {
  const supabase = createClient();

  try {
    console.log("Creating required database tables...");

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError || "No user found");
      return false;
    }

    // Create storage bucket if it doesn't exist
    const { error: bucketError } = await supabase.rpc(
      "create_bucket_if_not_exists",
    );

    if (bucketError) {
      console.error("Error creating storage bucket:", bucketError);
      // Continue anyway, we'll try to create it directly later
    } else {
      console.log("Storage bucket created or already exists");
    }

    // Create folders table if it doesn't exist
    const { error: foldersError } = await supabase.rpc(
      "create_folders_table_if_not_exists",
    );

    if (foldersError) {
      console.error("Error creating folders table:", foldersError);
      return false;
    }
    console.log("Folders table created or already exists");

    // Create files table if it doesn't exist
    const { error: filesError } = await supabase.rpc(
      "create_files_table_if_not_exists",
    );

    if (filesError) {
      console.error("Error creating files table:", filesError);
      return false;
    }
    console.log("Files table created or already exists");

    // Create file_revisions table if it doesn't exist
    const { error: revisionsError } = await supabase.rpc(
      "create_file_revisions_table_if_not_exists",
    );

    if (revisionsError) {
      console.error("Error creating file_revisions table:", revisionsError);
      return false;
    }
    console.log("File revisions table created or already exists");

    // Initialize storage directly as a fallback
    try {
      const { initializeStorage } = await import("./file-utils");
      await initializeStorage();
      console.log("Storage initialized successfully");
    } catch (storageError) {
      console.error("Error initializing storage:", storageError);
      // Continue anyway
    }

    console.log("Required tables created successfully");
    return true;
  } catch (error) {
    console.error("Error creating required tables:", error);
    return false;
  }
};
