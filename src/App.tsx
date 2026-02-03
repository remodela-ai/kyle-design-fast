import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { KyleProvider } from "@/contexts/KyleContext";
import { DesignerProfileProvider } from "@/contexts/DesignerProfileContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DesignerRoute from "@/components/DesignerRoute";
import OnboardingRoute from "@/components/OnboardingRoute";
import Index from "./pages/Index";
import BlinkDesign from "./pages/BlinkDesign";
import Shazam from "./pages/Shazam";
import CreateAgent from "./pages/CreateAgent";
import FreeProject360 from "./pages/FreeProject360";
import DesignReview from "./pages/DesignReview";
import Productivity from "./pages/Productivity";
import DailyNextInteriors from "./pages/DailyNextInteriors";
import DailyOrielCarlos from "./pages/DailyOrielCarlos";
import GTMAnalytics from "./pages/GTMAnalytics";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DesignerOnboarding from "./pages/DesignerOnboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DesignerProfileProvider>
          <KyleProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/blink-design" element={<BlinkDesign />} />
              <Route path="/shazam" element={<Shazam />} />
              <Route path="/create-agent" element={<CreateAgent />} />
              <Route path="/360-free-project" element={<FreeProject360 />} />
              <Route path="/design-review" element={<DesignReview />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/designer-onboarding" element={<OnboardingRoute><DesignerOnboarding /></OnboardingRoute>} />
              
              {/* Designer routes - require auth + profile */}
              <Route path="/dashboard" element={<DesignerRoute><Dashboard /></DesignerRoute>} />
              
              {/* Protected routes - Super Admin only */}
              <Route path="/productivity" element={<ProtectedRoute><Productivity /></ProtectedRoute>} />
              <Route path="/daily-next-interiors" element={<ProtectedRoute><DailyNextInteriors /></ProtectedRoute>} />
              <Route path="/daily-oriel-carlos" element={<ProtectedRoute><DailyOrielCarlos /></ProtectedRoute>} />
              <Route path="/gtm-analytics" element={<ProtectedRoute><GTMAnalytics /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </KyleProvider>
        </DesignerProfileProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
