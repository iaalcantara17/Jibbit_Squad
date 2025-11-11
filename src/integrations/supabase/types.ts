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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      application_events: {
        Row: {
          event_date: string | null
          event_type: string
          id: string
          job_id: string
          metadata: Json | null
          notes: string | null
          user_id: string
        }
        Insert: {
          event_date?: string | null
          event_type: string
          id?: string
          job_id: string
          metadata?: Json | null
          notes?: string | null
          user_id: string
        }
        Update: {
          event_date?: string | null
          event_type?: string
          id?: string
          job_id?: string
          metadata?: Json | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          rule_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          rule_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          rule_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string | null
          id: string
          last_sync: string | null
          provider: string
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          provider: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          provider?: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_research: {
        Row: {
          ai_summary: string | null
          company_name: string
          competitors: Json | null
          created_at: string | null
          culture: string | null
          description: string | null
          glassdoor_rating: number | null
          id: string
          industry: string | null
          key_people: Json | null
          recent_news: Json | null
          size: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          company_name: string
          competitors?: Json | null
          created_at?: string | null
          culture?: string | null
          description?: string | null
          glassdoor_rating?: number | null
          id?: string
          industry?: string | null
          key_people?: Json | null
          recent_news?: Json | null
          size?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          company_name?: string
          competitors?: Json | null
          created_at?: string | null
          culture?: string | null
          description?: string | null
          glassdoor_rating?: number | null
          id?: string
          industry?: string | null
          key_people?: Json | null
          recent_news?: Json | null
          size?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cover_letters: {
        Row: {
          ai_generated: Json | null
          company_research: Json | null
          content: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          job_id: string | null
          last_used: string | null
          response_rate: number | null
          style_preferences: Json | null
          template: string | null
          times_used: number | null
          title: string
          tone: string | null
          updated_at: string | null
          user_id: string
          versions: Json | null
        }
        Insert: {
          ai_generated?: Json | null
          company_research?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          job_id?: string | null
          last_used?: string | null
          response_rate?: number | null
          style_preferences?: Json | null
          template?: string | null
          times_used?: number | null
          title: string
          tone?: string | null
          updated_at?: string | null
          user_id: string
          versions?: Json | null
        }
        Update: {
          ai_generated?: Json | null
          company_research?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          job_id?: string | null
          last_used?: string | null
          response_rate?: number | null
          style_preferences?: Json | null
          template?: string | null
          times_used?: number | null
          title?: string
          tone?: string | null
          updated_at?: string | null
          user_id?: string
          versions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          calendar_event_id: string | null
          common_questions: Json | null
          company_research: Json | null
          created_at: string | null
          id: string
          interview_date: string | null
          interview_type: string | null
          interviewer_name: string | null
          interviewer_role: string | null
          job_id: string
          location: string | null
          notes: string | null
          preparation_status: string | null
          reminder_sent: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          common_questions?: Json | null
          company_research?: Json | null
          created_at?: string | null
          id?: string
          interview_date?: string | null
          interview_type?: string | null
          interviewer_name?: string | null
          interviewer_role?: string | null
          job_id: string
          location?: string | null
          notes?: string | null
          preparation_status?: string | null
          reminder_sent?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
          common_questions?: Json | null
          company_research?: Json | null
          created_at?: string | null
          id?: string
          interview_date?: string | null
          interview_type?: string | null
          interviewer_name?: string | null
          interviewer_role?: string | null
          job_id?: string
          location?: string | null
          notes?: string | null
          preparation_status?: string | null
          reminder_sent?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_match_scores: {
        Row: {
          created_at: string | null
          education_score: number | null
          experience_score: number | null
          gaps: Json | null
          id: string
          job_id: string
          overall_score: number
          recommendations: string | null
          skills_score: number | null
          strengths: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          education_score?: number | null
          experience_score?: number | null
          gaps?: Json | null
          id?: string
          job_id: string
          overall_score: number
          recommendations?: string | null
          skills_score?: number | null
          strengths?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          education_score?: number | null
          experience_score?: number | null
          gaps?: Json | null
          id?: string
          job_id?: string
          overall_score?: number
          recommendations?: string | null
          skills_score?: number | null
          strengths?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_match_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          archive_reason: string | null
          company_info: Json | null
          company_name: string
          contacts: Json | null
          cover_letter_id: string | null
          created_at: string | null
          id: string
          industry: string | null
          interview_notes: string | null
          is_archived: boolean | null
          job_description: string | null
          job_title: string
          job_type: string | null
          job_url: string | null
          location: string | null
          notes: string | null
          resume_id: string | null
          salary_max: number | null
          salary_min: number | null
          salary_notes: string | null
          status: string
          status_history: Json | null
          status_updated_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_deadline?: string | null
          archive_reason?: string | null
          company_info?: Json | null
          company_name: string
          contacts?: Json | null
          cover_letter_id?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          interview_notes?: string | null
          is_archived?: boolean | null
          job_description?: string | null
          job_title: string
          job_type?: string | null
          job_url?: string | null
          location?: string | null
          notes?: string | null
          resume_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_notes?: string | null
          status?: string
          status_history?: Json | null
          status_updated_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_deadline?: string | null
          archive_reason?: string | null
          company_info?: Json | null
          company_name?: string
          contacts?: Json | null
          cover_letter_id?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          interview_notes?: string | null
          is_archived?: boolean | null
          job_description?: string | null
          job_title?: string
          job_type?: string | null
          job_url?: string | null
          location?: string | null
          notes?: string | null
          resume_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_notes?: string | null
          status?: string
          status_history?: Json | null
          status_updated_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_interview_id: string | null
          related_job_id: string | null
          sent_via_email: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_interview_id?: string | null
          related_job_id?: string | null
          sent_via_email?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_interview_id?: string | null
          related_job_id?: string | null
          sent_via_email?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_interview_id_fkey"
            columns: ["related_interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          certifications: Json | null
          created_at: string | null
          education: Json | null
          email: string | null
          employment_history: Json | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          name: string | null
          phone_number: string | null
          portfolio_url: string | null
          professional_headline: string | null
          projects: Json | null
          skills: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          employment_history?: Json | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          professional_headline?: string | null
          projects?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          employment_history?: Json | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          professional_headline?: string | null
          projects?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ai_generated: Json | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          last_used: string | null
          linked_jobs: Json | null
          sections: Json | null
          styling: Json | null
          success_rate: number | null
          template: string | null
          times_used: number | null
          title: string
          updated_at: string | null
          user_id: string
          versions: Json | null
        }
        Insert: {
          ai_generated?: Json | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          last_used?: string | null
          linked_jobs?: Json | null
          sections?: Json | null
          styling?: Json | null
          success_rate?: number | null
          template?: string | null
          times_used?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          versions?: Json | null
        }
        Update: {
          ai_generated?: Json | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          last_used?: string | null
          linked_jobs?: Json | null
          sections?: Json | null
          styling?: Json | null
          success_rate?: number | null
          template?: string | null
          times_used?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          versions?: Json | null
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
    Enums: {},
  },
} as const
