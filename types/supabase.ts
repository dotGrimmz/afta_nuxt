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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bingo_cards: {
        Row: {
          auto_mark_enabled: boolean
          contestant_id: string
          free_space: boolean
          game_id: string
          grid: Json
          id: string
          is_winner_candidate: boolean
        }
        Insert: {
          auto_mark_enabled?: boolean
          contestant_id: string
          free_space?: boolean
          game_id: string
          grid: Json
          id?: string
          is_winner_candidate?: boolean
        }
        Update: {
          auto_mark_enabled?: boolean
          contestant_id?: string
          free_space?: boolean
          game_id?: string
          grid?: Json
          id?: string
          is_winner_candidate?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bingo_cards_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "bingo_contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bingo_cards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bingo_games"
            referencedColumns: ["id"]
          },
        ]
      }
      bingo_contestants: {
        Row: {
          code: string
          game_id: string
          id: string
          joined_at: string
          num_cards: number
          username: string
        }
        Insert: {
          code: string
          game_id: string
          id?: string
          joined_at?: string
          num_cards?: number
          username: string
        }
        Update: {
          code?: string
          game_id?: string
          id?: string
          joined_at?: string
          num_cards?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "bingo_contestants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bingo_games"
            referencedColumns: ["id"]
          },
        ]
      }
      bingo_draws: {
        Row: {
          called_at: string
          draw_order: number
          game_id: string
          id: string
          number: number
        }
        Insert: {
          called_at?: string
          draw_order: number
          game_id: string
          id?: string
          number: number
        }
        Update: {
          called_at?: string
          draw_order?: number
          game_id?: string
          id?: string
          number?: number
        }
        Relationships: [
          {
            foreignKeyName: "bingo_draws_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bingo_games"
            referencedColumns: ["id"]
          },
        ]
      }
      bingo_games: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          min_players: number
          status: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          min_players?: number
          status?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          min_players?: number
          status?: string
        }
        Relationships: []
      }
      bingo_results: {
        Row: {
          card_id: string
          contestant_id: string
          game_id: string
          id: string
          payout: number
          won_at: string
        }
        Insert: {
          card_id: string
          contestant_id: string
          game_id: string
          id?: string
          payout?: number
          won_at?: string
        }
        Update: {
          card_id?: string
          contestant_id?: string
          game_id?: string
          id?: string
          payout?: number
          won_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bingo_results_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "bingo_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bingo_results_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "bingo_contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bingo_results_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bingo_games"
            referencedColumns: ["id"]
          },
        ]
      }
      buzzes: {
        Row: {
          id: string
          ping_ms: number | null
          player_id: string
          received_at: string
          round_id: string
          ts: string
        }
        Insert: {
          id?: string
          ping_ms?: number | null
          player_id: string
          received_at?: string
          round_id: string
          ts?: string
        }
        Update: {
          id?: string
          ping_ms?: number | null
          player_id?: string
          received_at?: string
          round_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "buzzes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buzzes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_players: {
        Row: {
          avatar_url: string | null
          display_name: string
          game_id: string
          id: string
          joined_at: string
          role: string | null
          score: number
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name: string
          game_id: string
          id?: string
          joined_at?: string
          role?: string | null
          score?: number
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string
          game_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          created_by: string | null
          host_user_id: string
          id: string
          ping_ms: number | null
          status: Database["public"]["Enums"]["game_status"]
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          host_user_id: string
          id?: string
          ping_ms?: number | null
          status?: Database["public"]["Enums"]["game_status"]
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          host_user_id?: string
          id?: string
          ping_ms?: number | null
          status?: Database["public"]["Enums"]["game_status"]
          title?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string | null
          sort: number | null
          text: string
        }
        Insert: {
          id?: string
          poll_id?: string | null
          sort?: number | null
          text: string
        }
        Update: {
          id?: string
          poll_id?: string | null
          sort?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "poll_with_votes"
            referencedColumns: ["poll_id"]
          },
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_results: {
        Row: {
          finalized_at: string | null
          id: string
          option_id: string | null
          poll_id: string | null
          votes_total: number | null
        }
        Insert: {
          finalized_at?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          votes_total?: number | null
        }
        Update: {
          finalized_at?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          votes_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_results_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_results_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_with_votes"
            referencedColumns: ["option_id"]
          },
          {
            foreignKeyName: "poll_results_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "poll_with_votes"
            referencedColumns: ["poll_id"]
          },
          {
            foreignKeyName: "poll_results_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          option_id: string | null
          poll_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string | null
          option_id?: string | null
          poll_id: string
          voter_id: string
        }
        Update: {
          created_at?: string | null
          option_id?: string | null
          poll_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_with_votes"
            referencedColumns: ["option_id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "poll_with_votes"
            referencedColumns: ["poll_id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          created_by: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          poll_type: string | null
          question: string
          started_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          poll_type?: string | null
          question: string
          started_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          poll_type?: string | null
          question?: string
          started_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string
          category: string | null
          difficulty: number | null
          id: string
          prompt: string
          ref: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          difficulty?: number | null
          id?: string
          prompt: string
          ref?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          difficulty?: number | null
          id?: string
          prompt?: string
          ref?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          correct: boolean | null
          created_at: string
          game_id: string
          id: string
          locked_player_id: string | null
          question_id: string
          show_at: string | null
          status: Database["public"]["Enums"]["round_status"]
        }
        Insert: {
          correct?: boolean | null
          created_at?: string
          game_id: string
          id?: string
          locked_player_id?: string | null
          question_id: string
          show_at?: string | null
          status?: Database["public"]["Enums"]["round_status"]
        }
        Update: {
          correct?: boolean | null
          created_at?: string
          game_id?: string
          id?: string
          locked_player_id?: string | null
          question_id?: string
          show_at?: string | null
          status?: Database["public"]["Enums"]["round_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_locked_player_id_fkey"
            columns: ["locked_player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      poll_with_votes: {
        Row: {
          created_at: string | null
          is_active: boolean | null
          option_id: string | null
          option_text: string | null
          poll_id: string | null
          question: string | null
          vote_count: number | null
        }
        Relationships: []
      }
      v_game_membership: {
        Row: {
          game_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      buzz: {
        Args: { _round_id: string }
        Returns: Json
      }
      get_grouped_polls: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      game_status: "lobby" | "live" | "ended"
      round_status: "hidden" | "shown" | "locked" | "scored"
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
      game_status: ["lobby", "live", "ended"],
      round_status: ["hidden", "shown", "locked", "scored"],
    },
  },
} as const
