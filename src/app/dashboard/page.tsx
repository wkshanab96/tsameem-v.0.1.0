import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { fetchRecentItems, fetchStarredItems } from "@/lib/file-utils";
import { FileIcon } from "@/components/file-explorer/FileIcon";
import { formatDate, formatFileSize } from "@/lib/file-utils";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch recent and starred items - this will be triggered on login, not on page load
  let recentFiles = [];
  let starredItems = { files: [], folders: [] };

  // We'll fetch this data server-side when the user logs in
  // This ensures data is ready when the page loads
  try {
    const [recentFilesData, starredItemsData] = await Promise.all([
      fetchRecentItems(5),
      fetchStarredItems(),
    ]);

    recentFiles = recentFilesData;
    starredItems = starredItemsData;
  } catch (error) {
    // Handle error silently
  }

  // Get user's full name or email
  const userName = user.user_metadata?.full_name || user.email || "User";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="home" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back, {userName.split(" ")[0]}!
            </h1>
            <p className="text-gray-600">
              Here's an overview of your recent activity and important files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {recentFiles.length}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Starred Items</p>
                  <p className="text-2xl font-bold text-green-700">
                    {starredItems.files.length + starredItems.folders.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/dashboard/documents"
                  className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <FileIcon fileType="pdf" />
                  <span className="text-orange-700 font-medium">
                    View Documents
                  </span>
                </Link>
                <Link
                  href="/dashboard/ai-drawings"
                  className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <PenToolIcon />
                  <span className="text-purple-700 font-medium">
                    Create Drawing
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Files
              </h3>
              <Link
                href="/dashboard/documents"
                className="text-sm text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            {recentFiles.length > 0 ? (
              <div className="space-y-2">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <FileIcon fileType={file.file_type} />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} •{" "}
                        {formatDate(file.updated_at)}
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
              <div className="text-center py-8 text-gray-500">
                <p>No recent files found. Upload your first document!</p>
                <Link
                  href="/dashboard/documents"
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  Go to Documents
                </Link>
              </div>
            )}
          </div>

          {/* Starred Items */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Starred Items
              </h3>
              <Link
                href="/dashboard/documents"
                className="text-sm text-blue-600 hover:underline"
              >
                Manage Starred
              </Link>
            </div>

            {starredItems.files.length > 0 ||
            starredItems.folders.length > 0 ? (
              <div className="space-y-2">
                {starredItems.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
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
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
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
              <div className="text-center py-8 text-gray-500">
                <p>
                  No starred items yet. Star your important files and folders
                  for quick access!
                </p>
              </div>
            )}
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
}

// Simple PenTool icon component
function PenToolIcon() {
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
      className="text-purple-600"
    >
      <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
      <path d="M2 2l7.586 7.586"></path>
      <circle cx="11" cy="11" r="2"></circle>
    </svg>
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
