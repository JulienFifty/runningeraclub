"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard,
  User,
  Calendar,
  Trophy,
  MessageSquare,
  Settings,
  Home,
  LogOut,
  Star
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  {
    href: '/miembros/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Panel principal',
  },
  {
    href: '/miembros/perfil',
    icon: User,
    label: 'Mi Perfil',
    description: 'Editar perfil',
  },
  {
    href: '/miembros/eventos',
    icon: Calendar,
    label: 'Mis Eventos',
    description: 'Registros y eventos',
  },
  {
    href: '/leaderboard',
    icon: Trophy,
    label: 'Leaderboard',
    description: 'Ranking',
  },
  {
    href: '/#reseñas',
    icon: Star,
    label: 'Reseñas',
    description: 'Dejar reseña',
  },
];

export function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userData, setUserData] = useState<{
    email?: string;
    full_name?: string;
    profile_image?: string;
  } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Obtener datos del miembro
        const { data: member } = await supabase
          .from('members')
          .select('full_name, email, profile_image')
          .eq('id', user.id)
          .single();

        setUserData({
          email: member?.email || user.email || '',
          full_name: member?.full_name || user.email?.split('@')[0] || 'Usuario',
          profile_image: member?.profile_image || null,
        });
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/miembros/dashboard') {
      return pathname === '/miembros/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getInitials = () => {
    if (userData?.full_name) {
      const names = userData.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return userData.full_name[0].toUpperCase();
    }
    if (userData?.email) {
      return userData.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <Link href="/miembros/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground leading-tight">
              RUNNING ERA
            </h1>
            <p className="text-xs text-muted-foreground">Mi Cuenta</p>
          </div>
        </Link>
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
        {/* User Profile */}
        {userData && (
          <div className="px-4 py-3 rounded-lg bg-muted/50 flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={userData.profile_image || undefined} alt={userData.full_name} />
              <AvatarFallback className="bg-foreground/10 text-foreground text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userData.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userData.email}
              </p>
            </div>
          </div>
        )}

        {/* External Links */}
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
        >
          <Home className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-display font-medium text-sm">Ir al Inicio</span>
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

