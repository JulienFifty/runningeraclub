"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EventosPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la home y luego hacer scroll a la sección
    router.push('/');
    setTimeout(() => {
      const element = document.getElementById('eventos');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [router]);

  return null;
}

