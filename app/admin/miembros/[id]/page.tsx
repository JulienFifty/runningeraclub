"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard,
  User,
  Instagram,
  Edit,
  Save,
  X,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatEventDate } from '@/lib/date-utils';

interface Member {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  instagram?: string;
  membership_type: string;
  membership_status: string;
  created_at: string;
  updated_at: string;
}

interface EventRegistration {
  id: string;
  event_id?: string;
  registration_date: string;
  status: string;
  payment_status: string;
  event: {
    id: string;
    title: string;
    slug: string;
    date: string;
    location: string;
    price?: string;
  } | null;
}

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  event: {
    title: string;
  };
}

export default function AdminMemberDetail() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const supabase = createClient();
  
  const [member, setMember] = useState<Member | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Member>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin && memberId) {
      fetchMemberData();
    }
  }, [isAuthenticated, isAdmin, memberId]);

  const checkAdminAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);

      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !admin) {
        toast.error('Acceso denegado');
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/admin/login');
    }
  };

  const fetchMemberData = async () => {
    try {
      // Usar API route para obtener datos del miembro (bypass RLS)
      const response = await fetch(`/api/admin/members/${memberId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          toast.error('Miembro no encontrado');
          router.push('/admin/miembros');
          return;
        }
        throw new Error(errorData.error || 'Error al cargar datos del miembro');
      }

      const result = await response.json();
      
      setMember(result.member);
      setEditData(result.member);
      setRegistrations(result.registrations || []);
      setTransactions(result.transactions || []);
    } catch (error: any) {
      console.error('Error fetching member data:', error);
      toast.error('Error al cargar datos del miembro', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;

    try {
      const { error } = await supabase
        .from('members')
        .update(editData)
        .eq('id', member.id);

      if (error) {
        toast.error('Error al actualizar miembro');
        console.error(error);
        return;
      }

      toast.success('Miembro actualizado exitosamente');
      setIsEditing(false);
      fetchMemberData();
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message,
      });
    }
  };

  const handleCancel = () => {
    setEditData(member || {});
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      registered: { label: 'Registrado', className: 'bg-blue-500/20 text-blue-600' },
      confirmed: { label: 'Confirmado', className: 'bg-green-500/20 text-green-600' },
      cancelled: { label: 'Cancelado', className: 'bg-red-500/20 text-red-600' },
      attended: { label: 'Asistió', className: 'bg-purple-500/20 text-purple-600' },
      no_show: { label: 'No asistió', className: 'bg-gray-500/20 text-gray-600' },
    };

    const variant = variants[status] || variants.registered;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-600' },
      paid: { label: 'Pagado', className: 'bg-green-500/20 text-green-600' },
      refunded: { label: 'Reembolsado', className: 'bg-orange-500/20 text-orange-600' },
    };

    const variant = variants[status] || variants.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Miembro no encontrado</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container-premium max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/miembros"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Miembros</span>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-sans text-4xl md:text-5xl text-foreground font-light mb-4">
                {isEditing ? 'Editar Miembro' : member.full_name || 'Miembro'}
              </h1>
              <p className="text-muted-foreground">
                {member.email}
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-sans font-semibold text-foreground mb-6">
                Información Personal
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Nombre Completo
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.full_name || ''}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    />
                  ) : (
                    <p className="text-foreground">{member.full_name || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Email
                  </label>
                  <p className="text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {member.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Teléfono
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    />
                  ) : (
                    <p className="text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {member.phone || 'No especificado'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Instagram
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.instagram || ''}
                      onChange={(e) => setEditData({ ...editData, instagram: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      placeholder="@usuario"
                    />
                  ) : (
                    <p className="text-foreground flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                      {member.instagram ? `@${member.instagram}` : 'No especificado'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Tipo de Membresía
                    </label>
                    {isEditing ? (
                      <select
                        value={editData.membership_type || 'regular'}
                        onChange={(e) => setEditData({ ...editData, membership_type: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      >
                        <option value="regular">Regular</option>
                        <option value="premium">Premium</option>
                        <option value="vip">VIP</option>
                      </select>
                    ) : (
                      <p className="text-foreground capitalize">{member.membership_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Estado
                    </label>
                    {isEditing ? (
                      <select
                        value={editData.membership_status || 'active'}
                        onChange={(e) => setEditData({ ...editData, membership_status: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="suspended">Suspendido</option>
                      </select>
                    ) : (
                      <p className="text-foreground capitalize">{member.membership_status}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Eventos Registrados */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-sans font-semibold text-foreground mb-6">
                Eventos Registrados ({registrations.length})
              </h2>
              {registrations.length === 0 ? (
                <p className="text-muted-foreground">No hay eventos registrados</p>
              ) : (
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="border border-border rounded-lg p-4 hover:border-foreground/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-sans text-lg text-foreground font-semibold">
                              {reg.event?.title || 'Evento no encontrado'}
                            </h3>
                            {getStatusBadge(reg.status)}
                            {getPaymentBadge(reg.payment_status)}
                          </div>
                          {reg.event ? (
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatEventDate(reg.event.date, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) || reg.event.date}
                              </span>
                              <span>{reg.event.location}</span>
                              {reg.event.price && <span>{reg.event.price}</span>}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Evento eliminado o no disponible</p>
                          )}
                        </div>
                        {reg.event?.slug && (
                          <Link
                            href={`/eventos/${reg.event.slug}`}
                            target="_blank"
                            className="text-sm text-foreground hover:underline"
                          >
                            Ver evento →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transacciones */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-sans font-semibold text-foreground mb-6">
                Historial de Pagos ({transactions.length})
              </h2>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground">No hay transacciones</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {transaction.event?.title || 'Evento'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            ${transaction.amount.toFixed(2)} {transaction.currency.toUpperCase()}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'succeeded' 
                              ? 'bg-green-500/20 text-green-600'
                              : transaction.status === 'refunded'
                              ? 'bg-orange-500/20 text-orange-600'
                              : 'bg-yellow-500/20 text-yellow-600'
                          }`}>
                            {transaction.status === 'succeeded' ? 'Exitoso' : 
                             transaction.status === 'refunded' ? 'Reembolsado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-sans font-semibold text-foreground mb-4">
                Estadísticas
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Eventos Registrados</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {registrations.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Pagado</p>
                  <p className="text-2xl font-semibold text-foreground">
                    ${transactions
                      .filter(t => t.status === 'succeeded')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)} MXN
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Miembro desde</p>
                  <p className="text-foreground">
                    {new Date(member.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

