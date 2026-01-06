"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Calendar, User, LogOut, Clock, MapPin, CheckCircle, XCircle, ArrowRight, Trophy, Activity, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { StravaConnectButton } from '@/components/strava/StravaConnectButton';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

interface Member {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  membership_type: string;
  membership_status: string;
  profile_image?: string;
}

interface EventRegistration {
  id: string;
  event_id: string;
  registration_date: string;
  status: string;
  payment_status: string;
  event: {
    id: string;
    slug: string;
    title: string;
    date: string;
    location: string;
    image: string;
    category: string;
  };
}

interface StravaConnection {
  strava_athlete_id: number;
  athlete_data?: {
    username?: string;
    firstname?: string;
    lastname?: string;
    profile?: string;
  };
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [member, setMember] = useState<Member | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [stravaConnection, setStravaConnection] = useState<StravaConnection | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    checkAuthAndLoadData();

    // Verificar parámetros de Strava en la URL
    const stravaConnected = searchParams?.get('strava_connected');
    const stravaError = searchParams?.get('strava_error');

    if (stravaConnected === 'true') {
      toast.success('¡Strava conectado exitosamente!');
      // Limpiar URL
      window.history.replaceState({}, '', '/miembros/dashboard');
    } else if (stravaError) {
      const errorMessages: Record<string, string> = {
        cancelled: 'Conexión con Strava cancelada',
        invalid: 'Error en la autorización de Strava',
        config: 'Error de configuración',
        token: 'Error al obtener tokens de Strava',
        db: 'Error al guardar la conexión',
        unknown: 'Error desconocido',
      };
      toast.error(errorMessages[stravaError] || 'Error al conectar con Strava');
      // Limpiar URL
      window.history.replaceState({}, '', '/miembros/dashboard');
    }
  }, [searchParams]);

  const loadStravaConnection = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('strava_connections')
        .select('strava_athlete_id, athlete_data')
        .eq('member_id', memberId)
        .single();

      if (!error && data) {
        setStravaConnection(data as StravaConnection);
      } else {
        setStravaConnection(null);
      }
    } catch (error) {
      console.error('Error loading Strava connection:', error);
      setStravaConnection(null);
    }
  };

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/miembros/login');
        return;
      }

      // Cargar perfil del miembro
      let { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single();

      // Si el perfil no existe, crearlo automáticamente
      if (memberError && memberError.code === 'PGRST116') {
        // PGRST116 = no rows returned
        const { data: newMember, error: createError } = await supabase
          .from('members')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Miembro',
            phone: user.user_metadata?.phone || null,
            membership_type: 'regular',
            membership_status: 'active',
          })
          .select()
          .single();

        if (createError) {
          toast.error('Error al crear tu perfil', {
            description: createError.message || 'Por favor, intenta recargar la página',
          });
          return;
        }

        memberData = newMember;
        toast.success('Perfil creado', {
          description: 'Tu perfil ha sido creado automáticamente',
        });
      } else if (memberError) {
        toast.error('Error al cargar tu perfil', {
          description: memberError.message || 'Por favor, intenta recargar la página',
        });
        return;
      }

      if (memberData) {
        setMember(memberData);
        // Cargar conexión de Strava
        await loadStravaConnection(memberData.id);
      }

      // Cargar registros de eventos
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('event_registrations')
        .select(`
          id,
          event_id,
          registration_date,
          status,
          payment_status,
          event:events (
            id,
            slug,
            title,
            date,
            location,
            image,
            category
          )
        `)
        .eq('member_id', user.id)
        .order('registration_date', { ascending: false });

      if (registrationsError) {
        // Error al cargar registros, pero no bloqueamos la vista
      } else if (registrationsData) {
        // Transformar los datos para asegurar que event sea un objeto, no un array
        const transformedRegistrations = registrationsData.map((reg: any) => ({
          id: reg.id,
          event_id: reg.event_id,
          registration_date: reg.registration_date,
          status: reg.status,
          payment_status: reg.payment_status,
          event: Array.isArray(reg.event) ? reg.event[0] : reg.event,
        })).filter((reg: any) => reg.event); // Filtrar registros sin evento
        
        setRegistrations(transformedRegistrations);
      }
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      router.push('/');
      toast.success('Sesión cerrada');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; className: string; icon: any } } = {
      registered: { label: 'Registrado', className: 'bg-blue-500/20 text-blue-500', icon: Clock },
      confirmed: { label: 'Confirmado', className: 'bg-green-500/20 text-green-500', icon: CheckCircle },
      cancelled: { label: 'Cancelado', className: 'bg-red-500/20 text-red-500', icon: XCircle },
      attended: { label: 'Asistió', className: 'bg-green-500/20 text-green-500', icon: CheckCircle },
      no_show: { label: 'No asistió', className: 'bg-gray-500/20 text-gray-500', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.registered;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </main>
    );
  }

  if (!member) {
    return null;
  }

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="container-premium">
        {/* Header con Perfil */}
        <div className="mb-8">
          {/* Profile Header Card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            {/* Background Pattern */}
            <div className="h-32 bg-gradient-to-r from-foreground/10 via-foreground/5 to-foreground/10 relative">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground rounded-full blur-3xl"></div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="px-6 pb-6 -mt-16 relative">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex items-end gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {member.profile_image ? (
                      <img
                        src={member.profile_image}
                        alt={member.full_name}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-foreground/10 flex items-center justify-center">
                        <span className="text-2xl md:text-4xl font-display font-bold text-foreground">
                          {getInitials(member.full_name)}
                        </span>
                      </div>
                    )}
                    {/* Status Indicator */}
                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  
                  {/* Name and Info */}
                  <div className="mb-2">
                    <h1 className="font-display text-2xl md:text-3xl text-foreground font-bold mb-1">
                      {member.full_name}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-2">
                      {member.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-foreground/10 text-foreground rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Miembro {member.membership_status === 'active' ? 'Activo' : member.membership_status}
                      </span>
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                        {member.membership_type}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/miembros/perfil"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors text-sm"
                  >
                    <User className="w-4 h-4" />
                    Editar Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-card transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Eventos Registrados */}
            <div className="bg-card border border-border p-4 rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Eventos</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {registrations.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Eventos Completados */}
            <div className="bg-card border border-border p-4 rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completados</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {registrations.filter(r => r.status === 'attended').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Kilómetros */}
            <div className="bg-card border border-border p-4 rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kilómetros</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    0
                  </p>
                </div>
              </div>
            </div>

            {/* Posición */}
            <div className="bg-card border border-border p-4 rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posición</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    --
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Strava Connection Card - Próximamente */}
          <div className="bg-card border border-border p-6 rounded-lg mb-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FC4C02] rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[#FC4C02]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl text-foreground font-light mb-2">
                    Integración con Strava
                  </h2>
                  <span className="inline-block text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full mb-4">
                    Próximamente
                  </span>
                  <p className="text-sm text-muted-foreground mb-4">
                    Muy pronto podrás conectar tu cuenta de Strava y disfrutar de estas funcionalidades:
                  </p>
                </div>
              </div>

              {/* Features Tease */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-[#FC4C02]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground mb-1 uppercase tracking-wider">Leaderboard Automático</h3>
                    <p className="text-xs text-muted-foreground">
                      Tus actividades se sincronizarán automáticamente y competirás en tiempo real
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-[#FC4C02]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground mb-1 uppercase tracking-wider">Estadísticas Detalladas</h3>
                    <p className="text-xs text-muted-foreground">
                      Visualiza tus kilómetros, ritmos y progreso de entrenamiento
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#FC4C02]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground mb-1 uppercase tracking-wider">Competencia Social</h3>
                    <p className="text-xs text-muted-foreground">
                      Compara tu rendimiento con otros miembros del club
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-[#FC4C02]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground mb-1 uppercase tracking-wider">Seguimiento de Progreso</h3>
                    <p className="text-xs text-muted-foreground">
                      Analiza tu evolución y alcanza tus objetivos de running
                    </p>
                  </div>
                </div>
              </div>

              <StravaConnectButton
                isConnected={false}
                onConnectionChange={() => {}}
              />
            </div>
          </div>
        </div>

        {/* My Events */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-foreground">Mis Eventos</h2>
            <Link
              href="/#eventos"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Ver todos los eventos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-card border border-border p-12 rounded-lg text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No tienes eventos registrados</p>
              <Link
                href="/#eventos"
                className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors"
              >
                Explorar Eventos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((registration) => (
                <Link
                  key={registration.id}
                  href={`/eventos/${registration.event.slug}`}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/50 transition-all group"
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={registration.event.image}
                      alt={registration.event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/hero-runners.jpg';
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-display text-xl text-foreground group-hover:text-foreground/80 transition-colors flex-1">
                        {registration.event.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {registration.event.category}
                      </span>
                      {getStatusBadge(registration.status)}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{registration.event.date}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{registration.event.location}</span>
                    </div>

                    {registration.payment_status === 'pending' && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Pago pendiente
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function MemberDashboard() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </main>
    }>
      <DashboardContent />
    </Suspense>
  );
}

