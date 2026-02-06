import { cn } from "@/lib/utils";
import kLogoImage from "@/assets/k-logo.png";
import { Button } from "@/components/ui/button";
import {
  User,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Sparkles,
  FileText,
  BarChart3,
  Code,
  Settings,
  Megaphone,
  Users,
  Palette,
  FolderKanban,
  Package,
  HardHat,
  Bot,
  ExternalLink,
  Calendar,
  CreditCard,
  Mail,
  FileSignature,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { useAuth } from "@/hooks/useAuth";
import { useDesignerProfile } from "@/hooks/useDesignerProfile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ═══════════════════════════════════════════════════════════════════════════
// CAPA 1 - Kyle (Central Orchestrator)
// El punto de entrada único. Interfaz, memoria, router y supervisor.
// ═══════════════════════════════════════════════════════════════════════════
const kyleNavItems = [
  { icon: Bot, label: "Kyle Home", path: "/kustr-next", description: "Centro de comando" },
  { icon: Sparkles, label: "Kyle Voice", path: "/shazam", description: "Diseño por voz" },
];

// ═══════════════════════════════════════════════════════════════════════════
// CAPA 2 - Journeys (6 Macro-flujos de negocio)
// Flujos completos activados por Kyle según contexto e intención del usuario.
// Cada Journey contiene múltiples micro-agentes especializados (Capa 3).
// ═══════════════════════════════════════════════════════════════════════════
const journeyNavItems = [
  { icon: Megaphone, label: "Marketing", path: "/marketing", status: "active", agents: 3 },
  { icon: Users, label: "Sales", path: "/kustr-next/leads", status: "active", agents: 4 },
  { icon: Palette, label: "Design", path: "/dashboard", status: "active", agents: 5 },
  { icon: FolderKanban, label: "Project Mgmt", path: "/project", status: "coming", agents: 0 },
  { icon: Package, label: "Procurement", path: "/procurement", status: "coming", agents: 0 },
  { icon: HardHat, label: "Execution", path: "/execution", status: "coming", agents: 0 },
];

// Sales Funnel - Sub-routes del Journey de Sales
const salesFunnelItems = [
  { icon: Users, label: "Leads", path: "/kustr-next/leads" },
  { icon: FileSignature, label: "Proposals", path: "/kustr-next/proposal" },
  { icon: Calendar, label: "Appointments", path: "/kustr-next/appointments" },
  { icon: Mail, label: "Nurturing", path: "/kustr-next/nurturing" },
  { icon: CreditCard, label: "Payments", path: "/kustr-next/payments" },
];

// Operations & Analytics
const operationsNavItems = [
  { icon: BarChart3, label: "Analytics", path: "/kustr-next/analytics" },
  { icon: Code, label: "Embed Widget", path: "/kustr-next/embed" },
];

// Public Landings
const landingNavItems = [
  { icon: ExternalLink, label: "Kitchen", path: "/kitchen" },
  { icon: ExternalLink, label: "Bathroom", path: "/bathroom" },
];

// Admin-only nav items
const adminNavItems = [
  { icon: FileText, label: "Docs", path: "/documentation" },
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
        {/* CAPA 1 - Kyle (Orquestador Central) */}
          {(!collapsed || mobileOpen) && (
            <span className="text-xs text-primary font-semibold uppercase tracking-wider px-3 mb-2 block flex items-center gap-2">
              <Bot className="h-3 w-3" /> Capa 1 · Kyle
            </span>
          )}
          <ul className="space-y-1 mb-4 bg-primary/5 rounded-lg p-2">
            {kyleNavItems.map((item) => (
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

          {/* CAPA 2 - Journeys (Macro-flujos de negocio) */}
          {(!collapsed || mobileOpen) && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
              Capa 2 · Journeys
            </span>
          )}
          <ul className="space-y-1 mb-4">
            {journeyNavItems.map((item) => (
              <li key={item.label} className="relative">
                <SidebarNavItem
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed && !mobileOpen}
                  onClick={item.status === "active" ? onMobileClose : undefined}
                  path={item.status === "active" ? item.path : undefined}
                />
                {!collapsed && (
                  <span className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded",
                    item.status === "coming" 
                      ? "text-muted-foreground bg-muted" 
                      : "text-primary bg-primary/10"
                  )}>
                    {item.status === "coming" ? "Soon" : `${item.agents} agents`}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Sales Funnel - Expandido del Journey Sales */}
          {isAuthenticated && hasProfile && (
            <>
              {(!collapsed || mobileOpen) && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
                  Sales Funnel
                </span>
              )}
              <ul className="space-y-1 mb-4">
                {salesFunnelItems.map((item) => (
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

          {/* Operations & Analytics */}
          {isAuthenticated && hasProfile && (
            <>
              {(!collapsed || mobileOpen) && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
                  Operations
                </span>
              )}
              <ul className="space-y-1 mb-4">
                {operationsNavItems.map((item) => (
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

          {/* Public Landings */}
          {(!collapsed || mobileOpen) && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
              Landings
            </span>
          )}
          <ul className="space-y-1 mb-4">
            {landingNavItems.map((item) => (
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
                <span className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
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
