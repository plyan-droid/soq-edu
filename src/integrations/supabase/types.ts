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
      certificates: {
        Row: {
          code: string
          course_slug: string
          created_at: string
          id: string
          issued_on: string
          status: string
          student_id: string | null
          student_name: string
        }
        Insert: {
          code?: string
          course_slug: string
          created_at?: string
          id?: string
          issued_on?: string
          status?: string
          student_id?: string | null
          student_name: string
        }
        Update: {
          code?: string
          course_slug?: string
          created_at?: string
          id?: string
          issued_on?: string
          status?: string
          student_id?: string | null
          student_name?: string
        }
        Relationships: []
      }
      community_livestreams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          hosts: string | null
          id: string
          starts_at: string
          status: string
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          hosts?: string | null
          id?: string
          starts_at: string
          status?: string
          title: string
          video_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          hosts?: string | null
          id?: string
          starts_at?: string
          status?: string
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      community_profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          member_type: string
          username: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          member_type?: string
          username: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          member_type?: string
          username?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      course_applications: {
        Row: {
          citizenship: string | null
          course_slug: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string
          preferred_intake: string | null
          status: string
        }
        Insert: {
          citizenship?: string | null
          course_slug: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          preferred_intake?: string | null
          status?: string
        }
        Update: {
          citizenship?: string | null
          course_slug?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          preferred_intake?: string | null
          status?: string
        }
        Relationships: []
      }
      course_drafts: {
        Row: {
          category: string
          created_at: string
          duration: string | null
          id: string
          mode: string | null
          outcomes: string[]
          price: string | null
          staff_note: string | null
          status: string
          summary: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          duration?: string | null
          id?: string
          mode?: string | null
          outcomes?: string[]
          price?: string | null
          staff_note?: string | null
          status?: string
          summary?: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          duration?: string | null
          id?: string
          mode?: string | null
          outcomes?: string[]
          price?: string | null
          staff_note?: string | null
          status?: string
          summary?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_intakes: {
        Row: {
          apply_by: string | null
          course_slug: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          session_time: string | null
          start_date: string
          status: string
        }
        Insert: {
          apply_by?: string | null
          course_slug: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          session_time?: string | null
          start_date: string
          status?: string
        }
        Update: {
          apply_by?: string | null
          course_slug?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          session_time?: string | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      course_overrides: {
        Row: {
          badge: string | null
          duration: string | null
          mode: string | null
          outcomes: string[] | null
          price: string | null
          sections: Json | null
          slug: string
          summary: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge?: string | null
          duration?: string | null
          mode?: string | null
          outcomes?: string[] | null
          price?: string | null
          sections?: Json | null
          slug: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge?: string | null
          duration?: string | null
          mode?: string | null
          outcomes?: string[] | null
          price?: string | null
          sections?: Json | null
          slug?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      course_reviews: {
        Row: {
          body: string
          course_slug: string
          created_at: string
          hidden: boolean
          id: string
          rating: number
          reviewer_name: string
          user_id: string
        }
        Insert: {
          body: string
          course_slug: string
          created_at?: string
          hidden?: boolean
          id?: string
          rating: number
          reviewer_name: string
          user_id: string
        }
        Update: {
          body?: string
          course_slug?: string
          created_at?: string
          hidden?: boolean
          id?: string
          rating?: number
          reviewer_name?: string
          user_id?: string
        }
        Relationships: []
      }
      course_tasks: {
        Row: {
          created_at: string
          due_at: string
          enrollment_id: string
          id: string
          kind: string
          result: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          due_at: string
          enrollment_id: string
          id?: string
          kind?: string
          result?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          due_at?: string
          enrollment_id?: string
          id?: string
          kind?: string
          result?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tasks_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_on: string | null
          max_uses: number | null
          percent_off: number
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_on?: string | null
          max_uses?: number | null
          percent_off: number
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_on?: string | null
          max_uses?: number | null
          percent_off?: number
          used_count?: number
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_slug: string
          created_at: string
          end_date: string | null
          id: string
          progress: number
          start_date: string | null
          status: string
          student_id: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          end_date?: string | null
          id?: string
          progress?: number
          start_date?: string | null
          status?: string
          student_id: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          end_date?: string | null
          id?: string
          progress?: number
          start_date?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body: string | null
          course_slug: string
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          position: number
          title: string
          video_url: string | null
        }
        Insert: {
          body?: string | null
          course_slug: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          position?: number
          title: string
          video_url?: string | null
        }
        Update: {
          body?: string | null
          course_slug?: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          position?: number
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          course_slug: string
          created_at: string
          duration_min: number
          id: string
          meeting_url: string | null
          starts_at: string
          status: string
          title: string
          trainer_id: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          duration_min?: number
          id?: string
          meeting_url?: string | null
          starts_at: string
          status?: string
          title: string
          trainer_id: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          duration_min?: number
          id?: string
          meeting_url?: string | null
          starts_at?: string
          status?: string
          title?: string
          trainer_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          key: string
          label: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          key: string
          label: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          key?: string
          label?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          discount_amount: number
          discount_code: string | null
          email: string
          full_name: string
          id: string
          items: Json
          payment_ref: string
          status: string
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          email: string
          full_name: string
          id?: string
          items: Json
          payment_ref: string
          status?: string
          subtotal: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          email?: string
          full_name?: string
          id?: string
          items?: Json
          payment_ref?: string
          status?: string
          subtotal?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          hidden: boolean
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          hidden?: boolean
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          hidden?: boolean
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          hidden: boolean
          id: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          hidden?: boolean
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          hidden?: boolean
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          body: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          staff_note: string | null
          status: string
          topic: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          staff_note?: string | null
          status?: string
          topic?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          staff_note?: string | null
          status?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trainer_applications: {
        Row: {
          created_at: string
          email: string
          experience: string
          expertise: string
          full_name: string
          id: string
          phone: string | null
          portfolio_url: string | null
          staff_note: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          experience: string
          expertise: string
          full_name: string
          id?: string
          phone?: string | null
          portfolio_url?: string | null
          staff_note?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          experience?: string
          expertise?: string
          full_name?: string
          id?: string
          phone?: string | null
          portfolio_url?: string | null
          staff_note?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trainer_courses: {
        Row: {
          course_slug: string
          created_at: string
          trainer_id: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          trainer_id: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          trainer_id?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      check_discount: { Args: { _code: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_mock_order: {
        Args: {
          _code: string
          _email: string
          _full_name: string
          _items: Json
        }
        Returns: string
      }
      trainer_lesson_stats: {
        Args: never
        Returns: {
          completions: number
          lesson_id: string
        }[]
      }
      trainer_roster: {
        Args: never
        Returns: {
          course_slug: string
          end_date: string
          enrollment_id: string
          lessons_done: number
          progress: number
          start_date: string
          status: string
          student_email: string
          student_name: string
        }[]
      }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          code: string
          course_slug: string
          issued_on: string
          status: string
          student_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student" | "trainer"
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
      app_role: ["admin", "student", "trainer"],
    },
  },
} as const
