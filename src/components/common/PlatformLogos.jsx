import React, { useState, useEffect } from 'react';
import { getLogo, subscribeToLogos } from "../admin/LogoCache.jsx";

const platformLogos = {
  'Netflix': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'Amazon Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
  'Disney+ Hotstar': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Disney%2B_Hotstar_logo.svg',
  'HBO Max': 'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg',
  'Apple TV+': 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg',
  'Hulu': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg',
  'Paramount+': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg',
  'Peacock': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/NBCUniversal_Peacock_Logo.svg',
  'SonyLIV': 'https://upload.wikimedia.org/wikipedia/commons/9/94/SonyLIV.svg',
  'Zee5': 'https://upload.wikimedia.org/wikipedia/commons/1/13/ZEE5_logo.svg',
  'Voot': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Voot_Logo.svg',
  'MX Player': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/MX_Player_icon.svg',
  'Jio Cinema': 'https://upload.wikimedia.org/wikipedia/commons/2/20/JioCinema_Logo.svg',
  'Disney+': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
  'Aha': 'https://upload.wikimedia.org/wikipedia/en/2/26/Aha_OTT_Logo.png',
  'Sun NXT': 'https://upload.wikimedia.org/wikipedia/en/c/c9/Sun_NXT_Logo.png'
};

export function PlatformBadge({ platform, size = 'default' }) {
  const [customLogoUrl, setCustomLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const defaultLogoUrl = platformLogos[platform];
  
  const sizeClasses = {
    sm: 'h-3',
    small: 'h-3',
    default: 'h-4',
    large: 'h-5',
    lg: 'h-5'
  };

  useEffect(() => {
    if (!platform) {
      setLoading(false);
      return;
    }
    
    // Load from cache immediately
    const loadLogo = async () => {
      const logoUrl = await getLogo(platform, 'platform');
      if (logoUrl) setCustomLogoUrl(logoUrl);
      setLoading(false);
    };
    loadLogo();

    // Subscribe to cache updates
    const unsubscribe = subscribeToLogos((cache) => {
      const key = `platform:${platform}`;
      if (cache[key]) {
        setCustomLogoUrl(cache[key]);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [platform]);

  const logoUrl = customLogoUrl || defaultLogoUrl;

  if (loading) {
    return (
      <div className="inline-flex items-center px-2 py-0.5">
        <div className={`${sizeClasses[size]} w-12 bg-zinc-800/50 rounded animate-pulse`} />
      </div>
    );
  }

  if (!logoUrl) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/50 text-white text-[10px] border border-zinc-700 font-bold uppercase">
        {platform}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center px-1 py-0.5">
      <img 
        src={logoUrl} 
        alt={platform}
        className={`${sizeClasses[size]} w-auto object-contain`}
        style={{
          filter: 'brightness(0) invert(1)',
          mixBlendMode: 'screen',
          objectFit: 'contain'
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/50 text-white text-[10px] border border-zinc-700 font-bold uppercase">${platform}</span>`;
        }}
      />
    </div>
  );
}

export default PlatformBadge;
export { platformLogos };