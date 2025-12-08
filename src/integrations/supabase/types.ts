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
      advisor_profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          specialization: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          specialization?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          specialization?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          event_category: string | null
          event_name: string
          event_properties: Json | null
          id: string
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_category?: string | null
          event_name: string
          event_properties?: Json | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_category?: string | null
          event_name?: string
          event_properties?: Json | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          api_name: string
          average_response_ms: number | null
          created_at: string
          current_usage: number
          daily_limit: number
          id: string
          last_error: string | null
          last_error_at: string | null
          reset_at: string
          updated_at: string
        }
        Insert: {
          api_name: string
          average_response_ms?: number | null
          created_at?: string
          current_usage?: number
          daily_limit: number
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          reset_at?: string
          updated_at?: string
        }
        Update: {
          api_name?: string
          average_response_ms?: number | null
          created_at?: string
          current_usage?: number
          daily_limit?: number
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          reset_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_name: string
          created_at: string
          endpoint: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          request_count: number | null
          response_status: number | null
          response_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          api_name: string
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          request_count?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          api_name?: string
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          request_count?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      application_ab_test_results: {
        Row: {
          applied_at: string
          created_at: string
          days_to_response: number | null
          id: string
          job_id: string | null
          response_at: string | null
          response_received: boolean | null
          response_type: string | null
          test_id: string | null
          variant: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          days_to_response?: number | null
          id?: string
          job_id?: string | null
          response_at?: string | null
          response_received?: boolean | null
          response_type?: string | null
          test_id?: string | null
          variant: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          days_to_response?: number | null
          id?: string
          job_id?: string | null
          response_at?: string | null
          response_received?: boolean | null
          response_type?: string | null
          test_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_ab_test_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_ab_test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "application_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      application_ab_tests: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean | null
          started_at: string
          test_name: string
          updated_at: string
          user_id: string
          variant_a_id: string | null
          variant_a_type: string
          variant_b_id: string | null
          variant_b_type: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string
          test_name: string
          updated_at?: string
          user_id: string
          variant_a_id?: string | null
          variant_a_type: string
          variant_b_id?: string | null
          variant_b_type: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string
          test_name?: string
          updated_at?: string
          user_id?: string
          variant_a_id?: string | null
          variant_a_type?: string
          variant_b_id?: string | null
          variant_b_type?: string
        }
        Relationships: []
      }
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
      application_quality_assessments: {
        Row: {
          cover_letter_id: string | null
          created_at: string
          experience_alignment_score: number | null
          formatting_score: number | null
          id: string
          improvement_suggestions: Json | null
          job_id: string
          keyword_match_score: number | null
          missing_keywords: Json | null
          overall_score: number | null
          resume_id: string | null
          strengths: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_letter_id?: string | null
          created_at?: string
          experience_alignment_score?: number | null
          formatting_score?: number | null
          id?: string
          improvement_suggestions?: Json | null
          job_id: string
          keyword_match_score?: number | null
          missing_keywords?: Json | null
          overall_score?: number | null
          resume_id?: string | null
          strengths?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_letter_id?: string | null
          created_at?: string
          experience_alignment_score?: number | null
          formatting_score?: number | null
          id?: string
          improvement_suggestions?: Json | null
          job_id?: string
          keyword_match_score?: number | null
          missing_keywords?: Json | null
          overall_score?: number | null
          resume_id?: string | null
          strengths?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      application_quality_scores: {
        Row: {
          consistency_score: number | null
          cover_letter_id: string | null
          created_at: string
          experience_match_score: number | null
          formatting_score: number | null
          id: string
          improvement_suggestions: Json | null
          job_id: string
          keyword_match_score: number | null
          missing_keywords: Json | null
          overall_score: number
          resume_id: string | null
          skills_alignment_score: number | null
          strengths: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consistency_score?: number | null
          cover_letter_id?: string | null
          created_at?: string
          experience_match_score?: number | null
          formatting_score?: number | null
          id?: string
          improvement_suggestions?: Json | null
          job_id: string
          keyword_match_score?: number | null
          missing_keywords?: Json | null
          overall_score?: number
          resume_id?: string | null
          skills_alignment_score?: number | null
          strengths?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consistency_score?: number | null
          cover_letter_id?: string | null
          created_at?: string
          experience_match_score?: number | null
          formatting_score?: number | null
          id?: string
          improvement_suggestions?: Json | null
          job_id?: string
          keyword_match_score?: number | null
          missing_keywords?: Json | null
          overall_score?: number
          resume_id?: string | null
          skills_alignment_score?: number | null
          strengths?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_quality_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          changed_at: string
          from_status: string | null
          id: string
          job_id: string
          notes: string | null
          to_status: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          from_status?: string | null
          id?: string
          job_id: string
          notes?: string | null
          to_status: string
          user_id: string
        }
        Update: {
          changed_at?: string
          from_status?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      application_timing_recommendations: {
        Row: {
          actual_submit_at: string | null
          created_at: string
          factors: Json | null
          historical_success_rate: number | null
          id: string
          is_scheduled: boolean | null
          job_id: string
          recommendation_text: string | null
          recommended_day: string | null
          recommended_time_end: string | null
          recommended_time_start: string | null
          recommended_timezone: string | null
          scheduled_submit_at: string | null
          timing_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_submit_at?: string | null
          created_at?: string
          factors?: Json | null
          historical_success_rate?: number | null
          id?: string
          is_scheduled?: boolean | null
          job_id: string
          recommendation_text?: string | null
          recommended_day?: string | null
          recommended_time_end?: string | null
          recommended_time_start?: string | null
          recommended_timezone?: string | null
          scheduled_submit_at?: string | null
          timing_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_submit_at?: string | null
          created_at?: string
          factors?: Json | null
          historical_success_rate?: number | null
          id?: string
          is_scheduled?: boolean | null
          job_id?: string
          recommendation_text?: string | null
          recommended_day?: string | null
          recommended_time_end?: string | null
          recommended_time_start?: string | null
          recommended_timezone?: string | null
          scheduled_submit_at?: string | null
          timing_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_timing_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      automation_rule_runs: {
        Row: {
          dedupe_key: string | null
          id: string
          job_id: string | null
          message: string | null
          outcome: string
          rule_id: string
          run_at: string
          user_id: string
        }
        Insert: {
          dedupe_key?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          outcome: string
          rule_id: string
          run_at?: string
          user_id: string
        }
        Update: {
          dedupe_key?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          outcome?: string
          rule_id?: string
          run_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rule_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action: Json
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          is_enabled: boolean
          name: string
          rule_type: string
          trigger: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action?: Json
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          name?: string
          rule_type: string
          trigger?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: Json
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          name?: string
          rule_type?: string
          trigger?: Json
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
      campaign_outreaches: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string
          id: string
          outcome_notes: string | null
          response_date: string | null
          response_received: boolean | null
          sent_at: string | null
          user_id: string
          variant: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string
          id?: string
          outcome_notes?: string | null
          response_date?: string | null
          response_received?: boolean | null
          sent_at?: string | null
          user_id: string
          variant?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          outcome_notes?: string | null
          response_date?: string | null
          response_received?: boolean | null
          sent_at?: string | null
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_outreaches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "networking_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_outreaches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      career_simulations: {
        Row: {
          assumptions: Json | null
          created_at: string
          id: string
          milestone_projections: Json | null
          paths: Json | null
          risk_factors: Json | null
          selected_path_index: number | null
          simulation_name: string
          starting_role: string
          starting_salary: number | null
          success_criteria: Json | null
          success_probability: number | null
          target_role: string | null
          target_salary: number | null
          time_horizon_years: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assumptions?: Json | null
          created_at?: string
          id?: string
          milestone_projections?: Json | null
          paths?: Json | null
          risk_factors?: Json | null
          selected_path_index?: number | null
          simulation_name: string
          starting_role: string
          starting_salary?: number | null
          success_criteria?: Json | null
          success_probability?: number | null
          target_role?: string | null
          target_salary?: number | null
          time_horizon_years?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assumptions?: Json | null
          created_at?: string
          id?: string
          milestone_projections?: Json | null
          paths?: Json | null
          risk_factors?: Json | null
          selected_path_index?: number | null
          simulation_name?: string
          starting_role?: string
          starting_salary?: number | null
          success_criteria?: Json | null
          success_probability?: number | null
          target_role?: string | null
          target_salary?: number | null
          time_horizon_years?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_value: number
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_value?: number
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_value?: number
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "group_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          advisor_id: string
          client_user_id: string
          created_at: string
          duration_minutes: number
          id: string
          meeting_link: string | null
          notes: string | null
          scheduled_date: string
          session_type: string
          status: string
          updated_at: string
        }
        Insert: {
          advisor_id: string
          client_user_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_date: string
          session_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          advisor_id?: string
          client_user_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_date?: string
          session_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_members: {
        Row: {
          cohort_id: string
          enrollment_date: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          enrollment_date?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          enrollment_date?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "institutional_cohorts"
            referencedColumns: ["id"]
          },
        ]
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
      competitive_analysis: {
        Row: {
          advantages: Json | null
          application_velocity: number | null
          competitive_score: number | null
          created_at: string
          differentiation_strategies: Json | null
          disadvantages: Json | null
          estimated_applicants: number | null
          estimated_time_to_fill: number | null
          id: string
          job_id: string
          likelihood_interview: string | null
          likelihood_percent: number | null
          market_position: string | null
          unique_qualifications: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advantages?: Json | null
          application_velocity?: number | null
          competitive_score?: number | null
          created_at?: string
          differentiation_strategies?: Json | null
          disadvantages?: Json | null
          estimated_applicants?: number | null
          estimated_time_to_fill?: number | null
          id?: string
          job_id: string
          likelihood_interview?: string | null
          likelihood_percent?: number | null
          market_position?: string | null
          unique_qualifications?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advantages?: Json | null
          application_velocity?: number | null
          competitive_score?: number | null
          created_at?: string
          differentiation_strategies?: Json | null
          disadvantages?: Json | null
          estimated_applicants?: number | null
          estimated_time_to_fill?: number | null
          id?: string
          job_id?: string
          likelihood_interview?: string | null
          likelihood_percent?: number | null
          market_position?: string | null
          unique_qualifications?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_connections: {
        Row: {
          contact_id_a: string
          contact_id_b: string
          created_at: string | null
          id: string
          relationship_type: string | null
          user_id: string
        }
        Insert: {
          contact_id_a: string
          contact_id_b: string
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          user_id: string
        }
        Update: {
          contact_id_a?: string
          contact_id_b?: string
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_connections_contact_id_a_fkey"
            columns: ["contact_id_a"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_connections_contact_id_b_fkey"
            columns: ["contact_id_b"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_interactions: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          interaction_date: string
          interaction_type: string
          notes: string | null
          outcome: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type: string
          notes?: string | null
          outcome?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type?: string
          notes?: string | null
          outcome?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_job_links: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_job_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_reminders: {
        Row: {
          completed: boolean
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          reminder_date: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          reminder_date: string
          user_id: string
        }
        Update: {
          completed?: boolean
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          reminder_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          degree: string | null
          email: string | null
          graduation_year: number | null
          id: string
          influence_score: number | null
          interests: string | null
          is_industry_leader: boolean | null
          is_influencer: boolean | null
          last_contacted_at: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          relationship_strength: number | null
          relationship_type: string | null
          role: string | null
          school: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          degree?: string | null
          email?: string | null
          graduation_year?: number | null
          id?: string
          influence_score?: number | null
          interests?: string | null
          is_industry_leader?: boolean | null
          is_influencer?: boolean | null
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          relationship_strength?: number | null
          relationship_type?: string | null
          role?: string | null
          school?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          degree?: string | null
          email?: string | null
          graduation_year?: number | null
          id?: string
          influence_score?: number | null
          interests?: string | null
          is_industry_leader?: boolean | null
          is_influencer?: boolean | null
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          relationship_strength?: number | null
          relationship_type?: string | null
          role?: string | null
          school?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cover_letter_analytics: {
        Row: {
          cover_letter_id: string
          created_at: string | null
          id: string
          job_id: string | null
          opened: boolean | null
          outcome: string | null
          responded: boolean | null
          response_time_hours: number | null
          sent_at: string | null
          updated_at: string | null
          user_id: string
          variant_name: string | null
        }
        Insert: {
          cover_letter_id: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          opened?: boolean | null
          outcome?: string | null
          responded?: boolean | null
          response_time_hours?: number | null
          sent_at?: string | null
          updated_at?: string | null
          user_id: string
          variant_name?: string | null
        }
        Update: {
          cover_letter_id?: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          opened?: boolean | null
          outcome?: string | null
          responded?: boolean | null
          response_time_hours?: number | null
          sent_at?: string | null
          updated_at?: string | null
          user_id?: string
          variant_name?: string | null
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
      custom_report_templates: {
        Row: {
          chart_type: string | null
          created_at: string
          description: string | null
          filters: Json | null
          id: string
          metrics: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chart_type?: string | null
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          metrics: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chart_type?: string | null
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          metrics?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          auto_delete: boolean
          created_at: string
          entity_type: string
          id: string
          institution_id: string
          retention_days: number
        }
        Insert: {
          auto_delete?: boolean
          created_at?: string
          entity_type: string
          id?: string
          institution_id: string
          retention_days: number
        }
        Update: {
          auto_delete?: boolean
          created_at?: string
          entity_type?: string
          id?: string
          institution_id?: string
          retention_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutional_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          comment_text: string
          created_at: string
          document_id: string
          document_type: string
          id: string
          quoted_text: string | null
          resolved: boolean
          selection_end: number | null
          selection_start: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          quoted_text?: string | null
          resolved?: boolean
          selection_end?: number | null
          selection_start?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          quoted_text?: string | null
          resolved?: boolean
          selection_end?: number | null
          selection_start?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_shares_internal: {
        Row: {
          created_at: string
          document_id: string
          document_type: string
          id: string
          owner_id: string
          permission: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          owner_id: string
          permission: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          owner_id?: string
          permission?: string
          shared_with_user_id?: string
        }
        Relationships: []
      }
      email_integrations: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          provider: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          provider: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_tracking: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          detected_status: string | null
          email_body: string | null
          email_subject: string | null
          from_addr: string | null
          id: string
          job_id: string | null
          metadata: Json | null
          processed_at: string | null
          provider_msg_id: string | null
          received_at: string | null
          sender_email: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          detected_status?: string | null
          email_body?: string | null
          email_subject?: string | null
          from_addr?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          processed_at?: string | null
          provider_msg_id?: string | null
          received_at?: string | null
          sender_email?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          detected_status?: string | null
          email_body?: string | null
          email_subject?: string | null
          from_addr?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          processed_at?: string | null
          provider_msg_id?: string | null
          received_at?: string | null
          sender_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          is_resolved: boolean | null
          metadata: Json | null
          resolved_at: string | null
          severity: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_connections: {
        Row: {
          contact_id: string
          created_at: string
          event_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_connections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_connections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "networking_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_outcomes: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          job_id: string | null
          outcome_type: string
          referral_request_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          job_id?: string | null
          outcome_type: string
          referral_request_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          job_id?: string | null
          outcome_type?: string
          referral_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_outcomes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "networking_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_outcomes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_outcomes_referral_request_id_fkey"
            columns: ["referral_request_id"]
            isOneToOne: false
            referencedRelation: "referral_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          contact_id: string
          created_at: string | null
          event_id: string
          id: string
          participant_role: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          event_id: string
          id?: string
          participant_role: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          participant_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "networking_events"
            referencedColumns: ["id"]
          },
        ]
      }
      external_certifications: {
        Row: {
          badge_url: string | null
          certification_name: string
          certification_url: string | null
          completion_date: string | null
          created_at: string
          id: string
          is_verified: boolean | null
          platform: string
          platform_username: string | null
          profile_url: string | null
          rank: string | null
          score: string | null
          skills_validated: Json | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          badge_url?: string | null
          certification_name: string
          certification_url?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          platform: string
          platform_username?: string | null
          profile_url?: string | null
          rank?: string | null
          score?: string | null
          skills_validated?: Json | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          badge_url?: string | null
          certification_name?: string
          certification_url?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          platform?: string
          platform_username?: string | null
          profile_url?: string | null
          rank?: string | null
          score?: string | null
          skills_validated?: Json | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      family_supporters: {
        Row: {
          accepted_at: string | null
          access_level: string
          can_send_messages: boolean | null
          created_at: string | null
          id: string
          invite_token: string
          invited_at: string | null
          is_muted: boolean | null
          relationship: string
          supporter_email: string
          supporter_name: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          access_level?: string
          can_send_messages?: boolean | null
          created_at?: string | null
          id?: string
          invite_token: string
          invited_at?: string | null
          is_muted?: boolean | null
          relationship: string
          supporter_email: string
          supporter_name: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          access_level?: string
          can_send_messages?: boolean | null
          created_at?: string | null
          id?: string
          invite_token?: string
          invited_at?: string | null
          is_muted?: boolean | null
          relationship?: string
          supporter_email?: string
          supporter_name?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_analytics: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          event_category: string | null
          event_name: string
          event_properties: Json | null
          id: string
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_category?: string | null
          event_name: string
          event_properties?: Json | null
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_category?: string | null
          event_name?: string
          event_properties?: Json | null
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      follow_up_reminders: {
        Row: {
          auto_generated: boolean | null
          completed_at: string | null
          created_at: string
          dismissed_at: string | null
          email_template: string | null
          id: string
          job_id: string | null
          notes: string | null
          reminder_type: string
          scheduled_date: string
          snoozed_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_generated?: boolean | null
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          email_template?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          reminder_type: string
          scheduled_date: string
          snoozed_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_generated?: boolean | null
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          email_template?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          reminder_type?: string
          scheduled_date?: string
          snoozed_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          accuracy_score: number | null
          actual_value: number | null
          based_on_data: Json
          confidence_level: string
          created_at: string
          forecast_date: string
          forecast_type: string
          id: string
          prediction_value: number
          target_date: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_value?: number | null
          based_on_data: Json
          confidence_level: string
          created_at?: string
          forecast_date?: string
          forecast_type: string
          id?: string
          prediction_value: number
          target_date: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: number | null
          based_on_data?: Json
          confidence_level?: string
          created_at?: string
          forecast_date?: string
          forecast_type?: string
          id?: string
          prediction_value?: number
          target_date?: string
          user_id?: string
        }
        Relationships: []
      }
      geocoded_locations: {
        Row: {
          cached_at: string
          city: string | null
          country: string | null
          formatted_address: string | null
          id: string
          latitude: number | null
          location_string: string
          longitude: number | null
          state: string | null
          timezone: string | null
        }
        Insert: {
          cached_at?: string
          city?: string | null
          country?: string | null
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          location_string: string
          longitude?: number | null
          state?: string | null
          timezone?: string | null
        }
        Update: {
          cached_at?: string
          city?: string | null
          country?: string | null
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          location_string?: string
          longitude?: number | null
          state?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      github_integrations: {
        Row: {
          access_token: string | null
          avatar_url: string | null
          created_at: string
          followers: number | null
          github_username: string
          id: string
          last_synced_at: string | null
          profile_url: string | null
          public_repos: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          followers?: number | null
          github_username: string
          id?: string
          last_synced_at?: string | null
          profile_url?: string | null
          public_repos?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          followers?: number | null
          github_username?: string
          id?: string
          last_synced_at?: string | null
          profile_url?: string | null
          public_repos?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      github_repositories: {
        Row: {
          created_at: string
          created_at_github: string | null
          description: string | null
          forks_count: number | null
          full_name: string | null
          github_id: number
          html_url: string
          id: string
          is_featured: boolean | null
          language: string | null
          languages: Json | null
          last_commit_at: string | null
          name: string
          open_issues_count: number | null
          stargazers_count: number | null
          topics: Json | null
          updated_at: string
          updated_at_github: string | null
          user_id: string
          watchers_count: number | null
        }
        Insert: {
          created_at?: string
          created_at_github?: string | null
          description?: string | null
          forks_count?: number | null
          full_name?: string | null
          github_id: number
          html_url: string
          id?: string
          is_featured?: boolean | null
          language?: string | null
          languages?: Json | null
          last_commit_at?: string | null
          name: string
          open_issues_count?: number | null
          stargazers_count?: number | null
          topics?: Json | null
          updated_at?: string
          updated_at_github?: string | null
          user_id: string
          watchers_count?: number | null
        }
        Update: {
          created_at?: string
          created_at_github?: string | null
          description?: string | null
          forks_count?: number | null
          full_name?: string | null
          github_id?: number
          html_url?: string
          id?: string
          is_featured?: boolean | null
          language?: string | null
          languages?: Json | null
          last_commit_at?: string | null
          name?: string
          open_issues_count?: number | null
          stargazers_count?: number | null
          topics?: Json | null
          updated_at?: string
          updated_at_github?: string | null
          user_id?: string
          watchers_count?: number | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          achievable: string | null
          category: string
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          is_shared: boolean | null
          measurable: string | null
          milestones: Json | null
          relevant: string | null
          specific: string | null
          status: string
          target_date: string | null
          target_value: number | null
          time_bound: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievable?: string | null
          category: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          measurable?: string | null
          milestones?: Json | null
          relevant?: string | null
          specific?: string | null
          status?: string
          target_date?: string | null
          target_value?: number | null
          time_bound?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievable?: string | null
          category?: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          measurable?: string | null
          milestones?: Json | null
          relevant?: string | null
          specific?: string | null
          status?: string
          target_date?: string | null
          target_value?: number | null
          time_bound?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          created_by: string
          description: string
          duration_days: number
          end_date: string
          group_id: string
          id: string
          start_date: string
          target_value: number
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          created_by: string
          description: string
          duration_days: number
          end_date: string
          group_id: string
          id?: string
          start_date: string
          target_value: number
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          created_by?: string
          description?: string
          duration_days?: number
          end_date?: string
          group_id?: string
          id?: string
          start_date?: string
          target_value?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_challenges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          is_anonymous: boolean
          post_type: string
          reaction_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          is_anonymous?: boolean
          post_type: string
          reaction_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          is_anonymous?: boolean
          post_type?: string
          reaction_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_webinars: {
        Row: {
          created_at: string
          description: string
          duration_minutes: number
          group_id: string
          host_name: string
          id: string
          meeting_link: string | null
          recording_link: string | null
          scheduled_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          duration_minutes?: number
          group_id: string
          host_name: string
          id?: string
          meeting_link?: string | null
          recording_link?: string | null
          scheduled_date: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_minutes?: number
          group_id?: string
          host_name?: string
          id?: string
          meeting_link?: string | null
          recording_link?: string | null
          scheduled_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_webinars_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      informational_interviews: {
        Row: {
          contact_id: string
          created_at: string
          follow_up_tasks: Json | null
          id: string
          outcome_notes: string | null
          outreach_sent_at: string | null
          prep_checklist: Json | null
          scheduled_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          follow_up_tasks?: Json | null
          id?: string
          outcome_notes?: string | null
          outreach_sent_at?: string | null
          prep_checklist?: Json | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          follow_up_tasks?: Json | null
          id?: string
          outcome_notes?: string | null
          outreach_sent_at?: string | null
          prep_checklist?: Json | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "informational_interviews_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_cohorts: {
        Row: {
          cohort_name: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          institution_id: string
          start_date: string
        }
        Insert: {
          cohort_name: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          institution_id: string
          start_date: string
        }
        Update: {
          cohort_name?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          institution_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "institutional_cohorts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutional_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_settings: {
        Row: {
          created_at: string
          created_by: string
          custom_domain: string | null
          id: string
          institution_name: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          custom_domain?: string | null
          id?: string
          institution_name: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          custom_domain?: string | null
          id?: string
          institution_name?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interview_checklists: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          id: string
          interview_id: string
          is_required: boolean
          label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          interview_id: string
          is_required?: boolean
          label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          interview_id?: string
          is_required?: boolean
          label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_checklists_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_followups: {
        Row: {
          created_at: string
          id: string
          interview_id: string
          sent_at: string | null
          status: string
          template_body: string | null
          template_subject: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_id: string
          sent_at?: string | null
          status?: string
          template_body?: string | null
          template_subject?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_id?: string
          sent_at?: string | null
          status?: string
          template_body?: string | null
          template_subject?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_followups_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_response_library: {
        Row: {
          ai_feedback: string | null
          ai_feedback_score: number | null
          companies_used_for: Json | null
          created_at: string
          experiences_referenced: Json | null
          id: string
          is_starred: boolean | null
          question_text: string
          question_type: string
          response_text: string
          skills_demonstrated: Json | null
          success_count: number | null
          tags: Json | null
          times_used: number | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_feedback_score?: number | null
          companies_used_for?: Json | null
          created_at?: string
          experiences_referenced?: Json | null
          id?: string
          is_starred?: boolean | null
          question_text: string
          question_type: string
          response_text: string
          skills_demonstrated?: Json | null
          success_count?: number | null
          tags?: Json | null
          times_used?: number | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          ai_feedback?: string | null
          ai_feedback_score?: number | null
          companies_used_for?: Json | null
          created_at?: string
          experiences_referenced?: Json | null
          id?: string
          is_starred?: boolean | null
          question_text?: string
          question_type?: string
          response_text?: string
          skills_demonstrated?: Json | null
          success_count?: number | null
          tags?: Json | null
          times_used?: number | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      interview_success_predictions: {
        Row: {
          actual_outcome: string | null
          confidence_band: string
          created_at: string
          id: string
          interview_id: string
          outcome_recorded_at: string | null
          predicted_score: number
          prediction_accuracy: number | null
          score_factors: Json
          top_actions: Json
          user_id: string
        }
        Insert: {
          actual_outcome?: string | null
          confidence_band: string
          created_at?: string
          id?: string
          interview_id: string
          outcome_recorded_at?: string | null
          predicted_score: number
          prediction_accuracy?: number | null
          score_factors?: Json
          top_actions?: Json
          user_id: string
        }
        Update: {
          actual_outcome?: string | null
          confidence_band?: string
          created_at?: string
          id?: string
          interview_id?: string
          outcome_recorded_at?: string | null
          predicted_score?: number
          prediction_accuracy?: number | null
          score_factors?: Json
          top_actions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_success_predictions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
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
          duration_minutes: number | null
          id: string
          interview_date: string | null
          interview_type: string | null
          interviewer_name: string | null
          interviewer_names: string[] | null
          interviewer_role: string | null
          job_id: string
          location: string | null
          notes: string | null
          outcome: string | null
          preparation_status: string | null
          reminder_sent: boolean | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          video_link: string | null
        }
        Insert: {
          calendar_event_id?: string | null
          common_questions?: Json | null
          company_research?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          interview_date?: string | null
          interview_type?: string | null
          interviewer_name?: string | null
          interviewer_names?: string[] | null
          interviewer_role?: string | null
          job_id: string
          location?: string | null
          notes?: string | null
          outcome?: string | null
          preparation_status?: string | null
          reminder_sent?: boolean | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          video_link?: string | null
        }
        Update: {
          calendar_event_id?: string | null
          common_questions?: Json | null
          company_research?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          interview_date?: string | null
          interview_type?: string | null
          interviewer_name?: string | null
          interviewer_names?: string[] | null
          interviewer_role?: string | null
          job_id?: string
          location?: string | null
          notes?: string | null
          outcome?: string | null
          preparation_status?: string | null
          reminder_sent?: boolean | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          video_link?: string | null
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
      job_locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          geocoded_at: string | null
          id: string
          job_id: string | null
          latitude: number | null
          location_type: string | null
          longitude: number | null
          postal_code: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          geocoded_at?: string | null
          id?: string
          job_id?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          geocoded_at?: string | null
          id?: string
          job_id?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_locations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
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
      job_offers: {
        Row: {
          base_salary: number | null
          bonus: number | null
          company_name: string
          cost_of_living_index: number | null
          created_at: string
          culture_score: number | null
          deadline: string | null
          decline_reason: string | null
          equity_value: number | null
          growth_score: number | null
          health_insurance_value: number | null
          id: string
          job_id: string | null
          job_title: string
          location: string | null
          notes: string | null
          pto_days: number | null
          remote_policy: string | null
          retirement_match: number | null
          signing_bonus: number | null
          start_date: string | null
          status: string | null
          updated_at: string
          user_id: string
          work_life_balance_score: number | null
        }
        Insert: {
          base_salary?: number | null
          bonus?: number | null
          company_name: string
          cost_of_living_index?: number | null
          created_at?: string
          culture_score?: number | null
          deadline?: string | null
          decline_reason?: string | null
          equity_value?: number | null
          growth_score?: number | null
          health_insurance_value?: number | null
          id?: string
          job_id?: string | null
          job_title: string
          location?: string | null
          notes?: string | null
          pto_days?: number | null
          remote_policy?: string | null
          retirement_match?: number | null
          signing_bonus?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          work_life_balance_score?: number | null
        }
        Update: {
          base_salary?: number | null
          bonus?: number | null
          company_name?: string
          cost_of_living_index?: number | null
          created_at?: string
          culture_score?: number | null
          deadline?: string | null
          decline_reason?: string | null
          equity_value?: number | null
          growth_score?: number | null
          health_insurance_value?: number | null
          id?: string
          job_id?: string | null
          job_title?: string
          location?: string | null
          notes?: string | null
          pto_days?: number | null
          remote_policy?: string | null
          retirement_match?: number | null
          signing_bonus?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          work_life_balance_score?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          application_deadline: string | null
          archive_reason: string | null
          commute_distance_miles: number | null
          commute_time_minutes: number | null
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
          latitude: number | null
          location: string | null
          longitude: number | null
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
          commute_distance_miles?: number | null
          commute_time_minutes?: number | null
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
          latitude?: number | null
          location?: string | null
          longitude?: number | null
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
          commute_distance_miles?: number | null
          commute_time_minutes?: number | null
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
          latitude?: number | null
          location?: string | null
          longitude?: number | null
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
      market_notes: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          location: string | null
          skills: string[] | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          skills?: string[] | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          skills?: string[] | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      materials_usage: {
        Row: {
          cover_letter_id: string | null
          cover_letter_version_name: string | null
          id: string
          job_id: string
          notes: string | null
          resume_id: string | null
          resume_version_name: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          cover_letter_id?: string | null
          cover_letter_version_name?: string | null
          id?: string
          job_id: string
          notes?: string | null
          resume_id?: string | null
          resume_version_name?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          cover_letter_id?: string | null
          cover_letter_version_name?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          resume_id?: string | null
          resume_version_name?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_usage_cover_letter_id_fkey"
            columns: ["cover_letter_id"]
            isOneToOne: false
            referencedRelation: "cover_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_usage_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_feedback: {
        Row: {
          candidate_id: string
          created_at: string
          entity_id: string
          entity_type: string
          feedback_text: string
          id: string
          implemented: boolean
          implemented_at: string | null
          mentor_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          feedback_text: string
          id?: string
          implemented?: boolean
          implemented_at?: string | null
          mentor_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          feedback_text?: string
          id?: string
          implemented?: boolean
          implemented_at?: string | null
          mentor_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_feedback_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_responses: {
        Row: {
          answered_at: string | null
          created_at: string
          followup_rationale: string | null
          id: string
          is_followup: boolean
          question_id: string
          question_order: number
          response_text: string | null
          session_id: string
          started_at: string
          time_taken: number | null
        }
        Insert: {
          answered_at?: string | null
          created_at?: string
          followup_rationale?: string | null
          id?: string
          is_followup?: boolean
          question_id: string
          question_order: number
          response_text?: string | null
          session_id: string
          started_at?: string
          time_taken?: number | null
        }
        Update: {
          answered_at?: string | null
          created_at?: string
          followup_rationale?: string | null
          id?: string
          is_followup?: boolean
          question_id?: string
          question_order?: number
          response_text?: string | null
          session_id?: string
          started_at?: string
          time_taken?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_interview_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_sessions: {
        Row: {
          company_name: string | null
          completed_at: string | null
          created_at: string
          format: string
          id: string
          job_id: string | null
          question_count: number
          started_at: string
          status: string
          target_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          format: string
          id?: string
          job_id?: string | null
          question_count: number
          started_at?: string
          status?: string
          target_role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          format?: string
          id?: string
          job_id?: string | null
          question_count?: number
          started_at?: string
          status?: string
          target_role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mock_interview_summaries: {
        Row: {
          ai_summary: string | null
          avg_response_length: number | null
          completion_rate: number
          created_at: string
          id: string
          session_id: string
          strongest_category: string | null
          top_improvements: Json
          weakest_category: string | null
        }
        Insert: {
          ai_summary?: string | null
          avg_response_length?: number | null
          completion_rate: number
          created_at?: string
          id?: string
          session_id: string
          strongest_category?: string | null
          top_improvements?: Json
          weakest_category?: string | null
        }
        Update: {
          ai_summary?: string | null
          avg_response_length?: number | null
          completion_rate?: number
          created_at?: string
          id?: string
          session_id?: string
          strongest_category?: string | null
          top_improvements?: Json
          weakest_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_campaigns: {
        Row: {
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          name: string
          start_date: string | null
          target_companies: string[] | null
          target_roles: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          start_date?: string | null
          target_companies?: string[] | null
          target_roles?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          start_date?: string | null
          target_companies?: string[] | null
          target_roles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      networking_events: {
        Row: {
          attended: boolean
          created_at: string
          event_date: string
          event_type: string
          goals: string | null
          id: string
          location: string | null
          notes: string | null
          prep_checklist: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          created_at?: string
          event_date: string
          event_type?: string
          goals?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          prep_checklist?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean
          created_at?: string
          event_date?: string
          event_type?: string
          goals?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          prep_checklist?: Json | null
          title?: string
          updated_at?: string
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
      offer_comparisons: {
        Row: {
          comparison_weights: Json | null
          created_at: string
          id: string
          name: string
          notes: string | null
          offer_ids: Json | null
          updated_at: string
          user_id: string
          winner_offer_id: string | null
        }
        Insert: {
          comparison_weights?: Json | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          offer_ids?: Json | null
          updated_at?: string
          user_id: string
          winner_offer_id?: string | null
        }
        Update: {
          comparison_weights?: Json | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          offer_ids?: Json | null
          updated_at?: string
          user_id?: string
          winner_offer_id?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          adjusted_compensation: number | null
          base_salary: number | null
          bonus: number | null
          commute_time_minutes: number | null
          confidence_checklist: Json | null
          cost_of_living_index: number | null
          created_at: string
          culture_fit_score: number | null
          equity: string | null
          growth_opportunities_score: number | null
          health_insurance_value: number | null
          id: string
          job_id: string
          level: string | null
          location: string | null
          market_data: Json | null
          notes: string | null
          pto_days: number | null
          relocation_bonus: number | null
          remote_policy: string | null
          retirement_match_percent: number | null
          signing_bonus: number | null
          status: string
          total_compensation: number | null
          updated_at: string
          user_id: string
          work_life_balance_score: number | null
        }
        Insert: {
          adjusted_compensation?: number | null
          base_salary?: number | null
          bonus?: number | null
          commute_time_minutes?: number | null
          confidence_checklist?: Json | null
          cost_of_living_index?: number | null
          created_at?: string
          culture_fit_score?: number | null
          equity?: string | null
          growth_opportunities_score?: number | null
          health_insurance_value?: number | null
          id?: string
          job_id: string
          level?: string | null
          location?: string | null
          market_data?: Json | null
          notes?: string | null
          pto_days?: number | null
          relocation_bonus?: number | null
          remote_policy?: string | null
          retirement_match_percent?: number | null
          signing_bonus?: number | null
          status?: string
          total_compensation?: number | null
          updated_at?: string
          user_id: string
          work_life_balance_score?: number | null
        }
        Update: {
          adjusted_compensation?: number | null
          base_salary?: number | null
          bonus?: number | null
          commute_time_minutes?: number | null
          confidence_checklist?: Json | null
          cost_of_living_index?: number | null
          created_at?: string
          culture_fit_score?: number | null
          equity?: string | null
          growth_opportunities_score?: number | null
          health_insurance_value?: number | null
          id?: string
          job_id?: string
          level?: string | null
          location?: string | null
          market_data?: Json | null
          notes?: string | null
          pto_days?: number | null
          relocation_bonus?: number | null
          remote_policy?: string | null
          retirement_match_percent?: number | null
          signing_bonus?: number | null
          status?: string
          total_compensation?: number | null
          updated_at?: string
          user_id?: string
          work_life_balance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_referrals: {
        Row: {
          application_url: string | null
          company_name: string
          created_at: string
          description: string | null
          expires_at: string | null
          group_id: string
          id: string
          referral_type: string
          role_title: string
          shared_by_user_id: string
        }
        Insert: {
          application_url?: string | null
          company_name: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          group_id: string
          id?: string
          referral_type: string
          role_title: string
          shared_by_user_id: string
        }
        Update: {
          application_url?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          group_id?: string
          id?: string
          referral_type?: string
          role_title?: string
          shared_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_referrals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_applications: {
        Row: {
          applied_at: string | null
          created_at: string
          detected_from: string | null
          duplicate_of_id: string | null
          id: string
          is_duplicate: boolean | null
          job_id: string | null
          last_platform_update: string | null
          platform: string
          platform_job_id: string | null
          platform_url: string | null
          raw_data: Json | null
          status_on_platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          detected_from?: string | null
          duplicate_of_id?: string | null
          id?: string
          is_duplicate?: boolean | null
          job_id?: string | null
          last_platform_update?: string | null
          platform: string
          platform_job_id?: string | null
          platform_url?: string | null
          raw_data?: Json | null
          status_on_platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          detected_from?: string | null
          duplicate_of_id?: string | null
          id?: string
          is_duplicate?: boolean | null
          job_id?: string | null
          last_platform_update?: string | null
          platform?: string
          platform_job_id?: string | null
          platform_url?: string | null
          raw_data?: Json | null
          status_on_platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_references: {
        Row: {
          can_speak_to: string[] | null
          contact_id: string
          contact_preference: string | null
          created_at: string
          id: string
          notes: string | null
          relationship_description: string | null
          times_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_speak_to?: string[] | null
          contact_id: string
          contact_preference?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          relationship_description?: string | null
          times_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_speak_to?: string[] | null
          contact_id?: string
          contact_preference?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          relationship_description?: string | null
          times_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_references_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: Json | null
          created_at: string | null
          education: Json | null
          email: string | null
          email_reminders: boolean | null
          employment_history: Json | null
          experience_level: string | null
          github_url: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          location: string | null
          name: string | null
          phone_number: string | null
          portfolio_url: string | null
          professional_headline: string | null
          projects: Json | null
          reminder_days: number[] | null
          skills: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          email_reminders?: boolean | null
          employment_history?: Json | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          professional_headline?: string | null
          projects?: Json | null
          reminder_days?: number[] | null
          skills?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          email_reminders?: boolean | null
          employment_history?: Json | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          professional_headline?: string | null
          projects?: Json | null
          reminder_days?: number[] | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      progress_share_access_log: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          share_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          share_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          share_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_share_access_log_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "progress_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          notes: string | null
          scope: string
          share_token: string
          shared_with_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          notes?: string | null
          scope: string
          share_token: string
          shared_with_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          notes?: string | null
          scope?: string
          share_token?: string
          shared_with_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_bank_items: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          id: string
          industry: string | null
          linked_skills: string[] | null
          question_text: string
          role_title: string
          source: string | null
          star_framework_hint: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          difficulty: string
          id?: string
          industry?: string | null
          linked_skills?: string[] | null
          question_text: string
          role_title: string
          source?: string | null
          star_framework_hint?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          industry?: string | null
          linked_skills?: string[] | null
          question_text?: string
          role_title?: string
          source?: string | null
          star_framework_hint?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_practice: {
        Row: {
          created_at: string
          id: string
          last_practiced_at: string
          question_id: string
          response_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_practiced_at?: string
          question_id: string
          response_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_practiced_at?: string
          question_id?: string
          response_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_practice_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank_items"
            referencedColumns: ["id"]
          },
        ]
      }
      question_practice_feedback: {
        Row: {
          alternative_approaches: string[] | null
          clarity_score: number | null
          created_at: string
          general_feedback: string | null
          id: string
          impact_score: number | null
          overall_score: number | null
          relevance_score: number | null
          response_id: string
          speaking_time_estimate: number | null
          specificity_score: number | null
          star_adherence: Json | null
          weak_language: Json | null
        }
        Insert: {
          alternative_approaches?: string[] | null
          clarity_score?: number | null
          created_at?: string
          general_feedback?: string | null
          id?: string
          impact_score?: number | null
          overall_score?: number | null
          relevance_score?: number | null
          response_id: string
          speaking_time_estimate?: number | null
          specificity_score?: number | null
          star_adherence?: Json | null
          weak_language?: Json | null
        }
        Update: {
          alternative_approaches?: string[] | null
          clarity_score?: number | null
          created_at?: string
          general_feedback?: string | null
          id?: string
          impact_score?: number | null
          overall_score?: number | null
          relevance_score?: number | null
          response_id?: string
          speaking_time_estimate?: number | null
          specificity_score?: number | null
          star_adherence?: Json | null
          weak_language?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "question_practice_feedback_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "question_practice_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      question_practice_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_text: string
          status: string
          time_taken: number | null
          timer_duration: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_text: string
          status?: string
          time_taken?: number | null
          timer_duration?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_text?: string
          status?: string
          time_taken?: number | null
          timer_duration?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_practice_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_requests: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          notes: string | null
          provided_at: string | null
          reference_id: string
          requested_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          provided_at?: string | null
          reference_id: string
          requested_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          provided_at?: string | null
          reference_id?: string
          requested_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_requests_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "professional_references"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_requests: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          job_id: string
          last_action_at: string
          message_sent: string | null
          next_followup_at: string | null
          notes: string | null
          optimal_send_time: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          job_id: string
          last_action_at?: string
          message_sent?: string | null
          next_followup_at?: string | null
          notes?: string | null
          optimal_send_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          job_id?: string
          last_action_at?: string
          message_sent?: string | null
          next_followup_at?: string | null
          notes?: string | null
          optimal_send_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      response_time_predictions: {
        Row: {
          actual_response_days: number | null
          confidence_percent: number | null
          created_at: string
          factors: Json | null
          id: string
          is_overdue: boolean | null
          job_id: string
          predicted_days_avg: number | null
          predicted_days_max: number | null
          predicted_days_min: number | null
          suggested_followup_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_response_days?: number | null
          confidence_percent?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          is_overdue?: boolean | null
          job_id: string
          predicted_days_avg?: number | null
          predicted_days_max?: number | null
          predicted_days_min?: number | null
          suggested_followup_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_response_days?: number | null
          confidence_percent?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          is_overdue?: boolean | null
          job_id?: string
          predicted_days_avg?: number | null
          predicted_days_max?: number | null
          predicted_days_min?: number | null
          suggested_followup_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_time_predictions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_comments: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          share_id: string
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          share_id: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_comments_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "resume_shares_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_experience_variants: {
        Row: {
          accepted: boolean
          content_markdown: string
          created_at: string
          id: string
          job_id: string | null
          relevance_score: number
          resume_experience_id: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          content_markdown: string
          created_at?: string
          id?: string
          job_id?: string | null
          relevance_score: number
          resume_experience_id: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          content_markdown?: string
          created_at?: string
          id?: string
          job_id?: string | null
          relevance_score?: number
          resume_experience_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_experience_variants_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_shares: {
        Row: {
          access_level: string
          created_at: string | null
          expires_at: string | null
          id: string
          resume_id: string
          share_token: string
          shared_with_email: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          resume_id: string
          share_token: string
          shared_with_email: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          resume_id?: string
          share_token?: string
          shared_with_email?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_shares_v2: {
        Row: {
          can_comment: boolean
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          resume_id: string
          share_token: string
          user_id: string
        }
        Insert: {
          can_comment?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          resume_id: string
          share_token: string
          user_id: string
        }
        Update: {
          can_comment?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          resume_id?: string
          share_token?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_templates: {
        Row: {
          content_markdown: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_markdown: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_markdown?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
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
      salary_benchmarks: {
        Row: {
          created_at: string
          data_source: string
          fetched_at: string
          id: string
          industry: string | null
          job_title: string
          location: string | null
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          sample_size: number | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_source?: string
          fetched_at?: string
          id?: string
          industry?: string | null
          job_title: string
          location?: string | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          sample_size?: number | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_source?: string
          fetched_at?: string
          id?: string
          industry?: string | null
          job_title?: string
          location?: string | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          sample_size?: number | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_payments: {
        Row: {
          advisor_id: string
          amount: number
          client_user_id: string
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payment_provider: string | null
          payment_status: string
          provider_transaction_id: string | null
          session_id: string
        }
        Insert: {
          advisor_id: string
          amount: number
          client_user_id: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_status?: string
          provider_transaction_id?: string | null
          session_id: string
        }
        Update: {
          advisor_id?: string
          amount?: number
          client_user_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_status?: string
          provider_transaction_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_payments_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          privacy_level: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          privacy_level?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          privacy_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      support_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_type: string
          id: string
          industry: string | null
          is_private: boolean
          location: string | null
          member_count: number
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_type: string
          id?: string
          industry?: string | null
          is_private?: boolean
          location?: string | null
          member_count?: number
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_type?: string
          id?: string
          industry?: string | null
          is_private?: boolean
          location?: string | null
          member_count?: number
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supporter_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string
          supporter_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          supporter_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          supporter_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supporter_messages_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "family_supporters"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      technical_challenges: {
        Row: {
          best_practices: string | null
          category: string
          created_at: string
          difficulty: string
          hints: Json | null
          id: string
          problem_statement: string
          solution_framework: string | null
          tech_stack: string[]
          title: string
          updated_at: string
        }
        Insert: {
          best_practices?: string | null
          category: string
          created_at?: string
          difficulty: string
          hints?: Json | null
          id?: string
          problem_statement: string
          solution_framework?: string | null
          tech_stack?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          best_practices?: string | null
          category?: string
          created_at?: string
          difficulty?: string
          hints?: Json | null
          id?: string
          problem_statement?: string
          solution_framework?: string | null
          tech_stack?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      technical_practice_attempts: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          language: string
          notes: string | null
          rubric_checklist: Json
          solution_code: string | null
          started_at: string
          status: string
          submitted_at: string | null
          time_taken: number | null
          timer_duration: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          language?: string
          notes?: string | null
          rubric_checklist?: Json
          solution_code?: string | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_taken?: number | null
          timer_duration?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          language?: string
          notes?: string | null
          rubric_checklist?: Json
          solution_code?: string | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_taken?: number | null
          timer_duration?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_practice_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "technical_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking: {
        Row: {
          activity_type: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          job_id: string | null
          notes: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          started_at: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_benchmarks: {
        Row: {
          created_at: string
          id: string
          metric_type: string
          period: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_type: string
          period: string
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_type?: string
          period?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_home_location: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_updates: {
        Row: {
          created_at: string | null
          id: string
          update_text: string
          update_type: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          update_text: string
          update_type: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          update_text?: string
          update_type?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_candidate_data: {
        Args: { _candidate_id: string; _viewer_id: string }
        Returns: boolean
      }
      has_document_access: {
        Args: { _document_id: string; _document_type: string; _user_id: string }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      team_role: "admin" | "mentor" | "candidate"
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
      team_role: ["admin", "mentor", "candidate"],
    },
  },
} as const
