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
    // Create a regular client
    const supabase = createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SQL to check if the column exists
    const checkColumnSql = `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'files' 
        AND column_name = 'extracted_text'
      ) as column_exists;
    `;

    // Execute the check
    const checkResult = await executeSql(supabase, checkColumnSql);

    if (!checkResult.success) {
      return NextResponse.json(
        { error: `Failed to check if column exists: ${checkResult.error}` },
        { status: 500 },
      );
    }

    // If the column doesn't exist, add it
    if (
      !checkResult.data ||
      !checkResult.data[0] ||
      !checkResult.data[0].column_exists
    ) {
      console.log("extracted_text column does not exist, adding it now");

      // SQL to add the column
      const addColumnSql = `
        ALTER TABLE files 
        ADD COLUMN IF NOT EXISTS extracted_text TEXT;
      `;

      const addResult = await executeSql(supabase, addColumnSql);

      if (!addResult.success) {
        return NextResponse.json(
          { error: `Failed to add column: ${addResult.error}` },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "extracted_text column added successfully",
      });
    }

    return NextResponse.json({
      success: true,
      message: "extracted_text column already exists",
    });
  } catch (error) {
    console.error("Error in add-extracted-text-column API:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || "Unknown error"}` },
      { status: 500 },
    );
  }
}
