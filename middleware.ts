import React from "react";
import { updateSession } from "./supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    // Only attempt to update session if Supabase environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.length > 0 &&
      supabaseAnonKey.length > 0
    ) {
      return await updateSession(request);
    }

    // If Supabase environment variables are not available or empty, just continue the request
    console.log(
      "Skipping Supabase session update: environment variables not available",
    );
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // Continue the request even if there's an error with the session update
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
