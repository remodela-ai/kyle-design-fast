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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      visibility_type: ["private", "shared", "public"],
    },
  },
} as const
