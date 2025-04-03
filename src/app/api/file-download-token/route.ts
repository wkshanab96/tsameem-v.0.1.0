import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

/**
 * This endpoint generates a temporary token for file downloads
 * that can be used by n8n to authenticate and download files
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const authToken = secretData?.value || "default-secure-token";

    return NextResponse.json({ token: authToken });
  } catch (error) {
    console.error("Error generating download token:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
