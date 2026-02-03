import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type DesignSpecialization = 
  | 'residential'
  | 'commercial'
  | 'hospitality'
  | 'retail'
  | 'healthcare'
  | 'office'
  | 'sustainable'
  | 'luxury'
  | 'minimalist'
  | 'traditional';

export interface DesignerProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  company_name: string | null;
  bio: string | null;
  website_url: string | null;
  portfolio_url: string | null;
  contact_email: string | null;
  specializations: DesignSpecialization[];
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  display_name: string;
  company_name?: string;
  bio?: string;
  website_url?: string;
  portfolio_url?: string;
  contact_email?: string;
  specializations?: DesignSpecialization[];
}

export interface UpdateProfileData extends Partial<CreateProfileData> {
  avatar_url?: string;
}

interface DesignerProfileContextType {
  profile: DesignerProfile | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  needsOnboarding: boolean;
  createProfile: (data: CreateProfileData) => Promise<{ data?: DesignerProfile; error: Error | null }>;
  updateProfile: (data: UpdateProfileData) => Promise<{ data?: DesignerProfile; error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ data?: DesignerProfile; error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const DesignerProfileContext = createContext<DesignerProfileContextType | null>(null);

export function DesignerProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<DesignerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      setHasFetched(true);
      return;
    }

    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      setProfile(data as DesignerProfile | null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [user?.id]);

  // Fetch profile when user changes
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      setHasFetched(true);
      return;
    }

    fetchProfile();
  }, [user?.id, isAuthenticated, authLoading, fetchProfile]);

  const createProfile = async (data: CreateProfileData) => {
    if (!user?.id) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data: newProfile, error: createError } = await supabase
        .from('designer_profiles')
        .insert({
          user_id: user.id,
          display_name: data.display_name,
          company_name: data.company_name || null,
          bio: data.bio || null,
          website_url: data.website_url || null,
          portfolio_url: data.portfolio_url || null,
          contact_email: data.contact_email || user.email || null,
          specializations: data.specializations || [],
        })
        .select()
        .single();

      if (createError) throw createError;

      setProfile(newProfile as DesignerProfile);
      return { data: newProfile as DesignerProfile, error: null };
    } catch (err) {
      console.error('Error creating profile:', err);
      return { error: err instanceof Error ? err : new Error('Failed to create profile') };
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    if (!profile?.id) {
      return { error: new Error('No profile to update') };
    }

    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('designer_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(updatedProfile as DesignerProfile);
      return { data: updatedProfile as DesignerProfile, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { error: err instanceof Error ? err : new Error('Failed to update profile') };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('designer-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('designer-assets')
        .getPublicUrl(fileName);

      const result = await updateProfile({ avatar_url: publicUrl });
      return result;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      return { error: err instanceof Error ? err : new Error('Failed to upload avatar') };
    }
  };

  const hasProfile = !!profile;
  const needsOnboarding = isAuthenticated && hasFetched && !loading && !hasProfile;

  const value: DesignerProfileContextType = {
    profile,
    loading: authLoading || loading,
    error,
    hasProfile,
    needsOnboarding,
    createProfile,
    updateProfile,
    uploadAvatar,
    refreshProfile: fetchProfile,
  };

  return (
    <DesignerProfileContext.Provider value={value}>
      {children}
    </DesignerProfileContext.Provider>
  );
}

export function useDesignerProfileContext() {
  const context = useContext(DesignerProfileContext);
  if (!context) {
    throw new Error('useDesignerProfileContext must be used within a DesignerProfileProvider');
  }
  return context;
}
