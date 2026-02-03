import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDesignerProfileContext } from '@/contexts/DesignerProfileContext';
import { Loader2 } from 'lucide-react';

interface OnboardingRouteProps {
  children: React.ReactNode;
}

/**
 * Route wrapper for designer onboarding.
 * - If not authenticated: redirect to /auth
 * - If already has profile: redirect to /dashboard
 * - Otherwise: show onboarding
 */
const OnboardingRoute = ({ children }: OnboardingRouteProps) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loading: profileLoading, hasProfile } = useDesignerProfileContext();

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If user already has a profile, redirect to dashboard
  if (hasProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default OnboardingRoute;
