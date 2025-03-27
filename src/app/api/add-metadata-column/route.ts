import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase admin client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase URL or service key not found");
      return NextResponse.json(
        { error: "Supabase credentials not found" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Execute raw SQL to add the metadata column if it doesn't exist
    // Try direct SQL approach instead of RPC
    const { error } = await supabase
      .from("_exec_sql")
      .select("*")
      .eq(
        "query",
        `ALTER TABLE files ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`
      );
      
    // If the _exec_sql approach fails, try a direct query
    if (error) {
      console.log("_exec_sql approach failed, trying direct SQL query");
      try {
        // Try a direct query to add the column
        await supabase.auth.getUser(); // Just to verify auth is working
        console.log("Auth check passed, attempting direct SQL approach");
      } catch (authError) {
        console.error("Auth error:", authError);
      }

    if (error) {
      console.error("Error adding metadata column:", error);

      // Fallback to direct SQL if RPC fails
      try {
        const { error: sqlError } = await supabase
          .from("_exec_sql")
          .select("*")
          .eq(
            "query",
            `
          ALTER TABLE files ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
        `,
          );

        if (sqlError) {
          return NextResponse.json(
            { error: `Failed to add metadata column: ${sqlError.message}` },
            { status: 500 },
          );
        }
      } catch (fallbackError) {
        return NextResponse.json(
          { error: `Failed to add metadata column: ${error.message}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Metadata column added or already exists",
    });
  } catch (error: any) {
    console.error("Unexpected error adding metadata column:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 },
    );
  }
}
