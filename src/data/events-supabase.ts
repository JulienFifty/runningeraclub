import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  description: string;
  shortDescription: string;
  image: string;
  buttonText: 'REGÍSTRATE' | 'VER EVENTO';
  category: string;
  duration?: string;
  distance?: string;
  difficulty?: string | string[]; // Puede ser string (legacy) o array de strings
  price?: string;
  maxParticipants?: number;
  requirements?: string[];
  schedule?: {
    time: string;
    activity: string;
  }[];
  highlights?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
}

// Función para transformar datos de Supabase al formato de la aplicación
function transformEvent(event: any): Event {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    date: event.date,
    location: event.location,
    description: event.description,
    shortDescription: event.short_description,
    image: event.image,
    buttonText: event.button_text,
    category: event.category,
    duration: event.duration || undefined,
    distance: event.distance || undefined,
    difficulty: Array.isArray(event.difficulty) 
      ? event.difficulty 
      : event.difficulty 
      ? event.difficulty 
      : undefined,
    price: event.price || undefined,
    maxParticipants: event.max_participants || undefined,
    requirements: event.requirements || [],
    schedule: event.schedule || [],
    highlights: event.highlights || [],
    contactInfo: event.contact_info || {},
  };
}

export async function getEvents(): Promise<Event[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return (data || []).map(transformEvent);
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function getEventBySlug(slug: string, useStaticClient = false): Promise<Event | undefined> {
  try {
    // Si useStaticClient es true, usar cliente directo sin cookies (para generateStaticParams)
    const supabase = useStaticClient 
      ? createStaticClient()
      : await createClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return undefined;
    }

    return transformEvent(data);
  } catch (error) {
    console.error('Error fetching event:', error);
    return undefined;
  }
}

// Función para obtener slugs sin cookies (para generateStaticParams)
function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createSupabaseClient(url, key);
}

export async function getAllEventSlugs(): Promise<string[]> {
  try {
    // Verificar que las variables de entorno estén disponibles
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Si no hay variables de entorno, retornar array vacío (build time)
      return [];
    }
    
    // Para generateStaticParams, usar cliente directo sin cookies
    // Para otros casos, usar el cliente del servidor
    const supabase = createStaticClient();
    
    if (!supabase) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('events')
      .select('slug');

    if (error || !data) {
      return [];
    }

    return data.map((event: { slug: string }) => event.slug);
  } catch (error) {
    // En build time, si hay error, retornar array vacío
    return [];
  }
}

