import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useComprehensiveAchievements } from "./ComprehensiveAchievements";
import AchievementDetailModal from "./AchievementDetailModal";

export default function AchievementsView({ completedSchedules, mediaMap, mediaList }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [contributingTitles, setContributingTitles] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('unlocked');
  
  const achievements = useComprehensiveAchievements(completedSchedules, mediaMap, mediaList);

  // Generate contributing titles when achievement is selected
  const handleAchievementClick = (achievement) => {
    const titles = [];
    const completed = completedSchedules.filter(s => mediaMap[s.media_id]);
    
    // Based on achievement ID, filter relevant completed titles
    switch (achievement.id) {
      case 'watch_time':
      case 'watch_days':
      case 'streak':
        completed.forEach(s => {
          const media = mediaMap[s.media_id];
          if (media) {
            let runtime = media.runtime_minutes;
            if (media.type === 'series' && s.season_number && s.episode_number) {
              const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
              if (epRuntime) runtime = epRuntime;
            }
            titles.push({
              title: media.title,
              poster: media.poster_url,
              subtitle: new Date(s.rating_submitted_at || s.updated_date).toLocaleDateString(),
              value: `${runtime}m`,
              status: 'Completed'
            });
          }
        });
        break;
      
      case 'movies':
        completed.filter(s => mediaMap[s.media_id]?.type === 'movie').forEach(s => {
          const media = mediaMap[s.media_id];
          titles.push({
            title: media.title,
            poster: media.poster_url,
            subtitle: `${media.runtime_minutes}m`,
            value: media.platform,
            status: 'Completed'
          });
        });
        break;
      
      case 'series':
      case 'episodes':
        completed.filter(s => mediaMap[s.media_id]?.type === 'series').forEach(s => {
          const media = mediaMap[s.media_id];
          titles.push({
            title: media.title,
            poster: media.poster_url,
            subtitle: `S${s.season_number}E${s.episode_number}`,
            value: media.platform,
            status: 'Completed'
          });
        });
        break;
      
      case 'books':
      case 'reading_sessions':
        completed.filter(s => mediaMap[s.media_id]?.type === 'book').forEach(s => {
          const media = mediaMap[s.media_id];
          titles.push({
            title: media.title,
            poster: media.poster_url,
            subtitle: `${media.pages_read || 0} / ${media.total_pages} pages`,
            value: media.platform,
            status: 'Completed'
          });
        });
        break;

      case 'five_star':
        completed.filter(s => (s.rating || mediaMap[s.media_id]?.rating) === 5).forEach(s => {
          const media = mediaMap[s.media_id];
          if (media) {
            titles.push({
              title: media.title,
              poster: media.poster_url,
              subtitle: '⭐⭐⭐⭐⭐',
              value: media.platform,
              status: 'Completed'
            });
          }
        });
        break;

      case 'audiophile':
        completed.filter(s => {
          const premiumAudio = ['Dolby Atmos', 'DTS:X', 'IMAX Enhanced Audio', 'Spatial Audio'];
          return s.audio_format && premiumAudio.includes(s.audio_format);
        }).forEach(s => {
          const media = mediaMap[s.media_id];
          if (media) {
            titles.push({
              title: media.title,
              poster: media.poster_url,
              subtitle: s.audio_format,
              value: media.platform,
              status: 'Completed'
            });
          }
        });
        break;

      case 'videophile':
        completed.filter(s => {
          const premiumVideo = ['4K UHD', '8K', 'Dolby Vision', 'HDR10+', 'IMAX', 'IMAX Enhanced'];
          return s.video_format && premiumVideo.includes(s.video_format);
        }).forEach(s => {
          const media = mediaMap[s.media_id];
          if (media) {
            titles.push({
              title: media.title,
              poster: media.poster_url,
              subtitle: s.video_format,
              value: media.platform,
              status: 'Completed'
            });
          }
        });
        break;

      case 'social_watcher':
        completed.filter(s => s.viewers && s.viewers.length > 0).forEach(s => {
          const media = mediaMap[s.media_id];
          if (media) {
            titles.push({
              title: media.title,
              poster: media.poster_url,
              subtitle: `With ${s.viewers.length} viewer${s.viewers.length > 1 ? 's' : ''}`,
              value: media.platform,
              status: 'Completed'
            });
          }
        });
        break;

      default:
        // For other achievements, show all completed
        completed.forEach(s => {
          const media = mediaMap[s.media_id];
          if (media) {
            titles.push({
              title: media.title,
              poster: media.poster_url,
              subtitle: media.type || 'Media',
              value: media.platform,
              status: 'Completed'
            });
          }
        });
    }
    
    setContributingTitles(titles.slice(0, 50)); // Limit to 50 for performance
    setSelectedAchievement(achievement);
  };



  const filtered = useMemo(() => {
    let result = achievements;
    
    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(a => a.category === filterCategory);
    }
    
    // Sort - FIXED
    return [...result].sort((a, b) => {
      const aProgress = a.levels.find(l => !l.unlocked)?.progress || 100;
      const bProgress = b.levels.find(l => !l.unlocked)?.progress || 100;
      const aUnlocked = a.levels.filter(l => l.unlocked).length;
      const bUnlocked = b.levels.filter(l => l.unlocked).length;
      
      if (sortBy === 'progress') {
        return bProgress - aProgress;
      } else if (sortBy === 'unlocked') {
        return bUnlocked - aUnlocked;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [achievements, filterCategory, sortBy]);

  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/50',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/50',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/50',
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/50',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/50',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/50'
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'time', label: 'Time' },
    { id: 'content', label: 'Content' },
    { id: 'ratings', label: 'Ratings' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'quality', label: 'Quality' },
    { id: 'devices', label: 'Devices' },
    { id: 'genres', label: 'Genres' },
    { id: 'exploration', label: 'Exploration' },
    { id: 'misc', label: 'More' }
  ];

  const overallStats = useMemo(() => {
    const totalAchievements = achievements.length;
    const totalLevels = achievements.reduce((sum, a) => sum + a.levels.length, 0);
    const achievedCount = achievements.filter(a => a.levels.some(l => l.unlocked)).length;
    const unlockedLevels = achievements.reduce((sum, a) => sum + a.levels.filter(l => l.unlocked).length, 0);
    return { totalAchievements, totalLevels, achievedCount, unlockedLevels };
  }, [achievements]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-purple-400" />
          Achievements & Badges
        </h2>
        <p className="text-zinc-400 text-xs">Track your progress and unlock special badges</p>
        
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg p-3">
            <p className="text-xs text-zinc-400">Total Achievements</p>
            <p className="text-2xl font-bold text-white">{overallStats.totalAchievements}</p>
          </div>
          <div className="bg-zinc-900/80 border border-emerald-500/50 rounded-lg p-3">
            <p className="text-xs text-zinc-400">Achievements Started</p>
            <p className="text-2xl font-bold text-emerald-400">{overallStats.achievedCount}</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg p-3">
            <p className="text-xs text-zinc-400">Total Levels</p>
            <p className="text-2xl font-bold text-white">{overallStats.totalLevels}</p>
          </div>
          <div className="bg-zinc-900/80 border border-purple-500/50 rounded-lg p-3">
            <p className="text-xs text-zinc-400">Levels Unlocked</p>
            <p className="text-2xl font-bold text-purple-400">{overallStats.unlockedLevels}</p>
          </div>
        </div>
      </div>

      {/* Category Filter & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between w-full">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 pb-2 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap hover:shadow-xl ${
                filterCategory === cat.id
                  ? 'bg-gradient-to-r from-purple-500 to-emerald-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-amber-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-zinc-900/50 border-amber-500/30 text-white text-xs hover:border-amber-500/50 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-amber-500/50">
              <SelectItem value="progress" className="text-white text-xs">Highest Progress</SelectItem>
              <SelectItem value="unlocked" className="text-white text-xs">Most Unlocked</SelectItem>
              <SelectItem value="name" className="text-white text-xs">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((achievement, idx) => {
          const Icon = achievement.icon;
          const currentLevel = achievement.levels.find(l => !l.unlocked) || achievement.levels[achievement.levels.length - 1];
          const unlockedCount = achievement.levels.filter(l => l.unlocked).length;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card 
                onClick={() => handleAchievementClick(achievement)}
                className="bg-zinc-900/80 border-zinc-800 cursor-pointer hover:scale-105 hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-zinc-900/50">
                        <Icon className={`w-6 h-6 ${
                          achievement.color === 'purple' ? 'text-purple-400' :
                          achievement.color === 'emerald' ? 'text-emerald-400' :
                          achievement.color === 'amber' ? 'text-amber-400' :
                          achievement.color === 'orange' ? 'text-orange-400' :
                          achievement.color === 'indigo' ? 'text-indigo-400' :
                          achievement.color === 'violet' ? 'text-violet-400' :
                          achievement.color === 'pink' ? 'text-pink-400' :
                          achievement.color === 'blue' ? 'text-blue-400' :
                          achievement.color === 'cyan' ? 'text-cyan-400' :
                          achievement.color === 'teal' ? 'text-teal-400' :
                          achievement.color === 'rose' ? 'text-rose-400' :
                          achievement.color === 'yellow' ? 'text-yellow-400' :
                          achievement.color === 'green' ? 'text-green-400' :
                          achievement.color === 'red' ? 'text-red-400' :
                          achievement.color === 'gold' ? 'text-yellow-500' :
                          'text-white'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{achievement.name}</h3>
                        <p className="text-[10px] text-zinc-300">{achievement.desc}</p>
                        <Badge className="bg-zinc-700 text-zinc-300 border-0 text-[10px] mt-1">
                          {unlockedCount} / {achievement.levels.length} Unlocked
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">Next Level</span>
                      <span className="text-white font-semibold">
                        {currentLevel.current} / {currentLevel.target}
                      </span>
                    </div>
                    <Progress 
                      value={currentLevel.progress} 
                      className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-emerald-500" 
                      style={{ backgroundColor: 'rgb(39 39 42)' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        open={!!selectedAchievement}
        onClose={() => {
          setSelectedAchievement(null);
          setContributingTitles([]);
        }}
        achievement={selectedAchievement}
        contributingTitles={contributingTitles}
      />
    </div>
  );
}