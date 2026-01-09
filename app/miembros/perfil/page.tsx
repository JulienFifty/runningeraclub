"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, Calendar, ArrowLeft, Save, Instagram, Camera, Upload, Trash2, AlertTriangle, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { NotificationPermissionButton } from '@/components/NotificationPermissionButton';
import { autoSubscribeToPushNotifications } from '@/lib/auto-subscribe-push';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

interface Member {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  instagram?: string;
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
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    instagram: '',
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
            instagram: user.user_metadata?.instagram || null,
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
      }
      setFormData({
        full_name: memberData.full_name || '',
        phone: memberData.phone || '',
        instagram: memberData.instagram || '',
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen
    handleImageUpload(file);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Subir imagen a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar perfil con la nueva URL
      const { error: updateError } = await supabase
        .from('members')
        .update({ profile_image: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Foto de perfil actualizada');
      loadProfile();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen', {
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          instagram: formData.instagram || null,
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

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const response = await fetch('/api/members/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar cuenta');
      }

      // Mostrar mensaje de éxito
      toast.success('Cuenta eliminada', {
        description: 'Tu cuenta ha sido eliminada permanentemente',
        duration: 3000,
      });

      // Esperar un poco y redirigir al home
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error al eliminar cuenta:', error);
      toast.error('Error al eliminar cuenta', {
        description: error.message || 'Intenta de nuevo más tarde',
      });
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
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
    <main className="min-h-screen bg-background px-0 md:p-8">
      <div className="max-w-4xl mx-auto md:container-premium">
        <div className="px-4 md:px-0">
          <Link
            href="/miembros/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>

          <div className="mb-6 md:mb-8">
            <h1 className="font-display text-3xl md:text-5xl text-foreground font-light mb-2 md:mb-4">
              Mi Perfil
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gestiona tu información personal
            </p>
          </div>
        </div>

        <div className="bg-card border-t border-b md:border md:border-border p-4 md:p-6 md:rounded-lg space-y-4 md:space-y-6">
          {/* Información de Membresía */}
          <div className="pb-4 md:pb-6 border-b border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 md:mb-4">
              <h2 className="font-display text-lg md:text-xl text-foreground">Información de Membresía</h2>
              <NotificationPermissionButton
                variant="outline"
                size="default"
                className="w-full sm:w-auto text-xs md:text-sm"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
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

          {/* Foto de Perfil */}
          <div className="pb-4 md:pb-6 border-b border-border">
            <h2 className="font-display text-lg md:text-xl text-foreground mb-3 md:mb-4">Foto de Perfil</h2>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              {/* Avatar Preview */}
              <div className="relative">
                {profileImagePreview || member.profile_image ? (
                  <img
                    src={profileImagePreview || member.profile_image}
                    alt={member.full_name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-border bg-foreground/10 flex items-center justify-center">
                    <span className="text-2xl md:text-4xl font-display font-bold text-foreground">
                      {getInitials(member.full_name)}
                    </span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  {uploading ? 'Subiendo...' : 'Cambiar Foto'}
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos: JPG, PNG o GIF. Tamaño máximo: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div>
            <h2 className="font-display text-lg md:text-xl text-foreground mb-3 md:mb-4">Información Personal</h2>
            <div className="space-y-3 md:space-y-4">
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
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remover @ si el usuario lo agrega manualmente
                      if (value.startsWith('@')) {
                        value = value.substring(1);
                      }
                      setFormData({ ...formData, instagram: value });
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    placeholder="@tuusuario"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo el nombre de usuario (sin @)
                </p>
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

          <div className="pt-4 md:pt-6 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-foreground text-background px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

          {/* Zona Peligrosa - Eliminar Cuenta */}
          <div className="pt-6 md:pt-8 border-t border-red-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6">
              <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-red-900 mb-2">
                    Zona Peligrosa
                  </h3>
                  <p className="text-xs md:text-sm text-red-700 mb-3 md:mb-4">
                    Una vez que elimines tu cuenta, no hay vuelta atrás. Toda tu información será eliminada permanentemente.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm font-medium"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                ¿Eliminar tu cuenta?
              </h2>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                Esta acción es <strong className="text-red-600">permanente e irreversible</strong>.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Se eliminará toda tu información:
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Perfil y datos personales</li>
                  <li>Registros de eventos</li>
                  <li>Fotos y archivos</li>
                  <li>Conexiones y configuraciones</li>
                  <li>Cuenta de autenticación</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600">
                Para confirmar, escribe <strong className="font-mono bg-gray-100 px-2 py-0.5 rounded">ELIMINAR</strong> a continuación:
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'ELIMINAR' || deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {deleting ? 'Eliminando...' : 'Eliminar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

