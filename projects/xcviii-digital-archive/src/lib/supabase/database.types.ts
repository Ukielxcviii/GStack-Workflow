export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      collections: {
        Row: {
          collection_code: string;
          cover_image_url: string | null;
          created_at: string;
          id: string;
          internal_notes: string | null;
          name: string;
          planned_piece_total: number | null;
          release_date: string | null;
          short_description: string | null;
          slug: string;
          status: string;
          story: string | null;
          updated_at: string;
        };
        Insert: {
          collection_code: string;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          internal_notes?: string | null;
          name: string;
          planned_piece_total?: number | null;
          release_date?: string | null;
          short_description?: string | null;
          slug: string;
          status?: string;
          story?: string | null;
          updated_at?: string;
        };
        Update: {
          collection_code?: string;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          internal_notes?: string | null;
          name?: string;
          planned_piece_total?: number | null;
          release_date?: string | null;
          short_description?: string | null;
          slug?: string;
          status?: string;
          story?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      pieces: {
        Row: {
          authenticity_status: string;
          base_hat_brand: string | null;
          base_hat_model: string | null;
          build_time_minutes: number | null;
          care_instructions: string | null;
          collection_id: string;
          completion_date: string | null;
          craft_technique: string | null;
          created_at: string;
          crystal_count: number | null;
          edition_number: number;
          edition_total: number;
          first_published_at: string | null;
          hat_size: string | null;
          id: string;
          internal_notes: string | null;
          main_image_url: string | null;
          materials: string | null;
          name: string;
          nfc_last_tested_at: string | null;
          nfc_status: string;
          pearl_count: number | null;
          piece_id: string;
          piece_status: string;
          primary_color: string | null;
          product_tier: string;
          public_description: string | null;
          publication_status: string;
          slug: string;
          team: string | null;
          updated_at: string;
        };
        Insert: {
          authenticity_status?: string;
          base_hat_brand?: string | null;
          base_hat_model?: string | null;
          build_time_minutes?: number | null;
          care_instructions?: string | null;
          collection_id: string;
          completion_date?: string | null;
          craft_technique?: string | null;
          created_at?: string;
          crystal_count?: number | null;
          edition_number: number;
          edition_total: number;
          first_published_at?: string | null;
          hat_size?: string | null;
          id?: string;
          internal_notes?: string | null;
          main_image_url?: string | null;
          materials?: string | null;
          name: string;
          nfc_last_tested_at?: string | null;
          nfc_status?: string;
          pearl_count?: number | null;
          piece_id: string;
          piece_status?: string;
          primary_color?: string | null;
          product_tier: string;
          public_description?: string | null;
          publication_status?: string;
          slug: string;
          team?: string | null;
          updated_at?: string;
        };
        Update: {
          authenticity_status?: string;
          base_hat_brand?: string | null;
          base_hat_model?: string | null;
          build_time_minutes?: number | null;
          care_instructions?: string | null;
          collection_id?: string;
          completion_date?: string | null;
          craft_technique?: string | null;
          created_at?: string;
          crystal_count?: number | null;
          edition_number?: number;
          edition_total?: number;
          first_published_at?: string | null;
          hat_size?: string | null;
          id?: string;
          internal_notes?: string | null;
          main_image_url?: string | null;
          materials?: string | null;
          name?: string;
          nfc_last_tested_at?: string | null;
          nfc_status?: string;
          pearl_count?: number | null;
          piece_id?: string;
          piece_status?: string;
          primary_color?: string | null;
          product_tier?: string;
          public_description?: string | null;
          publication_status?: string;
          slug?: string;
          team?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pieces_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scan_events: {
        Row: {
          anonymous_identifier: string | null;
          country_code: string | null;
          device_category: string | null;
          id: string;
          piece_id: string;
          referrer: string | null;
          scanned_at: string;
          user_agent: string | null;
        };
        Insert: {
          anonymous_identifier?: string | null;
          country_code?: string | null;
          device_category?: string | null;
          id?: string;
          piece_id: string;
          referrer?: string | null;
          scanned_at?: string;
          user_agent?: string | null;
        };
        Update: {
          anonymous_identifier?: string | null;
          country_code?: string | null;
          device_category?: string | null;
          id?: string;
          piece_id?: string;
          referrer?: string | null;
          scanned_at?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scan_events_piece_id_fkey";
            columns: ["piece_id"];
            isOneToOne: false;
            referencedRelation: "pieces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
