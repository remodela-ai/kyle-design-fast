import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, MapPin, Users, Briefcase, TrendingUp } from 'lucide-react';

const KustrLanding = () => {
  const navigate = useNavigate();

  const offices = [
    { name: 'New York', location: 'New York, NY', image: '🗽' },
    { name: 'Arizona', location: 'Phoenix, AZ', image: '🌵' },
    { name: 'Wisconsin', location: 'Milwaukee, WI', image: '🏔️' },
  ];

  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage your team members, roles, and collaboration across your office.',
    },
    {
      icon: Briefcase,
      title: 'Project Portfolio',
      description: 'Track all your design projects from planning to completion.',
    },
    {
      icon: TrendingUp,
      title: 'Marketing Hub',
      description: 'Create and schedule posts across all social media platforms.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-8 shadow-2xl shadow-amber-500/25">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Kustr Design
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Interior design excellence across three locations. 
              Manage your office, team, projects, and marketing all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8"
                onClick={() => navigate('/kustr/auth')}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => navigate('/kustr/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Offices Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Our Offices</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {offices.map((office) => (
            <div
              key={office.name}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-colors"
            >
              <div className="text-6xl mb-4">{office.image}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{office.name}</h3>
              <div className="flex items-center justify-center text-slate-400">
                <MapPin className="h-4 w-4 mr-1" />
                {office.location}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Platform Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-amber-500/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-6">
                <feature.icon className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to streamline your office?
          </h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Join Kustr Design's management platform and take control of your projects,
            team, and marketing efforts.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8"
            onClick={() => navigate('/kustr/auth')}
          >
            Start Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <Building2 className="h-5 w-5" />
            <span>© 2025 Kustr Design. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KustrLanding;
