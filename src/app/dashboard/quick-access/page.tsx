import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus } from "lucide-react";
import Link from "next/link";
import { fetchStarredItems } from "@/lib/file-utils";
import { FileIcon } from "@/components/file-explorer/FileIcon";
import { formatDate, formatFileSize } from "@/lib/file-utils";

export default async function QuickAccessPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch starred items
  let starredItems = { files: [], folders: [] };
  try {
    starredItems = await fetchStarredItems();
  } catch (error) {
    // Handle error silently
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="quick-access" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Quick Access</h1>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Shortcut
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[70vh]">
            <h2 className="text-lg font-semibold mb-4">Starred Items</h2>

            {starredItems.files.length > 0 ||
            starredItems.folders.length > 0 ? (
              <div className="space-y-2">
                {starredItems.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                  >
                    <FolderIcon />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {folder.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Folder •{" "}
                        {formatDate(folder.updated_at || folder.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/documents?folder=${folder.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                ))}

                {starredItems.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                  >
                    <FileIcon fileType={file.file_type} />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} •{" "}
                        {formatDate(file.updated_at || file.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/documents?file=${file.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No Starred Items
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  Star your important files and folders for quick access.
                </p>
                <Link href="/dashboard/documents">
                  <Button variant="outline">Go to Documents</Button>
                </Link>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Recent Searches</h2>
              <div className="text-center py-8 text-gray-500">
                <p>Your recent searches will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
}

// Simple Folder icon component
function FolderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-yellow-500"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}
