"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExperienciasPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la home y luego hacer scroll a la sección
    router.push('/');
    setTimeout(() => {
      const element = document.getElementById('experiencias');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [router]);

  return null;
}

