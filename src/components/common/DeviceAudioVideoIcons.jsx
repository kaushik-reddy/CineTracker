import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { getLogo, subscribeToLogos } from "../admin/LogoCache.jsx";
import { Tv, Monitor, Smartphone, Book, Film } from "lucide-react";

// Official audio format logos - same pattern as platform logos
const audioFormatLogos = {
  'Dolby Atmos': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Dolby_Atmos_logo.svg',
  'Dolby Digital Plus': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Dolby_Digital_Plus_logo.svg',
  'Dolby Digital': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Dolby_Digital_logo.svg',
  'DTS:X': 'https://upload.wikimedia.org/wikipedia/commons/5/57/DTS_logo.svg',
  'DTS': 'https://upload.wikimedia.org/wikipedia/commons/5/57/DTS_logo.svg',
  'DTS-HD': 'https://upload.wikimedia.org/wikipedia/commons/5/57/DTS_logo.svg',
  'Spatial Audio': 'https://help.apple.com/assets/63D867F3DE3AAF31C003FA54/63D867F4DE3AAF31C003FA5F/en_US/6e4b8f9e86a75bcf6c3d5e6c5e5d8f08.png',
  'IMAX Enhanced Audio': 'https://upload.wikimedia.org/wikipedia/commons/6/68/IMAX.svg'
};

// Official video format logos - same pattern as platform logos
const videoFormatLogos = {
  'Dolby Vision': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Dolby_Vision_logo.svg',
  'HDR10': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/HDR10_Logo.svg',
  'HDR10+': 'https://upload.wikimedia.org/wikipedia/commons/8/80/HDR10%2B_Logo.svg',
  'IMAX': 'https://upload.wikimedia.org/wikipedia/commons/6/68/IMAX.svg',
  'IMAX Enhanced': 'https://upload.wikimedia.org/wikipedia/commons/6/68/IMAX.svg',
  'IMAX 3D': 'https://upload.wikimedia.org/wikipedia/commons/6/68/IMAX.svg',
  '4K UHD': 'https://upload.wikimedia.org/wikipedia/commons/9/92/4K_UHD_Logo.svg',
  'Dolby Cinema': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Dolby_Cinema_logo.svg'
};

