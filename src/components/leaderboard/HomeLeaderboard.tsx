"use client";

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Calendar, TrendingUp, Users, Sparkles } from 'lucide-react';
import { Avatar } from './Avatar';
import { motion } from 'framer-motion';

interface HomeLeaderboardProps {
  type: 'distance' | 'events';
  limit?: number;
  title: string;
  subtitle: string;
}

interface LeaderboardEntry {
  rank: number;
  member_id: string;
  member_name: string;
  profile_image: string | null;
  event_count: number;
}

export function HomeLeaderboard({ type, limit = 5, title, subtitle }: HomeLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    if (type === 'events') {
      loadEventsLeaderboard();
    } else {
      // Para distance, mantener "Próximamente" por ahora
      setLoading(false);
    }
  }, [type, limit]);

  const loadEventsLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard/events?limit=${limit}`);
      
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
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-sm font-display text-muted-foreground">#{rank}</span>;
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
        return 'bg-card/50 border-border';
    }
  };

  // Para distance, mostrar "Próximamente"
  if (type === 'distance') {
    return (
      <div className="bg-card/50 border border-border p-8 rounded-lg text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FC4C02] rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative">
          <div className="w-12 h-12 rounded-lg bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-[#FC4C02]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
          </div>
          <span className="inline-block text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full mb-3">
            Próximamente
          </span>
          <p className="text-sm text-muted-foreground">
            Próximamente con Strava
          </p>
        </div>
      </div>
    );
  }

  // Para events, mostrar leaderboard real
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
              <div className="w-12 h-6 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-card/50 border border-border p-8 rounded-lg text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">
          Aún no hay participantes en eventos
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          ¡Sé el primero en registrarte!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top 3 destacados */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`${getRankBadgeClass(2)} border rounded-lg p-3 text-center`}
          >
            <div className="flex justify-center mb-2">
              {getRankIcon(2)}
            </div>
            <div className="flex justify-center mb-2">
              <Avatar 
                name={leaderboard[1].member_name} 
                imageUrl={leaderboard[1].profile_image}
                size="sm"
                rank={2}
              />
            </div>
            <p className="text-xs font-medium text-foreground truncate mb-1">
              {leaderboard[1].member_name.split(' ')[0]}
            </p>
            <p className="text-lg font-bold text-foreground">
              {leaderboard[1].event_count}
            </p>
            <p className="text-[10px] text-muted-foreground">eventos</p>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
            className={`${getRankBadgeClass(1)} border-2 rounded-lg p-4 text-center relative`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex justify-center mb-2">
              {getRankIcon(1)}
            </div>
            <div className="flex justify-center mb-2">
              <Avatar 
                name={leaderboard[0].member_name} 
                imageUrl={leaderboard[0].profile_image}
                size="md"
                rank={1}
              />
            </div>
            <p className="text-xs font-bold text-foreground truncate mb-1">
              {leaderboard[0].member_name.split(' ')[0]}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {leaderboard[0].event_count}
            </p>
            <p className="text-[10px] text-muted-foreground">eventos</p>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`${getRankBadgeClass(3)} border rounded-lg p-3 text-center`}
          >
            <div className="flex justify-center mb-2">
              {getRankIcon(3)}
            </div>
            <div className="flex justify-center mb-2">
              <Avatar 
                name={leaderboard[2].member_name} 
                imageUrl={leaderboard[2].profile_image}
                size="sm"
                rank={3}
              />
            </div>
            <p className="text-xs font-medium text-foreground truncate mb-1">
              {leaderboard[2].member_name.split(' ')[0]}
            </p>
            <p className="text-lg font-bold text-foreground">
              {leaderboard[2].event_count}
            </p>
            <p className="text-[10px] text-muted-foreground">eventos</p>
          </motion.div>
        </div>
      )}

      {/* Resto del leaderboard */}
      {leaderboard.length > 3 && (
        <div className="space-y-2">
          {leaderboard.slice(3).map((entry, index) => (
            <motion.div
              key={entry.member_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="bg-card/50 border border-border p-3 rounded-lg hover:border-foreground/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 text-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-shrink-0">
                  <Avatar 
                    name={entry.member_name} 
                    imageUrl={entry.profile_image}
                    size="sm"
                    rank={entry.rank}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.member_name}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-foreground">
                    {entry.event_count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">eventos</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Vista especial para menos de 3 */}
      {leaderboard.length < 3 && (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.member_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`${getRankBadgeClass(entry.rank)} border-2 rounded-lg p-4 text-center`}
            >
              <div className="flex justify-center mb-2">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex justify-center mb-2">
                <Avatar 
                  name={entry.member_name} 
                  imageUrl={entry.profile_image}
                  size={entry.rank === 1 ? "md" : "sm"}
                  rank={entry.rank}
                />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">
                {entry.member_name}
              </p>
              <p className="text-2xl font-bold text-foreground mb-1">
                {entry.event_count}
              </p>
              <p className="text-xs text-muted-foreground">eventos participados</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {totalMembers > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-muted/30 border border-border p-3 rounded-lg text-center mt-4"
        >
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{totalMembers} participantes</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {leaderboard.reduce((sum, e) => sum + e.event_count, 0)} eventos totales
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}



