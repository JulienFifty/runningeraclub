"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareEventButtonProps {
  event: {
    title: string;
    slug: string;
  };
}

export function ShareEventButton({ event }: ShareEventButtonProps) {
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/eventos/${event.slug}`
    : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Echa un vistazo a este evento: ${event.title}`,
          url: shareUrl,
        });
      } catch (error: any) {
        // Usuario canceló el compartir o hubo un error
        if (error.name !== 'AbortError') {
          console.error('Error al compartir:', error);
        }
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('URL copiada al portapapeles');
      } catch (error) {
        console.error('Error al copiar:', error);
        toast.error('No se pudo copiar la URL');
      }
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="w-full"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Compartir
    </Button>
  );
}





