import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Sparkles, Newspaper, X , Clock} from 'lucide-react';
import { Button } from "@/components/ui/button";

const icons = [
  { id: 'releases', icon: Film, label: 'New Releases', color: 'from-purple-500 to-pink-500' },
  { id: 'recommendations', icon: Sparkles, label: 'AI Recommendations', color: 'from-amber-500 to-orange-500' },
  { id: 'news', icon: Newspaper, label: 'News & Facts', color: 'from-emerald-500 to-teal-500' }
];

export default function FloatingSmartIcons({ onOpenPanel }) {
  const [hoveredIcon, setHoveredIcon] = useState(null);

  return (
    <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col gap-2">
      {icons.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, type: 'spring' }}
            className="relative"
            onMouseEnter={() => setHoveredIcon(item.id)}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onOpenPanel(item.id)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg border-2 border-white/20 active:border-white/50 transition-all touch-manipulation`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.button>

            {/* Tooltip - Desktop only */}
            <AnimatePresence>
              {hoveredIcon === item.id && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-zinc-900 text-white px-2 py-1 rounded-lg text-xs font-medium border border-zinc-700 shadow-xl pointer-events-none hidden sm:block"
                >
                  {item.label}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export function SmartPanel({ isOpen, onClose, panelId, children, title }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 sm:bottom-6 sm:top-6 sm:w-[500px] bg-gradient-to-b from-zinc-900 to-black border-t sm:border border-zinc-800 sm:rounded-2xl overflow-hidden shadow-2xl max-h-[75vh] sm:max-h-full flex flex-col pb-24 sm:pb-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-base sm:text-xl font-bold text-white">{title}</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 -mr-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-700">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}