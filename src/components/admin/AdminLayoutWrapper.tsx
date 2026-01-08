"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isLoginPage = pathname === '/admin/login';
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
        router.push('/admin/login');
        return;
      }

      // Verificar que sea admin
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !admin) {
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/admin/login');
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
      {/* Sidebar - Solo mostrar si no es login */}
      {!isLoginPage && <AdminSidebar />}
      
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

