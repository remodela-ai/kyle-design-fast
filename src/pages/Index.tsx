import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Canvas } from "@/components/Canvas";

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Canvas />
    </div>
  );
};

export default Index;
