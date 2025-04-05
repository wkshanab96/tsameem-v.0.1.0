"use client";

import { useEffect, useState } from "react";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    // Listen for sidebar expand/collapse events
    const handleSidebarExpand = () => setIsSidebarExpanded(true);
    const handleSidebarCollapse = () => setIsSidebarExpanded(false);

    window.addEventListener("sidebar-expand", handleSidebarExpand);
    window.addEventListener("sidebar-collapse", handleSidebarCollapse);

    // Initial state is collapsed (false), event listeners will handle changes
    // Removed unreliable initial width check here

    return () => {
      window.removeEventListener("sidebar-expand", handleSidebarExpand);
      window.removeEventListener("sidebar-collapse", handleSidebarCollapse);
    };
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${isSidebarExpanded ? "ml-[240px] w-[calc(100%-240px)]" : "ml-[60px] w-[calc(100%-60px)]"} overflow-x-hidden h-screen`}
    >
      <div className="max-w-full h-full overflow-y-auto">{children}</div>
    </div>
  );
}
