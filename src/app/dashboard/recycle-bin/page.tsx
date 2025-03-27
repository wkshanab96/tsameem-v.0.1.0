import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";

export default async function RecycleBinPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // In a real implementation, you would fetch deleted items from the database
  // For now, we'll just show a placeholder

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="recycle-bin" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Recycle Bin</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Empty Bin
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[70vh]">
            <div className="text-center py-16">
              <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Recycle Bin is Empty
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Items you delete will appear here for 30 days before being
                permanently removed.
              </p>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
}
