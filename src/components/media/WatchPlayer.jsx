import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WatchPlayer({ open, onClose, media, schedule, onUpdateProgress, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(schedule?.elapsed_seconds || 0);
  const [showComplete, setShowComplete] = useState(false);
  const intervalRef = useRef(null);
  const totalSeconds = (media?.runtime_minutes || 0) * 60;

  useEffect(() => {
    if (schedule?.elapsed_seconds !== undefined) {
      setElapsedSeconds(schedule.elapsed_seconds);
    }
  }, [schedule?.elapsed_seconds]);

  useEffect(() => {
    if (isPlaying && elapsedSeconds < totalSeconds) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next >= totalSeconds) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            setShowComplete(true);
            return totalSeconds;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, totalSeconds]);

  const handleStart = async () => {
    setIsPlaying(true);
    await onUpdateProgress(schedule.id, 'in_progress', elapsedSeconds);
  };

  const handlePause = async () => {
    setIsPlaying(false);
    await onUpdateProgress(schedule.id, 'paused', elapsedSeconds);
  };

  const handleResume = async () => {
    setIsPlaying(true);
    await onUpdateProgress(schedule.id, 'in_progress', elapsedSeconds);
  };

  const handleMarkWatched = () => {
    setShowComplete(true);
  };

  const progress = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0;

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!media || !schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden">
        {/* Header with poster */}
        <div className="relative h-32 sm:h-48 overflow-hidden">
          {media.poster_url ? (
            <img 
              src={media.poster_url} 
              alt={media.title}
              className="w-full h-full object-cover blur-sm opacity-40"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 flex items-end gap-2 sm:gap-4">
            {media.poster_url && (
              <img 
                src={media.poster_url} 
                alt={media.title}
                className="w-12 h-16 sm:w-20 sm:h-28 object-cover rounded-lg shadow-2xl border border-zinc-700 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-2xl font-bold text-white truncate">{media.title}</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1 truncate">{media.platform} • {media.device}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Player content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Progress section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Progress</span>
              <motion.span 
                className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent"
                key={progress}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {progress.toFixed(1)}%
              </motion.span>
            </div>
            
            {/* Progress bar - Enhanced */}
            <div className="relative h-5 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent" />
              
              {/* Main progress bar */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Gradient fill */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400" />
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Top highlight */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
              </motion.div>
              
              {/* Pulse effect when playing */}
              {isPlaying && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
                  style={{ width: `${progress}%` }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              {/* Progress indicator dot */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg shadow-amber-500/50 border-2 border-amber-400"
                animate={{ left: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ marginLeft: '-12px' }}
              >
                <motion.div
                  className="absolute inset-1 rounded-full bg-amber-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.div>
            </div>

            {/* Time display */}
            <div className="flex justify-between text-sm font-mono">
              <motion.span 
                className="text-white font-medium"
                key={elapsedSeconds}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
              >
                {formatTime(elapsedSeconds)}
              </motion.span>
              <span className="text-zinc-500">{formatTime(totalSeconds)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2 sm:gap-4">
            {!isPlaying && elapsedSeconds === 0 && (
              <Button
                onClick={handleStart}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-8 py-3 sm:py-6 text-sm sm:text-lg font-medium w-full sm:w-auto"
              >
                <Play className="w-4 sm:w-6 h-4 sm:h-6 mr-1 sm:mr-2" />
                Start Watching
              </Button>
            )}

            {!isPlaying && elapsedSeconds > 0 && elapsedSeconds < totalSeconds && (
              <Button
                onClick={handleResume}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-8 py-3 sm:py-6 text-sm sm:text-lg font-medium w-full sm:w-auto"
              >
                <Play className="w-4 sm:w-6 h-4 sm:h-6 mr-1 sm:mr-2" />
                Resume
              </Button>
            )}

            {isPlaying && (
              <Button
                onClick={handlePause}
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 sm:px-8 py-3 sm:py-6 text-sm sm:text-lg font-medium w-full sm:w-auto"
              >
                <Pause className="w-4 sm:w-6 h-4 sm:h-6 mr-1 sm:mr-2" />
                Pause
              </Button>
            )}

            {elapsedSeconds >= totalSeconds && !showComplete && (
              <Button
                onClick={handleMarkWatched}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-8 py-3 sm:py-6 text-sm sm:text-lg font-medium w-full sm:w-auto"
              >
                <Check className="w-4 sm:w-6 h-4 sm:h-6 mr-1 sm:mr-2" />
                Mark as Watched
              </Button>
            )}
          </div>

          {/* Status indicator */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full"
                >
                  <motion.div
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-emerald-400 text-sm font-medium">Now Playing</span>
                </motion.div>
              )}
              {!isPlaying && elapsedSeconds > 0 && elapsedSeconds < totalSeconds && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full"
                >
                  <Pause className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">Paused</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Completion modal */}
        <AnimatePresence>
          {showComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
            >
              <RatingPanel 
                media={media} 
                onSubmit={(rating) => {
                  onComplete(schedule.id, media.id, rating);
                  setShowComplete(false);
                  onClose();
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function RatingPanel({ media, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Check className="w-8 h-8 text-emerald-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2">Finished Watching!</h3>
      <p className="text-zinc-400 mb-6">How would you rate {media.title}?</p>

      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="text-4xl transition-transform hover:scale-110"
          >
            <span className={star <= (hoveredRating || rating) ? 'text-amber-400' : 'text-zinc-600'}>
              ★
            </span>
          </button>
        ))}
      </div>

      <Button
        onClick={() => onSubmit(rating || null)}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium py-6"
      >
        {rating > 0 ? 'Submit Rating' : 'Skip Rating'}
      </Button>
    </motion.div>
  );
}