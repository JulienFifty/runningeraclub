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
  X,
  Filter,
  ChevronDown
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

type NotificationCategory = 'all' | 'new_member' | 'new_registration' | 'payment_success' | 'payment_failed' | 'payment_pending' | 'refund';

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (showToast = false) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const data = await response.json();
      const notifs = data.notifications || [];
      setNotifications(notifs);
      applyFilter(notifs, selectedCategory);
      
      if (showToast) {
        toast.success('Notificaciones actualizadas', {
          description: `${notifs.length} notificación${notifs.length !== 1 ? 'es' : ''} encontrada${notifs.length !== 1 ? 's' : ''}`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Error al cargar notificaciones', {
        description: error.message || 'No se pudieron cargar las notificaciones',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    applyFilter(notifications, selectedCategory);
  }, [selectedCategory, notifications]);

  const applyFilter = (notifs: Notification[], category: NotificationCategory) => {
    if (category === 'all') {
      setFilteredNotifications(notifs);
    } else {
      setFilteredNotifications(notifs.filter(n => n.type === category));
    }
  };

  const getCategoryCount = (category: NotificationCategory) => {
    if (category === 'all') return notifications.length;
    return notifications.filter(n => n.type === category).length;
  };

  const categories: Array<{ value: NotificationCategory; label: string; icon: any; color: string }> = [
    { value: 'all', label: 'Todas', icon: Bell, color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
    { value: 'new_member', label: 'Nuevos Miembros', icon: UserPlus, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { value: 'new_registration', label: 'Inscripciones', icon: Calendar, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    { value: 'payment_success', label: 'Pagos Exitosos', icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    { value: 'payment_failed', label: 'Pagos Fallidos', icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { value: 'payment_pending', label: 'Pagos Pendientes', icon: AlertCircle, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    { value: 'refund', label: 'Reembolsos', icon: RefreshCw, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  ];

  const formatTimeAgo = (timestamp: string) => {
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      // Validar que la fecha sea válida
      if (isNaN(time.getTime())) {
        return 'Fecha inválida';
      }

      const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

      // Si la diferencia es negativa (futuro), mostrar "Hace un momento"
      if (diffInSeconds < 0) {
        return 'Hace un momento';
      }

      if (diffInSeconds < 60) {
        return 'Hace un momento';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        if (days === 1) {
          return 'Ayer';
        } else if (days < 7) {
          return `Hace ${days} día${days !== 1 ? 's' : ''}`;
        } else {
          const weeks = Math.floor(days / 7);
          if (weeks === 1) {
            return 'Hace 1 semana';
          } else if (weeks < 4) {
            return `Hace ${weeks} semanas`;
          } else {
            const months = Math.floor(days / 30);
            return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
          }
        }
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Fecha inválida';
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
  const filteredCount = filteredNotifications.length;

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
      <div className="p-4">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
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
              setRefreshing(true);
              fetchNotifications(true);
            }}
            disabled={refreshing}
            className="p-2 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filtros por Categoría - Siempre visibles en el header */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = getCategoryCount(category.value);
            const isActive = selectedCategory === category.value;
            
            return (
              <button
                key={category.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(category.value);
                }}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                  border
                  ${isActive 
                    ? `${category.color} border-current` 
                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                <span>{category.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-current/20' : 'bg-muted'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      {isExpanded && (
        <div className="border-t border-border max-h-[500px] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {notifications.length === 0 
                  ? 'No hay notificaciones recientes'
                  : selectedCategory !== 'all'
                  ? `No hay notificaciones de tipo "${categories.find(c => c.value === selectedCategory)?.label}"`
                  : 'No hay notificaciones que coincidan con los filtros'
                }
              </p>
              {selectedCategory !== 'all' && notifications.length > 0 && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-4 text-xs text-foreground hover:underline"
                >
                  Ver todas las notificaciones
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => {
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
                        <h3 className="font-display font-medium text-sm text-foreground mb-1 tracking-tight">
                          {notification.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
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

