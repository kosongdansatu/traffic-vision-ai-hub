
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  // This would come from authentication context in a real app
  const username = "Demo User";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Header username={username} />
        <main className="container mx-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
