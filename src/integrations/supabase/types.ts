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
      contact_enquiries: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pickup_request_items: {
        Row: {
          category_id: string
          category_name: string
          id: string
          line_estimate: number
          quantity: number
          rate_snapshot: number
          request_id: string
          unit: Database["public"]["Enums"]["scrap_unit"]
        }
        Insert: {
          category_id: string
          category_name: string
          id?: string
          line_estimate: number
          quantity: number
          rate_snapshot: number
          request_id: string
          unit: Database["public"]["Enums"]["scrap_unit"]
        }
        Update: {
          category_id?: string
          category_name?: string
          id?: string
          line_estimate?: number
          quantity?: number
          rate_snapshot?: number
          request_id?: string
          unit?: Database["public"]["Enums"]["scrap_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "pickup_request_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "current_scrap_rates"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "pickup_request_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "scrap_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          address: string
          created_at: string
          customer_id: string | null
          customer_name: string
          estimated_total: number
          final_total: number | null
          id: string
          mobile: string
          notes: string | null
          pincode: string
          preferred_date: string | null
          request_code: string
          status: Database["public"]["Enums"]["pickup_status"]
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          estimated_total?: number
          final_total?: number | null
          id?: string
          mobile: string
          notes?: string | null
          pincode: string
          preferred_date?: string | null
          request_code: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          estimated_total?: number
          final_total?: number | null
          id?: string
          mobile?: string
          notes?: string | null
          pincode?: string
          preferred_date?: string | null
          request_code?: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string | null
          id: string
          mobile: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          mobile?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mobile?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      request_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["pickup_status"] | null
          id: string
          request_id: string
          to_status: Database["public"]["Enums"]["pickup_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["pickup_status"] | null
          id?: string
          request_id: string
          to_status: Database["public"]["Enums"]["pickup_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["pickup_status"] | null
          id?: string
          request_id?: string
          to_status?: Database["public"]["Enums"]["pickup_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      scrap_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          unit: Database["public"]["Enums"]["scrap_unit"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          unit?: Database["public"]["Enums"]["scrap_unit"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          unit?: Database["public"]["Enums"]["scrap_unit"]
          updated_at?: string
        }
        Relationships: []
      }
      scrap_rates: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          effective_from: string
          id: string
          rate_per_unit: number
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          rate_per_unit: number
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          rate_per_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "scrap_rates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "current_scrap_rates"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "scrap_rates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "scrap_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_scrap_rates: {
        Row: {
          category_id: string | null
          description: string | null
          image_url: string | null
          name: string | null
          rate_per_unit: number | null
          rate_updated_at: string | null
          slug: string | null
          sort_order: number | null
          unit: Database["public"]["Enums"]["scrap_unit"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_scrap_category: { Args: { _id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_pickup_request: {
        Args: {
          _address: string
          _items: Json
          _mobile: string
          _name: string
          _notes: string
          _pincode: string
          _preferred_date: string
        }
        Returns: {
          estimated_total: number
          request_code: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      enquiry_status: "new" | "in_progress" | "resolved"
      pickup_status:
        | "pending"
        | "confirmed"
        | "assigned"
        | "picked_up"
        | "completed"
        | "cancelled"
      scrap_unit: "kg" | "piece" | "litre"
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
      app_role: ["admin", "customer"],
      enquiry_status: ["new", "in_progress", "resolved"],
      pickup_status: [
        "pending",
        "confirmed",
        "assigned",
        "picked_up",
        "completed",
        "cancelled",
      ],
      scrap_unit: ["kg", "piece", "litre"],
    },
  },
} as const