// Fallback colors and labels
const audioFormats = {
  'Dolby Atmos': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Atmos' },
  'Dolby Digital Plus': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'DD+' },
  'Dolby Digital': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'DD' },
  'DTS:X': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'DTS:X' },
  'DTS': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'DTS' },
  'DTS-HD': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'DTS-HD' },
  'Spatial Audio': { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', label: 'Spatial' },
  'IMAX Enhanced Audio': { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'IMAX Audio' },
  'Stereo': { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Stereo' },
  'Mono': { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Mono' },
  '5.1 Surround': { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '5.1' },
  '7.1 Surround': { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '7.1' },
  'AAC': { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'AAC' },
  'PCM': { color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', label: 'PCM' }
};

const videoFormats = {
  'Dolby Vision': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Vision' },
  'HDR10': { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'HDR10' },
  'HDR10+': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'HDR10+' },
  'HDR': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'HDR' },
  'IMAX': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'IMAX' },
  'IMAX Enhanced': { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'IMAX+' },
  'IMAX 3D': { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'IMAX 3D' },
  'Dolby Cinema': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Dolby Cinema' },
  '4DX': { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '4DX' },
  'ScreenX': { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', label: 'ScreenX' },
  'MX4D': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'MX4D' },
  'HLG': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'HLG' },
  '4K UHD': { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: '4K' },
  '8K': { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: '8K' },
  'QHD': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'QHD' },
  'SD': { color: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30', label: 'SD' },
  'HD': { color: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30', label: 'HD' },
  'Full HD': { color: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30', label: 'FHD' },
  '3D': { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', label: '3D' }
};

export function AudioFormatBadge({ format, size = 'default' }) {
  const [customLogoUrl, setCustomLogoUrl] = useState(null);
  const defaultLogoUrl = audioFormatLogos[format];
  const formatData = audioFormats[format] || {
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    label: format
  };

  const sizeClasses = {
    sm: 'h-3',
    small: 'h-3',
    default: 'h-4',
    large: 'h-5',
    lg: 'h-5'
  };

  useEffect(() => {
    if (!format) return;

    // Load from cache immediately
    const loadLogo = async () => {
      const logoUrl = await getLogo(format, 'format');
      setCustomLogoUrl(logoUrl);
    };
    loadLogo();

    // Subscribe to cache updates for instant refresh
    const unsubscribe = subscribeToLogos((cache) => {
      const key = `format:${format}`;
      if (cache[key]) {
        setCustomLogoUrl(cache[key]);
      }
    });

    return unsubscribe;
  }, [format]);

  const logoUrl = customLogoUrl || defaultLogoUrl;

  if (!logoUrl) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/50 text-white border border-zinc-700 text-[10px] font-bold uppercase">
        {formatData.label}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center px-1 py-0.5">
      <img
        src={logoUrl}
        alt={format}
        className={`${sizeClasses[size]} max-w-[80px] object-contain`}
        style={{
          filter: customLogoUrl ? 'brightness(0) invert(1)' : 'brightness(0) invert(1)',
          mixBlendMode: 'screen',
          objectFit: 'contain'
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/50 text-white border border-zinc-700 text-[10px] font-bold uppercase">${formatData.label}</span>`;
        }}
      />
    </div>
  );
}

export function VideoFormatBadge({ format, size = 'default' }) {
  const [customLogoUrl, setCustomLogoUrl] = useState(null);
  const defaultLogoUrl = videoFormatLogos[format];
  const formatData = videoFormats[format] || {
    color: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
    label: format
  };

  const sizeClasses = {
    sm: 'h-3',
    small: 'h-3',
    default: 'h-4',
    large: 'h-5',
    lg: 'h-5'
  };

  useEffect(() => {
    if (!format) return;

    // Load from cache immediately
    const loadLogo = async () => {
      const logoUrl = await getLogo(format, 'format');
      setCustomLogoUrl(logoUrl);
    };
    loadLogo();

    // Subscribe to cache updates for instant refresh
    const unsubscribe = subscribeToLogos((cache) => {
      const key = `format:${format}`;
      if (cache[key]) {
        setCustomLogoUrl(cache[key]);
      }
    });

    return unsubscribe;
  }, [format]);

  const logoUrl = customLogoUrl || defaultLogoUrl;

  if (!logoUrl) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/50 text-white border border-zinc-700 text-[10px] font-bold uppercase">
        {formatData.label}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center px-1 py-0.5">
      <img
        src={logoUrl}
        alt={format}
        className={`${sizeClasses[size]} w-auto object-contain`}
        style={{
          filter: 'brightness(0) invert(1)',
          mixBlendMode: 'screen',
          objectFit: 'contain'
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/50 text-white border border-zinc-700 text-[10px] font-bold uppercase">${formatData.label}</span>`;
        }}
      />
    </div>
  );
}

// Fallback device icons mapping
const deviceIcons = {
  "TV": Tv,
  "Laptop": Monitor,
  "Phone": Smartphone,
  "Tablet": Smartphone,
  "Projector": Monitor,
  "E-Reader": Book,
  "Physical Book": Book,
  "Kindle": Book,
  "Big Screen": Monitor,
  "Theater": Film,
  "Other": Monitor
};

export function DeviceLogo({ device, size = 'default', className = '' }) {
  const [customLogoUrl, setCustomLogoUrl] = useState(null);

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  useEffect(() => {
    if (!device) return;

    // Load from cache immediately
    const loadLogo = async () => {
      const logoUrl = await getLogo(device, 'device');
      setCustomLogoUrl(logoUrl);
    };
    loadLogo();

    // Subscribe to cache updates for instant refresh
    const unsubscribe = subscribeToLogos((cache) => {
      const key = `device:${device}`;
      if (cache[key]) {
        setCustomLogoUrl(cache[key]);
      }
    });

    return unsubscribe;
  }, [device]);

  // If custom logo exists, show it
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt={device}
        className={`${sizeClasses[size]} object-contain ${className}`}
        style={{
          filter: 'brightness(0) invert(1)',
          mixBlendMode: 'screen'
        }}
        onError={(e) => {
          // On error, hide image - component will re-render with fallback on next render
          e.target.style.display = 'none';
        }}
      />
    );
  }

  // Fallback to Lucide icon
  const FallbackIcon = deviceIcons[device] || Monitor;
  return <FallbackIcon className={`${sizeClasses[size]} ${className}`} />;
}