// Database types for Supabase
// TODO: Generate with: supabase gen types typescript --project-id <project-id>

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          credits: number;
          membership_tier: string | null;
          preferred_language: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          credits?: number;
          membership_tier?: string | null;
          preferred_language?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          credits?: number;
          membership_tier?: string | null;
          preferred_language?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          latitude: number | null;
          longitude: number | null;
          image_url: string | null;
          available_suites: number;
          total_suites: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          image_url?: string | null;
          available_suites?: number;
          total_suites?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          image_url?: string | null;
          available_suites?: number;
          total_suites?: number;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          location: string | null;
          image_url: string | null;
          host_name: string | null;
          price: number;
          max_capacity: number | null;
          current_rsvps: number;
          tags: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          location?: string | null;
          image_url?: string | null;
          host_name?: string | null;
          price?: number;
          max_capacity?: number | null;
          current_rsvps?: number;
          tags?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          image_url?: string | null;
          host_name?: string | null;
          price?: number;
          max_capacity?: number | null;
          current_rsvps?: number;
          tags?: string[] | null;
          created_at?: string;
        };
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          location_id: string;
          suite_id: string | null;
          start_time: string;
          end_time: string;
          status: string;
          credits_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location_id: string;
          suite_id?: string | null;
          start_time: string;
          end_time: string;
          status?: string;
          credits_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location_id?: string;
          suite_id?: string | null;
          start_time?: string;
          end_time?: string;
          status?: string;
          credits_used?: number;
          created_at?: string;
        };
      };
      usage_history: {
        Row: {
          id: string;
          user_id: string;
          location_id: string;
          location_name: string;
          check_in_time: string;
          check_out_time: string | null;
          duration_minutes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location_id: string;
          location_name: string;
          check_in_time: string;
          check_out_time?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location_id?: string;
          location_name?: string;
          check_in_time?: string;
          check_out_time?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Commonly used types
export type Profile = Tables<'profiles'>;
export type Location = Tables<'locations'>;
export type Event = Tables<'events'>;
export type EventRsvp = Tables<'event_rsvps'>;
export type Booking = Tables<'bookings'>;
export type UsageHistory = Tables<'usage_history'>;
