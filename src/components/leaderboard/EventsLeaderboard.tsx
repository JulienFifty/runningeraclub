"use client";

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Calendar, Users, Sparkles, TrendingUp } from 'lucide-react';
import { Avatar } from './Avatar';

interface LeaderboardEntry {
  rank: number;
  member_id: string;
  member_name: string;
  profile_image: string | null;
  event_count: number;
}

interface EventsLeaderboardProps {
  limit?: number;
  period?: 'month' | 'alltime';
}

export function EventsLeaderboard({ limit, period = 'alltime' }: EventsLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    loadEventsLeaderboard();
  }, [limit, period]);

  const loadEventsLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      params.append('period', period);
      
      const url = `/api/leaderboard/events?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setTotalMembers(data.total_members || 0);
    } catch (error: any) {
      console.error('Error loading events leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-7 h-7 text-gray-400" />;
      case 3:
        return <Award className="w-7 h-7 text-orange-600" />;
      default:
        return <span className="text-2xl font-display text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30';
      default:
        return 'bg-card border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-card border border-border p-6 rounded-lg animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-card border border-border p-12 rounded-lg text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Aún no hay participantes en eventos
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          ¡Sé el primero en registrarte a un evento!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top 3 Podium - Solo si hay 3 o más */}
      {leaderboard.length >= 3 ? (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="md:order-1 order-2">
            <div className={`${getRankBadgeClass(2)} border-2 p-6 rounded-lg text-center transition-all hover:scale-105`}>
              <div className="flex justify-center mb-3">
                {getRankIcon(2)}
              </div>
              <div className="mx-auto mb-3 flex justify-center">
                <Avatar 
                  name={leaderboard[1].member_name} 
                  imageUrl={leaderboard[1].profile_image}
                  size="lg"
                  rank={2}
                />
              </div>
              <h3 className="font-display text-lg text-foreground mb-1">
                {leaderboard[1].member_name}
              </h3>
              <p className="text-3xl font-bold text-foreground mb-1">
                {leaderboard[1].event_count}
              </p>
              <p className="text-sm text-muted-foreground">eventos</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="md:order-2 order-1">
            <div className={`${getRankBadgeClass(1)} border-2 p-8 rounded-lg text-center transition-all hover:scale-105 md:-mt-4 relative`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex justify-center mb-4">
                {getRankIcon(1)}
              </div>
              <div className="mx-auto mb-4 flex justify-center">
                <Avatar 
                  name={leaderboard[0].member_name} 
                  imageUrl={leaderboard[0].profile_image}
                  size="xl"
                  rank={1}
                />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">
                {leaderboard[0].member_name}
              </h3>
              <p className="text-4xl font-bold text-foreground mb-2">
                {leaderboard[0].event_count}
              </p>
              <p className="text-sm text-muted-foreground">eventos</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="md:order-3 order-3">
            <div className={`${getRankBadgeClass(3)} border-2 p-6 rounded-lg text-center transition-all hover:scale-105`}>
              <div className="flex justify-center mb-3">
                {getRankIcon(3)}
              </div>
              <div className="mx-auto mb-3 flex justify-center">
                <Avatar 
                  name={leaderboard[2].member_name} 
                  imageUrl={leaderboard[2].profile_image}
                  size="lg"
                  rank={3}
                />
              </div>
              <h3 className="font-display text-lg text-foreground mb-1">
                {leaderboard[2].member_name}
              </h3>
              <p className="text-3xl font-bold text-foreground mb-1">
                {leaderboard[2].event_count}
              </p>
              <p className="text-sm text-muted-foreground">eventos</p>
            </div>
          </div>
        </div>
      ) : (
        /* Vista especial para 1-2 corredores */
        <div className="max-w-2xl mx-auto mb-8">
          {leaderboard.slice(0, Math.min(3, leaderboard.length)).map((entry) => (
            <div key={entry.member_id} className={`${getRankBadgeClass(entry.rank)} border-2 p-8 rounded-lg text-center mb-4 transition-all hover:scale-105`}>
              <div className="flex justify-center mb-4">
                {getRankIcon(entry.rank)}
              </div>
              <div className="mx-auto mb-4 flex justify-center">
                <Avatar 
                  name={entry.member_name} 
                  imageUrl={entry.profile_image}
                  size={entry.rank === 1 ? "xl" : "lg"}
                  rank={entry.rank}
                />
              </div>
              <h3 className="font-display text-2xl text-foreground mb-2">
                {entry.member_name}
              </h3>
              <p className="text-5xl font-bold text-foreground mb-2">
                {entry.event_count}
              </p>
              <p className="text-sm text-muted-foreground mb-4">eventos participados</p>
              
              {/* Stats detalladas */}
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{entry.event_count} {entry.event_count === 1 ? 'evento' : 'eventos'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest of the leaderboard (solo si hay más de 3) */}
      {leaderboard.length > 3 && (
        <div className="space-y-3">
          {leaderboard.slice(3).map((entry) => (
          <div
            key={entry.member_id}
            className="bg-card border border-border p-6 rounded-lg hover:border-foreground/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar 
                  name={entry.member_name} 
                  imageUrl={entry.profile_image}
                  size="md"
                  rank={entry.rank}
                />
              </div>

              {/* Name and Stats */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg text-foreground mb-1 truncate">
                  {entry.member_name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{entry.event_count} {entry.event_count === 1 ? 'evento' : 'eventos'}</span>
                  </div>
                </div>
              </div>

              {/* Event Count */}
              <div className="flex-shrink-0 text-right">
                <p className="text-3xl font-bold text-foreground">
                  {entry.event_count}
                </p>
                <p className="text-xs text-muted-foreground">eventos</p>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="bg-muted/30 border border-border p-6 rounded-lg text-center mt-8">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalMembers}</span> participantes activos •{' '}
          <span className="font-semibold text-foreground">
            {leaderboard.reduce((sum, e) => sum + e.event_count, 0)}
          </span> eventos totales registrados
        </p>
      </div>
    </div>
  );
}
