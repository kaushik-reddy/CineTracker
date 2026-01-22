import { useEffect } from 'react';

// Mobile-specific optimizations
export default function MobileOptimizations() {
  useEffect(() => {
    // Prevent pull-to-refresh on iOS
    let lastTouchY = 0;
    const preventPullToRefresh = (e) => {
      const touch = e.touches[0];
      if (lastTouchY !== null) {
        const deltaY = touch.clientY - lastTouchY;
        if (deltaY > 0 && window.scrollY === 0) {
          e.preventDefault();
        }
      }
      lastTouchY = touch.clientY;
    };

    document.addEventListener('touchstart', (e) => {
      lastTouchY = e.touches[0].clientY;
    });
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });

    // Disable pinch zoom
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());

    // Add touch-action CSS to body
    document.body.style.touchAction = 'pan-y';
    document.body.style.overscrollBehavior = 'none';

    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // iOS safe area handling
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);

    // Add standalone class for CSS targeting
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('pwa-standalone');
    }

    return () => {
      document.removeEventListener('touchmove', preventPullToRefresh);
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);

  return null;
}

// Hook for mobile gestures
export function useMobileGestures(onSwipeLeft, onSwipeRight) {
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diff < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}

// Haptic feedback (iOS Safari)
export function triggerHaptic(type = 'light') {
  if (window.navigator && window.navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [20, 100, 20]
    };
    window.navigator.vibrate(patterns[type] || patterns.light);
  }
}