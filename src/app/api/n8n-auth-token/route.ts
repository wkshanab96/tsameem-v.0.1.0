import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

/**
 * This endpoint allows generating or retrieving the n8n auth token
 * Only accessible by authenticated users with admin privileges
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated and has admin privileges
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, allow any authenticated user to access this endpoint
    // In the future, you can implement role-based access control

    // Get the current token from the app_secrets table
    const { data: secretData, error: secretError } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("name", "N8N_AUTH_TOKEN")
      .single();

    if (secretError && secretError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching N8N_AUTH_TOKEN:", secretError);
      return NextResponse.json(
        { error: "Error fetching token" },
        { status: 500 },
      );
    }

    const currentToken = secretData?.value || "default-secure-token";

    return NextResponse.json({ token: currentToken });
  } catch (error) {
    console.error("Error in n8n auth token handler:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated and has admin privileges
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, allow any authenticated user to access this endpoint
    // In the future, you can implement role-based access control

    // Generate a new token
    const newToken = `n8n_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;

    // Update the token in the app_secrets table
    const { error: updateError } = await supabase.from("app_secrets").upsert(
      {
        name: "N8N_AUTH_TOKEN",
        value: newToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "name" },
    );

    if (updateError) {
      console.error("Error updating N8N_AUTH_TOKEN:", updateError);
      return NextResponse.json(
        { error: "Failed to update token" },
        { status: 500 },
      );
    }

    console.log(`Generated new n8n auth token: ${newToken}`);

    return NextResponse.json({
      token: newToken,
      message: "New token generated",
    });
  } catch (error) {
    console.error("Error generating n8n auth token:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
