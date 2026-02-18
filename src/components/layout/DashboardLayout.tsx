import React, { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
// import { Outlet } from "react-router-dom";
import { NotificationProvider } from "../../context/NotificationContext";

// import { useNavigate } from "react-router-dom";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-bg-primary transition-colors duration-300">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out lg:pl-64">
          <DashboardHeader
            setIsOpen={setIsSidebarOpen}
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