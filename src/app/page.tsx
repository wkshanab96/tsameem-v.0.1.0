import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  History,
  Users,
  Brain,
  Shield,
  Grid,
  Layers,
} from "lucide-react";
import Image from "next/image";
import ClientHome from "@/components/client-home";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <ClientHome />
      <Footer />
    </div>
  );
}
