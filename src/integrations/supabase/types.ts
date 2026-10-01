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
      admissions: {
        Row: {
          application_id: string | null
          course_slug: string
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          course_slug: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          course_slug?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_mark_drafts: {
        Row: {
          created_at: string
          feedback: string
          score: number | null
          submission_id: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback?: string
          score?: number | null
          submission_id: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback?: string
          score?: number | null
          submission_id?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_mark_drafts_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          body: string
          created_at: string
          feedback: string | null
          files: Json
          id: string
          link: string | null
          score: number | null
          status: string
          student_id: string
          student_name: string
        }
        Insert: {
          assignment_id: string
          body?: string
          created_at?: string
          feedback?: string | null
          files?: Json
          id?: string
          link?: string | null
          score?: number | null
          status?: string
          student_id: string
          student_name?: string
        }
        Update: {
          assignment_id?: string
          body?: string
          created_at?: string
          feedback?: string | null
          files?: Json
          id?: string
          link?: string | null
          score?: number | null
          status?: string
          student_id?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_slug: string
          created_at: string
          created_by: string
          due_at: string | null
          id: string
          instructions: string
          max_score: number
          title: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          created_by: string
          due_at?: string | null
          id?: string
          instructions?: string
          max_score?: number
          title: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          created_by?: string
          due_at?: string | null
          id?: string
          instructions?: string
          max_score?: number
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          marked_at: string
          session_id: string
          status: string
          student_id: string
        }
        Insert: {
          marked_at?: string
          session_id: string
          status: string
          student_id: string
        }
        Update: {
          marked_at?: string
          session_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_payments: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          items: Json
          method: string
          plan: string
          reference: string
          staff_note: string | null
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          items: Json
          method: string
          plan?: string
          reference: string
          staff_note?: string | null
          status?: string
          total: number
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          items?: Json
          method?: string
          plan?: string
          reference?: string
          staff_note?: string | null
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      certificate_design: {
        Row: {
          accent: string
          body: string
          heading: string
          id: number
          signatory: string
          signatory_title: string
          subtitle: string
          template: string
          updated_at: string
        }
        Insert: {
          accent?: string
          body?: string
          heading?: string
          id?: number
          signatory?: string
          signatory_title?: string
          subtitle?: string
          template?: string
          updated_at?: string
        }
        Update: {
          accent?: string
          body?: string
          heading?: string
          id?: number
          signatory?: string
          signatory_title?: string
          subtitle?: string
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      classroom_replies: {
        Row: {
          author_id: string
          author_name: string
          body: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "classroom_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_threads: {
        Row: {
          author_id: string
          author_name: string
          body: string
          course_slug: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          body: string
          course_slug: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          course_slug?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
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
      course_answers: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          is_staff: boolean
          question_id: string
          user_id: string
        }
        Insert: {
          author_name?: string
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          question_id: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "course_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_applications: {
        Row: {
          address: string | null
          citizenship: string | null
          course_slug: string
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          id_number: string | null
          id_type: string | null
          message: string | null
          nationality: string | null
          newsletter: boolean
          phone: string
          preferred_intake: string | null
          qualification: string | null
          sales_manager: string | null
          source: string
          status: string
        }
        Insert: {
          address?: string | null
          citizenship?: string | null
          course_slug: string
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          message?: string | null
          nationality?: string | null
          newsletter?: boolean
          phone: string
          preferred_intake?: string | null
          qualification?: string | null
          sales_manager?: string | null
          source?: string
          status?: string
        }
        Update: {
          address?: string | null
          citizenship?: string | null
          course_slug?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          message?: string | null
          nationality?: string | null
          newsletter?: boolean
          phone?: string
          preferred_intake?: string | null
          qualification?: string | null
          sales_manager?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      course_bundles: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          price: number
          slugs: string[]
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          price: number
          slugs: string[]
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          price?: number
          slugs?: string[]
        }
        Relationships: []
      }
      course_chat_messages: {
        Row: {
          author_name: string
          body: string
          course_slug: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_name?: string
          body: string
          course_slug: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string
          course_slug?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      course_drafts: {
        Row: {
          badge: string | null
          category: string
          created_at: string
          duration: string | null
          faqs: Json
          id: string
          image_key: string | null
          intake_apply_by: string | null
          intake_start: string | null
          intake_time: string | null
          level: string | null
          mode: string | null
          outcomes: string[]
          price: string | null
          published_slug: string | null
          requirements: string | null
          sections: Json
          staff_note: string | null
          status: string
          summary: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category?: string
          created_at?: string
          duration?: string | null
          faqs?: Json
          id?: string
          image_key?: string | null
          intake_apply_by?: string | null
          intake_start?: string | null
          intake_time?: string | null
          level?: string | null
          mode?: string | null
          outcomes?: string[]
          price?: string | null
          published_slug?: string | null
          requirements?: string | null
          sections?: Json
          staff_note?: string | null
          status?: string
          summary?: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category?: string
          created_at?: string
          duration?: string | null
          faqs?: Json
          id?: string
          image_key?: string | null
          intake_apply_by?: string | null
          intake_start?: string | null
          intake_time?: string | null
          level?: string | null
          mode?: string | null
          outcomes?: string[]
          price?: string | null
          published_slug?: string | null
          requirements?: string | null
          sections?: Json
          staff_note?: string | null
          status?: string
          summary?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_follows: {
        Row: {
          course_slug: string
          created_at: string
          user_id: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          user_id: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          user_id?: string
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
      course_notices: {
        Row: {
          attachments: Json
          body: string
          color: string
          course_slug: string
          created_at: string
          created_by: string
          id: string
          pinned: boolean
          title: string
        }
        Insert: {
          attachments?: Json
          body?: string
          color?: string
          course_slug: string
          created_at?: string
          created_by: string
          id?: string
          pinned?: boolean
          title: string
        }
        Update: {
          attachments?: Json
          body?: string
          color?: string
          course_slug?: string
          created_at?: string
          created_by?: string
          id?: string
          pinned?: boolean
          title?: string
        }
        Relationships: []
      }
      course_overrides: {
        Row: {
          badge: string | null
          category: string | null
          custom: boolean
          duration: string | null
          faqs: Json | null
          hidden: boolean
          image_key: string | null
          level: string | null
          mode: string | null
          outcomes: string[] | null
          price: string | null
          requirements: string | null
          sections: Json | null
          slug: string
          summary: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge?: string | null
          category?: string | null
          custom?: boolean
          duration?: string | null
          faqs?: Json | null
          hidden?: boolean
          image_key?: string | null
          level?: string | null
          mode?: string | null
          outcomes?: string[] | null
          price?: string | null
          requirements?: string | null
          sections?: Json | null
          slug: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge?: string | null
          category?: string | null
          custom?: boolean
          duration?: string | null
          faqs?: Json | null
          hidden?: boolean
          image_key?: string | null
          level?: string | null
          mode?: string | null
          outcomes?: string[] | null
          price?: string | null
          requirements?: string | null
          sections?: Json | null
          slug?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      course_questions: {
        Row: {
          author_name: string
          body: string
          course_slug: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_name?: string
          body: string
          course_slug: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string
          course_slug?: string
          created_at?: string
          id?: string
          user_id?: string
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
      course_waitlist: {
        Row: {
          course_slug: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      custom_forms: {
        Row: {
          active: boolean
          banner: string | null
          created_at: string
          fields: Json
          id: string
          intro: string
          slug: string
          title: string
        }
        Insert: {
          active?: boolean
          banner?: string | null
          created_at?: string
          fields?: Json
          id?: string
          intro?: string
          slug: string
          title: string
        }
        Update: {
          active?: boolean
          banner?: string | null
          created_at?: string
          fields?: Json
          id?: string
          intro?: string
          slug?: string
          title?: string
        }
        Relationships: []
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
      event_signups: {
        Row: {
          created_at: string
          event_id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agenda: string | null
          capacity: number
          category: string
          created_at: string
          created_by: string
          description: string
          ends_at: string | null
          id: string
          image_key: string | null
          is_private: boolean
          location: string
          online_url: string | null
          speaker: string | null
          speaker_role: string | null
          starts_at: string
          title: string
        }
        Insert: {
          agenda?: string | null
          capacity?: number
          category?: string
          created_at?: string
          created_by: string
          description?: string
          ends_at?: string | null
          id?: string
          image_key?: string | null
          is_private?: boolean
          location?: string
          online_url?: string | null
          speaker?: string | null
          speaker_role?: string | null
          starts_at: string
          title: string
        }
        Update: {
          agenda?: string | null
          capacity?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_key?: string | null
          is_private?: boolean
          location?: string
          online_url?: string | null
          speaker?: string | null
          speaker_role?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      exemptions: {
        Row: {
          course_slug: string
          created_at: string
          evidence: string | null
          fee_reduction: number
          id: string
          kind: string
          module: string
          status: string
          student_email: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          evidence?: string | null
          fee_reduction?: number
          id?: string
          kind?: string
          module: string
          status?: string
          student_email: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          evidence?: string | null
          fee_reduction?: number
          id?: string
          kind?: string
          module?: string
          status?: string
          student_email?: string
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          id: string
        }
        Insert: {
          created_at?: string
          data: Json
          form_id: string
          id?: string
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "custom_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          buyer_id: string
          course_slug: string
          created_at: string
          id: string
          message: string
          recipient_email: string
          recipient_name: string
          send_on: string
          status: string
        }
        Insert: {
          buyer_id: string
          course_slug: string
          created_at?: string
          id?: string
          message?: string
          recipient_email: string
          recipient_name: string
          send_on?: string
          status?: string
        }
        Update: {
          buyer_id?: string
          course_slug?: string
          created_at?: string
          id?: string
          message?: string
          recipient_email?: string
          recipient_name?: string
          send_on?: string
          status?: string
        }
        Relationships: []
      }
      instalments: {
        Row: {
          amount: number
          due_date: string
          id: string
          paid: boolean
          paid_at: string | null
          payment_id: string
          seq: number
          user_id: string
        }
        Insert: {
          amount: number
          due_date: string
          id?: string
          paid?: boolean
          paid_at?: string | null
          payment_id: string
          seq: number
          user_id: string
        }
        Update: {
          amount?: number
          due_date?: string
          id?: string
          paid?: boolean
          paid_at?: string | null
          payment_id?: string
          seq?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instalments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "bank_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          interest: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      lesson_notes: {
        Row: {
          body: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
          topic: string | null
          unlock_at: string | null
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
          topic?: string | null
          unlock_at?: string | null
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
          topic?: string | null
          unlock_at?: string | null
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
          location: string | null
          meeting_url: string | null
          mode: string
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
          location?: string | null
          meeting_url?: string | null
          mode?: string
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
          location?: string | null
          meeting_url?: string | null
          mode?: string
          starts_at?: string
          status?: string
          title?: string
          trainer_id?: string
        }
        Relationships: []
      }
      login_events: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meeting_slots: {
        Row: {
          booked_by: string | null
          booked_name: string | null
          booked_note: string | null
          created_at: string
          duration_min: number
          id: string
          meeting_url: string | null
          price: number
          starts_at: string
          topic: string
          trainer_id: string
          trainer_name: string
        }
        Insert: {
          booked_by?: string | null
          booked_name?: string | null
          booked_note?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          meeting_url?: string | null
          price?: number
          starts_at: string
          topic?: string
          trainer_id: string
          trainer_name?: string
        }
        Update: {
          booked_by?: string | null
          booked_name?: string | null
          booked_note?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          meeting_url?: string | null
          price?: number
          starts_at?: string
          topic?: string
          trainer_id?: string
          trainer_name?: string
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
      org_members: {
        Row: {
          created_at: string
          id: string
          member_email: string
          member_role: string
          org_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_email: string
          member_role?: string
          org_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_email?: string
          member_role?: string
          org_id?: string
        }
        Relationships: []
      }
      org_packages: {
        Row: {
          expires_on: string | null
          instructor_seats: number
          name: string
          org_id: string
          student_seats: number
          updated_at: string
        }
        Insert: {
          expires_on?: string | null
          instructor_seats?: number
          name?: string
          org_id: string
          student_seats?: number
          updated_at?: string
        }
        Update: {
          expires_on?: string | null
          instructor_seats?: number
          name?: string
          org_id?: string
          student_seats?: number
          updated_at?: string
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
          address: string | null
          citizenship: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_name: string | null
          emergency_phone: string | null
          full_name: string | null
          id: string
          id_number: string | null
          id_type: string | null
          nationality: string | null
          phone: string | null
          postal_code: string | null
          qualification: string | null
          referral_source: string | null
        }
        Insert: {
          address?: string | null
          citizenship?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_name?: string | null
          emergency_phone?: string | null
          full_name?: string | null
          id: string
          id_number?: string | null
          id_type?: string | null
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          qualification?: string | null
          referral_source?: string | null
        }
        Update: {
          address?: string | null
          citizenship?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_name?: string | null
          emergency_phone?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          qualification?: string | null
          referral_source?: string | null
        }
        Relationships: []
      }
      quiz_answer_keys: {
        Row: {
          accepted: string[] | null
          correct: number
          question_id: string
        }
        Insert: {
          accepted?: string[] | null
          correct?: number
          question_id: string
        }
        Update: {
          accepted?: string[] | null
          correct?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answer_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          certificate_code: string | null
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          student_id: string
        }
        Insert: {
          certificate_code?: string | null
          created_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          student_id: string
        }
        Update: {
          certificate_code?: string | null
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          kind: string
          options: string[]
          position: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          id?: string
          kind?: string
          options: string[]
          position?: number
          prompt: string
          quiz_id: string
        }
        Update: {
          id?: string
          kind?: string
          options?: string[]
          position?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_slug: string
          created_at: string
          created_by: string
          gives_certificate: boolean
          id: string
          pass_mark: number
          title: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          created_by: string
          gives_certificate?: boolean
          id?: string
          pass_mark?: number
          title: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          created_by?: string
          gives_certificate?: boolean
          id?: string
          pass_mark?: number
          title?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id?: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_email: string | null
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_email?: string | null
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_email?: string | null
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      session_bookings: {
        Row: {
          created_at: string
          id: string
          session_id: string
          status: string
          student_id: string
          student_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          status?: string
          student_id: string
          student_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          status?: string
          student_id?: string
          student_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_plans: {
        Row: {
          activities: string
          assessment: string
          created_at: string
          id: string
          materials: string
          objectives: string
          session_id: string
          staff_note: string | null
          status: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          activities?: string
          assessment?: string
          created_at?: string
          id?: string
          materials?: string
          objectives?: string
          session_id: string
          staff_note?: string | null
          status?: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          activities?: string
          assessment?: string
          created_at?: string
          id?: string
          materials?: string
          objectives?: string
          session_id?: string
          staff_note?: string | null
          status?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_plans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sfc_balances: {
        Row: {
          balance: number
          email: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          balance?: number
          email: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          balance?: number
          email?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      sfc_claims: {
        Row: {
          claim_ref: string | null
          course_fee: number
          course_slug: string
          created_at: string
          id: string
          payment_id: string | null
          settled_on: string | null
          sfc_amount: number
          staff_note: string | null
          status: string
          student_email: string
          user_id: string | null
        }
        Insert: {
          claim_ref?: string | null
          course_fee?: number
          course_slug: string
          created_at?: string
          id?: string
          payment_id?: string | null
          settled_on?: string | null
          sfc_amount?: number
          staff_note?: string | null
          status?: string
          student_email: string
          user_id?: string | null
        }
        Update: {
          claim_ref?: string | null
          course_fee?: number
          course_slug?: string
          created_at?: string
          id?: string
          payment_id?: string | null
          settled_on?: string | null
          sfc_amount?: number
          staff_note?: string | null
          status?: string
          student_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sfc_claims_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "bank_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      site_notices: {
        Row: {
          body: string
          created_at: string
          ends_on: string | null
          id: string
          pinned: boolean
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          pinned?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          pinned?: boolean
          title?: string
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
      staff_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          reason?: string | null
          status?: string
          user_id?: string
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
          availability: string | null
          certs_path: string | null
          courses_interest: string | null
          created_at: string
          cv_path: string | null
          email: string
          experience: string
          expertise: string
          full_name: string
          id: string
          languages: string | null
          phone: string | null
          portfolio_url: string | null
          qualifications: string | null
          staff_note: string | null
          status: string
          teaching_mode: string | null
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          certs_path?: string | null
          courses_interest?: string | null
          created_at?: string
          cv_path?: string | null
          email: string
          experience: string
          expertise: string
          full_name: string
          id?: string
          languages?: string | null
          phone?: string | null
          portfolio_url?: string | null
          qualifications?: string | null
          staff_note?: string | null
          status?: string
          teaching_mode?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          certs_path?: string | null
          courses_interest?: string | null
          created_at?: string
          cv_path?: string | null
          email?: string
          experience?: string
          expertise?: string
          full_name?: string
          id?: string
          languages?: string | null
          phone?: string | null
          portfolio_url?: string | null
          qualifications?: string | null
          staff_note?: string | null
          status?: string
          teaching_mode?: string | null
          user_id?: string | null
          years_experience?: number | null
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
      tutor_profiles: {
        Row: {
          bio: string
          days: string[]
          display_name: string
          headline: string
          location: string
          online: boolean
          photo_url: string | null
          subjects: string[]
          times: string[]
          updated_at: string
          user_id: string
          visible: boolean
          years_experience: number | null
        }
        Insert: {
          bio?: string
          days?: string[]
          display_name: string
          headline?: string
          location?: string
          online?: boolean
          photo_url?: string | null
          subjects?: string[]
          times?: string[]
          updated_at?: string
          user_id: string
          visible?: boolean
          years_experience?: number | null
        }
        Update: {
          bio?: string
          days?: string[]
          display_name?: string
          headline?: string
          location?: string
          online?: boolean
          photo_url?: string | null
          subjects?: string[]
          times?: string[]
          updated_at?: string
          user_id?: string
          visible?: boolean
          years_experience?: number | null
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
      whatsapp_conversations: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          last_message_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          delivery_error: Json | null
          delivery_status: string | null
          direction: string
          id: string
          media_id: string | null
          media_type: string | null
          provider_message_id: string | null
          provider_timestamp: string | null
          updated_at: string
        }
        Insert: {
          body?: string
          conversation_id: string
          created_at?: string
          delivery_error?: Json | null
          delivery_status?: string | null
          direction: string
          id?: string
          media_id?: string | null
          media_type?: string | null
          provider_message_id?: string | null
          provider_timestamp?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          delivery_error?: Json | null
          delivery_status?: string | null
          direction?: string
          id?: string
          media_id?: string | null
          media_type?: string | null
          provider_message_id?: string | null
          provider_timestamp?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_bank_payment: { Args: { _id: string }; Returns: undefined }
      book_slot: { Args: { _note: string; _slot: string }; Returns: undefined }
      cancel_booking: { Args: { _slot: string }; Returns: undefined }
      check_discount: { Args: { _code: string }; Returns: number }
      check_maintenance_key: { Args: { _key: string }; Returns: boolean }
      claim_referral: { Args: { _code: string }; Returns: boolean }
      event_counts: {
        Args: never
        Returns: {
          event_id: string
          n: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      in_course: { Args: { _slug: string; _user: string }; Returns: boolean }
      is_top_admin: { Args: { _user_id: string }; Returns: boolean }
      issue_completed_certificate: {
        Args: { _course_slug: string; _student_id: string }
        Returns: Json
      }
      org_add_member: {
        Args: { _email: string; _role: string }
        Returns: string
      }
      org_roster: {
        Args: never
        Returns: {
          course_slug: string
          full_name: string
          member_email: string
          progress: number
          status: string
        }[]
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
      session_roster: {
        Args: { _session: string }
        Returns: {
          student_email: string
          student_id: string
          student_name: string
        }[]
      }
      submit_quiz: { Args: { _answers: Json; _quiz: string }; Returns: Json }
      teaches: { Args: { _slug: string; _user: string }; Returns: boolean }
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
      app_role: "admin" | "student" | "trainer" | "staff" | "organization"
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
      app_role: ["admin", "student", "trainer", "staff", "organization"],
    },
  },
} as const
