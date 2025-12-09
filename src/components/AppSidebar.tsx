import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";
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
  Menu,
  X,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

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
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside
        className={cn(
          "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out relative z-50",
          // Desktop
          "hidden md:flex",
          collapsed ? "md:w-20" : "md:w-64",
          // Mobile
          mobileOpen && "fixed inset-y-0 left-0 flex w-64"
        )}
      >
        {/* Mobile close button */}
        <Button
          variant="icon"
          size="icon"
          onClick={onMobileClose}
          className="absolute right-3 top-6 z-10 h-8 w-8 rounded-full md:hidden"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Desktop Toggle Button */}
        <Button
          variant="icon"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-border bg-card shadow-lg hidden md:flex"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Logo */}
        <div className="p-6 flex flex-col items-center">
          {(!collapsed || mobileOpen) ? (
            <div className="animate-fade-in flex flex-col items-center">
              <img 
                src={logoImage} 
                alt="Next Interiors Logo" 
                className="h-20 object-contain glow-red-subtle"
              />
              <span className="text-xs text-muted-foreground mt-2">Full Stack AI Interior Design</span>
            </div>
          ) : (
            <img 
              src={logoImage} 
              alt="Next Interiors Logo" 
              className="w-12 h-12 object-contain rounded-lg glow-red-subtle"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          {(!collapsed || mobileOpen) && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-4 block">
              Navigation
            </span>
          )}
          <ul className="space-y-1">
          {navItems.map((item) => (
              <li key={item.label}>
                <SidebarNavItem
                  icon={item.icon}
                  label={item.label}
                  active={item.active}
                  collapsed={collapsed && !mobileOpen}
                  onClick={onMobileClose}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign In */}
        <div className="p-3 border-t border-sidebar-border">
          <SidebarNavItem
            icon={User}
            label="Sign In"
            collapsed={collapsed && !mobileOpen}
          />
        </div>
      </aside>
    </>
  );
}
