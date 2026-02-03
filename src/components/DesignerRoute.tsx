import { Navigate } from 'react-router-dom';
import { useDesignerProfileContext } from '@/contexts/DesignerProfileContext';
import { Loader2 } from 'lucide-react';

interface DesignerRouteProps {
  children: React.ReactNode;
}

const DesignerRoute = ({ children }: DesignerRouteProps) => {
  const { loading, hasProfile, needsOnboarding } = useDesignerProfileContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsOnboarding || !hasProfile) {
    return <Navigate to="/designer-onboarding" replace />;
  }

  return <>{children}</>;
};

export default DesignerRoute;
