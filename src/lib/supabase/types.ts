export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          date: string;
          location: string;
          description: string;
          short_description: string;
          image: string;
          button_text: 'REGÍSTRATE' | 'VER EVENTO';
          category: string;
          duration: string | null;
          distance: string | null;
          difficulty: 'Principiante' | 'Intermedio' | 'Avanzado' | null;
          price: string | null;
          max_participants: number | null;
          requirements: any[];
          schedule: Array<{ time: string; activity: string }> | null;
          highlights: string[] | null;
          contact_info: {
            email?: string;
            phone?: string;
            whatsapp?: string;
          } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
    };
  };
}








