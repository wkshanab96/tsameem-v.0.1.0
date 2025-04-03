import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/client";

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
    // Create a regular client first
    const supabase = createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply the storage bucket RLS fixes
    const sqlStatements = [
      // Enable row level security on storage.buckets
      `ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;`,

      // Enable row level security on storage.objects
      `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,

      // Create policy to allow public access to the documents bucket
      `DROP POLICY IF EXISTS "Public Access" ON storage.buckets;`,
      `CREATE POLICY "Public Access" ON storage.buckets
        FOR SELECT
        USING (true);`,

      // Create policy to allow authenticated users to insert into the documents bucket
      `DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.buckets;`,
      `CREATE POLICY "Allow authenticated uploads" ON storage.buckets
        FOR INSERT
        TO authenticated
        USING (true);`,

      // Create policy to allow public access to objects
      `DROP POLICY IF EXISTS "Public Access" ON storage.objects;`,
      `CREATE POLICY "Public Access" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'documents');`,

      // Create policy to allow authenticated users to insert objects
      `DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;`,
      `CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documents');`,

      // Create policy to allow authenticated users to update their own objects
      `DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;`,
      `CREATE POLICY "Allow authenticated updates" ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));`,

      // Create policy to allow authenticated users to delete their own objects
      `DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;`,
      `CREATE POLICY "Allow authenticated deletes" ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));`,

      // Make sure the documents bucket exists and is public
      `UPDATE storage.buckets SET public = true WHERE id = 'documents';`,
    ];

    // Execute each SQL statement
    const results = [];
    for (const sql of sqlStatements) {
      console.log(`Executing SQL: ${sql.substring(0, 50)}...`);
      const result = await executeSql(supabase, sql);
      results.push(result);

      if (!result.success) {
        console.warn(`SQL statement failed: ${sql.substring(0, 100)}...`);
        console.warn(`Error: ${result.error}`);
        // Continue with next statement even if this one failed
      }
    }

    // Try to create the bucket if it doesn't exist
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === "documents");

      if (!bucketExists) {
        console.log("Bucket 'documents' not found, creating it...");
        const { data, error } = await supabase.storage.createBucket(
          "documents",
          {
            public: true,
          },
        );

        if (error) {
          console.error("Error creating bucket:", error);
          results.push({
            success: false,
            error: error.message,
            operation: "create_bucket",
          });
        } else {
          console.log("Bucket created successfully");
          results.push({ success: true, operation: "create_bucket" });
        }
      } else {
        console.log("Bucket 'documents' already exists");
        results.push({ success: true, operation: "bucket_exists" });
      }
    } catch (bucketError) {
      console.error("Error checking/creating bucket:", bucketError);
      results.push({
        success: false,
        error: bucketError.message,
        operation: "bucket_operation",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Migration executed",
      results,
    });
  } catch (error) {
    console.error("Error in run-migration API:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || "Unknown error"}` },
      { status: 500 },
    );
  }
}
