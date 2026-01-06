"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { ArrowLeft, Calendar, Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'alltime' | 'year' | 'month'>('alltime');

  const periodOptions = [
    { value: 'month' as const, label: 'Este Mes', icon: '📅' },
    { value: 'year' as const, label: 'Este Año', icon: '🗓️' },
    { value: 'alltime' as const, label: 'Histórico', icon: '🏆' },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="container-premium py-16 md:py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <Trophy className="w-12 h-12 text-primary" />
              <h1 className="font-display text-5xl md:text-6xl text-foreground font-light">
                Leaderboard
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Clasificación de los corredores más activos del club RUNNING ERA
            </p>
          </div>

          {/* Period Filters */}
          <div className="flex justify-center">
            <div className="inline-flex bg-card border border-border rounded-lg p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`
                    px-6 py-3 rounded-md transition-all font-medium text-sm
                    ${period === option.value
                      ? 'bg-foreground text-background shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Content */}
      <section className="container-premium section-padding">
        <Leaderboard period={period} />
      </section>

      {/* Footer Info */}
      <section className="container-premium pb-16">
        <div className="bg-gradient-to-br from-[#FC4C02]/5 to-[#FC4C02]/10 border border-[#FC4C02]/20 p-8 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg
              className="w-6 h-6 text-[#FC4C02]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            <h3 className="font-display text-2xl text-foreground font-light">
              Conecta tu Strava
            </h3>
          </div>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            ¿Quieres aparecer en el leaderboard? Conecta tu cuenta de Strava desde tu dashboard
            y tus carreras se sincronizarán automáticamente.
          </p>
          <Link
            href="/miembros/dashboard"
            className="inline-flex items-center gap-2 bg-[#FC4C02] text-white px-8 py-3 rounded-lg hover:bg-[#E34402] transition-colors font-medium"
          >
            Ir a Mi Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}



