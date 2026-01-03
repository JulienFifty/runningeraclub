"use client";

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Activity, Calendar } from 'lucide-react';
import { Avatar } from '@/components/leaderboard/Avatar';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  member_id: string;
  member_name: string;
  profile_image: string | null;
  total_distance_km?: number;
  event_count?: number;
}

interface HomeLeaderboardProps {
  type: 'distance' | 'events';
  limit?: number;
  title: string;
  subtitle: string;
}

export function HomeLeaderboard({ type, limit = 5, title, subtitle }: HomeLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [type, limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'distance' 
        ? `/api/leaderboard?period=alltime&limit=${limit}`
        : `/api/leaderboard/events?limit=${limit}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Error al cargar leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-sm font-display text-muted-foreground">#{rank}</span>;
    }
  };

  const getValue = (entry: LeaderboardEntry) => {
    if (type === 'distance') {
      return `${entry.total_distance_km?.toFixed(1) || 0} km`;
    } else {
      return `${entry.event_count || 0} eventos`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-card/50 border border-border p-4 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-card/50 border border-border p-8 rounded-lg text-center">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((entry) => (
        <div
          key={entry.member_id}
          className="bg-card/50 backdrop-blur-sm border border-border p-4 rounded-lg hover:border-foreground/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            {/* Rank */}
            <div className="flex-shrink-0 w-8 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar 
                name={entry.member_name} 
                imageUrl={entry.profile_image}
                size="sm"
                rank={entry.rank}
              />
            </div>

            {/* Name and Value */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate text-sm">
                {entry.member_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {getValue(entry)}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Ver más */}
      <Link
        href="/leaderboard"
        className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border"
      >
        Ver leaderboard completo →
      </Link>
    </div>
  );
}

