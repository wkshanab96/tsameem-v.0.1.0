import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StorageOptimizer } from "@/components/storage-optimizer";
import Link from "next/link";
import { Cog } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user's profile information
  const userName = user.user_metadata?.full_name || "";
  const userEmail = user.email || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar activeTab="settings" />
      <ResponsiveLayout>
        <div className="p-4 md:p-6 h-full">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[70vh]">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and profile settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={userName} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" defaultValue={userEmail} disabled />
                      <p className="text-xs text-gray-500">
                        Your email address cannot be changed.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="Your company name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Job Title</Label>
                      <Input id="role" placeholder="Your job title" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save Changes</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                      Customize your experience and notification settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">
                        Interface Settings
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label
                            htmlFor="dark-mode"
                            className="text-sm font-medium"
                          >
                            Dark Mode
                          </Label>
                          <p className="text-xs text-gray-500">
                            Enable dark mode for the interface
                          </p>
                        </div>
                        <Switch id="dark-mode" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label
                            htmlFor="compact-view"
                            className="text-sm font-medium"
                          >
                            Compact View
                          </Label>
                          <p className="text-xs text-gray-500">
                            Show more items in lists with reduced spacing
                          </p>
                        </div>
                        <Switch id="compact-view" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">
                        Notification Settings
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label
                            htmlFor="email-notifications"
                            className="text-sm font-medium"
                          >
                            Email Notifications
                          </Label>
                          <p className="text-xs text-gray-500">
                            Receive email notifications for important updates
                          </p>
                        </div>
                        <Switch id="email-notifications" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label
                            htmlFor="document-updates"
                            className="text-sm font-medium"
                          >
                            Document Updates
                          </Label>
                          <p className="text-xs text-gray-500">
                            Get notified when documents are updated
                          </p>
                        </div>
                        <Switch id="document-updates" defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save Preferences</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your password and security preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input id="confirm-password" type="password" />
                    </div>

                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">
                        Two-Factor Authentication
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">
                            Two-factor authentication is not enabled yet.
                          </p>
                          <p className="text-xs text-gray-500">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Update Password</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="storage">
                <div className="space-y-6">
                  <StorageOptimizer />

                  <Card>
                    <CardHeader>
                      <CardTitle>Storage Structure</CardTitle>
                      <CardDescription>
                        Information about how your data is stored for optimal
                        performance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border rounded-md p-4">
                          <h3 className="text-sm font-medium mb-2">
                            Database Storage
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            The database stores metadata and extracted text,
                            which is relatively small:
                          </p>
                          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                            <li>Drawing numbers and identifiers</li>
                            <li>File paths and locations</li>
                            <li>Revision history and metadata</li>
                            <li>Extracted text for search functionality</li>
                            <li>User permissions and access controls</li>
                          </ul>
                        </div>

                        <div className="border rounded-md p-4">
                          <h3 className="text-sm font-medium mb-2">
                            Cloud Storage Bucket
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            The cloud storage bucket stores the actual drawing
                            files, which can be very large:
                          </p>
                          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                            <li>PDF drawings and documents</li>
                            <li>CAD files (DWG, DXF)</li>
                            <li>Image files (JPG, PNG)</li>
                            <li>Other large binary files</li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <h3 className="text-sm font-medium text-blue-800 mb-2">
                            Benefits of This Approach
                          </h3>
                          <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                            <li>
                              Faster database queries (not slowed down by large
                              binary data)
                            </li>
                            <li>More efficient storage utilization</li>
                            <li>
                              Better scalability for large document collections
                            </li>
                            <li>Improved performance for search operations</li>
                            <li>Cost-effective storage for large files</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="integrations">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>External Integrations</CardTitle>
                      <CardDescription>
                        Configure integrations with external services and tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border rounded-md p-4 hover:border-orange-200 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-50 rounded-md">
                                <Cog className="h-6 w-6 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="text-md font-medium">
                                  n8n Integration
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Configure authentication and webhooks for n8n
                                  workflow automation
                                </p>
                              </div>
                            </div>
                            <Link href="/dashboard/settings/n8n-settings">
                              <Button size="sm">Configure</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
}
