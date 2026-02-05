import { cn } from "@/lib/utils";
import kLogoImage from "@/assets/k-logo.png";
import { Button } from "@/components/ui/button";
import {
  Home,
  LayoutDashboard,
  FolderKanban,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  LogOut,
  Sparkles,
  Building2,
  MessageSquare,
  FileText,
  BarChart3,
  Code,
  Settings,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { useAuth } from "@/hooks/useAuth";
import { useDesignerProfile } from "@/hooks/useDesignerProfile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Public nav items visible to everyone
const publicNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Kyle AI", path: "/kyle" },
  { icon: Sparkles, label: "Kitchen Design", path: "/start" },
];

// Designer nav items (authenticated users with profile)
const designerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Sparkles, label: "Co-create", path: "/shazam" },
  { icon: FolderKanban, label: "Projects", path: "/dashboard" },
];

// Kustr Design routes
const kustrNavItems = [
  { icon: Building2, label: "Design Studio", path: "/kustr" },
  { icon: BarChart3, label: "Leads", path: "/kustr/leads" },
  { icon: FileText, label: "Analytics", path: "/kustr/analytics" },
  { icon: Code, label: "Embed Widget", path: "/kustr/embed" },
];

// Admin-only nav items
const adminNavItems = [
  { icon: UserCheck, label: "Legacy Onboarding", path: "/onboarding2" },
  { icon: FileText, label: "Documentation", path: "/documentation" },
  { icon: Settings, label: "Backlog", path: "/backlog" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const { isSuperAdmin, isAuthenticated, signOut, user } = useAuth();
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

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
          "hidden md:flex",
          collapsed ? "md:w-20" : "md:w-64",
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
              <div className="w-14 h-14 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-md">
                <img 
                  src={kLogoImage} 
                  alt="Kuester Design Logo" 
                  className="h-8 object-contain"
                />
              </div>
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
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Main Navigation */}
          {(!collapsed || mobileOpen) && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-4 block">
              Navigation
            </span>
          )}
          <ul className="space-y-1">
            {publicNavItems.map((item) => (
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

          {/* Designer Routes */}
          {isAuthenticated && hasProfile && (
            <>
              {(!collapsed || mobileOpen) && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-4 mt-6 block">
                  Designer
                </span>
              )}
              <ul className="space-y-1">
                {designerNavItems.map((item) => (
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
            </>
          )}

          {/* Kustr Design Routes */}
          {(!collapsed || mobileOpen) && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-4 mt-6 block">
              Design Studio
            </span>
          )}
          <ul className="space-y-1">
            {kustrNavItems.map((item) => (
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

          {/* Admin Routes */}
          {isSuperAdmin && (
            <>
              {(!collapsed || mobileOpen) && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-4 mt-6 block">
                  Admin
                </span>
              )}
              <ul className="space-y-1">
                {adminNavItems.map((item) => (
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
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          {/* User Info */}
          {isAuthenticated && (!collapsed || mobileOpen) && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.display_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isSuperAdmin ? 'Super Admin' : 'Member'}
                </p>
              </div>
            </div>
          )}
          
          {/* Collapsed user avatar */}
          {isAuthenticated && collapsed && !mobileOpen && (
            <div className="flex justify-center mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {isAuthenticated ? (
            <SidebarNavItem
              icon={LogOut}
              label="Sign Out"
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
