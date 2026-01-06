"use client";

interface HomeLeaderboardProps {
  type: 'distance' | 'events';
  limit?: number;
  title: string;
  subtitle: string;
}

export function HomeLeaderboard({ type, limit = 5, title, subtitle }: HomeLeaderboardProps) {
  // Mostrar siempre "Próximamente con Strava"
  return (
    <div className="bg-card/50 border border-border p-8 rounded-lg text-center relative overflow-hidden">
      {/* Background Pattern */}
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



