import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useKustrOffice } from '@/contexts/KustrOfficeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, Building2, Users, Briefcase, DollarSign, 
  FolderOpen, TrendingUp, Calendar, LogOut,
  UserPlus, Building, Truck, Handshake, Megaphone
} from 'lucide-react';

interface DashboardStats {
  activeProjects: number;
  totalClients: number;
  teamMembers: number;
  monthlyBudget: number;
}

const KustrDashboard = () => {
  const navigate = useNavigate();
  const { signOut, isAuthenticated, loading: authLoading } = useAuth();
  const { 
    office, 
    teamMember, 
    userRole, 
    hasCompletedOnboarding, 
    loading: officeLoading,
    isManagingPartner 
  } = useKustrOffice();

  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    totalClients: 0,
    teamMembers: 0,
    monthlyBudget: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Redirect if not authenticated or not onboarded
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/kustr/auth');
      return;
    }
    if (!officeLoading && isAuthenticated) {
      if (!userRole || !hasCompletedOnboarding) {
        navigate('/kustr/onboarding');
      }
    }
  }, [authLoading, officeLoading, isAuthenticated, userRole, hasCompletedOnboarding, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!office?.id) return;

      try {
        const [projectsRes, clientsRes, teamRes, budgetRes] = await Promise.all([
          supabase
            .from('kustr_projects')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', office.id)
            .in('status', ['planning', 'in_progress', 'review']),
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', office.id)
            .eq('status', 'active'),
          supabase
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', office.id)
            .eq('is_active', true),
          supabase
            .from('marketing_budgets')
            .select('total_budget')
            .eq('office_id', office.id)
            .gte('month', new Date().toISOString().slice(0, 7) + '-01')
            .lte('month', new Date().toISOString().slice(0, 7) + '-31')
            .maybeSingle(),
        ]);

        setStats({
          activeProjects: projectsRes.count || 0,
          totalClients: clientsRes.count || 0,
          teamMembers: teamRes.count || 0,
          monthlyBudget: budgetRes.data?.total_budget || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [office?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/kustr/auth');
  };

  if (authLoading || officeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const quickActions = [
    { icon: UserPlus, label: 'Add Team Member', href: '/kustr/team', color: 'bg-blue-500' },
    { icon: Building, label: 'Add Client', href: '/kustr/clients', color: 'bg-green-500' },
    { icon: FolderOpen, label: 'New Project', href: '/kustr/projects', color: 'bg-purple-500' },
    { icon: Megaphone, label: 'Create Post', href: '/kustr/marketing', color: 'bg-pink-500' },
  ];

  const navItems = [
    { icon: Users, label: 'Team', href: '/kustr/team' },
    { icon: Building, label: 'Clients', href: '/kustr/clients' },
    { icon: Truck, label: 'Providers', href: '/kustr/providers' },
    { icon: Briefcase, label: 'Vendors', href: '/kustr/vendors' },
    { icon: Handshake, label: 'Alliances', href: '/kustr/alliances' },
    { icon: FolderOpen, label: 'Projects', href: '/kustr/projects' },
    { icon: Megaphone, label: 'Marketing', href: '/kustr/marketing' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Kustr Design</h1>
                <p className="text-sm text-slate-400">{office?.name} Office</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-amber-500/50">
                  <AvatarImage src={teamMember?.avatar_url || ''} />
                  <AvatarFallback className="bg-slate-700 text-white">
                    {teamMember?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{teamMember?.display_name}</p>
                  <p className="text-xs text-slate-400">{teamMember?.title}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {teamMember?.display_name?.split(' ')[0]}!
          </h2>
          <p className="text-slate-400 mt-1">
            Here's what's happening at your {office?.name} office today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Projects</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {loadingStats ? '-' : stats.activeProjects}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Clients</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {loadingStats ? '-' : stats.totalClients}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Building className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Team Members</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {loadingStats ? '-' : stats.teamMembers}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Marketing Budget</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {loadingStats ? '-' : `$${stats.monthlyBudget.toLocaleString()}`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-400">
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 border-slate-600 hover:bg-slate-700 hover:border-amber-500/50"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-slate-300">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Grid */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Office Management</CardTitle>
            <CardDescription className="text-slate-400">
              Access all areas of your office
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-slate-700/50 border border-slate-700 hover:border-amber-500/50"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-8 w-8 text-slate-400" />
                  <span className="text-slate-300">{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default KustrDashboard;
