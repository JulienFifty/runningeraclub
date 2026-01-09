"use client";

import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <Providers>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </Providers>
    </HelmetProvider>
  );
}









