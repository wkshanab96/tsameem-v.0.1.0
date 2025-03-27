import Link from "next/link";
import { createClient } from "../../supabase/server";
import { Button } from "./ui/button";
import { FileText, UserCircle } from "lucide-react";
import UserProfile from "./user-profile";
import ClientNavbar from "./client-navbar";

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  // Pass only the user ID to the client component to minimize data transfer
  // Full user data will be fetched client-side only when needed
  return <ClientNavbar userId={user?.id} />;
}
