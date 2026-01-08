"use client";

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground">
        <div className="w-5 h-5 flex-shrink-0" />
        <span className="font-display font-medium text-sm">Tema</span>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
      aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
      ) : (
        <Moon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
      )}
      <span className="font-display font-medium text-sm">
        {isDark ? 'Modo Claro' : 'Modo Oscuro'}
      </span>
    </button>
  );
}

