import { cn } from "@/lib/utils";
import kLogoImage from "@/assets/k-logo.png";
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
  X,
  Clock,
  Target,
  UserCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { useAuth } from "@/hooks/useAuth";
import { useDesignerProfile } from "@/hooks/useDesignerProfile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Public nav items visible to everyone
const publicNavItems = [
  { icon: Home, label: "Home", path: "/" },
];

// Designer nav items (authenticated users with profile)
const designerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Sparkles, label: "Co-create", path: "/shazam" },
  { icon: FolderKanban, label: "Collections", path: "/dashboard" },
];

// Admin-only nav items
const adminNavItems = [
  { icon: UserCheck, label: "Internal Onboarding", path: "/onboarding2" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const { isSuperAdmin, isAuthenticated, signOut } = useAuth();
  const { hasProfile, profile } = useDesignerProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/");
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  // Build nav items based on auth/profile status
  const visibleNavItems = [
    ...publicNavItems,
    ...(isAuthenticated && hasProfile ? designerNavItems : []),
    ...(isSuperAdmin ? adminNavItems : []),
  ];

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
            <div className="animate-fade-in flex items-center gap-3">
              {/* K logo in white container with red circle border */}
              <div className="w-14 h-14 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-md">
                <img 
                  src={kLogoImage} 
                  alt="Kuester Design Logo" 
                  className="h-8 object-contain"
                />
              </div>
              {/* Brand text */}
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground tracking-tight">Kuester</span>
                <span className="text-sm text-primary font-medium -mt-1">Design</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-md">
              <img 
                src={kLogoImage} 
                alt="Kuester Design Logo" 
                className="h-5 object-contain"
              />
            </div>
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
            {visibleNavItems.map((item) => (
              <li key={item.label}>
                <SidebarNavItem
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed && !mobileOpen}
                  onClick={onMobileClose}
                  path={item.path}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign In/Out */}
        <div className="p-3 border-t border-sidebar-border">
          {isAuthenticated ? (
            <SidebarNavItem
              icon={LogOut}
              label="Cerrar Sesión"
              collapsed={collapsed && !mobileOpen}
              onClick={handleSignOut}
            />
          ) : (
            <SidebarNavItem
              icon={User}
              label="Sign In"
              collapsed={collapsed && !mobileOpen}
              onClick={handleSignIn}
            />
          )}
        </div>
      </aside>
    </>
  );
}
