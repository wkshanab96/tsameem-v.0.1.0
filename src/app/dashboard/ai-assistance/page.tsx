import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { AIAssistancePanel } from "@/components/ai-assistance-panel";
import { ResponsiveLayout } from "@/components/responsive-layout";

export default async function AIAssistancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="ai-assistance" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <h1 className="text-2xl font-bold mb-6">AI Engineering Experts</h1>
          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[80vh]">
            <AIAssistancePanel />
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
}
