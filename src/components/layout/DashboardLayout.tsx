import React, { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
// import { Outlet } from "react-router-dom";
import { NotificationProvider } from "../../context/NotificationContext";

// import { useNavigate } from "react-router-dom";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-bg-secondary transition-colors duration-300">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          <DashboardHeader
            setIsOpen={setIsSidebarOpen}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in-up">
            <div className="mx-auto max-w-7xl space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}