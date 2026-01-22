import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, CheckCircle, Star, Calendar, Play, Pause, Shield, DollarSign, Users, AlertCircle } from 'lucide-react';

export default function DynamicIsland() {
  const [notification, setNotification] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [liveActivity, setLiveActivity] = useState(null); // For ongoing activities like playing media

  useEffect(() => {
    const handleNotification = (e) => {
      const { type, message, title, icon, duration = 4000, persistent = false } = e.detail;
      setNotification({ type, message, title, icon, persistent });
      setExpanded(true);

      if (!persistent) {
        // Auto collapse after duration
        setTimeout(() => setExpanded(false), duration);
        // Auto clear after duration + 1s
        setTimeout(() => setNotification(null), duration + 1000);
      }
    };

    const handleLiveActivity = (e) => {
      const { active, title, subtitle, progress, icon } = e.detail;
      if (active) {
        setLiveActivity({ title, subtitle, progress, icon });
      } else {
        setLiveActivity(null);
      }
    };

    window.addEventListener('dynamic-island-notification', handleNotification);
    window.addEventListener('dynamic-island-live-activity', handleLiveActivity);
    return () => {
      window.removeEventListener('dynamic-island-notification', handleNotification);
      window.removeEventListener('dynamic-island-live-activity', handleLiveActivity);
    };
  }, []);

  // Show live activity if active, otherwise show notification
  const displayContent = liveActivity || notification;
  if (!displayContent) return null;

  const icons = {
    schedule: Clock,
    complete: CheckCircle,
    achievement: Star,
    reminder: Bell,
    playing: Play,
    paused: Pause,
    admin: Shield,
    payment: DollarSign,
    user: Users,
    warning: AlertCircle,
    default: Calendar
  };

  const Icon = icons[displayContent.icon] || icons.default;
  
  // Determine background gradient based on type
  const getGradient = () => {
    if (liveActivity) {
      return 'from-purple-500 to-blue-500'; // Live activity (playing)
    }
    const type = notification?.type || 'default';
    switch (type) {
      case 'admin': return 'from-amber-500 to-orange-500';
      case 'payment': return 'from-emerald-500 to-teal-500';
      case 'warning': return 'from-red-500 to-orange-500';
      case 'success': return 'from-emerald-500 to-green-500';
      default: return 'from-purple-500 to-emerald-500';
    }
  };

  return (
    <>
      {/* Black notch area filler */}
      <div className="fixed top-0 left-0 right-0 bg-black z-[99]" style={{ height: 'env(safe-area-inset-top, 44px)' }} />
      
      <AnimatePresence>
        <motion.div
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: expanded ? 1 : 0.95, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="fixed left-0 right-0 z-[100] pointer-events-none flex justify-center"
          style={{ 
            top: 'calc(env(safe-area-inset-top, 44px) + 4px)'
          }}
        >
          <motion.div
            animate={{
              width: expanded ? (liveActivity ? '360px' : '320px') : '120px',
              height: expanded ? (liveActivity ? '80px' : '60px') : '28px',
              borderRadius: expanded ? '24px' : '14px'
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-black border border-zinc-700 shadow-2xl overflow-hidden backdrop-blur-xl"
            onClick={() => !liveActivity && setExpanded(!expanded)}
            style={{ pointerEvents: 'auto' }}
          >
            <AnimatePresence mode="wait">
              {expanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 h-full px-4"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {displayContent.title}
                    </p>
                    <p className="text-zinc-400 text-xs truncate">
                      {displayContent.subtitle || displayContent.message}
                    </p>
                    {liveActivity?.progress !== undefined && (
                      <div className="mt-1.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${liveActivity.progress}%` }}
                          className="h-full bg-gradient-to-r from-purple-500 to-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full gap-1.5"
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${getGradient()}`} />
                  {liveActivity && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`w-4 h-4 rounded-full bg-gradient-to-br ${getGradient()}`}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Helper function to trigger Dynamic Island notification
export function showDynamicIslandNotification({ type = 'default', title, message, icon, duration = 4000, persistent = false }) {
  window.dispatchEvent(new CustomEvent('dynamic-island-notification', {
    detail: { type, title, message, icon, duration, persistent }
  }));
}

// Helper function for live activities (ongoing events like playing media)
export function showDynamicIslandLiveActivity({ active, title, subtitle, progress, icon = 'playing' }) {
  window.dispatchEvent(new CustomEvent('dynamic-island-live-activity', {
    detail: { active, title, subtitle, progress, icon }
  }));
}

// Admin notification helper
export function showAdminNotification({ title, message, duration = 6000 }) {
  showDynamicIslandNotification({
    type: 'admin',
    title,
    message,
    icon: 'admin',
    duration
  });
}