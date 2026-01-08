"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Bell, 
  UserPlus, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'new_member' | 'new_registration' | 'payment_success' | 'payment_failed' | 'payment_pending' | 'refund';
  title: string;
  message: string;
  timestamp: string;
  link?: string;
  icon: any;
  color: string;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_member':
        return UserPlus;
      case 'new_registration':
        return Calendar;
      case 'payment_success':
        return CheckCircle;
      case 'payment_failed':
        return XCircle;
      case 'payment_pending':
        return AlertCircle;
      case 'refund':
        return RefreshCw;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_member':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'new_registration':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'payment_success':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'payment_failed':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'payment_pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'refund':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const unreadCount = notifications.length;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bell className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Cargando notificaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">Notificaciones</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount === 0 ? 'No hay notificaciones nuevas' : `${unreadCount} nueva${unreadCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchNotifications();
          }}
          className="p-2 hover:bg-muted rounded transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Notifications List */}
      {isExpanded && (
        <div className="border-t border-border max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No hay notificaciones recientes</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors border-l-4 ${colorClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          {notification.link && (
                            <a
                              href={notification.link}
                              className="text-xs text-foreground hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver detalles →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

