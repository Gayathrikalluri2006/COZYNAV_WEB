export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      incident_reports: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          lat: number;
          lng: number;
          severity: number;
          type: Database["public"]["Enums"]["incident_type"];
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          lat: number;
          lng: number;
          severity?: number;
          type: Database["public"]["Enums"]["incident_type"];
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          lat?: number;
          lng?: number;
          severity?: number;
          type?: Database["public"]["Enums"]["incident_type"];
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          avoid_isolated: boolean;
          created_at: string;
          display_name: string | null;
          id: string;
          night_mode_safety: boolean;
          prefer_crowded: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          avoid_isolated?: boolean;
          created_at?: string;
          display_name?: string | null;
          id: string;
          night_mode_safety?: boolean;
          prefer_crowded?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          avoid_isolated?: boolean;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          night_mode_safety?: boolean;
          prefer_crowded?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      route_score_snapshots: {
        Row: {
          id: string;
          recorded_at: string;
          saved_route_id: string;
          score: number;
        };
        Insert: {
          id?: string;
          recorded_at?: string;
          saved_route_id: string;
          score: number;
        };
        Update: {
          id?: string;
          recorded_at?: string;
          saved_route_id?: string;
          score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "route_score_snapshots_saved_route_id_fkey";
            columns: ["saved_route_id"];
            isOneToOne: false;
            referencedRelation: "saved_routes";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_routes: {
        Row: {
          created_at: string;
          dest_lat: number;
          dest_lng: number;
          destination_text: string;
          id: string;
          label: string;
          last_safety_score: number | null;
          origin_lat: number;
          origin_lng: number;
          origin_text: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dest_lat: number;
          dest_lng: number;
          destination_text: string;
          id?: string;
          label: string;
          last_safety_score?: number | null;
          origin_lat: number;
          origin_lng: number;
          origin_text: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dest_lat?: number;
          dest_lng?: number;
          destination_text?: string;
          id?: string;
          label?: string;
          last_safety_score?: number | null;
          origin_lat?: number;
          origin_lng?: number;
          origin_text?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      incident_type:
        | "crime"
        | "accident"
        | "hazard"
        | "poor_lighting"
        | "crowd"
        | "weather"
        | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      incident_type: ["crime", "accident", "hazard", "poor_lighting", "crowd", "weather", "other"],
    },
  },
} as const;
