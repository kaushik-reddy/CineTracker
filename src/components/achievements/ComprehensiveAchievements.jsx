import React, { useMemo } from 'react';
import { 
  Trophy, Star, Clock, Film, Tv, Flame, Target, Activity, Award, Users, Globe, Book,
  Calendar, Coffee, Moon, Sun, Zap, Heart, ThumbsUp, Eye, TrendingUp, Play, Repeat,
  FastForward, Headphones, Video, Smartphone, Monitor, Laptop, Volume2, Music, Wifi,
  Grid, Layers, Hash, Bookmark, Filter, Search, Edit, Settings, Share2, Download,
  Upload, Tablet, Speaker, Mic, Camera, Aperture, Film as FilmIcon, Tv2, Radio,
  Gamepad, Palette, Brush, Sparkles, Crown, Medal, Shield, Sword, Gem, Diamond, Library
} from "lucide-react";

export function useComprehensiveAchievements(completedSchedules, mediaMap, mediaList) {
  return useMemo(() => {
    const completed = completedSchedules.filter(s => mediaMap[s.media_id]);
    
    // Calculate all metrics
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
    
    const movieCount = completed.filter(s => mediaMap[s.media_id]?.type === 'movie').length;
    const seriesEpisodes = completed.filter(s => mediaMap[s.media_id]?.type === 'series').length;
    const uniqueSeries = new Set(completed.filter(s => mediaMap[s.media_id]?.type === 'series').map(s => s.media_id)).size;
    const bookSessions = completed.filter(s => mediaMap[s.media_id]?.type === 'book').length;
    const uniqueBooks = new Set(completed.filter(s => mediaMap[s.media_id]?.type === 'book').map(s => s.media_id)).size;
    
    // Streak calculation
    const watchStreak = (() => {
      const sortedDates = completed.map(s => new Date(s.rating_submitted_at || s.updated_date).toDateString()).sort((a, b) => new Date(b) - new Date(a));
      const uniqueDates = [...new Set(sortedDates)];
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < uniqueDates.length; i++) {
        const watchDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((currentDate - watchDate) / (1000 * 60 * 60 * 24));
        if (diffDays === streak) streak++;
        else break;
      }
      return streak;
    })();
    
    // Quality counts
    const premiumAudio = ['Dolby Atmos', 'DTS:X', 'IMAX Enhanced Audio', 'Spatial Audio'];
    const premiumVideo = ['4K UHD', '8K', 'Dolby Vision', 'HDR10+', 'IMAX', 'IMAX Enhanced'];
    const premiumAudioCount = completed.filter(s => s.audio_format && premiumAudio.includes(s.audio_format)).length;
    const premiumVideoCount = completed.filter(s => s.video_format && premiumVideo.includes(s.video_format)).length;
    
    // Genre counts
    const genreCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      media?.genre?.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    
    // Rating stats
    const ratedItems = completed.filter(s => s.rating || mediaMap[s.media_id]?.rating);
    const fiveStarCount = ratedItems.filter(s => (s.rating || mediaMap[s.media_id]?.rating) === 5).length;
    const fourPlusCount = ratedItems.filter(s => (s.rating || mediaMap[s.media_id]?.rating) >= 4).length;
    
    // Time patterns
    const hourCounts = Array(24).fill(0);
    completed.forEach(s => {
      const date = new Date(s.rating_submitted_at || s.updated_date);
      hourCounts[date.getHours()]++;
    });
    const morningWatches = hourCounts.slice(6, 12).reduce((a, b) => a + b, 0);
    const eveningWatches = hourCounts.slice(18, 24).reduce((a, b) => a + b, 0);
    const nightWatches = hourCounts.slice(0, 6).reduce((a, b) => a + b, 0);
    
    // Day patterns
    const weekendCount = completed.filter(s => {
      const day = new Date(s.rating_submitted_at || s.updated_date).getDay();
      return day === 0 || day === 6;
    }).length;
    
    // Device counts
    const deviceCounts = {};
    const theaterCount = completed.filter(s => {
      const media = mediaMap[s.media_id];
      return (s.device || media?.device) === 'Theater';
    }).length;
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      const device = s.device || media?.device;
      if (device) deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    
    // Language counts
    const languageCounts = {};
    const platformCounts = {};
    completed.forEach(s => {
      const media = mediaMap[s.media_id];
      if (media?.language) languageCounts[media.language] = (languageCounts[media.language] || 0) + 1;
      if (media?.platform) platformCounts[media.platform] = (platformCounts[media.platform] || 0) + 1;
    });
    
    // NEVER-ENDING LEVEL SYSTEM - generates unlimited levels based on progression
    const createInfiniteLevels = (baseTargets, current) => {
      const levels = [];
      let multiplier = 1;
      let levelIndex = 0;
      
      // Keep generating levels until we're well beyond current progress
      while (levels.length === 0 || levels[levels.length - 1].target <= current * 1.5) {
        baseTargets.forEach((baseTarget, idx) => {
          const target = Math.floor(baseTarget * multiplier);
          levelIndex++;
          levels.push({
            level: levelIndex,
            target,
            current: Math.min(current, target),
            progress: current >= target ? 100 : (current / target) * 100,
            unlocked: current >= target
          });
        });
        multiplier *= 2; // Double the targets for next tier
      }
      
      return levels;
    };

    const allAchievements = [
      // Time-based achievements
      {
        id: 'watch_time',
        name: 'Time Master',
        desc: 'Total watch time in hours',
        icon: Clock,
        category: 'time',
        color: 'purple',
        levels: createInfiniteLevels([1, 5, 10, 25, 50, 100], totalHours),
        data: []
      },
      {
        id: 'watch_days',
        name: 'Marathon Runner',
        desc: 'Watch content for multiple days',
        icon: Calendar,
        category: 'time',
        color: 'emerald',
        levels: createInfiniteLevels([1, 3, 7, 14, 30], Math.floor(totalHours / 24)),
        data: []
      },
      {
        id: 'streak',
        name: 'Streak Legend',
        desc: 'Consecutive watch days',
        icon: Flame,
        category: 'time',
        color: 'orange',
        levels: createInfiniteLevels([3, 7, 14, 30], watchStreak),
        data: []
      },
      {
        id: 'morning_bird',
        name: 'Early Bird',
        desc: 'Morning watches (6am-12pm)',
        icon: Sun,
        category: 'time',
        color: 'amber',
        levels: createInfiniteLevels([5, 10, 25], morningWatches),
        data: []
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        desc: 'Late night watches (12am-6am)',
        icon: Moon,
        category: 'time',
        color: 'indigo',
        levels: createInfiniteLevels([5, 10, 25], nightWatches),
        data: []
      },
      {
        id: 'evening_viewer',
        name: 'Prime Time',
        desc: 'Evening watches (6pm-12am)',
        icon: Tv,
        category: 'time',
        color: 'violet',
        levels: createInfiniteLevels([10, 25, 50], eveningWatches),
        data: []
      },
      {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        desc: 'Saturday & Sunday watches',
        icon: Coffee,
        category: 'time',
        color: 'pink',
        levels: createInfiniteLevels([5, 10, 25], weekendCount),
        data: []
      },
      
      // Content achievements
      {
        id: 'movies',
        name: 'Film Fanatic',
        desc: 'Movies completed',
        icon: Film,
        category: 'content',
        color: 'purple',
        levels: createInfiniteLevels([1, 5, 10, 25, 50], movieCount),
        data: []
      },
      {
        id: 'series',
        name: 'Series Master',
        desc: 'Unique series watched',
        icon: Tv,
        category: 'content',
        color: 'emerald',
        levels: createInfiniteLevels([1, 3, 5, 10, 20], uniqueSeries),
        data: []
      },
      {
        id: 'episodes',
        name: 'Episode Hunter',
        desc: 'Total episodes watched',
        icon: Play,
        category: 'content',
        color: 'blue',
        levels: createInfiniteLevels([10, 25, 50, 100], seriesEpisodes),
        data: []
      },
      {
        id: 'books',
        name: 'Bookworm',
        desc: 'Books completed',
        icon: Book,
        category: 'content',
        color: 'amber',
        levels: createInfiniteLevels([1, 3, 5, 10], uniqueBooks),
        data: []
      },
      {
        id: 'reading_sessions',
        name: 'Reading Marathon',
        desc: 'Reading sessions completed',
        icon: Book,
        category: 'content',
        color: 'orange',
        levels: createInfiniteLevels([5, 10, 25], bookSessions),
        data: []
      },
      {
        id: 'total_content',
        name: 'Content Connoisseur',
        desc: 'Total items watched/read',
        icon: Trophy,
        category: 'content',
        color: 'gold',
        levels: createInfiniteLevels([10, 25, 50, 100], completed.length),
        data: []
      },
      {
        id: 'library_size',
        name: 'Collector',
        desc: 'Total library size',
        icon: Bookmark,
        category: 'content',
        color: 'violet',
        levels: createInfiniteLevels([10, 25, 50], mediaList.length),
        data: []
      },
      {
        id: 'genre_explorer',
        name: 'Genre Explorer',
        desc: 'Unique genres watched',
        icon: Target,
        category: 'content',
        color: 'teal',
        levels: createInfiniteLevels([3, 5, 10], Object.keys(genreCounts).length),
        data: []
      },
      {
        id: 'long_form',
        name: 'Endurance Viewer',
        desc: 'Watch 3+ hour content',
        icon: Clock,
        category: 'content',
        color: 'rose',
        levels: createInfiniteLevels([1, 5, 10], completed.filter(s => {
          const media = mediaMap[s.media_id];
          if (!media || media.type === 'book') return false;
          let runtime = media.runtime_minutes || 0;
          if (media.type === 'series' && s.season_number && s.episode_number) {
            const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
            if (epRuntime) runtime = epRuntime;
          }
          return runtime >= 180;
        }).length),
        data: []
      },
      {
        id: 'page_turner',
        name: 'Page Turner',
        desc: 'Total pages read across all books',
        icon: Book,
        category: 'content',
        color: 'emerald',
        levels: createInfiniteLevels([100, 500, 1000], 
          Object.values(mediaMap).filter(m => m.type === 'book').reduce((sum, m) => sum + (m.pages_read || 0), 0)
        ),
        data: []
      },
      
      // Rating achievements
      {
        id: 'five_star',
        name: 'Perfectionist',
        desc: '5-star ratings given',
        icon: Star,
        category: 'ratings',
        color: 'yellow',
        levels: createInfiniteLevels([1, 5, 10, 25], fiveStarCount),
        data: []
      },
      {
        id: 'four_plus',
        name: 'High Standards',
        desc: '4+ star ratings',
        icon: ThumbsUp,
        category: 'ratings',
        color: 'green',
        levels: createInfiniteLevels([5, 10, 25], fourPlusCount),
        data: []
      },
      {
        id: 'critic',
        name: 'Critic',
        desc: 'Rate everything you watch',
        icon: Award,
        category: 'ratings',
        color: 'purple',
        levels: createInfiniteLevels([10, 25, 50], ratedItems.length),
        data: []
      },
      
      // Quality achievements
      {
        id: 'audiophile',
        name: 'Audiophile',
        desc: 'Premium audio watches',
        icon: Headphones,
        category: 'quality',
        color: 'purple',
        levels: createInfiniteLevels([10, 25, 50], premiumAudioCount),
        data: []
      },
      {
        id: 'videophile',
        name: 'Videophile',
        desc: 'Premium video watches',
        icon: Video,
        category: 'quality',
        color: 'blue',
        levels: createInfiniteLevels([10, 25, 50], premiumVideoCount),
        data: []
      },
      {
        id: 'dolby_atmos',
        name: 'Dolby Atmos Fan',
        desc: 'Watch in Dolby Atmos',
        icon: Volume2,
        category: 'quality',
        color: 'indigo',
        levels: createInfiniteLevels([5, 10, 25], completed.filter(s => s.audio_format === 'Dolby Atmos').length),
        data: []
      },
      {
        id: '4k_viewer',
        name: '4K Enthusiast',
        desc: 'Watch in 4K UHD',
        icon: Eye,
        category: 'quality',
        color: 'cyan',
        levels: createInfiniteLevels([5, 10, 25], completed.filter(s => s.video_format === '4K UHD').length),
        data: []
      },
      
      // Device achievements
      {
        id: 'mobile_master',
        name: 'Mobile Master',
        desc: 'Watch on phone',
        icon: Smartphone,
        category: 'devices',
        color: 'pink',
        levels: createInfiniteLevels([10, 25, 50], deviceCounts['Phone'] || 0),
        data: []
      },
      {
        id: 'big_screen',
        name: 'Big Screen Lover',
        desc: 'Watch on TV',
        icon: Monitor,
        category: 'devices',
        color: 'indigo',
        levels: createInfiniteLevels([10, 25, 50], deviceCounts['TV'] || 0),
        data: []
      },
      {
        id: 'laptop_viewer',
        name: 'Laptop Viewer',
        desc: 'Watch on laptop',
        icon: Laptop,
        category: 'devices',
        color: 'cyan',
        levels: createInfiniteLevels([10, 25, 50], deviceCounts['Laptop'] || 0),
        data: []
      },
      {
        id: 'multi_device',
        name: 'Multi-Device Master',
        desc: 'Use different devices',
        icon: Grid,
        category: 'devices',
        color: 'violet',
        levels: createInfiniteLevels([2, 3, 4], Object.keys(deviceCounts).length),
        data: []
      },
      {
        id: 'theater',
        name: 'Theater Goer',
        desc: 'Watch in theaters',
        icon: Film,
        category: 'devices',
        color: 'rose',
        levels: createInfiniteLevels([1, 5, 10], theaterCount),
        data: []
      },
      {
        id: 'platform_hopper',
        name: 'Platform Hopper',
        desc: 'Use different streaming platforms',
        icon: Wifi,
        category: 'devices',
        color: 'pink',
        levels: createInfiniteLevels([3, 5, 8], Object.keys(platformCounts).length),
        data: []
      },
      
      // NEW ACHIEVEMENTS - Added for enhanced engagement tracking
      {
        id: 'consistency_champion',
        name: 'Consistency Champion',
        desc: 'Watch content regularly across different weeks',
        icon: Calendar,
        category: 'engagement',
        color: 'emerald',
        levels: createInfiniteLevels([4, 8, 12], (() => {
          const weeklyActivity = {};
          completed.forEach(s => {
            const date = new Date(s.rating_submitted_at || s.updated_date);
            const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
            weeklyActivity[weekKey] = true;
          });
          return Object.keys(weeklyActivity).length;
        })()),
        data: []
      },
      {
        id: 'epic_completer',
        name: 'Epic Completer',
        desc: 'Complete series with 10+ seasons or books with 500+ pages',
        icon: Crown,
        category: 'engagement',
        color: 'gold',
        levels: createInfiniteLevels([1, 3, 5], (() => {
          const epicTitles = new Set();
          completed.forEach(s => {
            const media = mediaMap[s.media_id];
            if (!media) return;
            if ((media.type === 'series' && media.seasons_count >= 10) || 
                (media.type === 'book' && media.total_pages >= 500)) {
              epicTitles.add(s.media_id);
            }
          });
          return epicTitles.size;
        })()),
        data: []
      },
      {
        id: 'platform_explorer',
        name: 'Platform Explorer',
        desc: 'Watch content across 5+ different streaming platforms',
        icon: Globe,
        category: 'exploration',
        color: 'blue',
        levels: createInfiniteLevels([3, 5, 8], Object.keys(platformCounts).length),
        data: []
      },
      {
        id: 'balanced_viewer',
        name: 'Balanced Viewer',
        desc: 'Maintain variety by watching movies, series, and books',
        icon: Layers,
        category: 'engagement',
        color: 'violet',
        levels: createInfiniteLevels([5, 15, 30], (() => {
          const hasMovies = movieCount > 0;
          const hasSeries = uniqueSeries > 0;
          const hasBooks = uniqueBooks > 0;
          const types = [hasMovies, hasSeries, hasBooks].filter(Boolean).length;
          return types === 3 ? Math.min(movieCount, uniqueSeries, uniqueBooks) : 0;
        })()),
        data: []
      },
      {
        id: 'social_watcher',
        name: 'Social Watcher',
        desc: 'Watch content with friends or family (added viewers)',
        icon: Users,
        category: 'engagement',
        color: 'amber',
        levels: createInfiniteLevels([5, 10, 25], completed.filter(s => s.viewers && s.viewers.length > 0).length),
        data: []
      },
      {
        id: 'genre_sampler',
        name: 'Genre Sampler',
        desc: 'Explore at least 3 titles from 5 different genres',
        icon: Sparkles,
        category: 'exploration',
        color: 'pink',
        levels: createInfiniteLevels([3, 5, 8], (() => {
          return Object.values(genreCounts).filter(count => count >= 3).length;
        })()),
        data: []
      },
      {
        id: 'comeback_king',
        name: 'Comeback King',
        desc: 'Resume and complete paused content',
        icon: Repeat,
        category: 'engagement',
        color: 'teal',
        levels: createInfiniteLevels([3, 10, 20], completed.filter(s => s.status === 'completed' && s.elapsed_seconds > 0).length),
        data: []
      },
      {
        id: 'punctual_watcher',
        name: 'Punctual Watcher',
        desc: 'Complete scheduled content within 24 hours of scheduled time',
        icon: Target,
        category: 'engagement',
        color: 'emerald',
        levels: createInfiniteLevels([5, 15, 30], (() => {
          return completed.filter(s => {
            if (!s.scheduled_date) return false;
            const scheduled = new Date(s.scheduled_date);
            const completed = new Date(s.rating_submitted_at || s.updated_date);
            const diffHours = (completed - scheduled) / (1000 * 60 * 60);
            return diffHours >= 0 && diffHours <= 24;
          }).length;
        })()),
        data: []
      },
      {
        id: 'completion_master',
        name: 'Completion Master',
        desc: 'Maintain 80%+ completion rate (completed vs scheduled)',
        icon: Shield,
        category: 'engagement',
        color: 'cyan',
        levels: createInfiniteLevels([10, 25, 50], (() => {
          const totalScheduled = completedSchedules.length + completed.length;
          const completionRate = totalScheduled > 0 ? (completed.length / totalScheduled) : 0;
          return completionRate >= 0.8 ? completed.length : 0;
        })()),
        data: []
      },
      {
        id: 'mixed_media_maestro',
        name: 'Mixed Media Maestro',
        desc: 'Complete at least 5 movies, 5 episodes, and 3 books',
        icon: Library,
        category: 'content',
        color: 'indigo',
        levels: createInfiniteLevels([1, 2, 3], (() => {
          const hasMovies = movieCount >= 5;
          const hasEpisodes = seriesEpisodes >= 5;
          const hasBooks = uniqueBooks >= 3;
          return (hasMovies && hasEpisodes && hasBooks) ? 1 : 0;
        })()),
        data: []
      },
      
      // Genre-specific achievements
      ...Object.entries(genreCounts).slice(0, 10).map(([genre, count], idx) => ({
        id: `genre_${genre.toLowerCase()}`,
        name: `${genre} Fan`,
        desc: `${genre} titles watched`,
        icon: Target,
        category: 'genres',
        color: ['pink', 'purple', 'blue', 'emerald', 'amber', 'indigo', 'cyan', 'violet', 'teal', 'rose'][idx % 10],
        levels: createInfiniteLevels([5, 10, 25], count),
        data: []
      }))
    ];

    return allAchievements;
  }, [completedSchedules, mediaMap, mediaList]);
}