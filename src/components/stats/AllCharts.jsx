import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, Radar, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#a855f7', '#84cc16'];

export default function AllCharts({ completedSchedules, mediaMap }) {
  // 1. Monthly Watch Time Trend
  const monthlyTrend = useMemo(() => {
    const months = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (!media) return;
      const date = new Date(s.rating_submitted_at || s.updated_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      months[key] = (months[key] || 0) + runtime;
    });
    return Object.entries(months).sort().slice(-12).map(([month, minutes]) => ({
      month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
      hours: Math.round(minutes / 60)
    }));
  }, [completedSchedules, mediaMap]);

  // 2. Genre Distribution Pie
  const genreDistribution = useMemo(() => {
    const genres = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      media?.genre?.forEach(g => genres[g] = (genres[g] || 0) + 1);
    });
    return Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [completedSchedules, mediaMap]);

  // 3. Platform Usage Bar
  const platformUsage = useMemo(() => {
    const platforms = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.platform) platforms[media.platform] = (platforms[media.platform] || 0) + 1;
    });
    return Object.entries(platforms).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [completedSchedules, mediaMap]);

  // 4. Day of Week Pattern
  const dayPattern = useMemo(() => {
    const days = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    completedSchedules.forEach(s => {
      const date = new Date(s.rating_submitted_at || s.updated_date);
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      days[day]++;
    });
    return Object.entries(days).map(([day, count]) => ({ day, count }));
  }, [completedSchedules]);

  // 5. Hourly Watch Pattern
  const hourlyPattern = useMemo(() => {
    const hours = Array(24).fill(0);
    completedSchedules.forEach(s => {
      const date = new Date(s.started_at || s.updated_date);
      hours[date.getHours()]++;
    });
    return hours.map((count, hour) => ({ hour: `${hour}:00`, count }));
  }, [completedSchedules]);

  // 6. Rating Distribution
  const ratingDist = useMemo(() => {
    const ratings = { '1★': 0, '2★': 0, '3★': 0, '4★': 0, '5★': 0 };
    completedSchedules.forEach(s => {
      const rating = s.rating || mediaMap[s.media_id]?.rating;
      if (rating) ratings[`${Math.round(rating)}★`]++;
    });
    return Object.entries(ratings).map(([rating, count]) => ({ rating, count }));
  }, [completedSchedules, mediaMap]);

  // 7. Device Usage Hours
  const deviceHours = useMemo(() => {
    const devices = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      const device = s.device || media?.device || 'Unknown';
      let runtime = media?.runtime_minutes || 0;
      if (media?.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      } else if (media?.type === 'book') {
        runtime = s.session_duration || 30;
      }
      devices[device] = (devices[device] || 0) + runtime;
    });
    return Object.entries(devices).map(([device, minutes]) => ({ device, hours: Math.round(minutes / 60) }));
  }, [completedSchedules, mediaMap]);

  // 8. Language Distribution
  const languageDist = useMemo(() => {
    const languages = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.language) languages[media.language] = (languages[media.language] || 0) + 1;
    });
    return Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [completedSchedules, mediaMap]);

  // 9. Content Type Breakdown
  const contentTypes = useMemo(() => {
    const types = { Movies: 0, 'Series Episodes': 0, 'Book Sessions': 0 };
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.type === 'movie') types.Movies++;
      else if (media?.type === 'series') types['Series Episodes']++;
      else if (media?.type === 'book') types['Book Sessions']++;
    });
    return Object.entries(types).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [completedSchedules, mediaMap]);

  // 10. Audio Format Distribution
  const audioFormats = useMemo(() => {
    const formats = {};
    completedSchedules.forEach(s => {
      if (s.audio_format) formats[s.audio_format] = (formats[s.audio_format] || 0) + 1;
    });
    return Object.entries(formats).map(([name, value]) => ({ name, value }));
  }, [completedSchedules]);

  // 11. Video Format Distribution
  const videoFormats = useMemo(() => {
    const formats = {};
    completedSchedules.forEach(s => {
      if (s.video_format) formats[s.video_format] = (formats[s.video_format] || 0) + 1;
    });
    return Object.entries(formats).map(([name, value]) => ({ name, value }));
  }, [completedSchedules]);

  // 12. Year of Release Distribution
  const yearDist = useMemo(() => {
    const years = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.year) years[media.year] = (years[media.year] || 0) + 1;
    });
    return Object.entries(years).sort((a, b) => a[0] - b[0]).slice(-10).map(([year, count]) => ({ year, count }));
  }, [completedSchedules, mediaMap]);

  // 13. Watch Completion Time (avg time to finish)
  const completionData = useMemo(() => {
    const data = completedSchedules.map(s => {
      const media = mediaMap[s.media_id];
      let runtime = media?.runtime_minutes || 0;
      if (media?.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      } else if (media?.type === 'book') {
        runtime = s.session_duration || 30;
      }
      const elapsed = s.elapsed_seconds / 60;
      return { title: media?.title?.slice(0, 15) + '...', runtime, elapsed };
    }).slice(-20);
    return data;
  }, [completedSchedules, mediaMap]);

  // 14. Movies vs Series Over Time
  const contentTrend = useMemo(() => {
    const months = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      const date = new Date(s.rating_submitted_at || s.updated_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { movies: 0, series: 0, books: 0 };
      if (media?.type === 'movie') months[key].movies++;
      else if (media?.type === 'series') months[key].series++;
      else if (media?.type === 'book') months[key].books++;
    });
    return Object.entries(months).sort().slice(-12).map(([month, data]) => ({
      month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
      ...data
    }));
  }, [completedSchedules, mediaMap]);

  // 15. Rating Trend Over Time
  const ratingTrend = useMemo(() => {
    const months = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      const rating = s.rating || media?.rating;
      if (!rating) return;
      const date = new Date(s.rating_submitted_at || s.updated_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { total: 0, count: 0 };
      months[key].total += rating;
      months[key].count++;
    });
    return Object.entries(months).sort().slice(-12).map(([month, data]) => ({
      month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
      avgRating: (data.total / data.count).toFixed(1)
    }));
  }, [completedSchedules, mediaMap]);

  // 16. Top Actors Radar
  const topActors = useMemo(() => {
    const actors = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      media?.actors?.forEach(actor => actors[actor] = (actors[actor] || 0) + 1);
    });
    return Object.entries(actors).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([actor, count]) => ({ actor, count }));
  }, [completedSchedules, mediaMap]);

  // 17. Age Rating Distribution
  const ageRatings = useMemo(() => {
    const ratings = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.age_restriction) ratings[media.age_restriction] = (ratings[media.age_restriction] || 0) + 1;
    });
    return Object.entries(ratings).map(([name, value]) => ({ name, value }));
  }, [completedSchedules, mediaMap]);

  // 18. Weekday vs Weekend
  const weekdayWeekend = useMemo(() => {
    let weekday = 0, weekend = 0;
    completedSchedules.forEach(s => {
      const day = new Date(s.rating_submitted_at || s.updated_date).getDay();
      (day === 0 || day === 6) ? weekend++ : weekday++;
    });
    return [{ name: 'Weekday', value: weekday }, { name: 'Weekend', value: weekend }];
  }, [completedSchedules]);

  // 19. Runtime Distribution
  const runtimeDist = useMemo(() => {
    const buckets = { '0-30m': 0, '30-60m': 0, '60-90m': 0, '90-120m': 0, '120m+': 0 };
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.type === 'book') return; // Skip books for runtime distribution
      let runtime = media?.runtime_minutes || 0;
      if (media?.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      if (runtime < 30) buckets['0-30m']++;
      else if (runtime < 60) buckets['30-60m']++;
      else if (runtime < 90) buckets['60-90m']++;
      else if (runtime < 120) buckets['90-120m']++;
      else buckets['120m+']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [completedSchedules, mediaMap]);

  // 20. Seasonal Watch Pattern
  const seasonalPattern = useMemo(() => {
    const seasons = { Winter: 0, Spring: 0, Summer: 0, Fall: 0 };
    completedSchedules.forEach(s => {
      const month = new Date(s.rating_submitted_at || s.updated_date).getMonth();
      if (month < 3) seasons.Winter++;
      else if (month < 6) seasons.Spring++;
      else if (month < 9) seasons.Summer++;
      else seasons.Fall++;
    });
    return Object.entries(seasons).map(([season, count]) => ({ season, count }));
  }, [completedSchedules]);

  // NEW ENHANCED CHARTS (21-30)

  // 21. Cumulative Watch Progress (Area Chart)
  const cumulativeProgress = useMemo(() => {
    const sorted = [...completedSchedules].sort((a, b) => 
      new Date(a.rating_submitted_at || a.updated_date) - new Date(b.rating_submitted_at || b.updated_date)
    );
    let cumulative = 0;
    return sorted.map((s, idx) => {
      const media = mediaMap[s.media_id];
      let runtime = media?.runtime_minutes || 0;
      if (media?.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      cumulative += runtime;
      return {
        index: idx + 1,
        hours: Math.round(cumulative / 60)
      };
    }).filter((_, i) => i % Math.max(1, Math.floor(sorted.length / 30)) === 0);
  }, [completedSchedules, mediaMap]);

  // 22. Solo vs Group Watching Trend
  const soloGroupTrend = useMemo(() => {
    const months = {};
    completedSchedules.forEach(s => {
      const date = new Date(s.rating_submitted_at || s.updated_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { solo: 0, group: 0 };
      if (!s.viewers || s.viewers.length === 0) months[key].solo++;
      else months[key].group++;
    });
    return Object.entries(months).sort().slice(-12).map(([month, data]) => ({
      month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
      ...data
    }));
  }, [completedSchedules]);

  // 23. Binge Sessions Timeline
  const bingeSessions = useMemo(() => {
    const dateCounts = {};
    completedSchedules.forEach(s => {
      const date = new Date(s.rating_submitted_at || s.updated_date).toDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    return Object.entries(dateCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-15)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        watches: count,
        isBinge: count >= 3
      }));
  }, [completedSchedules]);

  // 24. Time of Day Heatmap Data (Morning, Afternoon, Evening, Night)
  const timeOfDayDist = useMemo(() => {
    const periods = { 
      'Morning (6am-12pm)': 0, 
      'Afternoon (12pm-6pm)': 0, 
      'Evening (6pm-12am)': 0, 
      'Night (12am-6am)': 0 
    };
    completedSchedules.forEach(s => {
      const hour = new Date(s.rating_submitted_at || s.updated_date).getHours();
      if (hour >= 6 && hour < 12) periods['Morning (6am-12pm)']++;
      else if (hour >= 12 && hour < 18) periods['Afternoon (12pm-6pm)']++;
      else if (hour >= 18 && hour < 24) periods['Evening (6pm-12am)']++;
      else periods['Night (12am-6am)']++;
    });
    return Object.entries(periods).map(([period, count]) => ({ period, count }));
  }, [completedSchedules]);

  // 25. Device Distribution Donut
  const deviceDistribution = useMemo(() => {
    const devices = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      const device = s.device || media?.device || 'Unknown';
      devices[device] = (devices[device] || 0) + 1;
    });
    return Object.entries(devices).map(([name, value]) => ({ name, value }));
  }, [completedSchedules, mediaMap]);

  // 26. Watch Frequency Pattern (Watches per day over time)
  const watchFrequency = useMemo(() => {
    const days = {};
    completedSchedules.forEach(s => {
      const date = new Date(s.rating_submitted_at || s.updated_date).toDateString();
      days[date] = (days[date] || 0) + 1;
    });
    return Object.entries(days)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-30)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      }));
  }, [completedSchedules]);

  // 27. Session Length Distribution
  const sessionLengths = useMemo(() => {
    const buckets = { '0-30m': 0, '30-60m': 0, '60-90m': 0, '90-120m': 0, '120-180m': 0, '180m+': 0 };
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      let runtime = media?.runtime_minutes || 0;
      if (media?.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      if (runtime < 30) buckets['0-30m']++;
      else if (runtime < 60) buckets['30-60m']++;
      else if (runtime < 90) buckets['60-90m']++;
      else if (runtime < 120) buckets['90-120m']++;
      else if (runtime < 180) buckets['120-180m']++;
      else buckets['180m+']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [completedSchedules, mediaMap]);

  // 28. Platform Loyalty (repeated usage)
  const platformLoyalty = useMemo(() => {
    const platforms = {};
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.platform) platforms[media.platform] = (platforms[media.platform] || 0) + 1;
    });
    return Object.entries(platforms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ 
        name, 
        percentage: ((count / completedSchedules.length) * 100).toFixed(1)
      }));
  }, [completedSchedules, mediaMap]);

  // 29. Watch Quality Preference (audio/video format breakdown)
  const qualityPreference = useMemo(() => {
    const premium = { audio: 0, video: 0, both: 0, standard: 0 };
    const premiumAudio = ['Dolby Atmos', 'DTS:X', 'IMAX Enhanced Audio', 'Spatial Audio'];
    const premiumVideo = ['4K UHD', '8K', 'Dolby Vision', 'HDR10+', 'IMAX', 'IMAX Enhanced'];
    
    completedSchedules.forEach(s => {
      const hasAudio = s.audio_format && premiumAudio.includes(s.audio_format);
      const hasVideo = s.video_format && premiumVideo.includes(s.video_format);
      if (hasAudio && hasVideo) premium.both++;
      else if (hasAudio) premium.audio++;
      else if (hasVideo) premium.video++;
      else premium.standard++;
    });
    
    return [
      { name: 'Premium A+V', value: premium.both },
      { name: 'Premium Audio', value: premium.audio },
      { name: 'Premium Video', value: premium.video },
      { name: 'Standard', value: premium.standard }
    ].filter(d => d.value > 0);
  }, [completedSchedules]);

  // 30. Completion Consistency (streak visualization)
  const streakData = useMemo(() => {
    const sorted = [...completedSchedules]
      .sort((a, b) => new Date(a.rating_submitted_at || a.updated_date) - new Date(b.rating_submitted_at || b.updated_date))
      .slice(-30);
    
    const dates = sorted.map(s => new Date(s.rating_submitted_at || s.updated_date).toDateString());
    const uniqueDates = [...new Set(dates)];
    
    return uniqueDates.slice(-20).map((date, idx) => {
      const watchCount = dates.filter(d => d === date).length;
      const prevDate = idx > 0 ? new Date(uniqueDates[idx - 1]) : null;
      const currDate = new Date(date);
      const gap = prevDate ? Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        date: currDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        watches: watchCount,
        consistent: gap <= 2
      };
    });
  }, [completedSchedules]);

  const chartConfig = {
    margin: { top: 5, right: 20, left: 0, bottom: 5 }
  };

  if (completedSchedules.length === 0) {
    return <div className="text-center text-zinc-400 py-12">No data available for charts</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      {/* 1. Monthly Trend */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Monthly Watch Time</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend} {...chartConfig}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 2. Genre Pie */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Top Genres</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genreDistribution} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                {genreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 3. Platform Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Platform Usage</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformUsage} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="name" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 4. Day of Week */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Watch by Day of Week</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayPattern} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="day" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 5. Hourly Pattern */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 xl:col-span-3">
        <CardHeader><CardTitle className="text-white text-sm">Watch Pattern by Hour</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hourlyPattern} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="hour" stroke="#71717a" style={{ fontSize: '10px' }} interval={2} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 6. Rating Distribution */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.25 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Rating Distribution</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratingDist} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="rating" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 7. Device Hours */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Device Watch Time</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deviceHours} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="device" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="hours" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 8-20: Wrap remaining charts */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.35 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Language Distribution</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={languageDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {languageDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Content Type Breakdown</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={contentTypes} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {contentTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.45 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Audio Formats</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={audioFormats} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="name" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.5 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Video Formats</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={videoFormats} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="name" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.55 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Content by Release Year</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearDist} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="year" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.6 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 xl:col-span-3">
        <CardHeader><CardTitle className="text-white text-sm">Movies vs Series vs Books Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={contentTrend} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="movies" stroke="#8b5cf6" strokeWidth={2} name="Movies" />
              <Line type="monotone" dataKey="series" stroke="#10b981" strokeWidth={2} name="Series" />
              <Line type="monotone" dataKey="books" stroke="#f59e0b" strokeWidth={2} name="Books" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.65 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Average Rating Trend</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ratingTrend} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis domain={[0, 5]} stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.7 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Top Actors</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={topActors}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="actor" stroke="#71717a" style={{ fontSize: '10px' }} />
              <PolarRadiusAxis stroke="#71717a" style={{ fontSize: '10px' }} />
              <Radar name="Count" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.75 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Age Rating Distribution</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={ageRatings} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {ageRatings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.8 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Weekday vs Weekend</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={weekdayWeekend} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {weekdayWeekend.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#ec4899'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.85 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Runtime Distribution</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={runtimeDist} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="range" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.9 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Seasonal Watch Pattern</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={seasonalPattern}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="season" stroke="#71717a" style={{ fontSize: '11px' }} />
              <PolarRadiusAxis stroke="#71717a" style={{ fontSize: '10px' }} />
              <Radar name="Watches" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.95 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader><CardTitle className="text-white text-sm">Watch Efficiency</CardTitle></CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="runtime" stroke="#71717a" style={{ fontSize: '11px' }} name="Runtime" unit="m" />
              <YAxis dataKey="elapsed" stroke="#71717a" style={{ fontSize: '11px' }} name="Elapsed" unit="m" />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Watches" data={completionData} fill="#a855f7" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* NEW ENHANCED CHARTS - 10 Additional Visualizations */}

      {/* 21. Cumulative Watch Progress */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.0 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-white text-sm">Cumulative Watch Progress</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Total hours accumulated over time</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cumulativeProgress} {...chartConfig}>
              <defs>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="#f97316" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="index" stroke="#71717a" style={{ fontSize: '11px' }} label={{ value: 'Watches', position: 'insideBottom', offset: -5, fill: '#71717a' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#71717a' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#cumulativeGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 22. Solo vs Group Watching Trend */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.05 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-sm">Solo vs Group Watching</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Social viewing patterns over time</p>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={soloGroupTrend} {...chartConfig}>
              <defs>
                <linearGradient id="soloGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="groupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="solo" stroke="#64748b" fill="url(#soloGradient)" name="Solo" stackId="1" />
              <Area type="monotone" dataKey="group" stroke="#10b981" fill="url(#groupGradient)" name="Group" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 23. Binge Sessions Timeline */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.1 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-white text-sm">Binge Sessions Timeline</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Days with 2+ watches (red = 3+ binge days)</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bingeSessions} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="watches" radius={[8, 8, 0, 0]}>
                {bingeSessions.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isBinge ? '#ef4444' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 24. Time of Day Distribution */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.15 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-sm">Time of Day Distribution</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">When you watch most</p>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={timeOfDayDist} 
                cx="50%" 
                cy="50%" 
                innerRadius={50}
                outerRadius={80} 
                dataKey="count"
                label={({ period, percent }) => `${period.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                <Cell fill="#fbbf24" />
                <Cell fill="#fb923c" />
                <Cell fill="#c084fc" />
                <Cell fill="#818cf8" />
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 25. Device Distribution */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.2 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-sm">Device Distribution</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Your preferred watching devices</p>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={deviceDistribution} 
                cx="50%" 
                cy="50%" 
                innerRadius={50}
                outerRadius={80} 
                dataKey="value"
                label
              >
                {deviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 26. Watch Frequency Pattern */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.25 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-white text-sm">Daily Watch Frequency (Last 30 Days)</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Number of watches completed per day</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={watchFrequency} {...chartConfig}>
              <defs>
                <linearGradient id="frequencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#frequencyGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 27. Session Length Distribution */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.3 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-sm">Session Length Distribution</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">How long you typically watch</p>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessionLengths} {...chartConfig} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis type="number" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis dataKey="range" type="category" stroke="#71717a" style={{ fontSize: '11px' }} width={80} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#a855f7" radius={[0, 8, 8, 0]}>
                {sessionLengths.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 28. Platform Loyalty */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.35 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-sm">Platform Loyalty</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Usage % per streaming platform</p>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformLoyalty} {...chartConfig} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis type="number" stroke="#71717a" style={{ fontSize: '11px' }} unit="%" />
              <YAxis dataKey="name" type="category" stroke="#71717a" style={{ fontSize: '10px' }} width={100} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} formatter={(value) => `${value}%`} />
              <Bar dataKey="percentage" fill="#14b8a6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 29. Quality Preference */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.4 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 h-[340px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-sm">Watch Quality Preference</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Premium vs standard quality breakdown</p>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={qualityPreference} 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill="#8b5cf6" />
                <Cell fill="#a855f7" />
                <Cell fill="#c084fc" />
                <Cell fill="#71717a" />
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      {/* 30. Completion Consistency */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.45 }}>
      <Card className="bg-zinc-900/80 border-zinc-800 xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-white text-sm">Watch Consistency Streak</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">Green = consistent (≤2 days gap), Orange = gap in streak</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={streakData} {...chartConfig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="watches" radius={[8, 8, 0, 0]}>
                {streakData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.consistent ? '#10b981' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

    </motion.div>
  );
}