export interface Event {
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
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
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

const nightRun = '/assets/night-run.jpg';
const trailRun = '/assets/trail-run.jpg';
const urbanRun = '/assets/urban-run.jpg';
const community = '/assets/community.jpg';
const heroImage = '/assets/hero-runners.jpg';

export const events: Event[] = [
  {
    slug: 'night-run',
    title: 'Night Run',
    date: '15 Dic 2024',
    location: 'Centro Histórico',
    description: 'Corre bajo las estrellas por las calles iluminadas de Puebla. Una experiencia única que combina running urbano con la belleza nocturna de nuestra ciudad. Disfruta de un recorrido por los lugares más emblemáticos mientras te ejercitas en un ambiente relajado y comunitario.',
    shortDescription: 'Corre bajo las estrellas por las calles iluminadas de Puebla.',
    image: nightRun,
    buttonText: 'REGÍSTRATE',
    category: 'Carrera Urbana',
    duration: '1.5 horas',
    distance: '5K - 10K',
    difficulty: 'Intermedio',
    price: 'Gratis para miembros',
    maxParticipants: 50,
    requirements: [
      'Ser miembro de RUNNING ERA',
      'Equipo de running con reflectores',
      'Hidratación personal',
    ],
    schedule: [
      { time: '19:00', activity: 'Registro y calentamiento' },
      { time: '19:30', activity: 'Inicio de la carrera' },
      { time: '21:00', activity: 'Estiramiento y networking' },
    ],
    highlights: [
      'Recorrido por el Centro Histórico iluminado',
      'Fotografía profesional incluida',
      'Refrigerio post-carrera',
      'Medalla conmemorativa',
    ],
    contactInfo: {
      email: 'eventos@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'trail-pietra',
    title: 'Trail Pietra',
    date: '22 Dic 2024',
    location: 'Sierra de Puebla',
    description: 'Aventura en montaña con vistas espectaculares. Desafía tus límites en esta ruta de trail running por la Sierra de Puebla. Conecta con la naturaleza mientras mejoras tu resistencia y técnica en terrenos variados.',
    shortDescription: 'Aventura en montaña con vistas espectaculares.',
    image: trailRun,
    buttonText: 'VER EVENTO',
    category: 'Trail Running',
    duration: '3 horas',
    distance: '12K - 21K',
    difficulty: 'Avanzado',
    price: '$500 MXN',
    maxParticipants: 30,
    requirements: [
      'Experiencia previa en trail running',
      'Equipo de trail running adecuado',
      'Hidratación y nutrición para 3+ horas',
    ],
    schedule: [
      { time: '06:00', activity: 'Salida desde punto de encuentro' },
      { time: '07:00', activity: 'Llegada e inicio de carrera' },
      { time: '10:00', activity: 'Finalización y estiramiento' },
    ],
    highlights: [
      'Vistas panorámicas de la Sierra',
      'Guía profesional de montaña',
      'Apoyo médico en ruta',
      'Fotografía aérea con drone',
    ],
    contactInfo: {
      email: 'trail@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'fika-social-run',
    title: 'FIKA Social Run',
    date: '28 Dic 2024',
    location: 'Angelópolis',
    description: 'Run + café + networking con la comunidad. Combina ejercicio con conexión social en este evento único. Después de una carrera relajada, disfruta de un café premium mientras conoces a otros miembros de la comunidad.',
    shortDescription: 'Run + café + networking con la comunidad.',
    image: community,
    buttonText: 'REGÍSTRATE',
    category: 'Social',
    duration: '2 horas',
    distance: '3K - 5K',
    difficulty: 'Principiante',
    price: 'Gratis para miembros',
    maxParticipants: 40,
    requirements: [
      'Ser miembro de RUNNING ERA',
      'Ropa cómoda para running',
    ],
    schedule: [
      { time: '08:00', activity: 'Registro y bienvenida' },
      { time: '08:30', activity: 'Carrera social' },
      { time: '09:30', activity: 'FIKA (café y networking)' },
    ],
    highlights: [
      'Café premium incluido',
      'Networking con la comunidad',
      'Ambiente relajado y social',
      'Fotografía de grupo',
    ],
    contactInfo: {
      email: 'social@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'lululemon-collab',
    title: 'Lululemon Collab',
    date: '5 Ene 2025',
    location: 'Lululemon Store',
    description: 'Entrenamiento exclusivo con la marca premium. Colaboración especial con Lululemon para un entrenamiento de alta calidad. Accede a productos exclusivos y técnicas avanzadas de entrenamiento.',
    shortDescription: 'Entrenamiento exclusivo con la marca premium.',
    image: urbanRun,
    buttonText: 'VER EVENTO',
    category: 'Entrenamiento',
    duration: '2 horas',
    distance: 'N/A',
    difficulty: 'Intermedio',
    price: 'Gratis para miembros',
    maxParticipants: 25,
    requirements: [
      'Ser miembro de RUNNING ERA',
      'Ropa deportiva cómoda',
    ],
    schedule: [
      { time: '10:00', activity: 'Bienvenida y presentación de productos' },
      { time: '10:30', activity: 'Entrenamiento funcional' },
      { time: '11:30', activity: 'Sesión de Q&A y networking' },
    ],
    highlights: [
      'Acceso a productos Lululemon',
      'Descuentos exclusivos',
      'Entrenamiento con coaches certificados',
      'Goodie bag premium',
    ],
    contactInfo: {
      email: 'collab@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'sunrise-run',
    title: 'Sunrise Run',
    date: '12 Ene 2025',
    location: 'Parque Ecológico',
    description: 'Comienza el día corriendo al amanecer con la comunidad. Disfruta de los primeros rayos del sol mientras corres en un ambiente natural y tranquilo. Perfecto para empezar el día con energía positiva.',
    shortDescription: 'Comienza el día corriendo al amanecer con la comunidad.',
    image: heroImage,
    buttonText: 'REGÍSTRATE',
    category: 'Carrera Matutina',
    duration: '1.5 horas',
    distance: '5K',
    difficulty: 'Principiante',
    price: 'Gratis para miembros',
    maxParticipants: 60,
    requirements: [
      'Ser miembro de RUNNING ERA',
      'Ropa cómoda para running',
    ],
    schedule: [
      { time: '06:30', activity: 'Registro y calentamiento' },
      { time: '07:00', activity: 'Inicio de la carrera' },
      { time: '08:00', activity: 'Estiramiento y desayuno ligero' },
    ],
    highlights: [
      'Amanecer en el parque',
      'Ambiente natural y relajado',
      'Desayuno ligero incluido',
      'Fotografía del amanecer',
    ],
    contactInfo: {
      email: 'eventos@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'trail-challenge',
    title: 'Trail Challenge',
    date: '19 Ene 2025',
    location: 'Sierra Norte',
    description: 'Desafío de trail running en las montañas de Puebla. Pon a prueba tu resistencia y habilidades técnicas en este desafío diseñado para corredores experimentados.',
    shortDescription: 'Desafío de trail running en las montañas de Puebla.',
    image: trailRun,
    buttonText: 'VER EVENTO',
    category: 'Trail Running',
    duration: '4 horas',
    distance: '25K',
    difficulty: 'Avanzado',
    price: '$800 MXN',
    maxParticipants: 20,
    requirements: [
      'Experiencia avanzada en trail running',
      'Equipo completo de trail running',
      'Hidratación y nutrición para 4+ horas',
      'Certificado médico reciente',
    ],
    schedule: [
      { time: '05:00', activity: 'Salida desde punto de encuentro' },
      { time: '06:30', activity: 'Inicio del desafío' },
      { time: '10:30', activity: 'Finalización y premiación' },
    ],
    highlights: [
      'Ruta técnica y desafiante',
      'Apoyo completo en ruta',
      'Medalla y certificado de finalización',
      'Fotografía profesional',
    ],
    contactInfo: {
      email: 'trail@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'urban-night-run',
    title: 'Urban Night Run',
    date: '26 Ene 2025',
    location: 'Zona Esmeralda',
    description: 'Carrera nocturna urbana por las mejores zonas de la ciudad. Explora los rincones más modernos de Puebla mientras te ejercitas en un ambiente nocturno único.',
    shortDescription: 'Carrera nocturna urbana por las mejores zonas de la ciudad.',
    image: nightRun,
    buttonText: 'REGÍSTRATE',
    category: 'Carrera Urbana',
    duration: '2 horas',
    distance: '8K',
    difficulty: 'Intermedio',
    price: 'Gratis para miembros',
    maxParticipants: 50,
    requirements: [
      'Ser miembro de RUNNING ERA',
      'Equipo de running con reflectores',
      'Hidratación personal',
    ],
    schedule: [
      { time: '19:00', activity: 'Registro y calentamiento' },
      { time: '19:30', activity: 'Inicio de la carrera' },
      { time: '21:00', activity: 'Networking y cierre' },
    ],
    highlights: [
      'Recorrido por Zona Esmeralda',
      'Iluminación especial',
      'Fotografía nocturna',
      'Refrigerio post-carrera',
    ],
    contactInfo: {
      email: 'eventos@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'community-run',
    title: 'Community Run',
    date: '2 Feb 2025',
    location: 'Centro Histórico',
    description: 'Carrera comunitaria abierta a todos los niveles. Un evento inclusivo donde todos son bienvenidos, sin importar tu nivel de experiencia. Perfecto para principiantes y para conectar con la comunidad.',
    shortDescription: 'Carrera comunitaria abierta a todos los niveles.',
    image: community,
    buttonText: 'VER EVENTO',
    category: 'Social',
    duration: '1.5 horas',
    distance: '3K - 5K',
    difficulty: 'Principiante',
    price: 'Gratis para miembros',
    maxParticipants: 100,
    requirements: [
      'Ser miembro de RUNNING ERA',
      'Ropa cómoda para running',
    ],
    schedule: [
      { time: '08:00', activity: 'Registro y bienvenida' },
      { time: '08:30', activity: 'Carrera comunitaria' },
      { time: '09:30', activity: 'Actividades de integración' },
    ],
    highlights: [
      'Inclusivo para todos los niveles',
      'Ambiente familiar y acogedor',
      'Actividades post-carrera',
      'Fotografía de grupo',
    ],
    contactInfo: {
      email: 'comunidad@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
  {
    slug: 'premium-training',
    title: 'Premium Training',
    date: '9 Feb 2025',
    location: 'Estadio Cuauhtémoc',
    description: 'Entrenamiento premium con coaches profesionales. Mejora tu técnica, velocidad y resistencia con sesiones dirigidas por entrenadores certificados en instalaciones de primer nivel.',
    shortDescription: 'Entrenamiento premium con coaches profesionales.',
    image: urbanRun,
    buttonText: 'REGÍSTRATE',
    category: 'Entrenamiento',
    duration: '2 horas',
    distance: 'N/A',
    difficulty: 'Intermedio',
    price: '$600 MXN',
    maxParticipants: 30,
    requirements: [
      'Ser miembro de RUNNING ERA',
      'Ropa deportiva adecuada',
      'Hidratación personal',
    ],
    schedule: [
      { time: '09:00', activity: 'Bienvenida y evaluación inicial' },
      { time: '09:30', activity: 'Entrenamiento técnico' },
      { time: '11:00', activity: 'Sesión de fuerza y acondicionamiento' },
      { time: '11:30', activity: 'Estiramiento y cierre' },
    ],
    highlights: [
      'Coaches certificados',
      'Instalaciones premium',
      'Análisis de técnica personalizado',
      'Plan de entrenamiento individual',
    ],
    contactInfo: {
      email: 'training@runningera.mx',
      whatsapp: '+52 222 123 4567',
    },
  },
];

export function getEventBySlug(slug: string): Event | undefined {
  return events.find(event => event.slug === slug);
}

export function getAllEventSlugs(): string[] {
  return events.map(event => event.slug);
}

