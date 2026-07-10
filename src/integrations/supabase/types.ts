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
      customer_loyalty: {
        Row: {
          created_at: string
          id: string
          points: number
          referral_code: string | null
          tier: string
          total_purchases: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          referral_code?: string | null
          tier?: string
          total_purchases?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          referral_code?: string | null
          tier?: string
          total_purchases?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          active: boolean
          battery_replacement: number
          brand: string
          colors: string[]
          condition: string
          created_at: string
          id: string
          model: string
          os: string
          price: number
          rear_glass_replacement: number
          screen_replacement: number
          storage: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          battery_replacement?: number
          brand: string
          colors?: string[]
          condition: string
          created_at?: string
          id?: string
          model: string
          os?: string
          price?: number
          rear_glass_replacement?: number
          screen_replacement?: number
          storage?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          battery_replacement?: number
          brand?: string
          colors?: string[]
          condition?: string
          created_at?: string
          id?: string
          model?: string
          os?: string
          price?: number
          rear_glass_replacement?: number
          screen_replacement?: number
          storage?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          cost_price: number | null
          created_at: string
          description: string | null
          device_brand: string
          device_condition: string
          device_model: string
          id: string
          is_active: boolean
          order_id: string | null
          price: number
          quantity_available: number
          sku: string | null
          sold_at: string | null
          sold_to_user_id: string | null
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          description?: string | null
          device_brand: string
          device_condition: string
          device_model: string
          id?: string
          is_active?: boolean
          order_id?: string | null
          price?: number
          quantity_available?: number
          sku?: string | null
          sold_at?: string | null
          sold_to_user_id?: string | null
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          description?: string | null
          device_brand?: string
          device_condition?: string
          device_model?: string
          id?: string
          is_active?: boolean
          order_id?: string | null
          price?: number
          quantity_available?: number
          sku?: string | null
          sold_at?: string | null
          sold_to_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parts_audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          payload: Json | null
          rate_used: number | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          payload?: Json | null
          rate_used?: number | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          payload?: Json | null
          rate_used?: number | null
        }
        Relationships: []
      }
      parts_collections: {
        Row: {
          amount_jmd: number
          collected_at: string
          confirmed_at: string | null
          confirmed_by: string | null
          id: string
          recorded_by: string | null
          sale_id: string
          status: string
        }
        Insert: {
          amount_jmd: number
          collected_at?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          id?: string
          recorded_by?: string | null
          sale_id: string
          status?: string
        }
        Update: {
          amount_jmd?: number
          collected_at?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          id?: string
          recorded_by?: string | null
          sale_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_collections_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "parts_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_deposits: {
        Row: {
          amount_jmd: number
          created_at: string
          deposited_at: string
          id: string
          recorded_by: string | null
          reference: string | null
          status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_jmd: number
          created_at?: string
          deposited_at?: string
          id?: string
          recorded_by?: string | null
          reference?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_jmd?: number
          created_at?: string
          deposited_at?: string
          id?: string
          recorded_by?: string | null
          reference?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      parts_exchange_rate_history: {
        Row: {
          effective_at: string
          id: string
          rate: number
          set_by: string | null
        }
        Insert: {
          effective_at?: string
          id?: string
          rate: number
          set_by?: string | null
        }
        Update: {
          effective_at?: string
          id?: string
          rate?: number
          set_by?: string | null
        }
        Relationships: []
      }
      parts_inventory: {
        Row: {
          archived: boolean
          category: string | null
          cost_per_unit_usd: number
          created_at: string
          created_by: string | null
          date_ordered: string | null
          discount_is_percent: boolean
          discount_value: number
          id: string
          item_name: string
          locked_rate: number | null
          product_cost_usd: number
          qty_available: number
          qty_ordered: number
          selling_price_jmd: number
          shipping_usd: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          category?: string | null
          cost_per_unit_usd?: number
          created_at?: string
          created_by?: string | null
          date_ordered?: string | null
          discount_is_percent?: boolean
          discount_value?: number
          id?: string
          item_name: string
          locked_rate?: number | null
          product_cost_usd?: number
          qty_available?: number
          qty_ordered?: number
          selling_price_jmd?: number
          shipping_usd?: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          category?: string | null
          cost_per_unit_usd?: number
          created_at?: string
          created_by?: string | null
          date_ordered?: string | null
          discount_is_percent?: boolean
          discount_value?: number
          id?: string
          item_name?: string
          locked_rate?: number | null
          product_cost_usd?: number
          qty_available?: number
          qty_ordered?: number
          selling_price_jmd?: number
          shipping_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      parts_misc_orders: {
        Row: {
          cost_currency: string
          cost_input: number
          cost_jmd: number
          created_at: string
          created_by: string | null
          date_added: string
          description: string
          id: string
          rate_used: number
        }
        Insert: {
          cost_currency: string
          cost_input: number
          cost_jmd: number
          created_at?: string
          created_by?: string | null
          date_added?: string
          description: string
          id?: string
          rate_used: number
        }
        Update: {
          cost_currency?: string
          cost_input?: number
          cost_jmd?: number
          created_at?: string
          created_by?: string | null
          date_added?: string
          description?: string
          id?: string
          rate_used?: number
        }
        Relationships: []
      }
      parts_misc_payments: {
        Row: {
          amount_jmd: number
          id: string
          misc_order_id: string
          paid_at: string
          recorded_by: string | null
        }
        Insert: {
          amount_jmd: number
          id?: string
          misc_order_id: string
          paid_at?: string
          recorded_by?: string | null
        }
        Update: {
          amount_jmd?: number
          id?: string
          misc_order_id?: string
          paid_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_misc_payments_misc_order_id_fkey"
            columns: ["misc_order_id"]
            isOneToOne: false
            referencedRelation: "parts_misc_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_misc_payments_misc_order_id_fkey"
            columns: ["misc_order_id"]
            isOneToOne: false
            referencedRelation: "parts_misc_orders_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_sales: {
        Row: {
          created_at: string
          customer_note: string | null
          id: string
          inventory_id: string
          rate_at_sale: number
          sold_by: string | null
          total_jmd: number
          unit_price_jmd: number
          units_sold: number
        }
        Insert: {
          created_at?: string
          customer_note?: string | null
          id?: string
          inventory_id: string
          rate_at_sale: number
          sold_by?: string | null
          total_jmd: number
          unit_price_jmd: number
          units_sold: number
        }
        Update: {
          created_at?: string
          customer_note?: string | null
          id?: string
          inventory_id?: string
          rate_at_sale?: number
          sold_by?: string | null
          total_jmd?: number
          unit_price_jmd?: number
          units_sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_sales_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "parts_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_sales_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "parts_inventory_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_settings: {
        Row: {
          exchange_rate: number
          id: string
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          exchange_rate?: number
          id?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          exchange_rate?: number
          id?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          created_at: string
          currency: string
          customer_info: Json | null
          device_info: Json | null
          id: string
          referral_code_used: string | null
          status: string
          total_price: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          workflow_status: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          currency?: string
          customer_info?: Json | null
          device_info?: Json | null
          id?: string
          referral_code_used?: string | null
          status?: string
          total_price?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          workflow_status?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          currency?: string
          customer_info?: Json | null
          device_info?: Json | null
          id?: string
          referral_code_used?: string | null
          status?: string
          total_price?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          workflow_status?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_amount: number
          discount_percentage: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      site_media: {
        Row: {
          asset_key: string
          created_at: string
          file_path: string
          file_url: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          asset_key: string
          created_at?: string
          file_path: string
          file_url: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          asset_key?: string
          created_at?: string
          file_path?: string
          file_url?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      parts_inventory_public: {
        Row: {
          archived: boolean | null
          category: string | null
          id: string | null
          item_name: string | null
          qty_available: number | null
          selling_price_jmd: number | null
        }
        Insert: {
          archived?: boolean | null
          category?: string | null
          id?: string | null
          item_name?: string | null
          qty_available?: number | null
          selling_price_jmd?: number | null
        }
        Update: {
          archived?: boolean | null
          category?: string | null
          id?: string | null
          item_name?: string | null
          qty_available?: number | null
          selling_price_jmd?: number | null
        }
        Relationships: []
      }
      parts_misc_orders_public: {
        Row: {
          cost_jmd: number | null
          created_at: string | null
          date_added: string | null
          description: string | null
          id: string | null
        }
        Insert: {
          cost_jmd?: number | null
          created_at?: string | null
          date_added?: string | null
          description?: string | null
          id?: string | null
        }
        Update: {
          cost_jmd?: number | null
          created_at?: string | null
          date_added?: string | null
          description?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_parts_guest: { Args: { user_email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      mark_inventory_sold: {
        Args: { buyer_id: string; item_id: string; sale_order_id: string }
        Returns: boolean
      }
      promote_to_admin: { Args: { user_email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "parts_guest"
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
      app_role: ["admin", "user", "parts_guest"],
    },
  },
} as const
