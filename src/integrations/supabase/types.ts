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
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          public_token: string
          referred_by: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          public_token?: string
          referred_by?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          public_token?: string
          referred_by?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      device_images: {
        Row: {
          brand: string
          created_at: string
          id: string
          image_url: string
          model: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          image_url: string
          model: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          image_url?: string
          model?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      device_repairs: {
        Row: {
          cost: number
          created_at: string
          description: string
          id: string
          repaired_at: string | null
          stock_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          description: string
          id?: string
          repaired_at?: string | null
          stock_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string
          id?: string
          repaired_at?: string | null
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_repairs_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "device_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sales: {
        Row: {
          actual_price: number
          courier: string | null
          created_at: string
          customer_id: string | null
          deposit: number
          id: string
          is_payment_plan: boolean
          listed_price: number
          loyalty_discount: number
          loyalty_rule_id: string | null
          notes: string | null
          payment_method: string
          plan_total: number
          sold_as_trade: boolean
          sold_at: string
          sold_for: number
          stock_id: string
          tracking_number: string | null
          trade_credit: number
          trade_in_request_id: string | null
          warranty_days: number
        }
        Insert: {
          actual_price?: number
          courier?: string | null
          created_at?: string
          customer_id?: string | null
          deposit?: number
          id?: string
          is_payment_plan?: boolean
          listed_price?: number
          loyalty_discount?: number
          loyalty_rule_id?: string | null
          notes?: string | null
          payment_method?: string
          plan_total?: number
          sold_as_trade?: boolean
          sold_at?: string
          sold_for?: number
          stock_id: string
          tracking_number?: string | null
          trade_credit?: number
          trade_in_request_id?: string | null
          warranty_days?: number
        }
        Update: {
          actual_price?: number
          courier?: string | null
          created_at?: string
          customer_id?: string | null
          deposit?: number
          id?: string
          is_payment_plan?: boolean
          listed_price?: number
          loyalty_discount?: number
          loyalty_rule_id?: string | null
          notes?: string | null
          payment_method?: string
          plan_total?: number
          sold_as_trade?: boolean
          sold_at?: string
          sold_for?: number
          stock_id?: string
          tracking_number?: string | null
          trade_credit?: number
          trade_in_request_id?: string | null
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "device_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sales_loyalty_rule_id_fkey"
            columns: ["loyalty_rule_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sales_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "device_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sales_trade_in_request_id_fkey"
            columns: ["trade_in_request_id"]
            isOneToOne: false
            referencedRelation: "trade_in_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      device_stock: {
        Row: {
          battery_health: number | null
          brand: string
          colour: string | null
          condition: string | null
          created_at: string
          id: string
          imei: string | null
          model: string
          notes: string | null
          photos: string[]
          purchase_cost: number
          purchase_date: string | null
          purchased_from: string | null
          serial: string | null
          sku: string | null
          status: string
          storage: string | null
          updated_at: string
          warranty_days: number
          website_price: number
        }
        Insert: {
          battery_health?: number | null
          brand?: string
          colour?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          imei?: string | null
          model: string
          notes?: string | null
          photos?: string[]
          purchase_cost?: number
          purchase_date?: string | null
          purchased_from?: string | null
          serial?: string | null
          sku?: string | null
          status?: string
          storage?: string | null
          updated_at?: string
          warranty_days?: number
          website_price?: number
        }
        Update: {
          battery_health?: number | null
          brand?: string
          colour?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          imei?: string | null
          model?: string
          notes?: string | null
          photos?: string[]
          purchase_cost?: number
          purchase_date?: string | null
          purchased_from?: string | null
          serial?: string | null
          sku?: string | null
          status?: string
          storage?: string | null
          updated_at?: string
          warranty_days?: number
          website_price?: number
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
      loyalty_rules: {
        Row: {
          active: boolean
          created_at: string
          discount_amount: number
          discount_percent: number
          id: string
          name: string
          rule_type: string
          threshold: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          id?: string
          name: string
          rule_type?: string
          threshold?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          id?: string
          name?: string
          rule_type?: string
          threshold?: number
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
          archive_note: string | null
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
          archive_note?: string | null
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
          archive_note?: string | null
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
      parts_price_list_items: {
        Row: {
          category: string | null
          cost_jmd: number
          created_at: string
          created_by: string | null
          id: string
          item_name: string
          note: string | null
          sell_jmd: number
          shipping_jmd: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_jmd?: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_name: string
          note?: string | null
          sell_jmd?: number
          shipping_jmd?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_jmd?: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_name?: string
          note?: string | null
          sell_jmd?: number
          shipping_jmd?: number
          updated_at?: string
        }
        Relationships: []
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
      sale_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          late_fee: number
          note: string | null
          paid_amount: number
          paid_at: string | null
          sale_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date: string
          id?: string
          late_fee?: number
          note?: string | null
          paid_amount?: number
          paid_at?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          late_fee?: number
          note?: string | null
          paid_amount?: number
          paid_at?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_installments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "device_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_prices: {
        Row: {
          brand: string | null
          condition: string | null
          created_at: string
          id: string
          market_price_usd: number
          matched_device_id: string | null
          model: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scraped_at: string
          source: string
          source_url: string
          status: string
          storage: string | null
          suggested_price_usd: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          market_price_usd: number
          matched_device_id?: string | null
          model: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraped_at?: string
          source?: string
          source_url: string
          status?: string
          storage?: string | null
          suggested_price_usd: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          market_price_usd?: number
          matched_device_id?: string | null
          model?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraped_at?: string
          source?: string
          source_url?: string
          status?: string
          storage?: string | null
          suggested_price_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraped_prices_matched_device_id_fkey"
            columns: ["matched_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_cron_token: {
        Row: {
          id: number
          token: string
        }
        Insert: {
          id?: number
          token?: string
        }
        Update: {
          id?: number
          token?: string
        }
        Relationships: []
      }
      scraper_settings: {
        Row: {
          auto_refresh: boolean
          backmarket_markup_percent: number
          backmarket_url: string
          created_at: string
          default_source_url: string
          id: string
          last_run_at: string | null
          markup_percent: number
          source: string
          swappa_url: string
          updated_at: string
        }
        Insert: {
          auto_refresh?: boolean
          backmarket_markup_percent?: number
          backmarket_url?: string
          created_at?: string
          default_source_url?: string
          id?: string
          last_run_at?: string | null
          markup_percent?: number
          source?: string
          swappa_url?: string
          updated_at?: string
        }
        Update: {
          auto_refresh?: boolean
          backmarket_markup_percent?: number
          backmarket_url?: string
          created_at?: string
          default_source_url?: string
          id?: string
          last_run_at?: string | null
          markup_percent?: number
          source?: string
          swappa_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          id: string
          note: string | null
          occurred_at: string
          sale_id: string
          status: string
        }
        Insert: {
          id?: string
          note?: string | null
          occurred_at?: string
          sale_id: string
          status: string
        }
        Update: {
          id?: string
          note?: string | null
          occurred_at?: string
          sale_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "device_sales"
            referencedColumns: ["id"]
          },
        ]
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
      trade_in_request_history: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          from_value: string | null
          id: string
          note: string | null
          request_id: string
          to_value: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          from_value?: string | null
          id?: string
          note?: string | null
          request_id: string
          to_value?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          from_value?: string | null
          id?: string
          note?: string | null
          request_id?: string
          to_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_in_request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "trade_in_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_in_requests: {
        Row: {
          admin_notes: string | null
          battery_pct: number | null
          condition: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          desired_device: Json | null
          estimate: Json
          estimated_value_usd: number
          expires_at: string | null
          faults: Json
          final_value_usd: number | null
          id: string
          invoice_id: string | null
          public_token: string
          request_code: string
          status: string
          trade_device: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          battery_pct?: number | null
          condition?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          desired_device?: Json | null
          estimate?: Json
          estimated_value_usd?: number
          expires_at?: string | null
          faults?: Json
          final_value_usd?: number | null
          id?: string
          invoice_id?: string | null
          public_token?: string
          request_code?: string
          status?: string
          trade_device?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          battery_pct?: number | null
          condition?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          desired_device?: Json | null
          estimate?: Json
          estimated_value_usd?: number
          expires_at?: string | null
          faults?: Json
          final_value_usd?: number | null
          id?: string
          invoice_id?: string | null
          public_token?: string
          request_code?: string
          status?: string
          trade_device?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_in_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      parts_price_catalog: {
        Row: {
          category: string | null
          cost_jmd: number | null
          created_at: string | null
          id: string | null
          item_name: string | null
          note: string | null
          qty_available: number | null
          sell_jmd: number | null
          shipping_jmd: number | null
          source: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_parts_guest: { Args: { user_email: string }; Returns: boolean }
      create_trade_in_request: { Args: { payload: Json }; Returns: Json }
      get_customer_portal: { Args: { token: string }; Returns: Json }
      get_trade_in_request: { Args: { token: string }; Returns: Json }
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
      app_role: ["admin", "user", "parts_guest"],
    },
  },
} as const
