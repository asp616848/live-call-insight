import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { CustomCursor } from "@/components/CustomCursor";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      {/* Full viewport height; hide global overflow, let main scroll */}
      <div className="flex h-screen w-screen bg-background overflow-hidden">
        <CustomCursor />
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        {/* Scroll only the right content */}
        <main className="flex-1 h-full overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
