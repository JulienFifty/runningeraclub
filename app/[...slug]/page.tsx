import { redirect } from 'next/navigation';

export default function CatchAllPage() {
  // Redirigir cualquier ruta no definida a la página de Próximamente
  redirect('/proximamente');
}

