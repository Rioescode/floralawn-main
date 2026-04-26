export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          job_id: string
          message: string | null
          professional_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          job_id: string
          message?: string | null
          professional_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          job_id?: string
          message?: string | null
          professional_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_professional_profile"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          images: string[] | null
          is_solution: boolean | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_solution?: boolean | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_solution?: boolean | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_free_items: {
        Row: {
          condition: string
          created_at: string | null
          description: string
          id: string
          images: string[] | null
          location: string
          pickup_confirmed_at: string | null
          pickup_photo: string | null
          reservation_expires_at: string | null
          reserved_by: string | null
          status: Database["public"]["Enums"]["item_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          condition: string
          created_at?: string | null
          description: string
          id?: string
          images?: string[] | null
          location: string
          pickup_confirmed_at?: string | null
          pickup_photo?: string | null
          reservation_expires_at?: string | null
          reserved_by?: string | null
          status?: Database["public"]["Enums"]["item_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          condition?: string
          created_at?: string | null
          description?: string
          id?: string
          images?: string[] | null
          location?: string
          pickup_confirmed_at?: string | null
          pickup_photo?: string | null
          reservation_expires_at?: string | null
          reserved_by?: string | null
          status?: Database["public"]["Enums"]["item_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          rating: number | null
          status: Database["public"]["Enums"]["post_status"] | null
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          rating?: number | null
          status?: Database["public"]["Enums"]["post_status"] | null
          tags?: string[] | null
          title: string
          type: Database["public"]["Enums"]["post_type"]
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          rating?: number | null
          status?: Database["public"]["Enums"]["post_status"] | null
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      community_reactions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acceptances: {
        Row: {
          created_at: string | null
          document_type: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_acceptances_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      dump_locations: {
        Row: {
          address: string
          city: string
          created_at: string | null
          fees: string | null
          hours: string | null
          id: string
          name: string
          notes: string | null
          state: string
          type: Database["public"]["Enums"]["dump_location_type"]
          updated_at: string | null
          verified: boolean | null
          zipcode: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          fees?: string | null
          hours?: string | null
          id?: string
          name: string
          notes?: string | null
          state: string
          type: Database["public"]["Enums"]["dump_location_type"]
          updated_at?: string | null
          verified?: boolean | null
          zipcode: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          fees?: string | null
          hours?: string | null
          id?: string
          name?: string
          notes?: string | null
          state?: string
          type?: Database["public"]["Enums"]["dump_location_type"]
          updated_at?: string | null
          verified?: boolean | null
          zipcode?: string
        }
        Relationships: []
      }
      dumpster_bookings: {
        Row: {
          created_at: string | null
          dumpster_id: string
          end_date: string
          id: string
          renter_id: string
          start_date: string
          status: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dumpster_id: string
          end_date: string
          id?: string
          renter_id: string
          start_date: string
          status?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dumpster_id?: string
          end_date?: string
          id?: string
          renter_id?: string
          start_date?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dumpster_bookings_dumpster_id_fkey"
            columns: ["dumpster_id"]
            isOneToOne: false
            referencedRelation: "dumpster_rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      dumpster_rentals: {
        Row: {
          availability_status: string | null
          created_at: string | null
          daily_rate: number
          description: string
          features: string[] | null
          id: string
          images: string[] | null
          location: string
          owner_id: string
          size: string
          title: string
          updated_at: string | null
        }
        Insert: {
          availability_status?: string | null
          created_at?: string | null
          daily_rate: number
          description: string
          features?: string[] | null
          id?: string
          images?: string[] | null
          location: string
          owner_id: string
          size: string
          title: string
          updated_at?: string | null
        }
        Update: {
          availability_status?: string | null
          created_at?: string | null
          daily_rate?: number
          description?: string
          features?: string[] | null
          id?: string
          images?: string[] | null
          location?: string
          owner_id?: string
          size?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_public: boolean | null
          status: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at: string | null
          upvotes_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_public?: boolean | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string | null
          upvotes_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_public?: boolean | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string | null
          upvotes_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      feedback_comments: {
        Row: {
          content: string
          created_at: string | null
          feedback_id: string
          id: string
          is_official: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          feedback_id: string
          id?: string
          is_official?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          feedback_id?: string
          id?: string
          is_official?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_upvotes: {
        Row: {
          created_at: string | null
          feedback_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_upvotes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      job_completions: {
        Row: {
          area_clean: boolean
          completion_notes: string | null
          created_at: string | null
          estimate_accurate: boolean
          id: string
          job_id: string
          no_damage: boolean
          photos_uploaded: boolean
          professional_id: string
          proper_disposal: boolean
          recycling: boolean
        }
        Insert: {
          area_clean: boolean
          completion_notes?: string | null
          created_at?: string | null
          estimate_accurate: boolean
          id?: string
          job_id: string
          no_damage: boolean
          photos_uploaded: boolean
          professional_id: string
          proper_disposal: boolean
          recycling: boolean
        }
        Update: {
          area_clean?: boolean
          completion_notes?: string | null
          created_at?: string | null
          estimate_accurate?: boolean
          id?: string
          job_id?: string
          no_damage?: boolean
          photos_uploaded?: boolean
          professional_id?: string
          proper_disposal?: boolean
          recycling?: boolean
        }
        Relationships: []
      }
      job_photos: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          photo_url: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          photo_url: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          photo_url?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          budget: number
          created_at: string | null
          customer_id: string
          date_needed: string
          description: string
          has_review: boolean | null
          id: string
          location: string
          professional_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget: number
          created_at?: string | null
          customer_id: string
          date_needed: string
          description: string
          has_review?: boolean | null
          id?: string
          location: string
          professional_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget?: number
          created_at?: string | null
          customer_id?: string
          date_needed?: string
          description?: string
          has_review?: boolean | null
          id?: string
          location?: string
          professional_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_profile"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_professional_profile"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          business_description: string | null
          business_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          insurance_info: string | null
          license_number: string | null
          logo_url: string | null
          service_area: string[] | null
          social_media: Json | null
          updated_at: string | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          business_description?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id: string
          insurance_info?: string | null
          license_number?: string | null
          logo_url?: string | null
          service_area?: string[] | null
          social_media?: Json | null
          updated_at?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          business_description?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          insurance_info?: string | null
          license_number?: string | null
          logo_url?: string | null
          service_area?: string[] | null
          social_media?: Json | null
          updated_at?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profile"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_professional: boolean | null
          location: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_professional?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_professional?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          job_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviewed_profile"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviewer_profile"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      time_suggestions: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          message: string | null
          professional_id: string
          status: string | null
          suggested_date: string
          suggested_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          message?: string | null
          professional_id: string
          status?: string | null
          suggested_date: string
          suggested_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          message?: string | null
          professional_id?: string
          status?: string | null
          suggested_date?: string
          suggested_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_professional_profile"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_suggestions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_dumpster: {
        Args: {
          p_dumpster_id: string
          p_renter_id: string
          p_start_date: string
          p_end_date: string
          p_total_price: number
        }
        Returns: string
      }
      complete_job: {
        Args: {
          p_job_id: string
          p_professional_id: string
          p_proper_disposal: boolean
          p_area_clean: boolean
          p_no_damage: boolean
          p_recycling: boolean
          p_estimate_accurate: boolean
          p_photos_uploaded: boolean
          p_completion_notes: string
        }
        Returns: undefined
      }
      decrement_feedback_upvotes: {
        Args: {
          feedback_id: string
        }
        Returns: undefined
      }
      delete_dump_location: {
        Args: {
          p_location_id: string
        }
        Returns: boolean
      }
      increment_feedback_upvotes: {
        Args: {
          feedback_id: string
        }
        Returns: undefined
      }
      increment_post_view: {
        Args: {
          post_id: string
        }
        Returns: undefined
      }
      mark_comment_as_solution: {
        Args: {
          p_comment_id: string
          p_post_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      unbook_dumpster: {
        Args: {
          p_dumpster_id: string
          p_owner_id: string
        }
        Returns: boolean
      }
      update_dump_location: {
        Args: {
          p_location_id: string
          p_name?: string
          p_address?: string
          p_city?: string
          p_state?: string
          p_zipcode?: string
          p_type?: Database["public"]["Enums"]["dump_location_type"]
          p_hours?: string
          p_fees?: string
          p_notes?: string
          p_verified?: boolean
        }
        Returns: Json
      }
      update_dumpster: {
        Args: {
          p_dumpster_id: string
          p_owner_id: string
          p_title?: string
          p_description?: string
          p_size?: string
          p_daily_rate?: number
          p_location?: string
          p_features?: string[]
          p_images?: string[]
          p_availability_status?: string
        }
        Returns: Json
      }
      update_user_comments: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_avatar_url: string
        }
        Returns: undefined
      }
      update_user_posts: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_avatar_url: string
        }
        Returns: undefined
      }
    }
    Enums: {
      dump_location_type:
        | "landfill"
        | "transfer_station"
        | "recycling_center"
        | "composting"
        | "other"
      feedback_status:
        | "new"
        | "under_review"
        | "planned"
        | "in_progress"
        | "completed"
        | "declined"
      feedback_type: "suggestion" | "issue" | "feature_request" | "other"
      item_status: "available" | "taken"
      job_status: "open" | "in_progress" | "completed" | "cancelled"
      post_status: "active" | "closed" | "archived" | "reported"
      post_type:
        | "general"
        | "question"
        | "discussion"
        | "event"
        | "announcement"
        | "job-update"
        | "recommendation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
