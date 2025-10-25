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
      activities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          analysis_data: Json | null
          budget_data: Json | null
          created_at: string
          id: string
          report_data: Json | null
          simulation_id: string
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          budget_data?: Json | null
          created_at?: string
          id?: string
          report_data?: Json | null
          simulation_id: string
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          budget_data?: Json | null
          created_at?: string
          id?: string
          report_data?: Json | null
          simulation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          after_image: string | null
          analysis_id: string | null
          before_image: string | null
          budget_number: string
          budget_type: string | null
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_price: number
          id: string
          items: Json | null
          patient_id: string | null
          patient_name: string | null
          payment_conditions: Json | null
          pdf_url: string | null
          price_per_tooth: number | null
          simulation_id: string | null
          status: string | null
          subtotal: number
          teeth_count: number
          treatment_type: string
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          after_image?: string | null
          analysis_id?: string | null
          before_image?: string | null
          budget_number: string
          budget_type?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price: number
          id?: string
          items?: Json | null
          patient_id?: string | null
          patient_name?: string | null
          payment_conditions?: Json | null
          pdf_url?: string | null
          price_per_tooth?: number | null
          simulation_id?: string | null
          status?: string | null
          subtotal: number
          teeth_count: number
          treatment_type?: string
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          after_image?: string | null
          analysis_id?: string | null
          before_image?: string | null
          budget_number?: string
          budget_type?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number
          id?: string
          items?: Json | null
          patient_id?: string | null
          patient_name?: string | null
          payment_conditions?: Json | null
          pdf_url?: string | null
          price_per_tooth?: number | null
          simulation_id?: string | null
          status?: string | null
          subtotal?: number
          teeth_count?: number
          treatment_type?: string
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          after_image: string | null
          before_image: string | null
          created_at: string
          id: string
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          simulation_id: string | null
          source: string
          status: string
          treatment_type: string | null
          user_id: string
        }
        Insert: {
          after_image?: string | null
          before_image?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          simulation_id?: string | null
          source?: string
          status?: string
          treatment_type?: string | null
          user_id: string
        }
        Update: {
          after_image?: string | null
          before_image?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          simulation_id?: string | null
          source?: string
          status?: string
          treatment_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          opportunity_value: number | null
          patient_id: string | null
          phone: string
          source: string | null
          stage: string | null
          status: string | null
          tags: string[] | null
          treatment_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          opportunity_value?: number | null
          patient_id?: string | null
          phone: string
          source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          treatment_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          opportunity_value?: number | null
          patient_id?: string | null
          phone?: string
          source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          treatment_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          last_simulation_date: string | null
          name: string
          notes: string | null
          phone: string
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_simulation_date?: string | null
          name: string
          notes?: string | null
          phone: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_simulation_date?: string | null
          name?: string
          notes?: string | null
          phone?: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          after_image: string | null
          analysis_id: string | null
          before_image: string | null
          created_at: string
          id: string
          model_name: string | null
          patient_id: string | null
          patient_name: string
          pdf_url: string | null
          prompt_sha256: string | null
          prompt_version: string | null
          report_number: string
          simulation_id: string | null
          treatment_type: string | null
          user_id: string
        }
        Insert: {
          after_image?: string | null
          analysis_id?: string | null
          before_image?: string | null
          created_at?: string
          id?: string
          model_name?: string | null
          patient_id?: string | null
          patient_name: string
          pdf_url?: string | null
          prompt_sha256?: string | null
          prompt_version?: string | null
          report_number: string
          simulation_id?: string | null
          treatment_type?: string | null
          user_id: string
        }
        Update: {
          after_image?: string | null
          analysis_id?: string | null
          before_image?: string | null
          created_at?: string
          id?: string
          model_name?: string | null
          patient_id?: string | null
          patient_name?: string
          pdf_url?: string | null
          prompt_sha256?: string | null
          prompt_version?: string | null
          report_number?: string
          simulation_id?: string | null
          treatment_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          base: boolean
          categoria: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          observacoes: string | null
          price: number
          required: boolean
          tipo_servico: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          base?: boolean
          categoria?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          observacoes?: string | null
          price?: number
          required?: boolean
          tipo_servico: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          base?: boolean
          categoria?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          observacoes?: string | null
          price?: number
          required?: boolean
          tipo_servico?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          budget_data: Json | null
          budget_pdf_url: string | null
          created_at: string | null
          error_message: string | null
          final_price: number | null
          id: string
          idempotency_key: string | null
          original_image_url: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          price_per_tooth: number | null
          processed_image_url: string | null
          retry_count: number | null
          run_id: string | null
          status: string | null
          technical_notes: string | null
          technical_report_url: string | null
          teeth_analyzed: Json | null
          teeth_count: number | null
          total_price: number | null
          treatment_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_data?: Json | null
          budget_pdf_url?: string | null
          created_at?: string | null
          error_message?: string | null
          final_price?: number | null
          id?: string
          idempotency_key?: string | null
          original_image_url?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          price_per_tooth?: number | null
          processed_image_url?: string | null
          retry_count?: number | null
          run_id?: string | null
          status?: string | null
          technical_notes?: string | null
          technical_report_url?: string | null
          teeth_analyzed?: Json | null
          teeth_count?: number | null
          total_price?: number | null
          treatment_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_data?: Json | null
          budget_pdf_url?: string | null
          created_at?: string | null
          error_message?: string | null
          final_price?: number | null
          id?: string
          idempotency_key?: string | null
          original_image_url?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          price_per_tooth?: number | null
          processed_image_url?: string | null
          retry_count?: number | null
          run_id?: string | null
          status?: string | null
          technical_notes?: string | null
          technical_report_url?: string | null
          teeth_analyzed?: Json | null
          teeth_count?: number | null
          total_price?: number | null
          treatment_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_configs: {
        Row: {
          api_key: string
          backend_url: string
          claude_api_key: string | null
          clinic_address: string | null
          clinic_city: string | null
          clinic_email: string | null
          clinic_logo_url: string | null
          clinic_name: string | null
          clinic_phone: string | null
          clinic_state: string | null
          clinic_zip_code: string | null
          created_at: string
          crm_enabled: boolean | null
          facets_simulator_enabled: boolean | null
          id: string
          max_tokens: number
          profile_picture_url: string | null
          prompt_template: string
          temperature: number
          top_k: number
          top_p: number
          updated_at: string
          use_claude: boolean | null
          user_email: string | null
          user_id: string
          user_name: string | null
          user_phone: string | null
          whitening_simulator_enabled: boolean | null
        }
        Insert: {
          api_key: string
          backend_url: string
          claude_api_key?: string | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_email?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_state?: string | null
          clinic_zip_code?: string | null
          created_at?: string
          crm_enabled?: boolean | null
          facets_simulator_enabled?: boolean | null
          id?: string
          max_tokens?: number
          profile_picture_url?: string | null
          prompt_template: string
          temperature?: number
          top_k?: number
          top_p?: number
          updated_at?: string
          use_claude?: boolean | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
          user_phone?: string | null
          whitening_simulator_enabled?: boolean | null
        }
        Update: {
          api_key?: string
          backend_url?: string
          claude_api_key?: string | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_email?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_state?: string | null
          clinic_zip_code?: string | null
          created_at?: string
          crm_enabled?: boolean | null
          facets_simulator_enabled?: boolean | null
          id?: string
          max_tokens?: number
          profile_picture_url?: string | null
          prompt_template?: string
          temperature?: number
          top_k?: number
          top_p?: number
          updated_at?: string
          use_claude?: boolean | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          user_phone?: string | null
          whitening_simulator_enabled?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
