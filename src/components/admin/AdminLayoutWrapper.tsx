"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background">{children}</div>;
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

