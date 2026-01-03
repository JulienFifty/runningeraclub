"use client";

import { useState } from 'react';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rank?: number;
}

export function Avatar({ name, imageUrl, size = 'md', rank }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-24 h-24 text-2xl',
  };

  const getRankColors = () => {
    if (!rank) return 'from-primary/30 to-primary/60';
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-yellow-600';
      case 2:
        return 'from-gray-400 to-gray-600';
      case 3:
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-primary/30 to-primary/60';
    }
  };

  const getInitial = () => {
    return name.charAt(0).toUpperCase();
  };

  const getTextSize = () => {
    switch (size) {
      case 'xl':
        return 'text-2xl';
      case 'lg':
        return 'text-xl';
      case 'md':
        return 'text-lg';
      case 'sm':
        return 'text-sm';
    }
  };

  const showImage = imageUrl && !imageError;

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden border-2 border-background flex-shrink-0 relative`}>
      {showImage ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${getRankColors()} flex items-center justify-center text-white font-bold shadow-lg ${getTextSize()}`}>
          {getInitial()}
        </div>
      )}
    </div>
  );
}

