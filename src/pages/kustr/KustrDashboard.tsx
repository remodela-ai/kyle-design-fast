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
  FolderOpen, LogOut, UserPlus, Building, Truck, 
  Handshake, Megaphone, MessageSquare
} from 'lucide-react';

interface DashboardStats {
  activeProjects: number;
  totalClients: number;
  teamMembers: number;
  monthlyBudget: number;
  newLeads: number;
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
  } = useKustrOffice();

  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    totalClients: 0,
    teamMembers: 0,
    monthlyBudget: 0,
    newLeads: 0,
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
        const [projectsRes, clientsRes, teamRes, budgetRes, leadsRes] = await Promise.all([
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
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', office.id)
            .eq('status', 'new'),
        ]);

        setStats({
          activeProjects: projectsRes.count || 0,
          totalClients: clientsRes.count || 0,
          teamMembers: teamRes.count || 0,
          monthlyBudget: budgetRes.data?.total_budget || 0,
          newLeads: leadsRes.count || 0,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickActions = [
    { icon: MessageSquare, label: 'View Leads', href: '/kustr/leads', color: 'bg-primary' },
    { icon: UserPlus, label: 'Add Team Member', href: '/kustr/team', color: 'bg-blue-500' },
    { icon: Building, label: 'Add Client', href: '/kustr/clients', color: 'bg-green-500' },
    { icon: FolderOpen, label: 'New Project', href: '/kustr/projects', color: 'bg-purple-500' },
  ];

  const navItems = [
    { icon: MessageSquare, label: 'Leads', href: '/kustr/leads' },
    { icon: Users, label: 'Team', href: '/kustr/team' },
    { icon: Building, label: 'Clients', href: '/kustr/clients' },
    { icon: Truck, label: 'Providers', href: '/kustr/providers' },
    { icon: Briefcase, label: 'Vendors', href: '/kustr/vendors' },
    { icon: Handshake, label: 'Alliances', href: '/kustr/alliances' },
    { icon: FolderOpen, label: 'Projects', href: '/kustr/projects' },
    { icon: Megaphone, label: 'Marketing', href: '/kustr/marketing' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{office?.name || 'My Studio'}</h1>
                <p className="text-sm text-muted-foreground">{office?.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-primary/50">
                  <AvatarImage src={teamMember?.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {teamMember?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{teamMember?.display_name}</p>
                  <p className="text-xs text-muted-foreground">{teamMember?.title}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
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
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {teamMember?.display_name?.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground mt-1">
            Here's what's happening at {office?.name} today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/kustr/leads')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Leads</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loadingStats ? '-' : stats.newLeads}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loadingStats ? '-' : stats.activeProjects}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loadingStats ? '-' : stats.totalClients}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                  <Building className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loadingStats ? '-' : stats.teamMembers}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Marketing Budget</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loadingStats ? '-' : `$${stats.monthlyBudget.toLocaleString()}`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Studio Management</CardTitle>
            <CardDescription>
              Access all areas of your studio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="h-auto py-6 flex flex-col items-center gap-3 border border-border hover:border-primary/50"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-foreground">{item.label}</span>
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
