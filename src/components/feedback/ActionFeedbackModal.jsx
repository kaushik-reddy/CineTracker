import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useActionFeedback } from './ActionFeedbackContext';

export default function ActionFeedbackModal() {
  const { state, dismiss } = useActionFeedback();

  useEffect(() => {
    if (state.status === 'success' && state.isOpen) {
      const timer = setTimeout(() => {
        dismiss();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.isOpen, dismiss]);

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={state.status === 'success' ? dismiss : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md" style={{ pointerEvents: 'auto' }}>
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                {state.status === 'loading' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-16 h-16 text-purple-400 mb-4" />
                  </motion.div>
                )}

                {state.status === 'success' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
                  >
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 relative z-10" />
                    </div>
                  </motion.div>
                )}

                {state.status === 'error' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  >
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                  </motion.div>
                )}

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`text-2xl font-bold mb-2 ${
                    state.status === 'loading' ? 'text-white' : 
                    state.status === 'success' ? 'text-emerald-400' : 
                    'text-red-400'
                  }`}
                >
                  {state.status === 'loading' && `${state.action}...`}
                  {state.status === 'success' && (state.title || `${state.action} Successfully`)}
                  {state.status === 'error' && (state.title || 'Action Failed')}
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-zinc-400 text-sm"
                >
                  {state.subtitle}
                </motion.p>

                {/* Progress bar for loading */}
                {state.status === 'loading' && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8 }}
                    className="mt-6 w-full h-1 bg-zinc-800 rounded-full overflow-hidden"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="h-full w-1/3 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}