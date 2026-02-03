export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alarms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          recurrence: string | null
          recurrence_days: string[] | null
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          recurrence?: string | null
          recurrence_days?: string[] | null
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          recurrence?: string | null
          recurrence_days?: string[] | null
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          office_id: string
          phone: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          office_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          office_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_syncs: {
        Row: {
          created_at: string
          id: string
          james_notes: string | null
          knowledge_base: string | null
          oriel_notes: string | null
          status: string
          sync_date: string
          synthesis: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          james_notes?: string | null
          knowledge_base?: string | null
          oriel_notes?: string | null
          status?: string
          sync_date?: string
          synthesis?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          james_notes?: string | null
          knowledge_base?: string | null
          oriel_notes?: string | null
          status?: string
          sync_date?: string
          synthesis?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      design_collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          designer_id: string
          id: string
          name: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          designer_id: string
          id?: string
          name: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          designer_id?: string
          id?: string
          name?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "design_collections_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      design_generations: {
        Row: {
          collection_id: string | null
          created_at: string
          designer_id: string
          id: string
          image_url: string
          metadata: Json | null
          prompt: string | null
          session_id: string | null
          style_notes: string | null
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          designer_id: string
          id?: string
          image_url: string
          metadata?: Json | null
          prompt?: string | null
          session_id?: string | null
          style_notes?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          designer_id?: string
          id?: string
          image_url?: string
          metadata?: Json | null
          prompt?: string | null
          session_id?: string | null
          style_notes?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "design_generations_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "design_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_generations_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          contact_email: string | null
          created_at: string
          display_name: string
          id: string
          portfolio_url: string | null
          specializations:
            | Database["public"]["Enums"]["design_specialization"][]
            | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          display_name: string
          id?: string
          portfolio_url?: string | null
          specializations?:
            | Database["public"]["Enums"]["design_specialization"][]
            | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string
          id?: string
          portfolio_url?: string | null
          specializations?:
            | Database["public"]["Enums"]["design_specialization"][]
            | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      kustr_project_files: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kustr_project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "kustr_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kustr_projects: {
        Row: {
          assigned_members: string[] | null
          budget: number | null
          client_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          office_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string
        }
        Insert: {
          assigned_members?: string[] | null
          budget?: number | null
          client_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          office_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
        }
        Update: {
          assigned_members?: string[] | null
          budget?: number | null
          client_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          office_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kustr_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kustr_projects_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_budgets: {
        Row: {
          created_at: string
          facebook_budget: number | null
          id: string
          instagram_budget: number | null
          linkedin_budget: number | null
          month: string
          notes: string | null
          office_id: string
          tiktok_budget: number | null
          total_budget: number | null
          updated_at: string
          x_budget: number | null
        }
        Insert: {
          created_at?: string
          facebook_budget?: number | null
          id?: string
          instagram_budget?: number | null
          linkedin_budget?: number | null
          month: string
          notes?: string | null
          office_id: string
          tiktok_budget?: number | null
          total_budget?: number | null
          updated_at?: string
          x_budget?: number | null
        }
        Update: {
          created_at?: string
          facebook_budget?: number | null
          id?: string
          instagram_budget?: number | null
          linkedin_budget?: number | null
          month?: string
          notes?: string | null
          office_id?: string
          tiktok_budget?: number | null
          total_budget?: number | null
          updated_at?: string
          x_budget?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_budgets_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          image_urls: string[] | null
          office_id: string
          platform: Database["public"]["Enums"]["marketing_platform"]
          scheduled_date: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_urls?: string[] | null
          office_id: string
          platform: Database["public"]["Enums"]["marketing_platform"]
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_urls?: string[] | null
          office_id?: string
          platform?: Database["public"]["Enums"]["marketing_platform"]
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      material_vendors: {
        Row: {
          category: string | null
          contact_name: string | null
          created_at: string
          discount_terms: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          office_id: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          discount_terms?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          office_id: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          discount_terms?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          office_id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_vendors_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          location: string
          name: string
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location: string
          name: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string
          name?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_sessions: {
        Row: {
          conversation_transcript: string | null
          created_at: string
          extracted_insights: Json | null
          id: string
          person_name: string
          session_focus: string | null
          session_number: number
        }
        Insert: {
          conversation_transcript?: string | null
          created_at?: string
          extracted_insights?: Json | null
          id?: string
          person_name: string
          session_focus?: string | null
          session_number: number
        }
        Update: {
          conversation_transcript?: string | null
          created_at?: string
          extracted_insights?: Json | null
          id?: string
          person_name?: string
          session_focus?: string | null
          session_number?: number
        }
        Relationships: []
      }
      person_profiles: {
        Row: {
          communication_style: string | null
          created_at: string
          decision_style: string | null
          feedback_preferences: string | null
          frustrations: Json | null
          id: string
          onboarding_completed: boolean | null
          person_name: string
          personality_summary: string | null
          priorities: Json | null
          sessions_completed: number | null
          strengths: Json | null
          updated_at: string
          values_and_motivations: string | null
          work_style: string | null
        }
        Insert: {
          communication_style?: string | null
          created_at?: string
          decision_style?: string | null
          feedback_preferences?: string | null
          frustrations?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          person_name: string
          personality_summary?: string | null
          priorities?: Json | null
          sessions_completed?: number | null
          strengths?: Json | null
          updated_at?: string
          values_and_motivations?: string | null
          work_style?: string | null
        }
        Update: {
          communication_style?: string | null
          created_at?: string
          decision_style?: string | null
          feedback_preferences?: string | null
          frustrations?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          person_name?: string
          personality_summary?: string | null
          priorities?: Json | null
          sessions_completed?: number | null
          strengths?: Json | null
          updated_at?: string
          values_and_motivations?: string | null
          work_style?: string | null
        }
        Relationships: []
      }
      pipeline_steps: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          memory_context: Json | null
          output_data: Json | null
          session_id: string | null
          started_at: string | null
          status: string | null
          step_name: string
          step_number: number
          visual_outcome_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          memory_context?: Json | null
          output_data?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          step_name: string
          step_number: number
          visual_outcome_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          memory_context?: Json | null
          output_data?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          step_name?: string
          step_number?: number
          visual_outcome_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_steps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "project_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      project_sessions: {
        Row: {
          conversation_summary: string | null
          created_at: string | null
          design_image_url: string | null
          designer_id: string | null
          id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          conversation_summary?: string | null
          created_at?: string | null
          design_image_url?: string | null
          designer_id?: string | null
          id?: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          conversation_summary?: string | null
          created_at?: string | null
          design_image_url?: string | null
          designer_id?: string | null
          id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_sessions_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          category: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          office_id: string
          phone: string | null
          rating: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          office_id: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          office_id?: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_alliances: {
        Row: {
          agreement_details: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          end_date: string | null
          id: string
          office_id: string
          partner_name: string
          partnership_type: string | null
          phone: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          agreement_details?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          office_id: string
          partner_name: string
          partnership_type?: string | null
          phone?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          agreement_details?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          office_id?: string
          partner_name?: string
          partnership_type?: string | null
          phone?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_alliances_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          phase: string
          speaker: string
          sync_id: string
          timestamp: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          phase: string
          speaker: string
          sync_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          phase?: string
          speaker?: string
          sync_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_messages_sync_id_fkey"
            columns: ["sync_id"]
            isOneToOne: false
            referencedRelation: "daily_syncs"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          reminder_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          reminder_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          reminder_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          office_id: string
          onboarding_completed: boolean | null
          phone: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          office_id: string
          onboarding_completed?: boolean | null
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          office_id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          office_id: string | null
          role: Database["public"]["Enums"]["kustr_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          office_id?: string | null
          role: Database["public"]["Enums"]["kustr_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          office_id?: string | null
          role?: Database["public"]["Enums"]["kustr_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_office_id: { Args: { _user_id: string }; Returns: string }
      has_kustr_role: {
        Args: {
          _role: Database["public"]["Enums"]["kustr_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_office: {
        Args: { _office_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      client_status: "lead" | "active" | "completed" | "inactive"
      design_specialization:
        | "residential"
        | "commercial"
        | "hospitality"
        | "retail"
        | "healthcare"
        | "office"
        | "sustainable"
        | "luxury"
        | "minimalist"
        | "traditional"
      kustr_role: "managing_partner" | "collaborator" | "admin"
      marketing_platform: "linkedin" | "facebook" | "instagram" | "tiktok" | "x"
      post_status: "draft" | "scheduled" | "published"
      project_status: "planning" | "in_progress" | "review" | "completed"
      visibility_type: "private" | "shared" | "public"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      client_status: ["lead", "active", "completed", "inactive"],
      design_specialization: [
        "residential",
        "commercial",
        "hospitality",
        "retail",
        "healthcare",
        "office",
        "sustainable",
        "luxury",
        "minimalist",
        "traditional",
      ],
      kustr_role: ["managing_partner", "collaborator", "admin"],
      marketing_platform: ["linkedin", "facebook", "instagram", "tiktok", "x"],
      post_status: ["draft", "scheduled", "published"],
      project_status: ["planning", "in_progress", "review", "completed"],
      visibility_type: ["private", "shared", "public"],
    },
  },
} as const
