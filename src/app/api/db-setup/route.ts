import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { directSqlExecute } from "./direct-sql";

export async function GET(request: NextRequest) {
  try {
    console.log("Running DB setup API");

    // Use the direct SQL approach instead of RPC functions
    const result = await directSqlExecute();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to execute database setup" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed",
    });
  } catch (error: any) {
    console.error("Unexpected error in DB setup API:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 },
    );
  }
}
