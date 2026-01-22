import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, Film, Tv, Star, Monitor, Activity, Zap, Target, TrendingUp, 
  Calendar, Play, Users, Globe, Award, Flame, Coffee, Moon, Sun, 
  Smartphone, Laptop, Tablet, Music, Video, Heart, ThumbsUp, Eye,
  TrendingDown, Percent, Hash, DollarSign, Layers, Grid, List,
  BarChart2, PieChart, Repeat, FastForward, Rewind, Volume2,
  Headphones, Speaker, Wifi, Download, Upload, Share2, Bookmark,
  Filter, Search, Edit, Trash, Settings, Book, Shield, Sunrise, Sunset, User, Timer
} from "lucide-react";
import { motion } from "framer-motion";

export default function ComprehensiveStats({ completedSchedules, mediaMap, mediaList, onStatClick }) {
  const allStats = useMemo(() => {
    const completed = completedSchedules.filter(s => mediaMap[s.media_id]);
    
    // Time-based calculations
    const totalMinutes = completed.reduce((sum, s) => {
      const media = mediaMap[s.media_id];
      if (!media) return sum;
      let runtime = media.runtime_minutes;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      return sum + runtime;
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    
    // Content counts
    const movieCount = completed.filter(s => mediaMap[s.media_id]?.type === 'movie').length;
    const seriesEpisodes = completed.filter(s => mediaMap[s.media_id]?.type === 'series').length;
    const uniqueSeries = new Set(completed.filter(s => mediaMap[s.media_id]?.type === 'series').map(s => s.media_id)).size;
    const bookSessions = completed.filter(s => mediaMap[s.media_id]?.type === 'book').length;
    const uniqueBooks = new Set(completed.filter(s => mediaMap[s.media_id]?.type === 'book').map(s => s.media_id)).size;
    
    // Ratings
    const ratedItems = completed.filter(s => s.rating || mediaMap[s.media_id]?.rating);
    const avgRating = ratedItems.length > 0 ? 
      ratedItems.reduce((sum, s) => sum + (s.rating || mediaMap[s.media_id]?.rating || 0), 0) / ratedItems.length : 0;
    const fiveStarCount = ratedItems.filter(s => (s.rating || mediaMap[s.media_id]?.rating) === 5).length;
    const fourPlusCount = ratedItems.filter(s => (s.rating || mediaMap[s.media_id]?.rating) >= 4).length;
    
    // Devices & Platforms
    const deviceCounts = {};
    const platformCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      const device = s.device || media?.device;
      if (device) deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      if (media?.platform) platformCounts[media.platform] = (platformCounts[media.platform] || 0) + 1;
    });
    const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0];
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Audio & Video formats
    const audioFormatCounts = {};
    const videoFormatCounts = {};
    completed.forEach(s => {
      if (s.audio_format) audioFormatCounts[s.audio_format] = (audioFormatCounts[s.audio_format] || 0) + 1;
      if (s.video_format) videoFormatCounts[s.video_format] = (videoFormatCounts[s.video_format] || 0) + 1;
    });
    const topAudio = Object.entries(audioFormatCounts).sort((a, b) => b[1] - a[1])[0];
    const topVideo = Object.entries(videoFormatCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Genres
    const genreCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      media?.genre?.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
    const genreDiversity = Object.keys(genreCounts).length;
    
    // Languages
    const languageCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.language) languageCounts[media.language] = (languageCounts[media.language] || 0) + 1;
    });
    const topLanguage = Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0];
    const languageDiversity = Object.keys(languageCounts).length;
    
    // Actors
    const actorCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      media?.actors?.forEach(actor => {
        actorCounts[actor] = (actorCounts[actor] || 0) + 1;
      });
    });
    const topActor = Object.entries(actorCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Time patterns
    const hourCounts = Array(24).fill(0);
    const dayCounts = Array(7).fill(0);
    const monthCounts = Array(12).fill(0);
    completed.forEach(s => {
      const date = new Date(s.rating_submitted_at || s.updated_date);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
      monthCounts[date.getMonth()]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayCounts.indexOf(Math.max(...dayCounts))];
    const peakMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthCounts.indexOf(Math.max(...monthCounts))];
    
    const morningWatches = hourCounts.slice(6, 12).reduce((a, b) => a + b, 0);
    const afternoonWatches = hourCounts.slice(12, 18).reduce((a, b) => a + b, 0);
    const eveningWatches = hourCounts.slice(18, 24).reduce((a, b) => a + b, 0);
    const nightWatches = [...hourCounts.slice(0, 6), ...hourCounts.slice(0, 0)].reduce((a, b) => a + b, 0);
    
    const weekdayCount = completed.filter(s => {
      const day = new Date(s.rating_submitted_at || s.updated_date).getDay();
      return day >= 1 && day <= 5;
    }).length;
    const weekendCount = completed.length - weekdayCount;
    
    // Years
    const yearCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.year) yearCounts[media.year] = (yearCounts[media.year] || 0) + 1;
    });
    const topYear = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Current year and month stats
    const now = new Date();
    const thisYearCount = completed.filter(s => new Date(s.rating_submitted_at || s.updated_date).getFullYear() === now.getFullYear()).length;
    const thisMonthCount = completed.filter(s => {
      const d = new Date(s.rating_submitted_at || s.updated_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const thisWeekCount = completed.filter(s => {
      const d = new Date(s.rating_submitted_at || s.updated_date);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }).length;
    const todayCount = completed.filter(s => {
      const d = new Date(s.rating_submitted_at || s.updated_date);
      return d.toDateString() === now.toDateString();
    }).length;
    
    // Watch streak
    let watchStreak = 0;
    if (completed.length > 0) {
      const sortedDates = completed.map(s => new Date(s.rating_submitted_at || s.updated_date).toDateString()).sort((a, b) => new Date(b) - new Date(a));
      const uniqueDates = [...new Set(sortedDates)];
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < uniqueDates.length; i++) {
        const watchDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((currentDate - watchDate) / (1000 * 60 * 60 * 24));
        if (diffDays === watchStreak) watchStreak++;
        else break;
      }
    }
    
    // Averages
    const avgWatchTime = completed.length > 0 ? totalMinutes / completed.length : 0;
    const avgPerDay = completed.length > 0 ? completed.length / ((Date.now() - new Date(completed[completed.length - 1].rating_submitted_at || completed[completed.length - 1].updated_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const avgPerWeek = avgPerDay * 7;
    const avgPerMonth = avgPerDay * 30;
    
    // Content characteristics
    const longestRuntime = Math.max(...completed.map(s => {
      const media = mediaMap[s.media_id];
      if (!media || media.type === 'book') return 0;
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      return runtime;
    }), 0);
    const shortestRuntime = Math.min(...completed.filter(s => {
      const media = mediaMap[s.media_id];
      return media && media.type !== 'book' && media.runtime_minutes;
    }).map(s => {
      const media = mediaMap[s.media_id];
      let runtime = media.runtime_minutes || 999;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      return runtime;
    }), 999);
    
    // Premium quality counts
    const premiumAudio = ['Dolby Atmos', 'DTS:X', 'IMAX Enhanced Audio', 'Spatial Audio'];
    const premiumVideo = ['4K UHD', '8K', 'Dolby Vision', 'HDR10+', 'IMAX', 'IMAX Enhanced'];
    const premiumAudioCount = completed.filter(s => s.audio_format && premiumAudio.includes(s.audio_format)).length;
    const premiumVideoCount = completed.filter(s => s.video_format && premiumVideo.includes(s.video_format)).length;
    
    // Completion rate for series
    const seriesWithAllEps = [...new Set(completed.filter(s => mediaMap[s.media_id]?.type === 'series').map(s => s.media_id))].filter(id => {
      const media = mediaMap[id];
      const totalEps = media?.episodes_per_season?.reduce((a, b) => a + b, 0) || 0;
      const completedEps = completed.filter(s => s.media_id === id).length;
      return completedEps >= totalEps;
    }).length;
    
    const completionRate = uniqueSeries > 0 ? (seriesWithAllEps / uniqueSeries) * 100 : 0;
    
    // Age ratings
    const ageRatingCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.age_restriction) ageRatingCounts[media.age_restriction] = (ageRatingCounts[media.age_restriction] || 0) + 1;
    });
    const topAgeRating = Object.entries(ageRatingCounts).sort((a, b) => b[1] - a[1])[0];

    // NEW STATS - Added for deeper insights
    
    // Solo vs Group Watching
    const soloWatches = completed.filter(s => !s.viewers || s.viewers.length === 0).length;
    const groupWatches = completed.filter(s => s.viewers && s.viewers.length > 0).length;

    // Device Variety (unique devices)
    const uniqueDevices = new Set(completed.map(s => s.device || mediaMap[s.media_id]?.device).filter(Boolean));

    // Binge Sessions
    const dateCounts = {};
    completed.forEach((s) => {
      const date = new Date(s.rating_submitted_at || s.updated_date).toDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const bingeDays = Object.values(dateCounts).filter(count => count >= 3).length;
    const maxBingeDay = Math.max(...Object.values(dateCounts), 0);

    // Average Days Between Watches
    let avgDaysBetween = 0;
    if (completed.length > 1) {
      const sortedDates = completed.map(s => new Date(s.rating_submitted_at || s.updated_date)).sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const daysDiff = Math.floor((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24));
        gaps.push(daysDiff);
      }
      avgDaysBetween = gaps.length > 0 ? Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length) : 0;
    }

    // Most Rewatched Title
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

    // Platform Diversity
    const uniquePlatforms = new Set(completed.map(s => mediaMap[s.media_id]?.platform).filter(Boolean));

    return [
      // Time Stats (1-10)
      { id: 1, title: "Total Watch Time", value: `${totalHours}h`, subtext: `${totalMinutes % 60}m`, icon: Clock, color: "from-blue-500 to-blue-600", category: "time" },
      { id: 2, title: "Watch Days", value: totalDays, subtext: "equivalent days", icon: Calendar, color: "from-emerald-500 to-emerald-600", category: "time" },
      { id: 3, title: "Average Per Title", value: `${Math.floor(avgWatchTime)}m`, subtext: "per watch", icon: Activity, color: "from-cyan-500 to-cyan-600", category: "time" },
      { id: 4, title: "Watch Streak", value: `${watchStreak}`, subtext: "consecutive days", icon: Flame, color: "from-red-500 to-red-600", category: "time" },
      { id: 5, title: "Peak Hour", value: `${peakHour}:00`, subtext: "most active time", icon: Clock, color: "from-indigo-500 to-indigo-600", category: "time" },
      { id: 6, title: "Peak Day", value: peakDay, subtext: "busiest day", icon: Calendar, color: "from-violet-500 to-violet-600", category: "time" },
      { id: 7, title: "Peak Month", value: peakMonth, subtext: "most watches", icon: TrendingUp, color: "from-pink-500 to-pink-600", category: "time" },
      { id: 8, title: "Morning Watches", value: morningWatches, subtext: "6am - 12pm", icon: Sun, color: "from-yellow-400 to-yellow-500", category: "time" },
      { id: 9, title: "Evening Watches", value: eveningWatches, subtext: "6pm - 12am", icon: Moon, color: "from-purple-500 to-purple-600", category: "time" },
      { id: 10, title: "Weekend vs Weekday", value: weekendCount, subtext: `vs ${weekdayCount} weekday`, icon: Coffee, color: "from-rose-500 to-rose-600", category: "time" },
      
      // Content Stats (11-20)
      { id: 11, title: "Movies Watched", value: movieCount, subtext: "films", icon: Film, color: "from-purple-500 to-purple-600", category: "content" },
      { id: 12, title: "Series Episodes", value: seriesEpisodes, subtext: `${uniqueSeries} shows`, icon: Tv, color: "from-pink-500 to-pink-600", category: "content" },
      { id: 13, title: "Books Read", value: uniqueBooks, subtext: `${bookSessions} sessions`, icon: Book, color: "from-orange-500 to-orange-600", category: "content" },
      { id: 14, title: "Total Watches", value: completed.length, subtext: "all content", icon: Play, color: "from-amber-500 to-amber-600", category: "content" },
      { id: 15, title: "This Year", value: thisYearCount, subtext: "2024", icon: Calendar, color: "from-teal-500 to-teal-600", category: "content" },
      { id: 16, title: "This Month", value: thisMonthCount, subtext: "current month", icon: TrendingUp, color: "from-indigo-500 to-indigo-600", category: "content" },
      { id: 17, title: "This Week", value: thisWeekCount, subtext: "last 7 days", icon: Zap, color: "from-yellow-500 to-yellow-600", category: "content" },
      { id: 18, title: "Today", value: todayCount, subtext: "watched today", icon: Eye, color: "from-violet-500 to-violet-600", category: "content" },
      { id: 19, title: "Completion Rate", value: `${completionRate.toFixed(0)}%`, subtext: "series finished", icon: Target, color: "from-rose-500 to-rose-600", category: "content" },
      { id: 20, title: "Avg Per Day", value: avgPerDay.toFixed(1), subtext: "daily average", icon: Activity, color: "from-blue-500 to-blue-600", category: "content" },
      
      // Rating Stats (21-28)
      { id: 21, title: "Average Rating", value: avgRating.toFixed(1), subtext: "⭐ overall", icon: Star, color: "from-yellow-400 to-yellow-500", category: "ratings" },
      { id: 22, title: "5-Star Watches", value: fiveStarCount, subtext: "perfect scores", icon: Award, color: "from-amber-400 to-amber-500", category: "ratings" },
      { id: 23, title: "4+ Star Count", value: fourPlusCount, subtext: "highly rated", icon: ThumbsUp, color: "from-green-500 to-green-600", category: "ratings" },
      { id: 24, title: "Rated Items", value: ratedItems.length, subtext: `${((ratedItems.length/completed.length)*100).toFixed(0)}% rated`, icon: Heart, color: "from-rose-500 to-rose-600", category: "ratings" },
      { id: 25, title: "Unrated Items", value: completed.length - ratedItems.length, subtext: "not yet rated", icon: TrendingDown, color: "from-zinc-500 to-zinc-600", category: "ratings" },
      { id: 26, title: "Rating Percentage", value: `${((ratedItems.length/completed.length)*100).toFixed(0)}%`, subtext: "completion", icon: Percent, color: "from-indigo-500 to-indigo-600", category: "ratings" },
      { id: 27, title: "Lowest Rating", value: Math.min(...ratedItems.map(s => s.rating || mediaMap[s.media_id]?.rating || 5), 5), subtext: "minimum score", icon: TrendingDown, color: "from-red-500 to-red-600", category: "ratings" },
      { id: 28, title: "Rating Spread", value: fiveStarCount > 0 ? "Wide" : "Narrow", subtext: "distribution", icon: BarChart2, color: "from-purple-500 to-purple-600", category: "ratings" },
      
      // Device & Platform Stats (29-36)
      { id: 29, title: "Top Device", value: topDevice?.[0] || 'N/A', subtext: `${topDevice?.[1] || 0} watches`, icon: Monitor, color: "from-cyan-500 to-cyan-600", category: "devices" },
      { id: 30, title: "Top Platform", value: topPlatform?.[0] || 'N/A', subtext: `${topPlatform?.[1] || 0} watches`, icon: Wifi, color: "from-teal-500 to-teal-600", category: "devices" },
      { id: 31, title: "Device Diversity", value: Object.keys(deviceCounts).length, subtext: "unique devices", icon: Layers, color: "from-emerald-500 to-emerald-600", category: "devices" },
      { id: 32, title: "Platform Count", value: Object.keys(platformCounts).length, subtext: "services used", icon: Grid, color: "from-pink-500 to-pink-600", category: "devices" },
      { id: 33, title: "Mobile Watches", value: deviceCounts['Phone'] || 0, subtext: "on phone", icon: Smartphone, color: "from-orange-500 to-orange-600", category: "devices" },
      { id: 34, title: "TV Watches", value: deviceCounts['TV'] || 0, subtext: "big screen", icon: Monitor, color: "from-indigo-500 to-indigo-600", category: "devices" },
      { id: 35, title: "Laptop Watches", value: deviceCounts['Laptop'] || 0, subtext: "on laptop", icon: Laptop, color: "from-violet-500 to-violet-600", category: "devices" },
      { id: 36, title: "Tablet Watches", value: deviceCounts['Tablet'] || 0, subtext: "on tablet", icon: Tablet, color: "from-blue-500 to-blue-600", category: "devices" },
      
      // Quality Stats (37-42)
      { id: 37, title: "Top Audio", value: topAudio?.[0] || 'N/A', subtext: `${topAudio?.[1] || 0} uses`, icon: Headphones, color: "from-purple-500 to-purple-600", category: "quality" },
      { id: 38, title: "Top Video", value: topVideo?.[0] || 'N/A', subtext: `${topVideo?.[1] || 0} uses`, icon: Video, color: "from-violet-500 to-violet-600", category: "quality" },
      { id: 39, title: "Premium Audio", value: premiumAudioCount, subtext: "high quality", icon: Volume2, color: "from-indigo-500 to-indigo-600", category: "quality" },
      { id: 40, title: "Premium Video", value: premiumVideoCount, subtext: "4K/HDR", icon: Eye, color: "from-rose-500 to-rose-600", category: "quality" },
      { id: 41, title: "Audio Formats", value: Object.keys(audioFormatCounts).length, subtext: "different formats", icon: Music, color: "from-amber-500 to-amber-600", category: "quality" },
      { id: 42, title: "Video Formats", value: Object.keys(videoFormatCounts).length, subtext: "different formats", icon: Video, color: "from-yellow-500 to-yellow-600", category: "quality" },
      
      // Genre & Language Stats (43-50)
      { id: 43, title: "Top Genre", value: topGenre?.[0] || 'N/A', subtext: `${topGenre?.[1] || 0} titles`, icon: Target, color: "from-emerald-500 to-emerald-600", category: "genres" },
      { id: 44, title: "Genre Diversity", value: genreDiversity, subtext: "unique genres", icon: Layers, color: "from-pink-500 to-pink-600", category: "genres" },
      { id: 45, title: "Top Language", value: topLanguage?.[0] || 'N/A', subtext: `${topLanguage?.[1] || 0} titles`, icon: Globe, color: "from-cyan-500 to-cyan-600", category: "genres" },
      { id: 46, title: "Language Count", value: languageDiversity, subtext: "languages", icon: List, color: "from-teal-500 to-teal-600", category: "genres" },
      { id: 47, title: "Top Actor", value: topActor?.[0] || 'N/A', subtext: `${topActor?.[1] || 0} titles`, icon: Users, color: "from-orange-500 to-orange-600", category: "genres" },
      { id: 48, title: "Top Release Year", value: topYear?.[0] || 'N/A', subtext: `${topYear?.[1] || 0} titles`, icon: Calendar, color: "from-indigo-500 to-indigo-600", category: "genres" },
      { id: 49, title: "Longest Runtime", value: `${longestRuntime}m`, subtext: "single watch", icon: FastForward, color: "from-red-500 to-red-600", category: "genres" },
      { id: 50, title: "Shortest Runtime", value: `${shortestRuntime}m`, subtext: "quickest watch", icon: Rewind, color: "from-blue-500 to-blue-600", category: "genres" },
      
      // Bonus Stats (51-55)
      { id: 51, title: "Top Age Rating", value: topAgeRating?.[0] || 'N/A', subtext: `${topAgeRating?.[1] || 0} titles`, icon: Shield, color: "from-rose-500 to-rose-600", category: "misc" },
      { id: 52, title: "Avg Per Week", value: avgPerWeek.toFixed(1), subtext: "weekly rate", icon: TrendingUp, color: "from-violet-500 to-violet-600", category: "misc" },
      { id: 53, title: "Avg Per Month", value: avgPerMonth.toFixed(0), subtext: "monthly rate", icon: BarChart2, color: "from-purple-500 to-purple-600", category: "misc" },
      { id: 54, title: "Unique Titles", value: new Set(completed.map(s => s.media_id)).size, subtext: "different titles", icon: Hash, color: "from-green-500 to-green-600", category: "misc" },
      { id: 55, title: "Total Library", value: mediaList.length, subtext: "all titles", icon: Bookmark, color: "from-amber-500 to-amber-600", category: "misc" },
      
      // NEW ENHANCED STATS (56-67)
      { id: 56, title: "Solo Watches", value: soloWatches, subtext: "watched alone", icon: User, color: "from-slate-500 to-slate-600", category: "social", desc: "Number of solo viewing sessions without companions" },
      { id: 57, title: "Group Watches", value: groupWatches, subtext: "with viewers", icon: Users, color: "from-green-500 to-green-600", category: "social", desc: "Watches with added viewers or companions" },
      { id: 58, title: "Device Variety", value: uniqueDevices.size, subtext: "devices used", icon: Smartphone, color: "from-blue-500 to-blue-600", category: "devices", desc: "Number of different devices utilized for watching" },
      { id: 59, title: "Binge Days", value: bingeDays, subtext: `max ${maxBingeDay}/day`, icon: Flame, color: "from-red-500 to-red-600", category: "time", desc: "Days with 3+ watches (binge sessions)" },
      { id: 60, title: "Days Between", value: avgDaysBetween, subtext: "avg gap", icon: TrendingDown, color: "from-purple-500 to-purple-600", category: "time", desc: "Average days between consecutive watches" },
      { id: 61, title: "Most Rewatched", value: mostRewatchedTitle, subtext: mostRewatchedCount > 0 ? `${mostRewatchedCount}x` : 'None yet', icon: Repeat, color: "from-pink-500 to-pink-600", category: "content", desc: "Movie watched multiple times" },
      { id: 62, title: "Platform Variety", value: uniquePlatforms.size, subtext: "platforms used", icon: Layers, color: "from-lime-500 to-lime-600", category: "devices", desc: "Number of unique streaming platforms explored" },
      { id: 63, title: "Afternoon Watches", value: afternoonWatches, subtext: "12pm - 6pm", icon: Sun, color: "from-orange-400 to-orange-500", category: "time", desc: "Watches completed during afternoon hours" },
      { id: 64, title: "Night Watches", value: nightWatches, subtext: "12am - 6am", icon: Moon, color: "from-indigo-500 to-indigo-600", category: "time", desc: "Watches completed during late night hours" },
      { id: 65, title: "Watch Pace", value: avgPerWeek.toFixed(1), subtext: "watches/week", icon: Timer, color: "from-cyan-500 to-cyan-600", category: "time", desc: "Average watches completed per week" },
      { id: 66, title: "Morning Peak", value: hourCounts.slice(6, 12).indexOf(Math.max(...hourCounts.slice(6, 12))) + 6, subtext: "am peak hour", icon: Sunrise, color: "from-yellow-500 to-yellow-600", category: "time", desc: "Peak morning viewing hour (6am-12pm)" },
      { id: 67, title: "Evening Peak", value: hourCounts.slice(18, 24).indexOf(Math.max(...hourCounts.slice(18, 24))) + 18, subtext: "pm peak hour", icon: Sunset, color: "from-orange-500 to-orange-600", category: "time", desc: "Peak evening viewing hour (6pm-12am)" }
    ];
  }, [completedSchedules, mediaMap, mediaList]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {allStats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.01 }}
          >
            <Card 
              onClick={() => {
                // Filter data based on stat type
                let filteredData = [];
                const statMap = {
                  1: completedSchedules, // Total Watch Time
                  4: completedSchedules, // Watch Streak
                  11: completedSchedules.filter(s => mediaMap[s.media_id]?.type === 'movie'),
                  12: completedSchedules.filter(s => mediaMap[s.media_id]?.type === 'series'),
                  13: completedSchedules.filter(s => mediaMap[s.media_id]?.type === 'book'),
                  21: completedSchedules.filter(s => s.rating || mediaMap[s.media_id]?.rating),
                  22: completedSchedules.filter(s => (s.rating || mediaMap[s.media_id]?.rating) === 5),
                  23: completedSchedules.filter(s => (s.rating || mediaMap[s.media_id]?.rating) >= 4),
                  29: completedSchedules.filter(s => {
                    const media = mediaMap[s.media_id];
                    return (s.device || media?.device) === (stat.value === 'N/A' ? null : stat.value);
                  }),
                  37: completedSchedules.filter(s => s.audio_format),
                  38: completedSchedules.filter(s => s.video_format),
                  39: completedSchedules.filter(s => {
                    const premiumAudio = ['Dolby Atmos', 'DTS:X', 'IMAX Enhanced Audio', 'Spatial Audio'];
                    return s.audio_format && premiumAudio.includes(s.audio_format);
                  }),
                  40: completedSchedules.filter(s => {
                    const premiumVideo = ['4K UHD', '8K', 'Dolby Vision', 'HDR10+', 'IMAX', 'IMAX Enhanced'];
                    return s.video_format && premiumVideo.includes(s.video_format);
                  }),
                  43: completedSchedules.filter(s => {
                    const media = mediaMap[s.media_id];
                    return media?.genre?.includes(stat.value === 'N/A' ? null : stat.value);
                  })
                };
                
                const relevantSchedules = statMap[stat.id] || completedSchedules;
                
                // Generate trend data (last 12 months)
                const trendData = (() => {
                  const months = {};
                  relevantSchedules.forEach(s => {
                    const date = new Date(s.rating_submitted_at || s.updated_date);
                    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    months[key] = (months[key] || 0) + 1;
                  });
                  return Object.entries(months).sort().slice(-12).map(([month, count]) => ({
                    period: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
                    value: count
                  }));
                })();

                // Generate insight based on stat
                const insight = (() => {
                  const total = relevantSchedules.length;
                  const percentage = ((total / completedSchedules.length) * 100).toFixed(1);
                  
                  if (stat.category === 'time' && total > 0) {
                    return `You've maintained ${stat.title.toLowerCase()} across ${total} viewing sessions, representing ${percentage}% of your total watch history.`;
                  } else if (stat.category === 'ratings' && total > 0) {
                    return `${total} titles meet this rating criteria, making up ${percentage}% of your rated content. Keep discovering great content!`;
                  } else if (stat.category === 'devices' && total > 0) {
                    return `${stat.title} has been used for ${total} watches (${percentage}% of total). Your device preference shows consistency in your viewing experience.`;
                  } else if (stat.category === 'content' && total > 0) {
                    return `${total} ${stat.title.toLowerCase()} completed, representing ${percentage}% of your total viewing activity.`;
                  } else if (total > 0) {
                    return `This stat represents ${total} entries from your watch history, accounting for ${percentage}% of all completed titles.`;
                  }
                  return null;
                })();
                
                const processedData = relevantSchedules.map(s => {
                  const media = mediaMap[s.media_id];
                  if (!media) return null;
                  let runtime = media.runtime_minutes;
                  if (media.type === 'series' && s.season_number && s.episode_number) {
                    const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
                    if (epRuntime) runtime = epRuntime;
                  }
                  
                  // Determine watch status
                  const status = s.status === 'completed' ? 'Completed' :
                                s.status === 'in_progress' ? 'Playing' :
                                s.status === 'paused' ? 'Paused' : 
                                s.status === 'scheduled' ? 'Scheduled' : 'Completed';
                  
                  return {
                    title: media.title,
                    poster: media.poster_url,
                    subtitle: stat.category === 'time' ? new Date(s.rating_submitted_at || s.updated_date).toLocaleDateString() :
                             stat.category === 'ratings' ? `${s.rating || media.rating || 'N/A'} ⭐` :
                             stat.category === 'devices' ? (s.device || media.device) :
                             stat.category === 'quality' ? `${s.audio_format || 'N/A'} / ${s.video_format || 'N/A'}` :
                             media.genre?.join(', ') || 'N/A',
                    value: stat.category === 'time' ? `${runtime}m` :
                          stat.category === 'ratings' ? `${s.rating || media.rating || 'N/A'}/5` :
                          media.type || 'N/A',
                    status: status
                  };
                }).filter(d => d);
                
                onStatClick({ 
                  ...stat, 
                  data: processedData,
                  trendData,
                  insight 
                });
              }}
              className="bg-zinc-900/80 border-zinc-800 cursor-pointer hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all hover:scale-105"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-5 h-5 ${
                    stat.color === 'from-purple-500 to-purple-600' ? 'text-purple-400' :
                    stat.color === 'from-emerald-500 to-emerald-600' ? 'text-emerald-400' :
                    stat.color === 'from-amber-500 to-amber-600' ? 'text-amber-400' :
                    stat.color === 'from-orange-500 to-orange-600' ? 'text-orange-400' :
                    stat.color === 'from-blue-500 to-blue-600' ? 'text-blue-400' :
                    stat.color === 'from-cyan-500 to-cyan-600' ? 'text-cyan-400' :
                    stat.color === 'from-pink-500 to-pink-600' ? 'text-pink-400' :
                    stat.color === 'from-teal-500 to-teal-600' ? 'text-teal-400' :
                    stat.color === 'from-rose-500 to-rose-600' ? 'text-rose-400' :
                    stat.color === 'from-indigo-500 to-indigo-600' ? 'text-indigo-400' :
                    stat.color === 'from-violet-500 to-violet-600' ? 'text-violet-400' :
                    stat.color === 'from-yellow-400 to-yellow-500' ? 'text-yellow-400' :
                    stat.color === 'from-red-500 to-red-600' ? 'text-red-400' :
                    stat.color === 'from-green-500 to-green-600' ? 'text-green-400' :
                    stat.color === 'from-amber-400 to-amber-500' ? 'text-amber-400' :
                    stat.color === 'from-yellow-500 to-yellow-600' ? 'text-yellow-400' :
                    'text-purple-400'
                  }`} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-[10px] text-zinc-300 font-semibold leading-tight">{stat.title}</p>
                  {stat.subtext && (
                    <p className="text-[10px] text-zinc-500 leading-tight">{stat.subtext}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}