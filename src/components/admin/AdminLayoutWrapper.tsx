"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from './AdminSidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [pathname]);

  // Cerrar menú mobile al cambiar de página
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
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
      {/* Sidebar Desktop - Solo mostrar si no es login */}
      {!isLoginPage && !isMobile && (
        <AdminSidebar isMobile={false} />
      )}

      {/* Sidebar Mobile - Sheet Drawer */}
      {!isLoginPage && isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
            <AdminSidebar isMobile={true} onClose={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      
      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          !isLoginPage && !isMobile ? 'ml-64' : ''
        }`}
      >
        {/* Mobile Menu Button */}
        {!isLoginPage && isMobile && (
          <div className="sticky top-0 z-40 bg-background border-b border-border p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

