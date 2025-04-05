"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import {
  Home,
  FileText,
  Brain,
  PenTool,
  Trash2,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Cog,
} from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  subItems?: SidebarItem[];
}

export default function DashboardSidebar({
  activeTab = "home",
}: {
  activeTab?: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-expand on hover, collapse when mouse leaves
  useEffect(() => {
    if (isHovering && isCollapsed) {
      setIsCollapsed(false);
      // Notify layout that sidebar has expanded
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sidebar-expand"));
      }
    } else if (!isHovering && !isCollapsed && !isManuallyExpanded) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
        // Notify layout that sidebar has collapsed
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("sidebar-collapse"));
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isHovering]);

  // Track if user manually expanded the sidebar
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

  const handleManualToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    setIsManuallyExpanded(!newState);

    // Notify layout of sidebar state change
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(newState ? "sidebar-collapse" : "sidebar-expand"),
      );
    }
  };

  const sidebarItems: SidebarItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Dashboard",
      href: "/dashboard",
      active: activeTab === "home",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Documents",
      href: "/dashboard/documents",
      active: activeTab === "documents",
    },
    {
      icon: <Brain className="h-5 w-5" />,
      label: "AI Experts",
      href: "/dashboard/ai-assistance",
      active: activeTab === "ai-assistance",
    },
    {
      icon: <PenTool className="h-5 w-5" />,
      label: "AI Drawings",
      href: "/dashboard/ai-drawings",
      active: activeTab === "ai-drawings",
    },
    {
      icon: <Trash2 className="h-5 w-5" />,
      label: "Recycle Bin",
      href: "/dashboard/recycle-bin",
      active: activeTab === "recycle-bin",
    },
    {
      icon: <Bookmark className="h-5 w-5" />,
      label: "Quick Access",
      href: "/dashboard/quick-access",
      active: activeTab === "quick-access",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/dashboard/settings",
      active: activeTab === "settings" || activeTab === "n8n-settings",
      subItems: [
        {
          icon: <Cog className="h-4 w-4" />,
          label: "n8n Integration",
          href: "/dashboard/settings/n8n-settings",
          active: activeTab === "n8n-settings",
        },
      ],
    },
  ];

  return (
    <div
      className="h-screen fixed left-0 top-0 z-40"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={5} // Start collapsed by default
          minSize={5}
          maxSize={30}
          collapsible={true}
          collapsedSize={5}
          onCollapse={() => {
            setIsCollapsed(true);
            setIsManuallyExpanded(false);
            // Add a custom event to notify the layout that the sidebar has collapsed
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("sidebar-collapse"));
            }
          }}
          onExpand={() => {
            setIsCollapsed(false);
            setIsManuallyExpanded(true);
            // Add a custom event to notify the layout that the sidebar has expanded
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("sidebar-expand"));
            }
          }}
          className={cn(
            "bg-white border-r border-gray-200 h-screen transition-all duration-300 shadow-md sidebar-panel",
            isCollapsed ? "w-[60px]" : "w-[240px]",
          )}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              {!isCollapsed && (
                <h2 className="text-lg font-semibold text-gray-800">
                  Tsameem.AI
                </h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleManualToggle}
                className="h-8 w-8"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            <nav className="space-y-1 flex-1">
              {sidebarItems.map((item, index) => (
                <div key={index}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      item.active
                        ? "bg-orange-100 text-orange-600"
                        : "text-gray-600 hover:bg-gray-100",
                      isCollapsed && "justify-center px-0",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center",
                        item.active ? "text-orange-600" : "text-gray-500",
                      )}
                    >
                      {item.icon}
                    </div>
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>

                  {/* Render sub-items if they exist and parent is active and sidebar is expanded */}
                  {!isCollapsed && item.subItems && item.active && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={`${index}-${subIndex}`}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                            subItem.active
                              ? "bg-orange-50 text-orange-600"
                              : "text-gray-600 hover:bg-gray-100",
                          )}
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between px-3 mb-4">
                {!isCollapsed && (
                  <span className="text-sm text-gray-600">Theme</span>
                )}
                <ThemeToggle />
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 w-full",
                    isCollapsed && "justify-center px-0",
                  )}
                >
                  <LogOut className="h-5 w-5 text-gray-500" />
                  {!isCollapsed && <span>Sign Out</span>}
                </button>
              </form>

              {!isCollapsed && (
                <div className="text-xs text-gray-500 mt-4 px-3">
                  Tsameem.AI © 2024
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
