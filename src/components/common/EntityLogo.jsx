import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";

export default function EntityLogo({ entityName, category, size = 'sm', className = '' }) {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (!entityName || !category) return;
    
    const loadLogo = async () => {
      try {
        const logos = await base44.entities.Logo.filter({
          name: entityName,
          category: category,
          is_active: true
        });
        if (logos[0]) {
          setLogoUrl(logos[0].processed_url || logos[0].original_url);
        }
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };
    loadLogo();
  }, [entityName, category]);

  const sizeClasses = {
    xs: 'h-3 max-w-[60px]',
    sm: 'h-4 max-w-[80px]',
    md: 'h-5 max-w-[100px]',
    lg: 'h-6 max-w-[120px]'
  };

  if (!logoUrl) {
    return (
      <span className={`text-[10px] sm:text-xs text-white font-bold uppercase tracking-wide bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700 ${className}`}>
        {entityName}
      </span>
    );
  }

  return (
    <div className={`px-1 py-0.5 flex items-center justify-center ${className}`}>
      <img 
        src={logoUrl} 
        alt={entityName}
        className={`${sizeClasses[size]} object-contain`}
        style={{
          filter: 'brightness(0) invert(1)',
          mixBlendMode: 'screen',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}