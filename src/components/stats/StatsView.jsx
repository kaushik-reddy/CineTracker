import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Film, Tv, Star, Monitor, Activity, Zap, Target, TrendingUp, Calendar, Play, BarChart2, PieChart, ArrowUpDown, X, Sunrise, Sunset, User, Users, Smartphone, Flame, Timer, Repeat, TrendingDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ComprehensiveStats from "./ComprehensiveStats";
import AllCharts from "./AllCharts";
import HistoryCard from "../history/HistoryCard";
import StatDetailModal from "./StatDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function StatsView({ completedSchedules, mediaMap, mediaList, onRateChange, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDevice, setFilterDevice] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [statDetail, setStatDetail] = useState(null);
  const [showFilterResults, setShowFilterResults] = useState(false);

  // Check if any filter is active
  const hasActiveFilters = searchQuery || filterDevice !== 'all' || filterPlatform !== 'all';

  // Open overlay when filters are applied
  useEffect(() => {
    if (hasActiveFilters && filteredCompleted.length > 0) {
      setShowFilterResults(true);
    } else {
      setShowFilterResults(false);
    }
  }, [searchQuery, filterDevice, filterPlatform]);

  const stats = useMemo(() => {
    const completed = completedSchedules.filter((s) => mediaMap[s.media_id]);

    const totalWatchedMinutes = completed.reduce((sum, s) => {
      const media = mediaMap[s.media_id];
      if (!media) return sum;
      let runtime = media.runtime_minutes;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      return sum + runtime;
    }, 0);

    const movieCount = completed.filter((s) => mediaMap[s.media_id]?.type === 'movie').length;
    const seriesCount = completed.filter((s) => mediaMap[s.media_id]?.type === 'series').length;

    const deviceCounts = {};
    const platformCounts = {};
    const actorCounts = {};
    const audioFormatCounts = {};
    const videoFormatCounts = {};

    completed.forEach((s) => {
      const media = mediaMap[s.media_id];
      if (media) {
        deviceCounts[s.device || media.device] = (deviceCounts[s.device || media.device] || 0) + 1;
        platformCounts[media.platform] = (platformCounts[media.platform] || 0) + 1;

        if (s.audio_format) {
          audioFormatCounts[s.audio_format] = (audioFormatCounts[s.audio_format] || 0) + 1;
        }
        if (s.video_format) {
          videoFormatCounts[s.video_format] = (videoFormatCounts[s.video_format] || 0) + 1;
        }

        media.actors?.forEach((actor) => {
          actorCounts[actor] = (actorCounts[actor] || 0) + 1;
        });
      }
    });

    const avgRating = completed.reduce((sum, s) => {
      const media = mediaMap[s.media_id];
      return sum + (media?.rating || 0);
    }, 0) / (completed.length || 1);

    const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0];
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];
    const topActor = Object.entries(actorCounts).sort((a, b) => b[1] - a[1])[0];
    const topAudioFormat = Object.entries(audioFormatCounts).sort((a, b) => b[1] - a[1])[0];
    const topVideoFormat = Object.entries(videoFormatCounts).sort((a, b) => b[1] - a[1])[0];

    const avgWatchTime = completed.length > 0 ? totalWatchedMinutes / completed.length : 0;
    const longestMovie = completed.reduce((longest, s) => {
      const media = mediaMap[s.media_id];
      return media && media.runtime_minutes > (longest?.runtime_minutes || 0) ? media : longest;
    }, null);

    const shortestMovie = completed.reduce((shortest, s) => {
      const media = mediaMap[s.media_id];
      return media && (!shortest || media.runtime_minutes < shortest.runtime_minutes) ? media : shortest;
    }, null);

    const ratedCount = completed.filter((s) => mediaMap[s.media_id]?.rating).length;

    const totalDays = completed.length > 0 ? Math.ceil(totalWatchedMinutes / (60 * 24)) : 0;
    const genreCounts = {};
    completed.forEach((s) => {
      const media = mediaMap[s.media_id];
      media?.genre?.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];

    // Calculate real watch streak - consecutive days with completions
    let watchStreak = 0;
    if (completed.length > 0) {
      const sortedDates = completed.map((s) => new Date(s.updated_date).toDateString()).sort((a, b) => new Date(b) - new Date(a));
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
      watchStreak = streak;
    }
    const thisMonthCount = completed.filter((s) => {
      const date = new Date(s.updated_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const weekendCount = completed.filter((s) => {
      const date = new Date(s.updated_date);
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;

    // NEW STATS - Added for deeper insights
    
    // 1. Most Active Day of Week
    const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    completed.forEach((s) => {
      const day = new Date(s.updated_date).getDay();
      dayCounts[day]++;
    });
    const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const mostActiveDayName = mostActiveDay ? dayNames[mostActiveDay[0]] : 'N/A';
    const mostActiveDayCount = mostActiveDay ? mostActiveDay[1] : 0;

    // 2. Longest Single Watch Session
    const longestSession = completed.reduce((longest, s) => {
      const media = mediaMap[s.media_id];
      if (!media) return longest;
      let runtime = media.runtime_minutes;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      return runtime > longest ? runtime : longest;
    }, 0);

    // 3. Platform Diversity (unique platforms used)
    const uniquePlatforms = new Set(completed.map(s => mediaMap[s.media_id]?.platform).filter(Boolean));
    const platformDiversity = uniquePlatforms.size;

    // 4. Time of Day Distribution
    const morningWatches = completed.filter((s) => {
      const hour = new Date(s.updated_date).getHours();
      return hour >= 6 && hour < 12;
    }).length;

    const eveningWatches = completed.filter((s) => {
      const hour = new Date(s.updated_date).getHours();
      return hour >= 18 && hour < 24;
    }).length;

    // 5. Solo vs Group Watching
    const soloWatches = completed.filter(s => !s.viewers || s.viewers.length === 0).length;
    const groupWatches = completed.filter(s => s.viewers && s.viewers.length > 0).length;

    // 6. Device Variety
    const uniqueDevices = new Set(completed.map(s => s.device || mediaMap[s.media_id]?.device).filter(Boolean));
    const deviceVariety = uniqueDevices.size;

    // 7. Binge Sessions (multiple watches same day)
    const dateCounts = {};
    completed.forEach((s) => {
      const date = new Date(s.updated_date).toDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const bingeDays = Object.values(dateCounts).filter(count => count >= 3).length;
    const maxBingeDay = Math.max(...Object.values(dateCounts), 0);

    // 8. Average Days Between Watches
    let avgDaysBetween = 0;
    if (completed.length > 1) {
      const sortedDates = completed.map(s => new Date(s.updated_date)).sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const daysDiff = Math.floor((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24));
        gaps.push(daysDiff);
      }
      avgDaysBetween = gaps.length > 0 ? Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length) : 0;
    }

    // 9. Most Rewatched Title
    const titleWatchCounts = {};
    completed.forEach((s) => {
      const media = mediaMap[s.media_id];
      if (media && media.type === 'movie') {
        titleWatchCounts[media.id] = (titleWatchCounts[media.id] || 0) + 1;
      }
    });
    const mostRewatchedEntry = Object.entries(titleWatchCounts).sort((a, b) => b[1] - a[1])[0];
    const mostRewatchedTitle = mostRewatchedEntry && mostRewatchedEntry[1] > 1 
      ? mediaMap[mostRewatchedEntry[0]]?.title 
      : 'None';
    const mostRewatchedCount = mostRewatchedEntry && mostRewatchedEntry[1] > 1 ? mostRewatchedEntry[1] : 0;

    // 10. Watch Frequency (watches per week)
    let watchesPerWeek = 0;
    if (completed.length > 0) {
      const firstWatch = new Date(Math.min(...completed.map(s => new Date(s.updated_date))));
      const lastWatch = new Date(Math.max(...completed.map(s => new Date(s.updated_date))));
      const totalWeeks = Math.max(1, Math.floor((lastWatch - firstWatch) / (1000 * 60 * 60 * 24 * 7)));
      watchesPerWeek = (completed.length / totalWeeks).toFixed(1);
    }

    return {
      totalWatchedMinutes,
      totalWatchedHours: Math.floor(totalWatchedMinutes / 60),
      totalDays,
      movieCount,
      seriesCount,
      totalCount: movieCount + seriesCount,
      avgRating,
      topDevice,
      topPlatform,
      topActor,
      topGenre,
      topAudioFormat,
      topVideoFormat,
      deviceCounts,
      platformCounts,
      audioFormatCounts,
      videoFormatCounts,
      avgWatchTime: Math.floor(avgWatchTime),
      longestMovie,
      shortestMovie,
      ratedCount,
      watchStreak,
      thisMonthCount,
      weekendCount,
      // New stats
      mostActiveDayName,
      mostActiveDayCount,
      longestSession,
      platformDiversity,
      morningWatches,
      eveningWatches,
      soloWatches,
      groupWatches,
      deviceVariety,
      bingeDays,
      maxBingeDay,
      avgDaysBetween,
      mostRewatchedTitle,
      mostRewatchedCount,
      watchesPerWeek
    };
  }, [completedSchedules, mediaMap]);

  // Filter completed items
  const filteredCompleted = useMemo(() => {
    let result = completedSchedules.filter((s) => {
      const media = mediaMap[s.media_id];
      if (!media) return false;

      const matchesSearch =
      media.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      media.actors?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDevice = filterDevice === 'all' || (s.device || media.device) === filterDevice;
      const matchesPlatform = filterPlatform === 'all' || media.platform === filterPlatform;

      return matchesSearch && matchesDevice && matchesPlatform;
    });
    
    // Sort
    result = [...result].sort((a, b) => {
      const mediaA = mediaMap[a.media_id];
      const mediaB = mediaMap[b.media_id];
      
      switch (sortBy) {
        case 'recent':
          return new Date(b.updated_date) - new Date(a.updated_date);
        case 'oldest':
          return new Date(a.updated_date) - new Date(b.updated_date);
        case 'title':
          return mediaA?.title?.localeCompare(mediaB?.title || '') || 0;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [completedSchedules, mediaMap, searchQuery, filterDevice, filterPlatform, sortBy]);

  const statCards = [
  { title: "Total Watched Time", value: `${stats.totalWatchedHours}h ${stats.totalWatchedMinutes % 60}m`, subtext: `${stats.totalDays} days equivalent`, icon: Clock, color: "from-blue-500 to-blue-600" },
  { title: "Movies Watched", value: stats.movieCount, icon: Film, color: "from-purple-500 to-purple-600" },
  { title: "Series Episodes", value: stats.seriesCount, icon: Tv, color: "from-pink-500 to-pink-600" },
  { title: "Total Watches", value: stats.totalCount, subtext: `${stats.thisMonthCount} this month`, icon: Play, color: "from-emerald-500 to-emerald-600" },
  { title: "Average Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A', subtext: `${stats.ratedCount} rated`, icon: Star, color: "from-amber-500 to-amber-600" },
  { title: "Favorite Device", value: stats.topDevice?.[0] || 'N/A', subtext: stats.topDevice ? `${stats.topDevice[1]} watches` : '', icon: Monitor, color: "from-cyan-500 to-cyan-600" },
  { title: "Avg Watch Time", value: `${stats.avgWatchTime} min`, subtext: "per title", icon: Activity, color: "from-indigo-500 to-indigo-600" },
  { title: "Watch Streak", value: `${stats.watchStreak} days`, subtext: watchStreakText(stats.watchStreak), icon: Zap, color: "from-orange-500 to-orange-600" },
  { title: "Top Audio", value: stats.topAudioFormat?.[0] || 'N/A', subtext: stats.topAudioFormat ? `${stats.topAudioFormat[1]} watches` : '', icon: Activity, color: "from-purple-500 to-purple-600" },
  { title: "Top Video", value: stats.topVideoFormat?.[0] || 'N/A', subtext: stats.topVideoFormat ? `${stats.topVideoFormat[1]} watches` : '', icon: Activity, color: "from-indigo-500 to-indigo-600" },
  { title: "Longest Title", value: stats.longestMovie?.title || 'N/A', subtext: stats.longestMovie ? `${stats.longestMovie.runtime_minutes} min` : '', icon: Target, color: "from-rose-500 to-rose-600" },
  { title: "Top Genre", value: stats.topGenre?.[0] || 'N/A', subtext: stats.topGenre ? `${stats.topGenre[1]} titles` : '', icon: TrendingUp, color: "from-violet-500 to-violet-600" },
  { title: "Shortest Title", value: stats.shortestMovie?.title || 'N/A', subtext: stats.shortestMovie ? `${stats.shortestMovie.runtime_minutes} min` : '', icon: Target, color: "from-teal-500 to-teal-600" },
  { title: "Weekend Watches", value: stats.weekendCount || 0, subtext: "Sat & Sun", icon: Calendar, color: "from-fuchsia-500 to-fuchsia-600" },
  // NEW STAT TILES
  { title: "Most Active Day", value: stats.mostActiveDayName, subtext: `${stats.mostActiveDayCount} watches`, icon: Calendar, color: "from-sky-500 to-sky-600", desc: "Day of the week with most completed watches" },
  { title: "Longest Session", value: `${stats.longestSession} min`, subtext: "Single watch runtime", icon: Clock, color: "from-red-500 to-red-600", desc: "Longest continuous watch session by runtime" },
  { title: "Platform Variety", value: stats.platformDiversity, subtext: "platforms used", icon: TrendingUp, color: "from-lime-500 to-lime-600", desc: "Number of unique streaming platforms explored" },
  { title: "Morning Views", value: stats.morningWatches, subtext: "6am - 12pm", icon: Sunrise, color: "from-yellow-500 to-yellow-600", desc: "Watches completed during morning hours" },
  { title: "Evening Views", value: stats.eveningWatches, subtext: "6pm - 12am", icon: Sunset, color: "from-orange-500 to-orange-600", desc: "Watches completed during evening hours" },
  { title: "Solo Watches", value: stats.soloWatches, subtext: "watched alone", icon: User, color: "from-slate-500 to-slate-600", desc: "Number of solo viewing sessions without companions" },
  { title: "Group Watches", value: stats.groupWatches, subtext: "with viewers", icon: Users, color: "from-green-500 to-green-600", desc: "Watches with added viewers or companions" },
  { title: "Device Switching", value: stats.deviceVariety, subtext: "devices used", icon: Smartphone, color: "from-blue-500 to-blue-600", desc: "Number of different devices utilized for watching" },
  { title: "Binge Days", value: stats.bingeDays, subtext: `max ${stats.maxBingeDay} in a day`, icon: Flame, color: "from-red-500 to-red-600", desc: "Days with 3+ watches (binge sessions)" },
  { title: "Watch Frequency", value: `${stats.watchesPerWeek}/week`, subtext: "average pace", icon: Timer, color: "from-cyan-500 to-cyan-600", desc: "Average watches completed per week" },
  { title: "Most Rewatched", value: stats.mostRewatchedTitle, subtext: stats.mostRewatchedCount > 0 ? `${stats.mostRewatchedCount}x` : 'None yet', icon: Repeat, color: "from-pink-500 to-pink-600", desc: "Movie watched multiple times" },
  { title: "Days Between", value: `${stats.avgDaysBetween} days`, subtext: "avg gap", icon: TrendingDown, color: "from-purple-500 to-purple-600", desc: "Average days between consecutive watches" }];


  function watchStreakText(days) {
    if (days === 0) return "Start watching!";
    if (days === 1) return "Good start!";
    if (days < 7) return "Keep going!";
    return "Amazing!";
  }

  return (
    <div className="space-y-4">
      {/* Compact Filters */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Search by title or actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:flex-1 bg-zinc-800/50 border-zinc-700 text-white text-xs h-8" />

          <Select value={filterDevice} onValueChange={setFilterDevice}>
            <SelectTrigger className="md:w-32 bg-zinc-800/50 border-zinc-700 text-white text-[10px] h-8">
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-white text-xs">All Devices</SelectItem>
              {Object.keys(stats.deviceCounts).filter(d => d && d.trim()).map((device) =>
              <SelectItem key={device} value={device} className="text-white text-xs">
                  {device} ({stats.deviceCounts[device]})
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="md:w-32 bg-zinc-800/50 border-zinc-700 text-white text-[10px] h-8">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-white text-xs">All Platforms</SelectItem>
              {Object.keys(stats.platformCounts).filter(p => p && p.trim()).map((platform) =>
              <SelectItem key={platform} value={platform} className="text-white text-xs">
                  {platform} ({stats.platformCounts[platform]})
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="md:w-28 bg-zinc-800/50 border-zinc-700 text-white text-[10px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="recent" className="text-white text-xs">Recent</SelectItem>
              <SelectItem value="oldest" className="text-white text-xs">Oldest</SelectItem>
              <SelectItem value="title" className="text-white text-xs">A-Z</SelectItem>
              <SelectItem value="rating" className="text-white text-xs">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">
          {searchQuery || filterDevice !== 'all' || filterPlatform !== 'all' 
            ? `Found ${filteredCompleted.length} of ${stats.totalCount}` 
            : `${stats.totalCount} total`} watched titles
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-800/50 border border-zinc-700 mb-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="charts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300">
            <BarChart2 className="w-4 h-4 mr-2" />
            Charts & Graphs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key="overview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Statistics Overview</h3>
                <p className="text-sm text-zinc-400">Click any stat to see detailed breakdown</p>
              </motion.div>
              <ComprehensiveStats 
            completedSchedules={completedSchedules} 
            mediaMap={mediaMap}
            mediaList={mediaList || []}
            onStatClick={(stat) => {
              setStatDetail({ 
                title: stat.title, 
                subtitle: stat.desc || stat.subtext,
                data: stat.data || []
              });
            }}
              />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="charts" className="mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key="charts"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <AllCharts completedSchedules={completedSchedules} mediaMap={mediaMap} />
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        </Tabs>

        {statDetail && (
        <StatDetailModal
          open={!!statDetail}
          onClose={() => setStatDetail(null)}
          title={statDetail.title}
          subtitle={statDetail.desc || statDetail.subtext}
          data={statDetail.data}
          icon={statDetail.icon}
          value={statDetail.value}
          color={statDetail.color}
          trendData={statDetail.trendData || []}
          insight={statDetail.insight}
        />
        )}

        {/* Filter Results Overlay - Bottom Sheet Style */}
        <AnimatePresence>
          {showFilterResults && hasActiveFilters && filteredCompleted.length > 0 && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilterResults(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />

              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 bg-zinc-900 border-t-2 border-purple-500/50 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Filtered Results
                    </h3>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {filteredCompleted.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilterResults(false)}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 overscroll-contain">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pb-4">
                    {filteredCompleted.map(schedule => {
                      const media = mediaMap[schedule.media_id];
                      if (!media) return null;
                      return (
                        <motion.div
                          key={schedule.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <HistoryCard
                            media={media}
                            schedule={schedule}
                            onDelete={onDelete || (() => {})}
                            onRateChange={onRateChange || (() => {})}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>


    </div>);

}