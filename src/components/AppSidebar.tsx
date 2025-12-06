import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  LayoutDashboard,
  FolderKanban,
  Heart,
  CreditCard,
  HelpCircle,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Heart, label: "Collections" },
  { icon: CreditCard, label: "Billing" },
  { icon: HelpCircle, label: "Help" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="icon"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-border bg-card shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-red-subtle">
          <span className="text-primary-foreground font-bold text-lg">K</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <span className="text-xs text-muted-foreground block">AI Design-OS</span>
            <span className="text-xl font-semibold text-primary">küster</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        {!collapsed && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-4 block">
            Navigation
          </span>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  item.active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", item.active && "text-primary")} />
                {!collapsed && (
                  <span className="animate-fade-in font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sign In */}
      <div className="p-3 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary hover:bg-sidebar-accent transition-colors">
          <User className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="animate-fade-in font-medium">Sign In</span>}
        </button>
      </div>
    </aside>
  );
}
