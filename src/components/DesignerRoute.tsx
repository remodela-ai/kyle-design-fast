import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDesignerProfile } from '@/hooks/useDesignerProfile';
import { Loader2 } from 'lucide-react';

interface DesignerRouteProps {
  children: React.ReactNode;
}

const DesignerRoute = ({ children }: DesignerRouteProps) => {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { loading: profileLoading, hasProfile, needsOnboarding } = useDesignerProfile();

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

  if (needsOnboarding) {
    return <Navigate to="/designer-onboarding" replace />;
  }

  if (!hasProfile) {
    return <Navigate to="/designer-onboarding" replace />;
  }

  return <>{children}</>;
};

export default DesignerRoute;
