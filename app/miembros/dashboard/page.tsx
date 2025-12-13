"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Calendar, User, LogOut, Clock, MapPin, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/miembros/login');
        return;
      }

      // Cargar perfil del miembro
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single();

      if (memberError) {
        console.error('Error loading member:', memberError);
        toast.error('Error al cargar tu perfil');
        return;
      }

      setMember(memberData);

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
        console.error('Error loading registrations:', registrationsError);
      } else {
        setRegistrations(registrationsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
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

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container-premium">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-2">
                Mi Dashboard
              </h1>
              <p className="text-muted-foreground">
                Bienvenido, {member.full_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/miembros/perfil"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-card transition-colors"
              >
                <User className="w-4 h-4" />
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-card transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>

          {/* Member Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Tipo de Membresía</p>
              <p className="text-2xl font-display text-foreground capitalize">
                {member.membership_type}
              </p>
            </div>
            <div className="bg-card border border-border p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Estado</p>
              <p className="text-2xl font-display text-foreground capitalize">
                {member.membership_status === 'active' ? 'Activo' : member.membership_status}
              </p>
            </div>
            <div className="bg-card border border-border p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Eventos Registrados</p>
              <p className="text-2xl font-display text-foreground">
                {registrations.length}
              </p>
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

