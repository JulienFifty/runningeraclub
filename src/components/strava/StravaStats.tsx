"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Activity, TrendingUp, Mountain, Clock, RefreshCw, Calendar } from 'lucide-react';

interface Stats {
  total_distance_km: number;
  total_runs: number;
  total_elevation_m: number;
  total_time_hours: number;
  avg_distance_km: number;
  avg_pace_min_km: number;
  last_run_date: string | null;
}

export function StravaStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/strava/stats');
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      toast.info('Sincronizando actividades...');

      const response = await fetch('/api/strava/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Sync error:', data);
        toast.error(data.error || 'Error al sincronizar');
        return;
      }

      toast.success(data.message || 'Sincronización completada');

      // Recargar estadísticas
      await loadStats();
    } catch (error: any) {
      console.error('Error syncing:', error);
      toast.error(error.message || 'Error al sincronizar actividades');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border p-6 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatPace = (paceMinKm: number) => {
    if (!paceMinKm || paceMinKm === 0) return '0:00';
    const minutes = Math.floor(paceMinKm);
    const seconds = Math.round((paceMinKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#FC4C02]/5 to-[#FC4C02]/10 border border-[#FC4C02]/20 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-foreground font-light mb-1">
            Tus Estadísticas de Strava
          </h2>
          <p className="text-sm text-muted-foreground">
            Actividades de running sincronizadas
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-[#FC4C02] text-white rounded-lg hover:bg-[#E34402] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Total Distance */}
        <div className="bg-card/50 backdrop-blur border border-border p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-[#FC4C02]" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Distancia Total
            </p>
          </div>
          <p className="font-display text-3xl text-foreground">
            {stats.total_distance_km.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">kilómetros</p>
        </div>

        {/* Total Runs */}
        <div className="bg-card/50 backdrop-blur border border-border p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#FC4C02]" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Carreras
            </p>
          </div>
          <p className="font-display text-3xl text-foreground">
            {stats.total_runs}
          </p>
          <p className="text-xs text-muted-foreground mt-1">actividades</p>
        </div>

        {/* Total Elevation */}
        <div className="bg-card/50 backdrop-blur border border-border p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mountain className="w-5 h-5 text-[#FC4C02]" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Elevación
            </p>
          </div>
          <p className="font-display text-3xl text-foreground">
            {stats.total_elevation_m.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">metros</p>
        </div>

        {/* Total Time */}
        <div className="bg-card/50 backdrop-blur border border-border p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-[#FC4C02]" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Tiempo Total
            </p>
          </div>
          <p className="font-display text-3xl text-foreground">
            {stats.total_time_hours.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">horas</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card/30 backdrop-blur border border-border/50 p-3 rounded">
          <p className="text-xs text-muted-foreground mb-1">Distancia Promedio</p>
          <p className="font-display text-xl text-foreground">
            {stats.avg_distance_km.toFixed(1)} km
          </p>
        </div>

        <div className="bg-card/30 backdrop-blur border border-border/50 p-3 rounded">
          <p className="text-xs text-muted-foreground mb-1">Pace Promedio</p>
          <p className="font-display text-xl text-foreground">
            {formatPace(stats.avg_pace_min_km)} /km
          </p>
        </div>

        <div className="bg-card/30 backdrop-blur border border-border/50 p-3 rounded col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Última Carrera
          </p>
          <p className="font-display text-xl text-foreground">
            {formatDate(stats.last_run_date)}
          </p>
        </div>
      </div>
    </div>
  );
}

