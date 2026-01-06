"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

function ConfirmarEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Obtener el email de los parámetros de la URL
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('No se pudo obtener tu email');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al reenviar el correo', {
          description: data.error || 'No se pudo reenviar el correo',
        });
      } else {
        toast.success('¡Correo reenviado exitosamente!', {
          description: 'Revisa tu bandeja de entrada y carpeta de spam',
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message || 'No se pudo reenviar el correo',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Card principal */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Título */}
          <h1 className="font-display text-3xl text-center text-foreground mb-4">
            Confirma tu email
          </h1>

          {/* Mensaje */}
          <p className="text-muted-foreground text-center mb-6">
            Te hemos enviado un correo de confirmación a:
          </p>

          {/* Email */}
          {email && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
              <p className="text-foreground font-medium text-center break-all">
                {email}
              </p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada y haz clic en el enlace de confirmación
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Si no lo ves, revisa tu carpeta de spam o correo no deseado
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Una vez confirmado, podrás iniciar sesión y acceder a tu dashboard
              </p>
            </div>
          </div>

          {/* Botón reenviar */}
          <button
            onClick={handleResendEmail}
            disabled={resending || !email}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {resending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Reenviar correo
              </>
            )}
          </button>

          {/* Link volver al login */}
          <Link
            href="/miembros/login"
            className="w-full bg-muted text-foreground py-3 rounded-lg hover:bg-muted/80 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>
        </div>

        {/* Ayuda adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Problemas para confirmar tu email?{' '}
            <a
              href="mailto:support@runningeraclub.com"
              className="text-primary hover:underline font-medium"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmarEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <ConfirmarEmailContent />
    </Suspense>
  );
}

