import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { KyleProvider } from "@/contexts/KyleContext";
import Index from "./pages/Index";
import BlinkDesign from "./pages/BlinkDesign";
import Shazam from "./pages/Shazam";
import CreateAgent from "./pages/CreateAgent";
import FreeProject360 from "./pages/FreeProject360";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <KyleProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/blink-design" element={<BlinkDesign />} />
            <Route path="/shazam" element={<Shazam />} />
            <Route path="/create-agent" element={<CreateAgent />} />
            <Route path="/360-free-project" element={<FreeProject360 />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </KyleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
