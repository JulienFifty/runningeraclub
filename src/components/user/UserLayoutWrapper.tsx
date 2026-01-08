"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserSidebar } from './UserSidebar';

export function UserLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isLoginPage = pathname === '/miembros/login' || pathname === '/miembros/confirmar-email';
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    if (isLoginPage) {
      setIsChecking(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/miembros/login');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/miembros/login');
    } finally {
      setIsChecking(false);
    }
  };

  if (!mounted || (isChecking && !isLoginPage)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Solo mostrar si no es login/confirmar-email */}
      {!isLoginPage && <UserSidebar />}
      
      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          !isLoginPage ? 'ml-64' : ''
        }`}
      >
        {children}
      </main>
    </div>
  );
}

