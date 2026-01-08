"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  FileCheck, 
  Tag, 
  Home,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  X
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Panel principal',
  },
  {
    href: '/admin/eventos',
    icon: Calendar,
    label: 'Eventos',
    description: 'Gestionar eventos',
  },
  {
    href: '/admin/miembros',
    icon: Users,
    label: 'Miembros',
    description: 'Gestionar usuarios',
  },
  {
    href: '/admin/check-in',
    icon: FileCheck,
    label: 'Check-in',
    description: 'Registro de asistencia',
  },
  {
    href: '/admin/pagos',
    icon: CreditCard,
    label: 'Pagos',
    description: 'Transacciones',
  },
  {
    href: '/admin/cupones',
    icon: Tag,
    label: 'Cupones',
    description: 'Descuentos',
  },
  {
    href: '/admin/resenas',
    icon: MessageSquare,
    label: 'Reseñas',
    description: 'Moderar reseñas',
  },
];

interface AdminSidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({ onClose, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={cn(
      "h-screen w-64 bg-card border-r border-border flex flex-col z-50",
      isMobile ? "relative" : "fixed left-0 top-0"
    )}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <Link 
          href="/admin" 
          className="flex items-center gap-3 group flex-1"
          onClick={handleLinkClick}
        >
          <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground leading-tight">
              RUNNING ERA
            </h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  active
                    ? 'bg-foreground/10 text-foreground border-l-4 border-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Icon 
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                  active ? 'scale-110' : 'group-hover:scale-110'
                }`} 
              />
              <div className="flex-1 min-w-0">
                <div className="font-display font-medium text-sm leading-tight">
                  {item.label}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {item.description}
                </div>
              </div>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {/* User Email */}
        {userEmail && (
          <div className="px-4 py-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Sesión activa</p>
            <p className="text-sm font-medium text-foreground truncate">
              {userEmail}
            </p>
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* External Links */}
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
        >
          <Home className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-display font-medium text-sm">Ver Sitio</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-display font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

