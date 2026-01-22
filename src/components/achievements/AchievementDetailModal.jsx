import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle, Lock, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function AchievementDetailModal({ 
  open, 
  onClose, 
  achievement,
  contributingTitles = []
}) {
  if (!achievement) return null;

  const Icon = achievement.icon;
  const unlockedLevels = achievement.levels.filter(l => l.unlocked).length;
  const totalLevels = achievement.levels.length;
  const currentLevel = achievement.levels.find(l => !l.unlocked) || achievement.levels[achievement.levels.length - 1];
  const isFullyUnlocked = unlockedLevels === totalLevels;

  // Generate insight based on achievement category and progress
  const insight = (() => {
    const percentage = ((unlockedLevels / totalLevels) * 100).toFixed(0);
    
    if (isFullyUnlocked) {
      return `Congratulations! You've mastered all ${totalLevels} levels of this achievement. Your dedication to ${achievement.name.toLowerCase()} is truly exceptional!`;
    } else if (unlockedLevels > 0) {
      return `You've unlocked ${unlockedLevels} of ${totalLevels} levels (${percentage}%). Keep going to reach the next milestone at ${currentLevel.target}!`;
    } else {
      return `Start your journey by reaching the first level target of ${currentLevel.target}. Every great achievement begins with a single step!`;
    }
  })();

  // Get color class
  const getColorClass = (color, type = 'text') => {
    const colorMap = {
      purple: type === 'text' ? 'text-purple-400' : type === 'bg' ? 'bg-purple-500/20' : 'border-purple-500/50',
      emerald: type === 'text' ? 'text-emerald-400' : type === 'bg' ? 'bg-emerald-500/20' : 'border-emerald-500/50',
      amber: type === 'text' ? 'text-amber-400' : type === 'bg' ? 'bg-amber-500/20' : 'border-amber-500/50',
      orange: type === 'text' ? 'text-orange-400' : type === 'bg' ? 'bg-orange-500/20' : 'border-orange-500/50',
      indigo: type === 'text' ? 'text-indigo-400' : type === 'bg' ? 'bg-indigo-500/20' : 'border-indigo-500/50',
      blue: type === 'text' ? 'text-blue-400' : type === 'bg' ? 'bg-blue-500/20' : 'border-blue-500/50',
      pink: type === 'text' ? 'text-pink-400' : type === 'bg' ? 'bg-pink-500/20' : 'border-pink-500/50',
      violet: type === 'text' ? 'text-violet-400' : type === 'bg' ? 'bg-violet-500/20' : 'border-violet-500/50',
      cyan: type === 'text' ? 'text-cyan-400' : type === 'bg' ? 'bg-cyan-500/20' : 'border-cyan-500/50',
      teal: type === 'text' ? 'text-teal-400' : type === 'bg' ? 'bg-teal-500/20' : 'border-teal-500/50',
      rose: type === 'text' ? 'text-rose-400' : type === 'bg' ? 'bg-rose-500/20' : 'border-rose-500/50',
      yellow: type === 'text' ? 'text-yellow-400' : type === 'bg' ? 'bg-yellow-500/20' : 'border-yellow-500/50',
      green: type === 'text' ? 'text-green-400' : type === 'bg' ? 'bg-green-500/20' : 'border-green-500/50',
      red: type === 'text' ? 'text-red-400' : type === 'bg' ? 'bg-red-500/20' : 'border-red-500/50',
      gold: type === 'text' ? 'text-yellow-500' : type === 'bg' ? 'bg-yellow-500/20' : 'border-yellow-500/50'
    };
    return colorMap[color] || (type === 'text' ? 'text-purple-400' : type === 'bg' ? 'bg-purple-500/20' : 'border-purple-500/50');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-hidden w-[95vw] sm:w-full p-0">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-6 py-5 border-b border-zinc-700">
          
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${getColorClass(achievement.color, 'bg')} border ${getColorClass(achievement.color, 'border')}`}>
              <Icon className={`w-8 h-8 ${getColorClass(achievement.color, 'text')}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white mb-1">{achievement.name}</DialogTitle>
              <p className="text-sm text-zinc-400 leading-relaxed">{achievement.desc}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-6 space-y-6">
          {/* Progress Summary Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-6 border ${
              isFullyUnlocked 
                ? 'bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border-emerald-500/50' 
                : unlockedLevels > 0
                ? getColorClass(achievement.color, 'bg') + ' border ' + getColorClass(achievement.color, 'border')
                : 'bg-zinc-800/50 border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-400 mb-2">Achievement Status</p>
                <div className="flex items-center gap-3">
                  {isFullyUnlocked ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                      <div>
                        <p className="text-2xl font-bold text-emerald-400">Fully Mastered!</p>
                        <p className="text-sm text-zinc-300">All {totalLevels} levels completed</p>
                      </div>
                    </>
                  ) : unlockedLevels > 0 ? (
                    <>
                      <TrendingUp className={`w-8 h-8 ${getColorClass(achievement.color, 'text')}`} />
                      <div>
                        <p className="text-2xl font-bold text-white">{unlockedLevels} / {totalLevels} Levels</p>
                        <p className="text-sm text-zinc-300">In Progress - Keep going!</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Lock className="w-8 h-8 text-zinc-500" />
                      <div>
                        <p className="text-2xl font-bold text-zinc-400">Not Started</p>
                        <p className="text-sm text-zinc-500">Complete {currentLevel.target} to unlock first level</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Next Target</p>
                <p className="text-3xl font-bold text-white">{currentLevel.target}</p>
              </div>
            </div>
            
            {!isFullyUnlocked && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Progress to Next Level</span>
                  <span className="font-semibold text-white">{currentLevel.current} / {currentLevel.target}</span>
                </div>
                <Progress 
                  value={currentLevel.progress} 
                  className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-emerald-500" 
                  style={{ backgroundColor: 'rgb(39 39 42)' }}
                />
                <p className="text-xs text-zinc-400 text-right">
                  {Math.round(currentLevel.progress)}% Complete
                </p>
              </div>
            )}
          </motion.div>

          {/* Insight Block */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 rounded-xl p-5 border border-purple-500/30"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Progress Insight</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
              </div>
            </div>
          </motion.div>

          {/* Level Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">All Levels</h3>
            <div className="space-y-3">
              {achievement.levels.map((level, idx) => (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.02) }}
                  className={`p-4 rounded-lg border transition-all ${
                    level.unlocked 
                      ? 'bg-emerald-500/10 border-emerald-500/50 hover:border-emerald-500' 
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={`${level.unlocked ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400'} text-xs`}>
                        Level {level.level}
                      </Badge>
                      {level.unlocked && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                      {!level.unlocked && level.progress > 0 && (
                        <span className="text-xs text-zinc-400">In Progress</span>
                      )}
                    </div>
                    <span className="text-sm text-white font-semibold">
                      {level.current} / {level.target}
                    </span>
                  </div>
                  <Progress 
                    value={level.progress} 
                    className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-emerald-500" 
                    style={{ backgroundColor: 'rgb(39 39 42)' }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contributing Titles Section */}
          {contributingTitles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Contributing Titles</h3>
                <Badge className="bg-amber-500/20 text-amber-400 border-0">
                  {contributingTitles.length} {contributingTitles.length === 1 ? 'title' : 'titles'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {contributingTitles.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.02) }}
                    className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-amber-500/30 hover:bg-zinc-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Poster Thumbnail */}
                      {item.poster ? (
                        <img 
                          src={item.poster} 
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded border border-zinc-600 group-hover:border-amber-500/50 transition-colors flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-zinc-700 rounded border border-zinc-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl text-zinc-500">{item.title?.[0]}</span>
                        </div>
                      )}
                      
                      {/* Title Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate text-sm">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.subtitle && (
                            <p className="text-xs text-zinc-400">{item.subtitle}</p>
                          )}
                          {item.status && (
                            <Badge className={`text-[9px] px-1.5 py-0 ${
                              item.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'Playing' ? 'bg-blue-500/20 text-blue-400' :
                              item.status === 'Paused' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-zinc-700 text-zinc-400'
                            }`}>
                              {item.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Platform/Device Icon */}
                      {item.icon && (
                        <div className="flex-shrink-0">
                          <item.icon className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                      
                      {/* Contribution Value */}
                      {item.value && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-0 ml-2 flex-shrink-0 text-xs">
                          {item.value}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {contributingTitles.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-500">No titles contributed yet - start watching to unlock!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}