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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: string
          city: string
          country: string
          created_at: string
          description: string | null
          duration_min: number
          hero_url: string | null
          highlights: string[]
          id: string
          is_published: boolean
          photos: string[]
          price_bdt: number
          rating: number
          review_count: number
          slug: string
          summary: string | null
          title: string
        }
        Insert: {
          category?: string
          city: string
          country?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          hero_url?: string | null
          highlights?: string[]
          id?: string
          is_published?: boolean
          photos?: string[]
          price_bdt: number
          rating?: number
          review_count?: number
          slug: string
          summary?: string | null
          title: string
        }
        Update: {
          category?: string
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          hero_url?: string | null
          highlights?: string[]
          id?: string
          is_published?: boolean
          photos?: string[]
          price_bdt?: number
          rating?: number
          review_count?: number
          slug?: string
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      activity_slots: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          price_bdt: number
          seats: number
          start_time: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          price_bdt: number
          seats?: number
          start_time: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          price_bdt?: number
          seats?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_slots_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      airports: {
        Row: {
          city: string
          country: string
          created_at: string
          iata: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          iata: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          iata?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      booking_events: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message?: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          deal_code: string | null
          guest_email: string
          guest_name: string
          guest_phone: string | null
          guests: number
          id: string
          listing_id: string
          nights: number
          note: string | null
          reference: string
          status: Database["public"]["Enums"]["booking_status"]
          total_bdt: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          deal_code?: string | null
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          guests?: number
          id?: string
          listing_id: string
          nights?: number
          note?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_bdt: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          deal_code?: string | null
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          guests?: number
          id?: string
          listing_id?: string
          nights?: number
          note?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_bdt?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rentals: {
        Row: {
          bags: number
          car_class: string
          city: string
          created_at: string
          id: string
          model: string
          photo_url: string | null
          price_per_day_bdt: number
          seats: number
          supplier: string
          transmission: string
          with_driver: boolean
        }
        Insert: {
          bags?: number
          car_class: string
          city: string
          created_at?: string
          id?: string
          model: string
          photo_url?: string | null
          price_per_day_bdt: number
          seats?: number
          supplier: string
          transmission?: string
          with_driver?: boolean
        }
        Update: {
          bags?: number
          car_class?: string
          city?: string
          created_at?: string
          id?: string
          model?: string
          photo_url?: string | null
          price_per_day_bdt?: number
          seats?: number
          supplier?: string
          transmission?: string
          with_driver?: boolean
        }
        Relationships: []
      }
      deals: {
        Row: {
          code: string
          created_at: string
          discount_pct: number
          expires_at: string | null
          id: string
          is_active: boolean
          starts_at: string
          subtitle: string | null
          terms: string | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_pct?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          subtitle?: string | null
          terms?: string | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_pct?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          subtitle?: string | null
          terms?: string | null
          title?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          country: string
          created_at: string
          hero_url: string | null
          id: string
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          tagline: string | null
        }
        Insert: {
          country: string
          created_at?: string
          hero_url?: string | null
          id?: string
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          hero_url?: string | null
          id?: string
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      esim_plans: {
        Row: {
          country: string
          country_code: string
          created_at: string
          data_gb: number
          id: string
          is_unlimited: boolean
          network: string
          price_bdt: number
          validity_days: number
        }
        Insert: {
          country: string
          country_code: string
          created_at?: string
          data_gb: number
          id?: string
          is_unlimited?: boolean
          network: string
          price_bdt: number
          validity_days: number
        }
        Update: {
          country?: string
          country_code?: string
          created_at?: string
          data_gb?: number
          id?: string
          is_unlimited?: boolean
          network?: string
          price_bdt?: number
          validity_days?: number
        }
        Relationships: []
      }
      flights: {
        Row: {
          airline: string
          airline_code: string
          arrive_time: string
          baggage_kg: number
          cabin: Database["public"]["Enums"]["cabin_class"]
          cabin_baggage_kg: number
          created_at: string
          days_of_week: number[]
          depart_time: string
          duration_min: number
          fare_bdt: number
          flight_no: string
          from_iata: string
          id: string
          refundable: boolean
          stops: number
          to_iata: string
        }
        Insert: {
          airline: string
          airline_code: string
          arrive_time: string
          baggage_kg?: number
          cabin?: Database["public"]["Enums"]["cabin_class"]
          cabin_baggage_kg?: number
          created_at?: string
          days_of_week?: number[]
          depart_time: string
          duration_min: number
          fare_bdt: number
          flight_no: string
          from_iata: string
          id?: string
          refundable?: boolean
          stops?: number
          to_iata: string
        }
        Update: {
          airline?: string
          airline_code?: string
          arrive_time?: string
          baggage_kg?: number
          cabin?: Database["public"]["Enums"]["cabin_class"]
          cabin_baggage_kg?: number
          created_at?: string
          days_of_week?: number[]
          depart_time?: string
          duration_min?: number
          fare_bdt?: number
          flight_no?: string
          from_iata?: string
          id?: string
          refundable?: boolean
          stops?: number
          to_iata?: string
        }
        Relationships: [
          {
            foreignKeyName: "flights_from_iata_fkey"
            columns: ["from_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata"]
          },
          {
            foreignKeyName: "flights_to_iata_fkey"
            columns: ["to_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata"]
          },
        ]
      }
      listings: {
        Row: {
          amenities: string[]
          baths: number
          bedrooms: number
          beds: number
          city: string
          country: string
          created_at: string
          description: string | null
          destination_id: string | null
          hero_url: string | null
          id: string
          is_guest_favorite: boolean
          is_published: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          max_guests: number
          photos: string[]
          price_bdt: number
          rating: number
          review_count: number
          slug: string
          summary: string | null
          supplier: string
          supplier_ref: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          baths?: number
          bedrooms?: number
          beds?: number
          city: string
          country?: string
          created_at?: string
          description?: string | null
          destination_id?: string | null
          hero_url?: string | null
          id?: string
          is_guest_favorite?: boolean
          is_published?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          max_guests?: number
          photos?: string[]
          price_bdt: number
          rating?: number
          review_count?: number
          slug: string
          summary?: string | null
          supplier?: string
          supplier_ref?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          baths?: number
          bedrooms?: number
          beds?: number
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          destination_id?: string | null
          hero_url?: string | null
          id?: string
          is_guest_favorite?: boolean
          is_published?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          max_guests?: number
          photos?: string[]
          price_bdt?: number
          rating?: number
          review_count?: number
          slug?: string
          summary?: string | null
          supplier?: string
          supplier_ref?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          order_reference: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          order_reference?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          order_reference?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          created_at: string
          id: string
          message: string | null
          order_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          order_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          currency: string
          details: Json
          ends_at: string | null
          hero_url: string | null
          id: string
          item_id: string | null
          reference: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          subtitle: string | null
          title: string
          total_bdt: number
          travellers: number
          updated_at: string
          user_id: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          currency?: string
          details?: Json
          ends_at?: string | null
          hero_url?: string | null
          id?: string
          item_id?: string | null
          reference?: string
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtitle?: string | null
          title: string
          total_bdt: number
          travellers?: number
          updated_at?: string
          user_id: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          currency?: string
          details?: Json
          ends_at?: string | null
          hero_url?: string | null
          id?: string
          item_id?: string | null
          reference?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtitle?: string | null
          title?: string
          total_bdt?: number
          travellers?: number
          updated_at?: string
          user_id?: string
          vertical?: Database["public"]["Enums"]["vertical"]
        }
        Relationships: []
      }
      packages: {
        Row: {
          bundle_price_bdt: number
          created_at: string
          from_iata: string
          hero_url: string | null
          id: string
          is_published: boolean
          listing_id: string | null
          nights: number
          saving_pct: number
          separate_price_bdt: number
          slug: string
          summary: string | null
          title: string
          to_iata: string
        }
        Insert: {
          bundle_price_bdt: number
          created_at?: string
          from_iata: string
          hero_url?: string | null
          id?: string
          is_published?: boolean
          listing_id?: string | null
          nights?: number
          saving_pct?: number
          separate_price_bdt: number
          slug: string
          summary?: string | null
          title: string
          to_iata: string
        }
        Update: {
          bundle_price_bdt?: number
          created_at?: string
          from_iata?: string
          hero_url?: string | null
          id?: string
          is_published?: boolean
          listing_id?: string | null
          nights?: number
          saving_pct?: number
          separate_price_bdt?: number
          slug?: string
          summary?: string | null
          title?: string
          to_iata?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_from_iata_fkey"
            columns: ["from_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata"]
          },
          {
            foreignKeyName: "packages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_to_iata_fkey"
            columns: ["to_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          vip_tier: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          vip_tier?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          vip_tier?: string
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      trains: {
        Row: {
          arrive_time: string
          created_at: string
          depart_time: string
          duration_min: number
          from_city: string
          id: string
          off_day: string | null
          operator: string
          price_bdt: number
          to_city: string
          train_name: string
          train_no: string
          travel_class: string
        }
        Insert: {
          arrive_time: string
          created_at?: string
          depart_time: string
          duration_min: number
          from_city: string
          id?: string
          off_day?: string | null
          operator?: string
          price_bdt: number
          to_city: string
          train_name: string
          train_no: string
          travel_class: string
        }
        Update: {
          arrive_time?: string
          created_at?: string
          depart_time?: string
          duration_min?: number
          from_city?: string
          id?: string
          off_day?: string | null
          operator?: string
          price_bdt?: number
          to_city?: string
          train_name?: string
          train_no?: string
          travel_class?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          airport_iata: string
          area: string
          created_at: string
          id: string
          luggage: number
          photo_url: string | null
          price_bdt: number
          seats: number
          vehicle_class: string
          vehicle_example: string | null
        }
        Insert: {
          airport_iata: string
          area: string
          created_at?: string
          id?: string
          luggage?: number
          photo_url?: string | null
          price_bdt: number
          seats?: number
          vehicle_class: string
          vehicle_example?: string | null
        }
        Update: {
          airport_iata?: string
          area?: string
          created_at?: string
          id?: string
          luggage?: number
          photo_url?: string | null
          price_bdt?: number
          seats?: number
          vehicle_class?: string
          vehicle_example?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_airport_iata_fkey"
            columns: ["airport_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata"]
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "ops" | "user"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      cabin_class: "economy" | "premium" | "business" | "first"
      listing_kind: "hotel" | "home" | "apartment" | "resort" | "villa"
      vertical:
        | "stay"
        | "flight"
        | "package"
        | "activity"
        | "transfer"
        | "car"
        | "esim"
        | "train"
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
      app_role: ["admin", "ops", "user"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      cabin_class: ["economy", "premium", "business", "first"],
      listing_kind: ["hotel", "home", "apartment", "resort", "villa"],
      vertical: [
        "stay",
        "flight",
        "package",
        "activity",
        "transfer",
        "car",
        "esim",
        "train",
      ],
    },
  },
} as const
