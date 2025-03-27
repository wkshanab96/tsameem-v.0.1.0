import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import DocumentExplorerNew from "@/components/document-explorer-new";
import { ResponsiveLayout } from "@/components/responsive-layout";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="documents" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <DocumentExplorerNew />
        </div>
      </ResponsiveLayout>
    </div>
  );
}
