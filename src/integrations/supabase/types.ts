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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          creation_id: string | null
          filename: string
          id: string
          metadata: Json
          mime_type: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creation_id?: string | null
          filename: string
          id?: string
          metadata?: Json
          mime_type: string
          size_bytes?: number | null
          storage_path: string
          user_id?: string
        }
        Update: {
          created_at?: string
          creation_id?: string | null
          filename?: string
          id?: string
          metadata?: Json
          mime_type?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "creations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          settings: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          settings?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          settings?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creations: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: string
          name: string
          prompt: string | null
          spec: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          name?: string
          prompt?: string | null
          spec?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          name?: string
          prompt?: string | null
          spec?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          detail: string | null
          id: string
          metadata: Json
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          detail?: string | null
          id?: string
          metadata?: Json
          role: string
          user_id?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          metadata?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          onboarding_completed: boolean
          preferences: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_completed?: boolean
          preferences?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      provider_configs: {
        Row: {
          base_url: string | null
          created_at: string
          enabled: boolean
          id: string
          key_hint: string | null
          label: string
          last_error: string | null
          last_tested_at: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          key_hint?: string | null
          label?: string
          last_error?: string | null
          last_tested_at?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          key_hint?: string | null
          label?: string
          last_error?: string | null
          last_tested_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_credentials: {
        Row: {
          ciphertext: string
          created_at: string
          id: string
          iv: string
          key_version: number
          provider_config_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          id?: string
          iv: string
          key_version?: number
          provider_config_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          id?: string
          iv?: string
          key_version?: number
          provider_config_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentials_provider_config_id_fkey"
            columns: ["provider_config_id"]
            isOneToOne: true
            referencedRelation: "provider_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      render_jobs: {
        Row: {
          created_at: string
          creation_id: string | null
          error: string | null
          external_job_id: string | null
          id: string
          progress: number | null
          status: string
          updated_at: string
          user_id: string
          worker: string
        }
        Insert: {
          created_at?: string
          creation_id?: string | null
          error?: string | null
          external_job_id?: string | null
          id?: string
          progress?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          worker: string
        }
        Update: {
          created_at?: string
          creation_id?: string | null
          error?: string | null
          external_job_id?: string | null
          id?: string
          progress?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          worker?: string
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "creations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          priority: string
          source: string
          source_conversation_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          source?: string
          source_conversation_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          source?: string
          source_conversation_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          kind: string
          latency_ms: number | null
          model: string | null
          provider: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          kind: string
          latency_ms?: number | null
          model?: string | null
          provider?: string | null
          status: string
          user_id?: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          kind?: string
          latency_ms?: number | null
          model?: string | null
          provider?: string | null
          status?: string
          user_id?: string
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
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
