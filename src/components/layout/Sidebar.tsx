
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  UploadCloud,
  BarChartHorizontal,
  Clock,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div
      className={cn(
        "h-screen bg-sidebar fixed left-0 top-0 z-50 flex flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-sidebar-foreground">Traffic Vision</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <div className="mt-4 flex flex-col space-y-1 px-2">
        <SidebarItem
          icon={<Home className="h-5 w-5" />}
          label="Dashboard"
          to="/dashboard"
          collapsed={collapsed}
          active={isActive("/dashboard")}
        />
        <SidebarItem
          icon={<UploadCloud className="h-5 w-5" />}
          label="Upload Video"
          to="/upload"
          collapsed={collapsed}
          active={isActive("/upload")}
        />
        <SidebarItem
          icon={<BarChartHorizontal className="h-5 w-5" />}
          label="Analytics"
          to="/analytics"
          collapsed={collapsed}
          active={isActive("/analytics")}
        />
        <SidebarItem
          icon={<Clock className="h-5 w-5" />}
          label="History"
          to="/history"
          collapsed={collapsed}
          active={isActive("/history")}
        />
        <SidebarItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          to="/settings"
          collapsed={collapsed}
          active={isActive("/settings")}
        />
      </div>

      <div className="mt-auto mb-4 px-2">
        <SidebarItem
          icon={<LogOut className="h-5 w-5" />}
          label="Logout"
          to="/logout"
          collapsed={collapsed}
          active={false}
        />
      </div>
    </div>
  );
};

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
  collapsed: boolean;
  active: boolean;
};

const SidebarItem = ({ icon, label, to, collapsed, active }: SidebarItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center rounded-md px-3 py-2 transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <div className="mr-2">{icon}</div>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

export default Sidebar;
