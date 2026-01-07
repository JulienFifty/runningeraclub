"use client";

import { Suspense } from 'react';
import { EventRegistrationButton } from './EventRegistrationButton';

interface EventRegistrationButtonWrapperProps {
  eventId: string;
  eventSlug?: string;
  buttonText: 'REGÍSTRATE' | 'VER EVENTO';
  eventTitle?: string;
  eventPrice?: string;
}

export function EventRegistrationButtonWrapper(props: EventRegistrationButtonWrapperProps) {
  return (
    <Suspense fallback={
      <div className="block w-full bg-foreground text-background px-6 py-4 text-center text-sm font-medium tracking-wider uppercase opacity-50">
        Cargando...
      </div>
    }>
      <EventRegistrationButton {...props} />
    </Suspense>
  );
}

