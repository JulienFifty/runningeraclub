"use client";

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Trophy, Calendar } from 'lucide-react';
import { HomeLeaderboard } from './leaderboard/HomeLeaderboard';
import Link from 'next/link';

export const LeaderboardsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="leaderboard" className="section-padding bg-background relative overflow-hidden">
      <div className="container-premium relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h2 className="font-display text-4xl md:text-5xl text-foreground font-light">
              Leaderboard
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Los corredores más activos del club RUNNING ERA
          </p>
        </motion.div>

        {/* Two Leaderboards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Leaderboard por Kilómetros */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-card border border-border p-6 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground font-light">
                  Por Kilómetros
                </h3>
                <p className="text-sm text-muted-foreground">
                  Distancia total recorrida
                </p>
              </div>
            </div>
            <HomeLeaderboard
              type="distance"
              limit={5}
              title="Por Kilómetros"
              subtitle="Distancia total recorrida"
            />
          </motion.div>

          {/* Leaderboard por Eventos */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-card border border-border p-6 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground font-light">
                  Por Eventos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Eventos participados
                </p>
              </div>
            </div>
            <HomeLeaderboard
              type="events"
              limit={5}
              title="Por Eventos"
              subtitle="Eventos participados"
            />
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
          >
            Ver Leaderboard Completo
            <Trophy className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};






