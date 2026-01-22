import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getLogo, subscribeToLogos } from "../admin/LogoCache.jsx";

export default function UniverseBadge({ universeId, className = "" }) {
  const [universe, setUniverse] = useState(null);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    if (!universeId) return;
    
    const loadUniverse = async () => {
      try {
        const universes = await base44.entities.Universe.filter({ id: universeId });
        if (universes[0]) {
          setUniverse(universes[0]);
          
          // Load logo from cache immediately
          const logoUrl = await getLogo(universes[0].name, 'studio');
          if (logoUrl) setLogo(logoUrl);
        }
      } catch (error) {
        console.error('Failed to load universe:', error);
      }
    };
    loadUniverse();

    // Subscribe to cache updates
    const unsubscribe = subscribeToLogos(async (cache) => {
      if (universe) {
        const key = `studio:${universe.name}`;
        if (cache[key]) {
          setLogo(cache[key]);
        }
      }
    });

    return unsubscribe;
  }, [universeId, universe]);

  if (!universe || !logo) return null;

  return (
    <div className={`inline-flex items-center px-1 py-0.5 ${className}`}>
      <img 
        src={logo} 
        alt={universe.name}
        className="h-3 w-auto object-contain"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </div>
  );
}