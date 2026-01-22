import React, { useState, useEffect } from 'react';
import { getLogo, subscribeToLogos } from "../admin/LogoCache.jsx";

export default function StudioLogo({ studioName, size = 'sm', className = '' }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studioName) {
      setLoading(false);
      return;
    }
    
    // Load from cache immediately
    const loadStudioLogo = async () => {
      const logoUrl = await getLogo(studioName, 'studio');
      if (logoUrl) setLogoUrl(logoUrl);
      setLoading(false);
    };
    loadStudioLogo();

    // Subscribe to cache updates
    const unsubscribe = subscribeToLogos((cache) => {
      const key = `studio:${studioName}`;
      if (cache[key]) {
        setLogoUrl(cache[key]);
      }
    });

    return unsubscribe;
  }, [studioName]);

  if (loading) {
    return <div className="h-4 w-12 bg-zinc-800/50 rounded animate-pulse" />;
  }
  
  if (!logoUrl) return null;

  const sizeClasses = {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
    xl: 'h-8'
  };

  return (
    <img
      src={logoUrl}
      alt={studioName}
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
      style={{
        filter: 'brightness(0) invert(1)',
        mixBlendMode: 'screen',
        objectFit: 'contain'
      }}
    />
  );
}

export function StudioLogos({ studios, size = 'sm', maxDisplay = 2, className = '' }) {
  if (!studios || studios.length === 0) return null;

  const displayStudios = studios.slice(0, maxDisplay);
  const remainingCount = studios.length - maxDisplay;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {displayStudios.map((studio, idx) => (
        <StudioLogo key={idx} studioName={studio} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-zinc-500">+{remainingCount}</span>
      )}
    </div>
  );
}