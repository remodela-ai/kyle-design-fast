import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Office {
  id: string;
  name: string;
  location: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  office_id: string;
  display_name: string;
  title: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'managing_partner' | 'collaborator' | 'admin';
  office_id: string;
}

interface KustrOfficeContextType {
  office: Office | null;
  offices: Office[];
  teamMember: TeamMember | null;
  userRole: UserRole | null;
  loading: boolean;
  isManagingPartner: boolean;
  isCollaborator: boolean;
  isAdmin: boolean;
  hasCompletedOnboarding: boolean;
  refetchProfile: () => Promise<void>;
}

const KustrOfficeContext = createContext<KustrOfficeContextType | undefined>(undefined);

export const KustrOfficeProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [office, setOffice] = useState<Office | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOffices = async () => {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setOffices(data);
    }
  };

  const fetchUserData = async () => {
    if (!user) {
      setTeamMember(null);
      setUserRole(null);
      setOffice(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData as UserRole);

        // Fetch office
        const { data: officeData } = await supabase
          .from('offices')
          .select('*')
          .eq('id', roleData.office_id)
          .single();

        if (officeData) {
          setOffice(officeData);
        }
      }

      // Fetch team member profile
      const { data: memberData } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData) {
        setTeamMember(memberData as TeamMember);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetchProfile = async () => {
    setLoading(true);
    await fetchUserData();
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const isManagingPartner = userRole?.role === 'managing_partner';
  const isCollaborator = userRole?.role === 'collaborator';
  const isAdmin = userRole?.role === 'admin';
  const hasCompletedOnboarding = teamMember?.onboarding_completed ?? false;

  return (
    <KustrOfficeContext.Provider
      value={{
        office,
        offices,
        teamMember,
        userRole,
        loading,
        isManagingPartner,
        isCollaborator,
        isAdmin,
        hasCompletedOnboarding,
        refetchProfile,
      }}
    >
      {children}
    </KustrOfficeContext.Provider>
  );
};

export const useKustrOffice = () => {
  const context = useContext(KustrOfficeContext);
  if (context === undefined) {
    throw new Error('useKustrOffice must be used within a KustrOfficeProvider');
  }
  return context;
};
