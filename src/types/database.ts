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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      category_rules: {
        Row: {
          condition_type: Database["public"]["Enums"]["rule_condition_type"]
          condition_value: string
          created_at: string
          enabled: boolean
          forced_category: Database["public"]["Enums"]["email_category"]
          id: string
          user_id: string
        }
        Insert: {
          condition_type: Database["public"]["Enums"]["rule_condition_type"]
          condition_value: string
          created_at?: string
          enabled?: boolean
          forced_category: Database["public"]["Enums"]["email_category"]
          id?: string
          user_id: string
        }
        Update: {
          condition_type?: Database["public"]["Enums"]["rule_condition_type"]
          condition_value?: string
          created_at?: string
          enabled?: boolean
          forced_category?: Database["public"]["Enums"]["email_category"]
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          disconnected_at: string | null
          email_gmail: string
          id: string
          last_history_id: string | null
          refresh_token: string | null
          user_id: string
          watch_expiration: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          disconnected_at?: string | null
          email_gmail: string
          id?: string
          last_history_id?: string | null
          refresh_token?: string | null
          user_id: string
          watch_expiration?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          disconnected_at?: string | null
          email_gmail?: string
          id?: string
          last_history_id?: string | null
          refresh_token?: string | null
          user_id?: string
          watch_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          account_id: string
          ai_suggested_reply: string | null
          ai_summary: string | null
          category: Database["public"]["Enums"]["email_category"] | null
          created_at: string
          effective_category:
            | Database["public"]["Enums"]["email_category"]
            | null
          gmail_message_id: string
          id: string
          manual_category: Database["public"]["Enums"]["email_category"] | null
          manual_reply: string | null
          read_at: string | null
          received_at: string
          replied_at: string | null
          sender: string
          snoozed_until: string | null
          state: Database["public"]["Enums"]["email_state"]
          subject: string | null
        }
        Insert: {
          account_id: string
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          category?: Database["public"]["Enums"]["email_category"] | null
          created_at?: string
          effective_category?:
            | Database["public"]["Enums"]["email_category"]
            | null
          gmail_message_id: string
          id?: string
          manual_category?: Database["public"]["Enums"]["email_category"] | null
          manual_reply?: string | null
          read_at?: string | null
          received_at: string
          replied_at?: string | null
          sender: string
          snoozed_until?: string | null
          state?: Database["public"]["Enums"]["email_state"]
          subject?: string | null
        }
        Update: {
          account_id?: string
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          category?: Database["public"]["Enums"]["email_category"] | null
          created_at?: string
          effective_category?:
            | Database["public"]["Enums"]["email_category"]
            | null
          gmail_message_id?: string
          id?: string
          manual_category?: Database["public"]["Enums"]["email_category"] | null
          manual_reply?: string | null
          read_at?: string | null
          received_at?: string
          replied_at?: string | null
          sender?: string
          snoozed_until?: string | null
          state?: Database["public"]["Enums"]["email_state"]
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
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
      email_category: "alta" | "media" | "baixa"
      email_state: "ativo" | "arquivado" | "adiado"
      rule_condition_type: "remetente" | "dominio" | "palavra_chave"
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
    Enums: {
      email_category: ["alta", "media", "baixa"],
      email_state: ["ativo", "arquivado", "adiado"],
      rule_condition_type: ["remetente", "dominio", "palavra_chave"],
    },
  },
} as const
