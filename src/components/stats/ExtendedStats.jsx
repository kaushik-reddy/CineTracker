import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Film, Tv, Star, Calendar, TrendingUp, Award, Monitor, 
  Zap, Target, Activity, Heart, Globe, DollarSign, Users, 
  Sparkles, Coffee, Moon, Sun, Sunrise, Sunset,
  Trophy, Flame, BarChart3, TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";

export default function ExtendedStats({ completedSchedules, mediaMap, schedules = [], onStatClick }) {
  const stats = useMemo(() => {
    const completed = completedSchedules.filter(s => mediaMap[s.media_id]);
    
    // CRITICAL FIX: Calculate from individual episode runtimes in history
    const totalMinutes = completed.reduce((sum, s) => {
      const media = mediaMap[s.media_id];
      if (!media) return sum;
      
      // Get actual episode runtime for series
      let runtime = media.runtime_minutes;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      
      return sum + runtime;
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.ceil(totalMinutes / (60 * 24));
    const movieCount = completed.filter(s => mediaMap[s.media_id]?.type === 'movie').length;
    const seriesCount = completed.filter(s => mediaMap[s.media_id]?.type === 'series').length;
    
    // Counts by category
    const deviceCounts = {};
    const platformCounts = {};
    const actorCounts = {};
    const genreCounts = {};
    const languageCounts = {};
    const yearCounts = {};
    const ageRatingCounts = {};
    const audioFormatCounts = {};
    const videoFormatCounts = {};
    
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media) {
        deviceCounts[s.device || media.device] = (deviceCounts[s.device || media.device] || 0) + 1;
        platformCounts[media.platform] = (platformCounts[media.platform] || 0) + 1;
        languageCounts[media.language] = (languageCounts[media.language] || 0) + 1;
        if (media.year) yearCounts[media.year] = (yearCounts[media.year] || 0) + 1;
        if (media.age_restriction) ageRatingCounts[media.age_restriction] = (ageRatingCounts[media.age_restriction] || 0) + 1;
        if (s.audio_format) audioFormatCounts[s.audio_format] = (audioFormatCounts[s.audio_format] || 0) + 1;
        if (s.video_format) videoFormatCounts[s.video_format] = (videoFormatCounts[s.video_format] || 0) + 1;
        media.actors?.forEach(actor => {
          actorCounts[actor] = (actorCounts[actor] || 0) + 1;
        });
        media.genre?.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    // Ratings
    const ratedSchedules = completed.filter(s => s.rating);
    const avgScheduleRating = ratedSchedules.length > 0 
      ? ratedSchedules.reduce((sum, s) => sum + s.rating, 0) / ratedSchedules.length 
      : 0;
    const fiveStarCount = ratedSchedules.filter(s => s.rating === 5).length;
    const oneStarCount = ratedSchedules.filter(s => s.rating === 1).length;
    
    // Time-based stats
    const thisWeekCount = completed.filter(s => {
      const date = new Date(s.started_at || s.updated_date);
      return isWithinInterval(date, { start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
    }).length;
    
    const thisMonthCount = completed.filter(s => {
      const date = new Date(s.started_at || s.updated_date);
      return isWithinInterval(date, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
    }).length;
    
    const weekendCount = completed.filter(s => {
      const date = new Date(s.started_at || s.updated_date);
      const day = date.getDay();
      return day === 0 || day === 6;
    }).length;
    
    const weekdayCount = completed.length - weekendCount;
    
    // Time of day stats
    const morningCount = completed.filter(s => {
      const hour = new Date(s.started_at || s.scheduled_date).getHours();
      return hour >= 6 && hour < 12;
    }).length;
    
    const afternoonCount = completed.filter(s => {
      const hour = new Date(s.started_at || s.scheduled_date).getHours();
      return hour >= 12 && hour < 18;
    }).length;
    
    const eveningCount = completed.filter(s => {
      const hour = new Date(s.started_at || s.scheduled_date).getHours();
      return hour >= 18 && hour < 24;
    }).length;
    
    const nightCount = completed.filter(s => {
      const hour = new Date(s.started_at || s.scheduled_date).getHours();
      return hour >= 0 && hour < 6;
    }).length;
    
    // Runtime stats
    const avgWatchTime = completed.length > 0 ? totalMinutes / completed.length : 0;
    const longestTitle = completed.reduce((longest, s) => {
      const media = mediaMap[s.media_id];
      return media && media.runtime_minutes > (longest?.runtime_minutes || 0) ? media : longest;
    }, null);
    const shortestTitle = completed.reduce((shortest, s) => {
      const media = mediaMap[s.media_id];
      return media && (!shortest || media.runtime_minutes < shortest.runtime_minutes) ? media : shortest;
    }, null);
    
    // Watch patterns
    const watchStreak = calculateStreak(completed);
    const busiestDay = Object.entries(
      completed.reduce((acc, s) => {
        const day = format(new Date(s.started_at || s.updated_date), 'EEEE');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];
    
    // Top items
    const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0];
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];
    const topActor = Object.entries(actorCounts).sort((a, b) => b[1] - a[1])[0];
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
    const topLanguage = Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0];
    const topYear = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0];
    const topAudioFormat = Object.entries(audioFormatCounts).sort((a, b) => b[1] - a[1])[0];
    const topVideoFormat = Object.entries(videoFormatCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Diversity stats
    const uniqueActors = Object.keys(actorCounts).length;
    const uniqueGenres = Object.keys(genreCounts).length;
    const uniquePlatforms = Object.keys(platformCounts).length;
    const uniqueLanguages = Object.keys(languageCounts).length;
    
    // Completion stats
    const completionRate = completed.length > 0 ? (completed.length / (completed.length + schedules.filter(s => s.status !== 'completed').length)) * 100 : 0;
    
    return {
      totalMinutes,
      totalHours,
      totalDays,
      movieCount,
      seriesCount,
      totalCount: completed.length,
      avgScheduleRating,
      fiveStarCount,
      oneStarCount,
      thisWeekCount,
      thisMonthCount,
      weekendCount,
      weekdayCount,
      morningCount,
      afternoonCount,
      eveningCount,
      nightCount,
      avgWatchTime,
      longestTitle,
      shortestTitle,
      watchStreak,
      busiestDay,
      topDevice,
      topPlatform,
      topActor,
      topGenre,
      topLanguage,
      topYear,
      topAudioFormat,
      topVideoFormat,
      uniqueActors,
      uniqueGenres,
      uniquePlatforms,
      uniqueLanguages,
      deviceCounts,
      platformCounts,
      genreCounts,
      audioFormatCounts,
      videoFormatCounts,
      completionRate,
      ratedCount: ratedSchedules.length
    };
  }, [completedSchedules, mediaMap, schedules]);

  function calculateStreak(completed) {
    if (completed.length === 0) return 0;
    const sortedDates = completed.map(s => new Date(s.started_at || s.updated_date).toDateString()).sort((a, b) => new Date(b) - new Date(a));
    const uniqueDates = [...new Set(sortedDates)];
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const watchDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor((currentDate - watchDate) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const allStats = [
    { title: "Total Watch Time", value: `${stats.totalHours}h ${stats.totalMinutes % 60}m`, subtext: `${stats.totalDays} days worth`, icon: Clock, color: "from-blue-500 to-blue-600" },
    { title: "Movies Completed", value: stats.movieCount, icon: Film, color: "from-purple-500 to-purple-600" },
    { title: "Series Episodes", value: stats.seriesCount, icon: Tv, color: "from-pink-500 to-pink-600" },
    { title: "Total Watches", value: stats.totalCount, subtext: `${stats.thisMonthCount} this month`, icon: BarChart3, color: "from-emerald-500 to-emerald-600" },
    { title: "Average Rating", value: stats.avgScheduleRating > 0 ? stats.avgScheduleRating.toFixed(1) + ' ⭐' : 'N/A', subtext: `${stats.ratedCount} rated`, icon: Star, color: "from-amber-500 to-amber-600" },
    { title: "Favorite Device", value: stats.topDevice?.[0] || 'N/A', subtext: stats.topDevice ? `${stats.topDevice[1]} watches` : '', icon: Monitor, color: "from-cyan-500 to-cyan-600" },
    { title: "Top Platform", value: stats.topPlatform?.[0] || 'N/A', subtext: stats.topPlatform ? `${stats.topPlatform[1]} watches` : '', icon: Tv, color: "from-red-500 to-red-600" },
    { title: "Most Watched Actor", value: stats.topActor?.[0] || 'N/A', subtext: stats.topActor ? `${stats.topActor[1]} titles` : '', icon: Users, color: "from-violet-500 to-violet-600" },
    { title: "Top Genre", value: stats.topGenre?.[0] || 'N/A', subtext: stats.topGenre ? `${stats.topGenre[1]} titles` : '', icon: TrendingUp, color: "from-indigo-500 to-indigo-600" },
    { title: "Top Language", value: stats.topLanguage?.[0] || 'N/A', subtext: stats.topLanguage ? `${stats.topLanguage[1]} watches` : '', icon: Globe, color: "from-green-500 to-green-600" },
    { title: "Top Year", value: stats.topYear?.[0] || 'N/A', subtext: stats.topYear ? `${stats.topYear[1]} titles` : '', icon: Calendar, color: "from-orange-500 to-orange-600" },
    { title: "Top Audio Format", value: stats.topAudioFormat?.[0] || 'N/A', subtext: stats.topAudioFormat ? `${stats.topAudioFormat[1]} watches` : '', icon: Activity, color: "from-purple-500 to-purple-600" },
    { title: "Top Video Format", value: stats.topVideoFormat?.[0] || 'N/A', subtext: stats.topVideoFormat ? `${stats.topVideoFormat[1]} watches` : '', icon: Activity, color: "from-blue-500 to-blue-600" },
    { title: "Watch Streak", value: `${stats.watchStreak} days`, subtext: stats.watchStreak > 0 ? '🔥 Keep it up!' : 'Start today!', icon: Flame, color: "from-red-500 to-orange-600" },
    { title: "Avg Watch Time", value: `${Math.floor(stats.avgWatchTime)} min`, subtext: "per title", icon: Activity, color: "from-teal-500 to-teal-600" },
    { title: "Longest Title", value: stats.longestTitle?.title || 'N/A', subtext: stats.longestTitle ? `${stats.longestTitle.runtime_minutes} min` : '', icon: Target, color: "from-rose-500 to-rose-600" },
    { title: "Shortest Title", value: stats.shortestTitle?.title || 'N/A', subtext: stats.shortestTitle ? `${stats.shortestTitle.runtime_minutes} min` : '', icon: Target, color: "from-lime-500 to-lime-600" },
    { title: "This Week", value: stats.thisWeekCount, subtext: "completed", icon: Calendar, color: "from-blue-500 to-indigo-600" },
    { title: "This Month", value: stats.thisMonthCount, subtext: "completed", icon: Calendar, color: "from-purple-500 to-pink-600" },
    { title: "Weekend Watches", value: stats.weekendCount, subtext: "Sat & Sun", icon: Coffee, color: "from-fuchsia-500 to-fuchsia-600" },
    { title: "Weekday Watches", value: stats.weekdayCount, subtext: "Mon-Fri", icon: Activity, color: "from-slate-500 to-slate-600" },
    { title: "Morning Watches", value: stats.morningCount, subtext: "6am-12pm", icon: Sunrise, color: "from-yellow-500 to-yellow-600" },
    { title: "Afternoon Watches", value: stats.afternoonCount, subtext: "12pm-6pm", icon: Sun, color: "from-orange-500 to-orange-600" },
    { title: "Evening Watches", value: stats.eveningCount, subtext: "6pm-12am", icon: Sunset, color: "from-purple-500 to-purple-600" },
    { title: "Night Watches", value: stats.nightCount, subtext: "12am-6am", icon: Moon, color: "from-indigo-500 to-indigo-600" },
    { title: "5-Star Reviews", value: stats.fiveStarCount, subtext: "Perfect ratings", icon: Trophy, color: "from-amber-500 to-yellow-600" },
    { title: "1-Star Reviews", value: stats.oneStarCount, subtext: "Lowest ratings", icon: TrendingDown, color: "from-gray-500 to-gray-600" },
    { title: "Unique Actors", value: stats.uniqueActors, subtext: "different cast", icon: Users, color: "from-pink-500 to-rose-600" },
    { title: "Genre Diversity", value: stats.uniqueGenres, subtext: "genres watched", icon: Sparkles, color: "from-violet-500 to-purple-600" },
    { title: "Platform Diversity", value: stats.uniquePlatforms, subtext: "services used", icon: Tv, color: "from-cyan-500 to-blue-600" },
    { title: "Language Diversity", value: stats.uniqueLanguages, subtext: "languages", icon: Globe, color: "from-green-500 to-emerald-600" },
    { title: "Busiest Day", value: stats.busiestDay?.[0] || 'N/A', subtext: stats.busiestDay ? `${stats.busiestDay[1]} watches` : '', icon: Calendar, color: "from-red-500 to-pink-600" },
    { title: "Completion Rate", value: `${Math.round(stats.completionRate)}%`, subtext: "of scheduled", icon: Target, color: "from-emerald-500 to-green-600" },
    { title: "Total Minutes", value: stats.totalMinutes.toLocaleString(), subtext: "of content", icon: Clock, color: "from-blue-500 to-cyan-600" },
    { title: "Avg per Day", value: stats.totalCount > 0 ? (stats.totalMinutes / stats.watchStreak || 1).toFixed(0) + ' min' : 'N/A', subtext: "watch time", icon: Activity, color: "from-indigo-500 to-purple-600" },
    { title: "Binge Sessions", value: stats.totalCount > 0 ? (() => {
      const binges = new Set();
      completedSchedules.forEach(s => {
        if (!mediaMap[s.media_id]) return;
        const day = new Date(s.started_at || s.updated_date).toDateString();
        const sameDay = completedSchedules.filter(s2 => {
          if (!mediaMap[s2.media_id]) return false;
          return new Date(s2.started_at || s2.updated_date).toDateString() === day;
        });
        if (sameDay.length >= 3) binges.add(day);
      });
      return binges.size;
    })() : 0, subtext: "3+ in a day", icon: Flame, color: "from-orange-500 to-red-600" },
    { title: "Most Watched Genre", value: stats.topGenre?.[0] || 'N/A', subtext: stats.topGenre ? `${stats.topGenre[1]} titles` : '', icon: Heart, color: "from-pink-500 to-rose-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {allStats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
        >
          <Card 
            onClick={() => onStatClick?.(stat)}
            className="bg-zinc-900/80 border-zinc-800 hover:border-purple-500/50 transition-all overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-400 mb-1.5">{stat.title}</p>
                  <p className="text-xl font-bold text-white truncate">{stat.value}</p>
                  {stat.subtext && (
                    <p className="text-xs text-zinc-400 mt-1">{stat.subtext}</p>
                  )}
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}