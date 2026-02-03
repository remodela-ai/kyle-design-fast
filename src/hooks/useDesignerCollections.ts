import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerProfile } from './useDesignerProfile';
import type { Json } from '@/integrations/supabase/types';

export type VisibilityType = 'private' | 'shared' | 'public';

export interface DesignCollection {
  id: string;
  designer_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

export interface DesignGeneration {
  id: string;
  designer_id: string;
  collection_id: string | null;
  session_id: string | null;
  image_url: string;
  prompt: string | null;
  style_notes: string | null;
  metadata: Json;
  visibility: VisibilityType;
  created_at: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  visibility?: VisibilityType;
}

export interface CreateGenerationData {
  collection_id?: string;
  session_id?: string;
  image_url: string;
  prompt?: string;
  style_notes?: string;
  metadata?: Json;
  visibility?: VisibilityType;
}

export const useDesignerCollections = () => {
  const { profile } = useDesignerProfile();
  const [collections, setCollections] = useState<DesignCollection[]>([]);
  const [generations, setGenerations] = useState<DesignGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!profile?.id) {
      setCollections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('design_collections')
        .select('*')
        .eq('designer_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCollections((data || []) as DesignCollection[]);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchGenerations = useCallback(async (collectionId?: string) => {
    if (!profile?.id) {
      setGenerations([]);
      return;
    }

    try {
      let query = supabase
        .from('design_generations')
        .select('*')
        .eq('designer_id', profile.id)
        .order('created_at', { ascending: false });

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setGenerations((data || []) as DesignGeneration[]);
    } catch (err) {
      console.error('Error fetching generations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch generations');
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchCollections();
    fetchGenerations();
  }, [fetchCollections, fetchGenerations]);

  const createCollection = async (data: CreateCollectionData) => {
    if (!profile?.id) {
      return { error: new Error('Profile not found') };
    }

    try {
      const { data: newCollection, error: createError } = await supabase
        .from('design_collections')
        .insert({
          designer_id: profile.id,
          name: data.name,
          description: data.description || null,
          visibility: data.visibility || 'private',
        })
        .select()
        .single();

      if (createError) throw createError;

      setCollections(prev => [newCollection as DesignCollection, ...prev]);
      return { data: newCollection, error: null };
    } catch (err) {
      console.error('Error creating collection:', err);
      return { error: err instanceof Error ? err : new Error('Failed to create collection') };
    }
  };

  const updateCollection = async (id: string, data: Partial<CreateCollectionData>) => {
    try {
      const { data: updated, error: updateError } = await supabase
        .from('design_collections')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCollections(prev => 
        prev.map(c => c.id === id ? updated as DesignCollection : c)
      );
      return { data: updated, error: null };
    } catch (err) {
      console.error('Error updating collection:', err);
      return { error: err instanceof Error ? err : new Error('Failed to update collection') };
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('design_collections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCollections(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting collection:', err);
      return { error: err instanceof Error ? err : new Error('Failed to delete collection') };
    }
  };

  const saveGeneration = async (data: CreateGenerationData) => {
    if (!profile?.id) {
      return { error: new Error('Profile not found') };
    }

    try {
      const { data: newGeneration, error: createError } = await supabase
        .from('design_generations')
        .insert({
          designer_id: profile.id,
          collection_id: data.collection_id || null,
          session_id: data.session_id || null,
          image_url: data.image_url,
          prompt: data.prompt || null,
          style_notes: data.style_notes || null,
          metadata: data.metadata || {},
          visibility: data.visibility || 'private',
        })
        .select()
        .single();

      if (createError) throw createError;

      setGenerations(prev => [newGeneration as DesignGeneration, ...prev]);
      return { data: newGeneration, error: null };
    } catch (err) {
      console.error('Error saving generation:', err);
      return { error: err instanceof Error ? err : new Error('Failed to save generation') };
    }
  };

  const updateGeneration = async (id: string, data: Partial<Omit<CreateGenerationData, 'metadata'>> & { metadata?: Json }) => {
    try {
      const { data: updated, error: updateError } = await supabase
        .from('design_generations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setGenerations(prev => 
        prev.map(g => g.id === id ? updated as DesignGeneration : g)
      );
      return { data: updated, error: null };
    } catch (err) {
      console.error('Error updating generation:', err);
      return { error: err instanceof Error ? err : new Error('Failed to update generation') };
    }
  };

  const deleteGeneration = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('design_generations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setGenerations(prev => prev.filter(g => g.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting generation:', err);
      return { error: err instanceof Error ? err : new Error('Failed to delete generation') };
    }
  };

  return {
    collections,
    generations,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    saveGeneration,
    updateGeneration,
    deleteGeneration,
    refreshCollections: fetchCollections,
    refreshGenerations: fetchGenerations,
  };
};
