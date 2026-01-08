"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowLeft,
  UserPlus,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  instagram?: string;
  membership_type: string;
  membership_status: string;
  created_at: string;
  _count?: {
    registrations: number;
  };
}

export default function AdminMembers() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchMembers();
    }
  }, [isAuthenticated, isAdmin, filterStatus, filterType]);

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

  const fetchMembers = async () => {
    try {
      // Usar API route para obtener todos los miembros (bypass RLS)
      const response = await fetch('/api/admin/members');
      
      if (!response.ok) {
        throw new Error('Error al cargar miembros');
      }

      const result = await response.json();
      const allMembers = result.members || [];

      // Aplicar filtros locales
      let filtered: Member[] = allMembers;
      
      if (filterStatus) {
        filtered = filtered.filter((m: Member) => m.membership_status === filterStatus);
      }

      if (filterType) {
        filtered = filtered.filter((m: Member) => m.membership_type === filterType);
      }

      setMembers(filtered);
    } catch (error) {
      console.error('Error al cargar miembros:', error);
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: 'Activo', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
      inactive: { label: 'Inactivo', className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' },
      suspended: { label: 'Suspendido', className: 'bg-red-500/20 text-red-600 border-red-500/30' },
    };

    const variant = variants[status] || variants.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      regular: { label: 'Regular', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
      premium: { label: 'Premium', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
      vip: { label: 'VIP', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
    };

    const variant = variants[type] || variants.regular;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${variant.className}`}>
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

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container-premium">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver al Panel</span>
              </Link>
              <h1 className="font-sans text-4xl md:text-5xl text-foreground font-light mb-4">
                Gestión de Miembros
              </h1>
              <p className="text-muted-foreground">
                Administra todos los miembros del club
              </p>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Filtro por Estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
            </select>

            {/* Filtro por Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
            >
              <option value="">Todos los tipos</option>
              <option value="regular">Regular</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>

            {/* Limpiar filtros */}
            {(filterStatus || filterType || searchQuery) && (
              <button
                onClick={() => {
                  setFilterStatus('');
                  setFilterType('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando miembros...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus || filterType 
                ? 'No se encontraron miembros con los filtros aplicados' 
                : 'No hay miembros registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <Link
                key={member.id}
                href={`/admin/miembros/${member.id}`}
                className="block bg-card border border-border rounded-lg p-6 hover:border-foreground/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-sans text-xl text-foreground font-semibold">
                        {member.full_name || 'Sin nombre'}
                      </h3>
                      {getStatusBadge(member.membership_status)}
                      {getTypeBadge(member.membership_type)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </span>
                      {member.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {member.phone}
                        </span>
                      )}
                      {member.instagram && (
                        <span className="flex items-center gap-2">
                          <span>@</span>
                          {member.instagram}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {member._count?.registrations || 0} eventos
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      Miembro desde
                    </p>
                    <p className="text-sm text-foreground">
                      {new Date(member.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

