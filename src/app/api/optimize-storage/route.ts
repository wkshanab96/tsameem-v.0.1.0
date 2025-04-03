import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

// Helper function to safely execute SQL
async function executeSql(supabase, sql) {
  try {
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: sql,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("SQL execution error:", error);
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create a regular client
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the storage optimization migration
    const migrationPath = "20240701000001_optimize_storage_structure.sql";
    console.log(`Running storage optimization migration: ${migrationPath}`);

    // Ensure the documents bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === "documents");

      if (!bucketExists) {
        console.log("Creating documents bucket...");
        const { error } = await supabase.storage.createBucket("documents", {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
        });

        if (error) {
          console.error("Error creating bucket:", error);
        } else {
          console.log("Documents bucket created successfully");
        }
      } else {
        console.log("Documents bucket already exists");
        // Update bucket to ensure it's public
        const { error } = await supabase.storage.updateBucket("documents", {
          public: true,
        });

        if (error) {
          console.error("Error updating bucket:", error);
        } else {
          console.log("Documents bucket updated successfully");
        }
      }
    } catch (bucketError) {
      console.error("Error checking/creating bucket:", bucketError);
    }

    // Create indexes to improve query performance
    const indexQueries = [
      // Files table indexes
      `CREATE INDEX IF NOT EXISTS idx_files_storage_path ON files(storage_path);`,
      `CREATE INDEX IF NOT EXISTS idx_files_public_url ON files(public_url);`,
      `CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);`,
      `CREATE INDEX IF NOT EXISTS idx_files_created_by ON files(created_by);`,
      `CREATE INDEX IF NOT EXISTS idx_files_starred ON files(starred) WHERE starred = true;`,
      `CREATE INDEX IF NOT EXISTS idx_files_updated_at ON files(updated_at DESC);`,

      // Folders table indexes
      `CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);`,
      `CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);`,
      `CREATE INDEX IF NOT EXISTS idx_folders_starred ON folders(starred) WHERE starred = true;`,
      `CREATE INDEX IF NOT EXISTS idx_folders_updated_at ON folders(updated_at DESC);`,

      // File revisions table indexes
      `CREATE INDEX IF NOT EXISTS idx_file_revisions_file_id ON file_revisions(file_id);`,
      `CREATE INDEX IF NOT EXISTS idx_file_revisions_created_at ON file_revisions(created_at DESC);`,
    ];

    const results = [];
    for (const query of indexQueries) {
      try {
        const result = await executeSql(supabase, query);
        results.push({
          query,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        console.error(`Error executing query: ${query}`, error);
        results.push({
          query,
          success: false,
          error: error.message,
        });
      }
    }

    // Apply storage RLS policies
    const rlsQueries = [
      // Enable RLS on storage tables
      `ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,

      // Drop existing policies
      `DROP POLICY IF EXISTS "Public Access" ON storage.buckets;`,
      `DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.buckets;`,
      `DROP POLICY IF EXISTS "Public Access" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;`,

      // Create policies for buckets
      `CREATE POLICY "Public Access" ON storage.buckets FOR SELECT USING (true);`,
      `CREATE POLICY "Allow authenticated uploads" ON storage.buckets FOR INSERT TO authenticated USING (true);`,

      // Create policies for objects
      `CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');`,
      `CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');`,
      `CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));`,
      `CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));`,
    ];

    for (const query of rlsQueries) {
      try {
        const result = await executeSql(supabase, query);
        results.push({
          query,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        console.error(`Error executing RLS query: ${query}`, error);
        results.push({
          query,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Storage optimization completed",
      results,
    });
  } catch (error) {
    console.error("Error in optimize-storage API:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || "Unknown error"}` },
      { status: 500 },
    );
  }
}
