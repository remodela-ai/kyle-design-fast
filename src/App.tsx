import { Toaster } from "@/components/ui/toaster";
import Backlog from "./pages/Backlog";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { KyleProvider } from "@/contexts/KyleContext";
import { DesignerProfileProvider } from "@/contexts/DesignerProfileContext";
import { KustrOfficeProvider } from "@/contexts/KustrOfficeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DesignerRoute from "@/components/DesignerRoute";
import OnboardingRoute from "@/components/OnboardingRoute";
import { GlobalLayout } from "@/components/GlobalLayout";
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

// Kustr Design pages
import KustrLanding from "./pages/kustr/KustrLanding";
import KustrAuth from "./pages/kustr/KustrAuth";
import KustrOnboarding from "./pages/kustr/KustrOnboarding";
import KustrDashboard from "./pages/kustr/KustrDashboard";
import Leads from "./pages/kustr/Leads";
import LeadDetail from "./pages/kustr/LeadDetail";
import Proposal from "./pages/kustr/Proposal";
 import EmbedGenerator from "./pages/kustr/EmbedGenerator";
 import Analytics from "./pages/kustr/Analytics";

// Public Kyle page
import KylePublic from "./pages/KylePublic";
import KyleSocialLanding from "./pages/KyleSocialLanding";
 import Documentation from "./pages/Documentation";
 import Screenshots from "./pages/Screenshots";
 import TestIdeas from "./pages/TestIdeas";
 import { TestGuideFloating } from "./components/TestGuideFloating";
 import ProjectDetail from "./pages/ProjectDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DesignerProfileProvider>
          <KustrOfficeProvider>
            <KyleProvider>
              <GlobalLayout>
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
                   <Route path="/project/:sessionId" element={<DesignerRoute><ProjectDetail /></DesignerRoute>} />
                  
                  {/* Designer onboarding - main route */}
                  <Route path="/onboarding" element={<OnboardingRoute><DesignerOnboarding /></OnboardingRoute>} />
                  
                  {/* Kustr Design routes */}
                  <Route path="/kustr-next" element={<KustrLanding />} />
                  <Route path="/kustr-next/auth" element={<KustrAuth />} />
                  <Route path="/kustr-next/onboarding" element={<KustrOnboarding />} />
                  <Route path="/kustr-next/dashboard" element={<KustrDashboard />} />
                  <Route path="/kustr-next/leads" element={<Leads />} />
                  <Route path="/kustr-next/leads/:leadId" element={<LeadDetail />} />
                  <Route path="/kustr-next/leads/:leadId/proposal" element={<Proposal />} />
                  <Route path="/kustr-next/embed" element={<EmbedGenerator />} />
                  <Route path="/kustr-next/analytics" element={<Analytics />} />
                  
                  {/* Public Kyle widget */}
                  <Route path="/kyle" element={<KylePublic />} />
                  <Route path="/start" element={<KyleSocialLanding />} />
                  
                  {/* Backlog */}
                  <Route path="/backlog" element={<Backlog />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/screenshots" element={<Screenshots />} />
                  <Route path="/test" element={<TestIdeas />} />
                  
                  {/* Protected routes - Super Admin only */}
                  <Route path="/productivity" element={<ProtectedRoute><Productivity /></ProtectedRoute>} />
                  <Route path="/daily-next-interiors" element={<ProtectedRoute><DailyNextInteriors /></ProtectedRoute>} />
                  <Route path="/daily-oriel-carlos" element={<ProtectedRoute><DailyOrielCarlos /></ProtectedRoute>} />
                  <Route path="/gtm-analytics" element={<ProtectedRoute><GTMAnalytics /></ProtectedRoute>} />
                  <Route path="/onboarding2" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <TestGuideFloating />
              </GlobalLayout>
            </KyleProvider>
          </KustrOfficeProvider>
        </DesignerProfileProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
