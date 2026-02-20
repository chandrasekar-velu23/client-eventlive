import React, { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-primary transition-colors duration-300 overflow-x-hidden">
      {/* Sidebar: fixed overlay on mobile, fixed column on desktop */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        collapsed={collapsed}
      />

      {/* Main content: full-width on mobile, offset on desktop based on sidebar width */}
      <div
        className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out
          ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
      >
        <DashboardHeader
          setIsOpen={setIsSidebarOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <main className="flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-8 animate-fade-in">
          <div className="mx-auto max-w-7xl w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}