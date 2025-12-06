import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  to?: string;
  collapsed?: boolean;
  onClick?: () => void;
}

export function SidebarNavItem({ icon: Icon, label, to, collapsed, onClick }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = to ? location.pathname === to : false;

  const content = (
    <>
      <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
      {!collapsed && (
        <span className="animate-fade-in font-medium">{label}</span>
      )}
    </>
  );

  const className = cn(
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
    isActive
      ? "bg-sidebar-accent text-primary"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
