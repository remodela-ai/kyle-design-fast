 import { useState } from "react";
 import { AppSidebar } from "./AppSidebar";
 import { Button } from "./ui/button";
 import { Menu } from "lucide-react";
 
 interface GlobalLayoutProps {
   children: React.ReactNode;
 }
 
 export function GlobalLayout({ children }: GlobalLayoutProps) {
   const [collapsed, setCollapsed] = useState(false);
   const [mobileOpen, setMobileOpen] = useState(false);
 
   return (
     <div className="flex min-h-screen w-full bg-background">
       {/* Sidebar */}
       <AppSidebar
         collapsed={collapsed}
         onToggle={() => setCollapsed(!collapsed)}
         mobileOpen={mobileOpen}
         onMobileClose={() => setMobileOpen(false)}
       />
 
       {/* Main content area */}
       <div className="flex-1 flex flex-col min-h-screen">
         {/* Mobile header with menu button */}
         <header className="md:hidden flex items-center p-4 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
           <Button
             variant="ghost"
             size="icon"
             onClick={() => setMobileOpen(true)}
             className="mr-3"
           >
             <Menu className="h-5 w-5" />
           </Button>
           <span className="font-semibold text-foreground">Kuester Design</span>
         </header>
 
         {/* Page content */}
         <main className="flex-1">
           {children}
         </main>
       </div>
     </div>
   );
 }