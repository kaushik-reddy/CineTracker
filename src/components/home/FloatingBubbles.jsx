import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function FloatingBubbles() {
  const [activeBubble, setActiveBubble] = useState(null);

  const bubbles = [
    { id: 'ai', icon: Sparkles, color: 'from-purple-500 to-pink-500', label: 'AI Recommendations' },
    { id: 'news', icon: TrendingUp, color: 'from-amber-500 to-orange-500', label: 'Facts & News' }
  ];

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
      <AnimatePresence>
        {bubbles.map((bubble, idx) => (
          <motion.div
            key={bubble.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: idx * 0.1 }}
            className="relative flex items-center justify-end"
          >
            {/* Tooltip Label */}
            <AnimatePresence>
              {activeBubble === bubble.id && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute right-16 bg-zinc-900 border border-zinc-700 text-white px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none"
                >
                  <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-400">
                    {bubble.label}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    Coming Soon
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onMouseEnter={() => setActiveBubble(bubble.id)}
              onMouseLeave={() => setActiveBubble(null)}
              onClick={() => setActiveBubble(activeBubble === bubble.id ? null : bubble.id)}
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${bubble.color} shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group relative z-40`}
            >
              <bubble.icon className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}