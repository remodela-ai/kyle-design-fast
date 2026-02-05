import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, Users, Briefcase, TrendingUp, Palette, FileText, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const KustrLanding = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Team & Locations',
      description: 'Manage team members across offices.',
    },
    {
      icon: Briefcase,
      title: 'Project Portfolio',
      description: 'Track projects from concept to delivery.',
    },
    {
      icon: TrendingUp,
      title: 'Marketing Hub',
      description: 'Schedule posts across platforms.',
    },
    {
      icon: FileText,
      title: 'Proposals & Contracts',
      description: 'Generate and track agreements.',
    },
    {
      icon: Palette,
      title: 'Client Management',
      description: 'Track clients and communication.',
    },
    {
      icon: Sparkles,
      title: 'Vendor Network',
      description: 'Organize vendors and partners.',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section - Compact */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-4 shadow-xl shadow-primary/25">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Next Kuester Design Platform
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto mb-5">
              The all-in-one management platform for interior design studios.
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                size="default"
                className="px-6"
                onClick={() => navigate(isLoggedIn ? '/kustr-next/dashboard' : '/kustr-next/auth')}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!isLoggedIn && (
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => navigate('/kustr-next/auth')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Compact Grid */}
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-xl font-bold text-foreground text-center mb-1">Platform Features</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Everything you need to run a successful studio
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Minimal */}
      <footer className="border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Next Kuester Design Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KustrLanding;
