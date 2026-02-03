import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

export const useDesignerProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<DesignerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
      return { data: newProfile, error: null };
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
      return { data: updatedProfile, error: null };
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

      // Update profile with new avatar URL
      const result = await updateProfile({ avatar_url: publicUrl });
      return result;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      return { error: err instanceof Error ? err : new Error('Failed to upload avatar') };
    }
  };

  const hasProfile = !!profile;
  const needsOnboarding = isAuthenticated && !loading && !hasProfile;

  return {
    profile,
    loading,
    error,
    hasProfile,
    needsOnboarding,
    createProfile,
    updateProfile,
    uploadAvatar,
    refreshProfile: fetchProfile,
  };
};
