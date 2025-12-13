"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, Calendar, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  membership_type: string;
  membership_status: string;
  profile_image?: string;
  bio?: string;
}

export default function MemberProfile() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    emergency_contact: '',
    emergency_phone: '',
    bio: '',
  });

  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/miembros/login');
        return;
      }

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
      }
      setFormData({
        full_name: memberData.full_name || '',
        phone: memberData.phone || '',
        date_of_birth: memberData.date_of_birth || '',
        emergency_contact: memberData.emergency_contact || '',
        emergency_phone: memberData.emergency_phone || '',
        bio: memberData.bio || '',
      });
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('members')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          emergency_contact: formData.emergency_contact || null,
          emergency_phone: formData.emergency_phone || null,
          bio: formData.bio || null,
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Error al guardar', {
          description: error.message,
        });
        return;
      }

      toast.success('Perfil actualizado', {
        description: 'Tus cambios han sido guardados correctamente',
      });

      loadProfile();
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
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
      <div className="container-premium max-w-4xl">
        <Link
          href="/miembros/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
            Mi Perfil
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg space-y-6">
          {/* Información de Membresía */}
          <div className="pb-6 border-b border-border">
            <h2 className="font-display text-xl text-foreground mb-4">Información de Membresía</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-foreground">{member.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipo de Membresía</p>
                <p className="text-foreground capitalize">{member.membership_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estado</p>
                <p className="text-foreground capitalize">
                  {member.membership_status === 'active' ? 'Activo' : member.membership_status}
                </p>
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div>
            <h2 className="font-display text-xl text-foreground mb-4">Información Personal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    placeholder="+52 222 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Contacto de Emergencia
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                  placeholder="Nombre del contacto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Teléfono de Emergencia
                </label>
                <input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                  placeholder="+52 222 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Biografía
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

