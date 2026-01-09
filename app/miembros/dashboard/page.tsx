"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Calendar, User, LogOut, Clock, MapPin, CheckCircle, XCircle, ArrowRight, Trophy, Activity, TrendingUp, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { StravaConnectButton } from '@/components/strava/StravaConnectButton';
import { CancelRegistrationModal } from '@/components/CancelRegistrationModal';
import { NotificationPermissionButton } from '@/components/NotificationPermissionButton';
import { autoSubscribeToPushNotifications } from '@/lib/auto-subscribe-push';

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
  stripe_payment_intent_id?: string | null;
  amount_paid?: number | null;
  currency?: string | null;
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
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkAuthAndLoadData();

    // Verificar parámetro de confirmación de email
    const emailConfirmed = searchParams?.get('email_confirmed');
    if (emailConfirmed === 'true') {
      toast.success('¡Email confirmado exitosamente!', {
        description: 'Bienvenido a RUNNING ERA Club',
      });
      
      // Intentar suscribirse automáticamente a notificaciones push
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await autoSubscribeToPushNotifications(user.id);
        }
      }, 1000); // Esperar 1 segundo para que la página termine de cargar
      
      // Limpiar URL
      window.history.replaceState({}, '', '/miembros/dashboard');
    }

    // Verificar si viene de un pago exitoso
    const paymentSuccess = searchParams?.get('payment_success');
    if (paymentSuccess === 'true') {
      toast.success('¡Pago completado exitosamente!', {
        description: 'Tu registro ha sido confirmado',
      });
      // Refrescar los registros después de un breve delay para asegurar que el webhook se ejecutó
      setTimeout(async () => {
        await reloadRegistrations();
      }, 2000);
      // Limpiar URL
      window.history.replaceState({}, '', '/miembros/dashboard');
    }

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

  const reloadRegistrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
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
          stripe_session_id,
          event:events (
            id,
            slug,
            title,
            date,
            location,
            image,
            category,
            price
          )
        `)
        .eq('member_id', user.id)
        .order('registration_date', { ascending: false });

      if (registrationsError) {
        console.error('Error reloading registrations:', registrationsError);
      } else if (registrationsData) {
        // Transformar los datos y filtrar
        const transformedRegistrations = registrationsData
          .map((reg: any) => ({
            id: reg.id,
            event_id: reg.event_id,
            registration_date: reg.registration_date,
            status: reg.status,
            payment_status: reg.payment_status,
            stripe_session_id: reg.stripe_session_id,
            event: Array.isArray(reg.event) ? reg.event[0] : reg.event,
          }))
          .filter((reg: any) => {
            if (!reg.event) return false;
            
            // Verificar si el evento es gratuito
            const price = reg.event.price?.toString().toLowerCase();
            const isFreeEvent = !price || price === 'gratis' || price === '0' || price === 'free';
            
            // Mostrar si:
            // 1. Está pagado
            // 2. Es evento gratuito
            // 3. Tiene stripe_session_id (pago iniciado, puede estar pendiente de webhook)
            return reg.payment_status === 'paid' || isFreeEvent || !!reg.stripe_session_id;
          });
        
        console.log('🔄 Registros recargados:', transformedRegistrations.length);
        setRegistrations(transformedRegistrations);
      }
    } catch (error) {
      console.error('Error reloading registrations:', error);
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
        
        // Intentar suscribirse automáticamente a notificaciones push después de crear el perfil
        setTimeout(async () => {
          await autoSubscribeToPushNotifications(user.id);
        }, 1500); // Esperar 1.5 segundos para que la página termine de cargar
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
          stripe_session_id,
          stripe_payment_intent_id,
          amount_paid,
          currency,
          event:events (
            id,
            slug,
            title,
            date,
            location,
            image,
            category,
            price
          )
        `)
        .eq('member_id', user.id)
        .order('registration_date', { ascending: false });

      if (registrationsError) {
        console.error('Error loading registrations:', registrationsError);
        // Error al cargar registros, pero no bloqueamos la vista
      } else if (registrationsData) {
        // Transformar los datos y filtrar
        const transformedRegistrations = registrationsData
          .map((reg: any) => ({
            id: reg.id,
            event_id: reg.event_id,
            registration_date: reg.registration_date,
            status: reg.status,
            payment_status: reg.payment_status,
            stripe_session_id: reg.stripe_session_id,
            stripe_payment_intent_id: reg.stripe_payment_intent_id,
            amount_paid: reg.amount_paid,
            currency: reg.currency,
            event: Array.isArray(reg.event) ? reg.event[0] : reg.event,
          }))
          .filter((reg: any) => {
            if (!reg.event) return false;
            
            // Verificar si el evento es gratuito
            const price = reg.event.price?.toString().toLowerCase();
            const isFreeEvent = !price || price === 'gratis' || price === '0' || price === 'free';
            
            // Mostrar si:
            // 1. Está pagado
            // 2. Es evento gratuito
            // 3. Tiene stripe_session_id (pago iniciado, puede estar pendiente de webhook)
            return reg.payment_status === 'paid' || isFreeEvent || !!reg.stripe_session_id;
          });
        
        console.log('📋 Registros cargados:', transformedRegistrations.length);
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
    <main className="min-h-screen bg-background px-0 md:p-8">
      <div className="max-w-7xl mx-auto md:container-premium">
        {/* Header con Perfil */}
        <div className="mb-4 md:mb-8">
          {/* Profile Header Card */}
          <div className="bg-card border-b border-border md:border md:border-border md:rounded-lg overflow-hidden mb-3 md:mb-6">
            {/* Background Pattern */}
            <div className="h-24 md:h-32 bg-gradient-to-r from-foreground/10 via-foreground/5 to-foreground/10 relative">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground rounded-full blur-3xl"></div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="px-4 md:px-6 pb-4 md:pb-6 -mt-12 md:-mt-16 relative">
              <div className="flex flex-col gap-4">
                <div className="flex items-end gap-3 md:gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {member.profile_image ? (
                      <img
                        src={member.profile_image}
                        alt={member.full_name}
                        className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-background object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-background bg-foreground/10 flex items-center justify-center">
                        <span className="text-xl md:text-4xl font-sans font-bold text-foreground">
                          {getInitials(member.full_name)}
                        </span>
                      </div>
                    )}
                    {/* Status Indicator */}
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  
                  {/* Name and Info */}
                  <div className="mb-0 md:mb-2 flex-1 min-w-0">
                    <h1 className="font-sans text-xl md:text-3xl text-foreground font-bold mb-1 break-words">
                      {member.full_name}
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2 truncate">
                      {member.email}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-foreground/10 text-foreground rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Miembro </span>
                        {member.membership_status === 'active' ? 'Activo' : member.membership_status}
                      </span>
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                        {member.membership_type}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 w-full flex-wrap">
                  <Link
                    href="/miembros/perfil"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors text-xs md:text-sm min-w-[120px]"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Editar </span>Perfil
                  </Link>
                  <div className="flex-1 min-w-[160px]">
                    <NotificationPermissionButton
                      variant="outline"
                      size="default"
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-border rounded-lg hover:bg-card transition-colors text-xs md:text-sm min-w-[100px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px md:gap-4 mb-4 md:mb-8 bg-border">
            {/* Eventos Registrados */}
            <div className="bg-card p-3 md:p-4 md:border md:border-border md:rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">Eventos</p>
                  <p className="text-xl md:text-2xl font-sans font-bold text-foreground">
                    {registrations.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Eventos Completados */}
            <div className="bg-card p-3 md:p-4 md:border md:border-border md:rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">Completados</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-foreground">
                    {registrations.filter(r => r.status === 'attended').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Kilómetros */}
            <div className="bg-card p-3 md:p-4 md:border md:border-border md:rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">Kilómetros</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-foreground">
                    0
                  </p>
                </div>
              </div>
            </div>

            {/* Posición */}
            <div className="bg-card p-3 md:p-4 md:border md:border-border md:rounded-lg hover:border-foreground/30 transition-all">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">Posición</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-foreground">
                    --
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Events - Movido antes de Strava */}
        <div className="px-4 md:px-0 mb-4 md:mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="font-sans text-xl md:text-2xl text-foreground font-semibold">Mis Eventos</h2>
            <Link
              href="/#eventos"
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <span className="hidden sm:inline">Ver todos los eventos</span>
              <span className="sm:hidden">Ver todos</span>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
            </Link>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-card border-t border-b md:border md:border-border p-8 md:p-12 md:rounded-lg text-center">
              <Calendar className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">No tienes eventos registrados</p>
              <Link
                href="/#eventos"
                className="inline-flex items-center gap-2 bg-foreground text-background px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-foreground/90 transition-colors text-sm md:text-base"
              >
                Explorar Eventos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {registrations.map((registration) => {
                const canCancel = registration.status !== 'cancelled' && 
                                  registration.status !== 'attended' &&
                                  (registration.payment_status === 'paid' || registration.payment_status === 'pending');
                
                return (
                  <div
                    key={registration.id}
                    className="bg-card border-t border-b md:border md:border-border md:rounded-lg overflow-hidden hover:border-foreground/50 transition-all group flex flex-col"
                  >
                    <Link href={`/eventos/${registration.event.slug}`} className="flex-1 flex flex-col">
                      <div className="relative w-full h-40 md:h-48 overflow-hidden">
                        <img
                          src={registration.event.image}
                          alt={registration.event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/hero-runners.jpg';
                          }}
                        />
                      </div>
                      <div className="p-4 md:p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                          <h3 className="font-sans text-lg md:text-xl text-foreground font-semibold group-hover:text-foreground/80 transition-colors flex-1 line-clamp-2">
                            {registration.event.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {registration.event.category}
                          </span>
                          {getStatusBadge(registration.status)}
                        </div>

                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{registration.event.date}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{registration.event.location}</span>
                        </div>

                        {registration.payment_status === 'pending' && (
                          <div className="mt-auto pt-3 md:pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              Pago pendiente
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Botón de cancelar */}
                    {canCancel && (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-border">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedRegistration(registration);
                            setCancelModalOpen(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs md:text-sm border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                          Cancelar Registro
                        </button>
                      </div>
                    )}

                    {registration.status === 'cancelled' && (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center">
                          Registro cancelado
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Strava Connection Card - Próximamente */}
        <div className="bg-card border-t border-b md:border md:border-border p-4 md:p-6 md:rounded-lg mb-4 md:mb-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FC4C02] rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-[#FC4C02]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-sans text-lg md:text-xl text-foreground font-light mb-2">
                  Integración con Strava
                </h2>
                <span className="inline-block text-xs px-2 md:px-3 py-1 bg-muted text-muted-foreground rounded-full mb-3 md:mb-4">
                  Próximamente
                </span>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  Muy pronto podrás conectar tu cuenta de Strava y disfrutar de estas funcionalidades:
                </p>
              </div>
            </div>

            {/* Features Tease */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-muted/30 rounded-lg">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FC4C02]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-sans font-bold text-foreground mb-1 uppercase tracking-wider">Leaderboard Automático</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tus actividades se sincronizarán automáticamente y competirás en tiempo real
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-muted/30 rounded-lg">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FC4C02]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-sans font-bold text-foreground mb-1 uppercase tracking-wider">Estadísticas Detalladas</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Visualiza tus kilómetros, ritmos y progreso de entrenamiento
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-muted/30 rounded-lg">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FC4C02]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-sans font-bold text-foreground mb-1 uppercase tracking-wider">Competencia Social</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Compara tu rendimiento con otros miembros del club
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-muted/30 rounded-lg">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FC4C02]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-sans font-bold text-foreground mb-1 uppercase tracking-wider">Seguimiento de Progreso</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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

      {/* Modal de Cancelación */}
      {selectedRegistration && (
        <CancelRegistrationModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedRegistration(null);
          }}
          onCancelSuccess={() => {
            reloadRegistrations();
          }}
          registration={selectedRegistration}
        />
      )}
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

