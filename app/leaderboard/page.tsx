"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { EventsLeaderboard } from '@/components/leaderboard/EventsLeaderboard';
import { ArrowLeft, Calendar, Trophy, Activity } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'alltime' | 'year' | 'month'>('alltime');
  const [eventsPeriod, setEventsPeriod] = useState<'month' | 'alltime'>('alltime');
  const [activeTab, setActiveTab] = useState<'distance' | 'events'>('events');

  const periodOptions = [
    { value: 'month' as const, label: 'Este Mes', icon: '📅' },
    { value: 'year' as const, label: 'Este Año', icon: '🗓️' },
    { value: 'alltime' as const, label: 'Histórico', icon: '🏆' },
  ];

  const eventsPeriodOptions = [
    { value: 'month' as const, label: 'Este Mes', icon: '📅' },
    { value: 'alltime' as const, label: 'Histórico', icon: '🏆' },
  ];

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title="Leaderboard | Clasificación de Corredores"
        description="Clasificación de los corredores más activos del club RUNNING ERA. Conecta tu Strava y compite por el primer lugar en nuestro leaderboard. Ver rankings mensuales, anuales e históricos."
        image="/assets/logo-running-era.png"
        url="https://runningera.mx/leaderboard"
      />
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

          {/* Tabs para cambiar entre leaderboards */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-card border border-border rounded-lg p-1">
              <button
                onClick={() => setActiveTab('events')}
                className={`
                  px-6 py-3 rounded-md transition-all font-medium text-sm flex items-center gap-2
                  ${activeTab === 'events'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                Por Eventos
              </button>
              <button
                onClick={() => setActiveTab('distance')}
                className={`
                  px-6 py-3 rounded-md transition-all font-medium text-sm flex items-center gap-2
                  ${activeTab === 'distance'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Activity className="w-4 h-4" />
                Por Kilómetros
              </button>
            </div>
          </div>

          {/* Period Filters */}
          <div className="flex justify-center">
            <div className="inline-flex bg-card border border-border rounded-lg p-1">
              {activeTab === 'events' ? (
                eventsPeriodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEventsPeriod(option.value)}
                    className={`
                      px-6 py-3 rounded-md transition-all font-medium text-sm
                      ${eventsPeriod === option.value
                        ? 'bg-foreground text-background shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </button>
                ))
              ) : (
                periodOptions.map((option) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Content */}
      <section className="container-premium section-padding">
        {activeTab === 'events' ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl text-foreground font-light mb-2">
                Leaderboard por Eventos
              </h2>
              <p className="text-muted-foreground">
                Los miembros más activos del club según eventos participados
                {eventsPeriod === 'month' && ' (este mes)'}
                {eventsPeriod === 'alltime' && ' (histórico)'}
              </p>
            </div>
            <EventsLeaderboard period={eventsPeriod} />
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl text-foreground font-light mb-2">
                Leaderboard por Kilómetros
              </h2>
              <p className="text-muted-foreground">
                Los corredores con más distancia recorrida (requiere conexión con Strava)
              </p>
            </div>
            <Leaderboard period={period} />
          </div>
        )}
      </section>

      {/* Footer Info */}
      <section className="container-premium pb-16">
        {activeTab === 'events' ? (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-8 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="font-display text-2xl text-foreground font-light">
                Participa en Eventos
              </h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              ¡Regístrate a los eventos del club y compite por el primer lugar en el leaderboard de eventos!
              Cada evento en el que participes cuenta para tu ranking.
            </p>
            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 bg-primary text-background px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Ver Eventos Disponibles
            </Link>
          </div>
        ) : (
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
              ¿Quieres aparecer en el leaderboard por kilómetros? Conecta tu cuenta de Strava desde tu dashboard
              y tus carreras se sincronizarán automáticamente.
            </p>
            <Link
              href="/miembros/dashboard"
              className="inline-flex items-center gap-2 bg-[#FC4C02] text-white px-8 py-3 rounded-lg hover:bg-[#E34402] transition-colors font-medium"
            >
              Ir a Mi Dashboard
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}






