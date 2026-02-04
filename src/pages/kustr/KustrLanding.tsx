import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, Users, Briefcase, TrendingUp, Palette, MapPin, Sparkles } from 'lucide-react';

const KustrLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage your team members, roles, and collaboration across your design studio.',
    },
    {
      icon: Briefcase,
      title: 'Project Portfolio',
      description: 'Track all your design projects from initial concept to final delivery.',
    },
    {
      icon: TrendingUp,
      title: 'Marketing Hub',
      description: 'Create and schedule posts across all social media platforms.',
    },
    {
      icon: MapPin,
      title: 'Multi-Location',
      description: 'Manage multiple office locations with dedicated teams and resources.',
    },
    {
      icon: Palette,
      title: 'Client Management',
      description: 'Keep track of your clients, projects, and communication history.',
    },
    {
      icon: Sparkles,
      title: 'Vendor Network',
      description: 'Organize your material vendors, service providers, and strategic partners.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-8 shadow-2xl shadow-primary/25">
              <Building2 className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Design Studio Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              The all-in-one management platform for interior design studios. 
              Manage your office, team, projects, and marketing in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="px-8"
                onClick={() => navigate('/kustr/auth')}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/kustr/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">Platform Features</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Everything you need to run a successful interior design studio
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to streamline your studio?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Create your design studio profile and start managing your team, 
            projects, and marketing efforts today.
          </p>
          <Button
            size="lg"
            className="px-8"
            onClick={() => navigate('/kustr/auth')}
          >
            Create Your Studio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Building2 className="h-5 w-5" />
            <span>Design Studio Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KustrLanding;
