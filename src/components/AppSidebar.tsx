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
  X,
  Clock,
  Target,
  UserCheck,
  LogOut,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Public nav items visible to everyone
const publicNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FolderKanban, label: "Projects", path: "/" },
  { icon: Heart, label: "Collections", path: "/" },
  { icon: CreditCard, label: "Billing", path: "/" },
  { icon: HelpCircle, label: "Help", path: "/" },
];

// Admin-only nav items
const adminNavItems = [
  { icon: Clock, label: "Productivity", path: "/productivity" },
  { icon: Target, label: "Daily GTM", path: "/daily-next-interiors" },
  { icon: Target, label: "Daily O-C", path: "/daily-oriel-carlos" },
  { icon: UserCheck, label: "Onboarding", path: "/onboarding" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const { isSuperAdmin, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Sesión cerrada" });
    navigate("/");
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  // Combine nav items based on auth status
  const visibleNavItems = isSuperAdmin 
    ? [...adminNavItems, ...publicNavItems]
    : publicNavItems;

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
