"use client";

import { useState, useEffect } from 'react';
import { Send, Loader2, Bell, User, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface ManualPushNotificationProps {
  className?: string;
}

export function ManualPushNotification({ className }: ManualPushNotificationProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/miembros/dashboard');
  const [recipient, setRecipient] = useState<'all' | 'specific'>('all');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [userFound, setUserFound] = useState<{ id: string; name: string; email: string } | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const searchUser = async (email: string) => {
    if (!email.trim()) {
      setUserFound(null);
      setUserId('');
      return;
    }

    try {
      setSearchingUser(true);
      const response = await fetch(`/api/admin/members?email=${encodeURIComponent(email.trim())}`);
      
      if (!response.ok) {
        throw new Error('Error al buscar usuario');
      }

      const data = await response.json();
      const members = data.members || [];

      if (members.length > 0) {
        const member = members[0];
        setUserFound({
          id: member.id,
          name: member.full_name || member.email,
          email: member.email,
        });
        setUserId(member.id);
      } else {
        setUserFound(null);
        setUserId('');
      }
    } catch (error: any) {
      console.error('Error searching user:', error);
      setUserFound(null);
      setUserId('');
    } finally {
      setSearchingUser(false);
    }
  };

  // Debounce para búsqueda de usuario
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!email.trim()) {
      setUserFound(null);
      setUserId('');
      return;
    }

    // Crear nuevo timeout para buscar después de 500ms de inactividad
    const timeout = setTimeout(() => {
      searchUser(email);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error('Campos requeridos', {
        description: 'El título y el mensaje son requeridos',
      });
      return;
    }

    if (recipient === 'specific' && !userId.trim()) {
      toast.error('Usuario requerido', {
        description: 'Debes buscar y seleccionar un usuario',
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/miembros/dashboard',
          user_id: recipient === 'specific' ? userId : undefined,
          all_users: recipient === 'all',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar notificación');
      }

      const data = await response.json();

      toast.success('Notificación enviada', {
        description: `Se enviaron ${data.sent || 0} notificaciones exitosamente`,
      });

      // Limpiar formulario
      setTitle('');
      setBody('');
      setUrl('/miembros/dashboard');
      setRecipient('all');
      setUserId('');
      setUserFound(null);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error('Error al enviar notificación', {
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Send className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="font-sans text-xl font-semibold text-foreground">
              Enviar Notificación Manual
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Envía una notificación push personalizada a usuarios
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">
            Título <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: ¡Nuevo evento disponible!"
            required
            disabled={loading}
            className="bg-background"
          />
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <Label htmlFor="body" className="text-foreground">
            Mensaje <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ej: Inscríbete ahora al próximo evento de RUNNING ERA"
            required
            disabled={loading}
            rows={4}
            className="bg-background resize-none"
          />
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="url" className="text-foreground">
            URL de destino
          </Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/miembros/dashboard"
            disabled={loading}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            URL a la que se dirigirá el usuario al hacer clic en la notificación
          </p>
        </div>

        {/* Destinatario */}
        <div className="space-y-3">
          <Label className="text-foreground">Enviar a</Label>
          <RadioGroup
            value={recipient}
            onValueChange={(value) => {
              setRecipient(value as 'all' | 'specific');
              setUserId('');
              setUserFound(null);
            }}
            disabled={loading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer font-normal">
                <Users className="w-4 h-4" />
                Todos los usuarios suscritos
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific" className="flex items-center gap-2 cursor-pointer font-normal">
                <User className="w-4 h-4" />
                Usuario específico
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Búsqueda de usuario */}
        {recipient === 'specific' && (
          <div className="space-y-2">
            <Label htmlFor="userEmail" className="text-foreground">
              Email del usuario
            </Label>
            <div className="flex gap-2">
              <Input
                id="userEmail"
                type="email"
                placeholder="usuario@ejemplo.com"
                disabled={loading || searchingUser}
                onChange={handleEmailChange}
                className="bg-background flex-1"
              />
              {searchingUser && (
                <div className="flex items-center justify-center px-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {userFound && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userFound.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userFound.email}
                  </p>
                </div>
              </div>
            )}
            {!userFound && recipient === 'specific' && (
              <p className="text-xs text-muted-foreground">
                Busca un usuario por su email para enviarle la notificación
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={loading || (recipient === 'specific' && !userId.trim()) || !title.trim() || !body.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Notificación
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

