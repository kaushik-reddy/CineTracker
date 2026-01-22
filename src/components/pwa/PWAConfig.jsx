import { useEffect } from 'react';

// iOS PWA Configuration Component
export default function PWAConfig() {
  useEffect(() => {
    // Inject iOS PWA meta tags dynamically
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'CineTracker' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#000000' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' }
    ];

    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Add iOS splash screens and icons
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      const icon = document.createElement('link');
      icon.rel = 'apple-touch-icon';
      icon.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693d661aca82e178be7bb96f/ab2cb46cf_IMG_0700.png';
      document.head.appendChild(icon);
    }

    // Detect standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    if (isStandalone) {
      document.body.classList.add('standalone-mode');
      localStorage.setItem('pwa_standalone', 'true');
    } else {
      localStorage.setItem('pwa_standalone', 'false');
    }

    // Lock orientation to portrait on mobile
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait').catch(() => {
        // Orientation lock not supported or denied
      });
    }
  }, []);

  return null;
}

// Hook to detect standalone mode
export function useStandaloneMode() {
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    localStorage.getItem('pwa_standalone') === 'true'
  );
  return isStandalone;
}