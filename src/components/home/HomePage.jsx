import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Bell, Film, Tv, TrendingUp, Play, AlertCircle, Sparkles, Star, Award, Users, Trophy, Book, Activity, Moon, Zap } from "lucide-react";
import WatchPartyButton from "../watchparty/WatchPartyButton";
import { format, isToday, isTomorrow, isThisWeek, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import CountdownTimer from "../schedule/CountdownTimer";
import { Clock as ClockIcon } from "lucide-react";
import AchievementsBadges from "./AchievementsBadges";
import TodaysScheduleTimeline from "./TodaysScheduleTimeline";
import FloatingSmartIcons, { SmartPanel } from "./FloatingSmartIcons";
import ReleasesPanel from "./ReleasesPanel";
import RecommendationsPanel from "./RecommendationsPanel";
import NewsPanel from "./NewsPanel";

export default function HomePage({ schedules, mediaMap, user, onWatch, onSchedule, onViewSchedule, onViewHistory, onViewTimeline, onViewLibrary, userPermissions, onNavigateToMedia, FloatingBubbles, userPreferences, onOpenAddFormWithData }) {
  const [quickStats, setQuickStats] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [seasonalInsights, setSeasonalInsights] = useState([]);
  const [fatigueAlert, setFatigueAlert] = useState(null);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [smartNotifications, setSmartNotifications] = useState([]);
  const [activePanel, setActivePanel] = useState(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get recently added titles and recommendations
  useEffect(() => {
    const allMedia = Object.values(mediaMap);
    const recent = allMedia.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);
    setRecentlyAdded(recent);
    
    // Get unscheduled recommendations with episode info
    const scheduledIds = new Set(schedules.filter(s => s.status !== 'completed').map(s => s.media_id));
    const unwatched = allMedia.filter(m => m.status !== 'watched' && !scheduledIds.has(m.id));
    
    // For series, find next episode to watch
    const withEpisodeInfo = unwatched.map(m => {
      if (m.type === 'series') {
        const completedEpisodes = schedules.filter(s => s.media_id === m.id && s.status === 'completed');
        if (completedEpisodes.length > 0) {
          const lastCompleted = completedEpisodes[completedEpisodes.length - 1];
          const nextSeason = lastCompleted.season_number || 1;
          const nextEpisode = (lastCompleted.episode_number || 0) + 1;
          const episodesInSeason = m.episodes_per_season?.[nextSeason - 1] || 0;
          
          if (nextEpisode <= episodesInSeason) {
            return { ...m, nextSeason, nextEpisode };
          } else if (nextSeason < (m.seasons_count || 0)) {
            return { ...m, nextSeason: nextSeason + 1, nextEpisode: 1 };
          }
        } else {
          return { ...m, nextSeason: 1, nextEpisode: 1 };
        }
      }
      return m;
    });
    
    // Prioritize by rating, then by year
    const sorted = withEpisodeInfo.sort((a, b) => {
      if (a.rating && b.rating) return b.rating - a.rating;
      if (a.rating) return -1;
      if (b.rating) return 1;
      return (b.year || 0) - (a.year || 0);
    }).slice(0, 5);
    
    setRecommendations(sorted);
  }, [mediaMap, schedules]);

  // Get today's and upcoming schedules
  const todaySchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.status === 'completed') return false;
      return isToday(new Date(s.scheduled_date));
    }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)).slice(0, 5);
  }, [schedules]);
  
  const nextSchedule = useMemo(() => {
    const upcoming = schedules.filter(s => s.status === 'scheduled' && new Date(s.scheduled_date) > new Date())
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    return upcoming[0];
  }, [schedules]);

  const nextScheduleMedia = useMemo(() => {
    if (!nextSchedule) return null;
    return mediaMap[nextSchedule.media_id];
  }, [nextSchedule, mediaMap]);

  const upcomingSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.status === 'completed') return false;
      const date = new Date(s.scheduled_date);
      return !isToday(date) && isThisWeek(date);
    }).slice(0, 5);
  }, [schedules]);

  const notifications = useMemo(() => {
    const notifs = [];

    // Check for overdue schedules
    const overdue = schedules.filter((s) => {
      if (s.status !== 'scheduled') return false;
      return new Date(s.scheduled_date) < new Date() && s.elapsed_seconds === 0;
    });

    if (overdue.length > 0) {
      notifs.push({
        type: 'warning',
        message: `${overdue.length} scheduled ${overdue.length === 1 ? 'title' : 'titles'} overdue`,
        icon: AlertCircle
      });
    }

    // Check for in progress
    const inProgress = schedules.filter((s) => s.status === 'in_progress' || s.status === 'paused');
    if (inProgress.length > 0) {
      notifs.push({
        type: 'info',
        message: `${inProgress.length} ${inProgress.length === 1 ? 'title' : 'titles'} in progress`,
        icon: Play
      });
    }

    // Today's schedules
    if (todaySchedules.length > 0) {
      notifs.push({
        type: 'success',
        message: `${todaySchedules.length} ${todaySchedules.length === 1 ? 'title' : 'titles'} scheduled for today`,
        icon: CalendarIcon
      });
    }

    return notifs;
  }, [schedules, todaySchedules]);

  // Calculate quick stats
  const completedSchedules = useMemo(() => {
    return schedules.filter(s => s.status === 'completed');
  }, [schedules]);

  useEffect(() => {
    if (completedSchedules.length > 0) {
      const totalMinutes = completedSchedules.reduce((sum, s) => {
        const media = mediaMap[s.media_id];
        if (!media) return sum;
        let runtime = media.runtime_minutes;
        if (media.type === 'series' && s.season_number && s.episode_number) {
          const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
          if (epRuntime) runtime = epRuntime;
        }
        return sum + runtime;
      }, 0);
      
      const watchStreak = (() => {
        const sortedDates = completedSchedules.map(s => new Date(s.started_at || s.updated_date).toDateString()).sort((a, b) => new Date(b) - new Date(a));
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

      setQuickStats({
        totalHours: Math.floor(totalMinutes / 60),
        totalCount: completedSchedules.length,
        watchStreak
      });
    }
  }, [completedSchedules, mediaMap]);

  // Dynamic Seasonal Insights - Recomputed on every reload
  useEffect(() => {
    if (completedSchedules.length < 5) {
      setSeasonalInsights([]);
      return;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentSeason = currentMonth < 3 ? 'winter' : currentMonth < 6 ? 'spring' : currentMonth < 9 ? 'summer' : 'fall';
    
    const insights = [];
    const byTime = { morning: {}, afternoon: {}, evening: {}, night: {} };
    const recentMonths = {};
    
    completedSchedules.forEach(s => {
      const media = mediaMap[s.media_id];
      if (!media) return;
      
      const date = new Date(s.updated_date);
      const hour = date.getHours();
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      // Time of day patterns
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
      if (!byTime[timeSlot].count) byTime[timeSlot] = { count: 0, genres: {} };
      byTime[timeSlot].count++;
      (media.genre || []).forEach(g => {
        byTime[timeSlot].genres[g] = (byTime[timeSlot].genres[g] || 0) + 1;
      });
      
      // Recent month patterns
      if (!recentMonths[monthKey]) recentMonths[monthKey] = { count: 0, types: {}, duration: 0 };
      recentMonths[monthKey].count++;
      recentMonths[monthKey].types[media.type] = (recentMonths[monthKey].types[media.type] || 0) + 1;
      recentMonths[monthKey].duration += media.runtime_minutes || 0;
    });
    
    // Find dominant time slot
    const timeSlots = Object.entries(byTime).filter(([_, data]) => data.count > 0).sort((a, b) => b[1].count - a[1].count);
    if (timeSlots.length > 0) {
      const [slot, data] = timeSlots[0];
      const topGenre = Object.keys(data.genres).sort((a, b) => data.genres[b] - data.genres[a])[0];
      insights.push({
        text: `You watch most during ${slot} - ${data.count} titles${topGenre ? `, especially ${topGenre}` : ''}`,
        icon: Clock
      });
    }
    
    // Recent trend
    const sortedMonths = Object.entries(recentMonths).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3);
    if (sortedMonths.length > 0) {
      const [latestMonth, data] = sortedMonths[0];
      const topType = Object.entries(data.types).sort((a, b) => b[1] - a[1])[0];
      if (topType && data.count >= 3) {
        insights.push({
          text: `Recent trend: ${data.count} ${topType[0]}${topType[1] > 1 ? 's' : ''} this month`,
          icon: TrendingUp
        });
      }
    }
    
    // Consistency check
    const last30Days = completedSchedules.filter(s => {
      const daysDiff = (now - new Date(s.updated_date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });
    if (last30Days.length >= 10) {
      insights.push({
        text: `You're on fire! ${last30Days.length} titles in the last 30 days`,
        icon: Zap
      });
    } else if (last30Days.length <= 2) {
      insights.push({
        text: `Watching less lately - only ${last30Days.length} title${last30Days.length !== 1 ? 's' : ''} this month`,
        icon: Moon
      });
    }
    
    setSeasonalInsights(insights.slice(0, 3));
  }, [completedSchedules, mediaMap]);

  // Dynamic Watch Fatigue Detection - Aggregates ALL data
  useEffect(() => {
    // Include completed watches, active sessions, scheduled sessions
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Recent completed watches - USE ACTUAL WATCHED DATE
    const recentCompleted = completedSchedules.filter(s => {
      const watchedDate = new Date(s.rating_submitted_at || s.started_at || s.updated_date);
      return watchedDate >= last7Days;
    });
    
    // Active watching/paused sessions
    const activeSessions = schedules.filter(s => 
      (s.status === 'in_progress' || s.status === 'paused') && s.elapsed_seconds > 0
    );
    
    // Recently scheduled (last 7 days of scheduling activity)
    const recentlyScheduled = schedules.filter(s => 
      s.status === 'scheduled' && new Date(s.created_date) >= last7Days
    );
    
    // Calculate total watch time from completed + active progress
    const completedMinutes = recentCompleted.reduce((sum, s) => {
      const media = mediaMap[s.media_id];
      if (!media) return sum;
      let runtime = media.runtime_minutes;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      return sum + runtime;
    }, 0);
    
    const activeMinutes = activeSessions.reduce((sum, s) => {
      return sum + Math.floor(s.elapsed_seconds / 60);
    }, 0);
    
    const totalMinutes = completedMinutes + activeMinutes;
    const hours = Math.floor(totalMinutes / 60);
    
    // Check for late-night sessions (10pm - 4am) - USE ACTUAL WATCHED DATE
    const lateNightSessions = [...recentCompleted, ...activeSessions].filter(s => {
      const watchedDate = new Date(s.rating_submitted_at || s.started_at || s.scheduled_date);
      const startHour = watchedDate.getHours();
      return startHour >= 22 || startHour < 4;
    }).length;
    
    // Check for back-to-back sessions (less than 1hr gap) - USE ACTUAL WATCHED DATES
    const sortedSessions = recentCompleted.sort((a, b) => {
      const aDate = new Date(a.rating_submitted_at || a.started_at || a.updated_date);
      const bDate = new Date(b.rating_submitted_at || b.started_at || b.updated_date);
      return aDate - bDate;
    });
    let backToBackCount = 0;
    for (let i = 1; i < sortedSessions.length; i++) {
      const prevEnd = new Date(sortedSessions[i-1].rating_submitted_at || sortedSessions[i-1].updated_date);
      const currStart = new Date(sortedSessions[i].rating_submitted_at || sortedSessions[i].started_at || sortedSessions[i].updated_date);
      const gapMinutes = (currStart - prevEnd) / (1000 * 60);
      if (gapMinutes < 60) backToBackCount++;
    }
    
    // Dynamic threshold based on signals
    const fatigueScore = (
      (hours >= 15 ? 3 : hours >= 10 ? 2 : hours >= 7 ? 1 : 0) +
      (lateNightSessions >= 3 ? 2 : lateNightSessions >= 2 ? 1 : 0) +
      (backToBackCount >= 3 ? 2 : backToBackCount >= 2 ? 1 : 0) +
      (recentCompleted.length >= 10 ? 2 : recentCompleted.length >= 7 ? 1 : 0)
    );
    
    if (fatigueScore >= 4) {
      const reasons = [];
      if (hours >= 10) reasons.push(`${hours}h watch time`);
      if (lateNightSessions >= 2) reasons.push(`${lateNightSessions} late-night sessions`);
      if (backToBackCount >= 2) reasons.push(`${backToBackCount} back-to-back watches`);
      
      // Context-aware message pool
      const messagePool = {
        highHours: [
          `You've watched ${hours}h this week - impressive dedication!`,
          `${hours} hours of content this week - you're on a roll!`,
          `High watch activity: ${hours}h watched recently`
        ],
        lateNight: [
          `${lateNightSessions} late-night viewing sessions detected this week`,
          `Late-night marathon alert: ${lateNightSessions} sessions after 10pm`,
          `Night owl watching: ${lateNightSessions} late sessions this week`
        ],
        backToBack: [
          `${backToBackCount} back-to-back sessions detected - minimal breaks taken`,
          `Continuous viewing alert: ${backToBackCount} sessions with short gaps`,
          `${backToBackCount} marathon sessions with less than 1hr breaks`
        ],
        general: [
          `High watch activity detected: ${reasons.join(', ')}`,
          `Intensive viewing pattern identified: ${reasons.join(', ')}`,
          `Active watch week: ${reasons.join(', ')}`
        ]
      };
      
      // Context-aware suggestion pool
      const suggestionPool = {
        highHours: [
          'Consider taking a 1-2 hour break before your next watch',
          'Try switching to shorter content or a quick episode',
          'Your dedication is great, but rest helps enjoyment too'
        ],
        lateNight: [
          'Try scheduling your next watch earlier in the day',
          'Late viewing can affect sleep quality - consider earlier times',
          'Watch during daytime hours for better rest patterns'
        ],
        backToBack: [
          'Space out your watches with 1-2 hour breaks between sessions',
          'Try watching on a different day to spread out enjoyment',
          'Add buffer time between titles for better retention'
        ],
        deviceSwitch: [
          'Switch from large screen to mobile for lighter viewing',
          'Try reading a book or watching on a smaller device',
          'Consider switching devices for varied experience'
        ],
        contentSwitch: [
          'Try switching from movies to a quick series episode',
          'Mix it up - try a book session instead of screen time',
          'Watch something lighter or shorter for variety'
        ]
      };
      
      // Determine primary context
      let messageCategory = 'general';
      let suggestionCategory = 'highHours';
      
      if (hours >= 15) {
        messageCategory = 'highHours';
        suggestionCategory = 'highHours';
      } else if (lateNightSessions >= 3) {
        messageCategory = 'lateNight';
        suggestionCategory = 'lateNight';
      } else if (backToBackCount >= 3) {
        messageCategory = 'backToBack';
        suggestionCategory = 'backToBack';
      } else if (lateNightSessions >= 2) {
        messageCategory = 'lateNight';
        suggestionCategory = 'lateNight';
      } else if (backToBackCount >= 2) {
        messageCategory = 'backToBack';
        suggestionCategory = 'backToBack';
      } else if (hours >= 10) {
        messageCategory = 'highHours';
        suggestionCategory = Math.random() < 0.5 ? 'contentSwitch' : 'deviceSwitch';
      }
      
      // Get last shown message to avoid repetition
      const lastShownKey = 'fatigue_last_message';
      const lastShown = localStorage.getItem(lastShownKey);
      
      // Select message (avoid repeating last one)
      const messages = messagePool[messageCategory];
      let selectedMessage = messages[Math.floor(Math.random() * messages.length)];
      
      if (lastShown && messages.includes(lastShown)) {
        const otherMessages = messages.filter(m => m !== lastShown);
        if (otherMessages.length > 0) {
          selectedMessage = otherMessages[Math.floor(Math.random() * otherMessages.length)];
        }
      }
      
      // Select suggestion
      const suggestions = suggestionPool[suggestionCategory];
      const selectedSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      
      // Store selected message
      localStorage.setItem(lastShownKey, selectedMessage);
      
      setFatigueAlert({
        message: selectedMessage,
        suggestion: selectedSuggestion
      });
    } else {
      setFatigueAlert(null);
    }
  }, [schedules, completedSchedules, mediaMap]);

  // Hidden gems
  useEffect(() => {
    const allMedia = Object.values(mediaMap);
    const watchCounts = {};
    
    completedSchedules.forEach(s => {
      watchCounts[s.media_id] = (watchCounts[s.media_id] || 0) + 1;
    });
    
    const gems = allMedia
      .filter(m => m.rating >= 4 && (watchCounts[m.id] || 0) <= 1)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
    
    setHiddenGems(gems);
  }, [mediaMap, completedSchedules]);

  // Truly Dynamic Smart Notifications - Cross-page aware
  useEffect(() => {
    const now = new Date();
    const notifications = [];
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Helper: Check if a schedule was actively watched today (not just added to history)
    const wasWatchedToday = (schedule) => {
      const today = new Date().toDateString();
      
      // Check if any active watch activity happened today
      const startedToday = schedule.started_at && new Date(schedule.started_at).toDateString() === today;
      const resumedToday = schedule.last_resumed_at && new Date(schedule.last_resumed_at).toDateString() === today;
      const completedToday = schedule.rating_submitted_at && new Date(schedule.rating_submitted_at).toDateString() === today;
      
      return startedToday || resumedToday || completedToday;
    };
    
    // 1. Upcoming soon (within 10 minutes)
    schedules.forEach(s => {
      if (s.status !== 'scheduled') return;
      const scheduleTime = new Date(s.scheduled_date);
      const diffMinutes = (scheduleTime - now) / (1000 * 60);
      
      if (diffMinutes > 0 && diffMinutes <= 10) {
        const media = mediaMap[s.media_id];
        if (media) {
          notifications.push({
            type: 'upcoming',
            priority: 10,
            message: `"${media.title}" starts in ${Math.round(diffMinutes)} minutes!`,
            scheduleId: s.id
          });
        }
      }
    });
    
    // 2. Overdue schedules (more than 30 min late)
    const overdueSchedules = schedules.filter(s => {
      if (s.status !== 'scheduled') return false;
      const diffMinutes = (now - new Date(s.scheduled_date)) / (1000 * 60);
      return diffMinutes > 30 && s.elapsed_seconds === 0;
    });
    
    if (overdueSchedules.length >= 3) {
      notifications.push({
        type: 'delayed',
        priority: 8,
        message: `${overdueSchedules.length} titles are waiting for you - catch up soon!`
      });
    }
    
    // 3. Paused sessions reminder (paused for 1+ days)
    const stuckPaused = schedules.filter(s => {
      if (s.status !== 'paused') return false;
      const hoursSincePause = (now - new Date(s.updated_date)) / (1000 * 60 * 60);
      return hoursSincePause >= 24;
    });
    
    if (stuckPaused.length > 0) {
      const media = mediaMap[stuckPaused[0].media_id];
      notifications.push({
        type: 'info',
        priority: 6,
        message: `"${media?.title}" has been paused for a while - ready to resume?`
      });
    }
    
    // 4. Streak at risk (watched yesterday but not today, after 8pm)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    const last24Hours = completedSchedules.filter(s => wasWatchedToday(s) || (
      (s.started_at && new Date(s.started_at).toDateString() === yesterdayStr) ||
      (s.last_resumed_at && new Date(s.last_resumed_at).toDateString() === yesterdayStr) ||
      (s.rating_submitted_at && new Date(s.rating_submitted_at).toDateString() === yesterdayStr)
    ));
    
    const todayWatches = completedSchedules.filter(s => wasWatchedToday(s));
    
    if (last24Hours.length > 0 && todayWatches.length === 0 && now.getHours() >= 20) {
      notifications.push({
        type: 'warning',
        priority: 7,
        message: `Your watch streak is at risk! Watch something today to keep it going`
      });
    }
    
    // 5. High activity alert (actively watched 3+ items today)
    const todayActivelyWatched = completedSchedules.filter(s => wasWatchedToday(s));
    const todayCount = todayActivelyWatched.length;
    
    if (todayCount >= 3) {
      notifications.push({
        type: 'success',
        priority: 5,
        message: `You've already watched ${todayCount} titles today! You're on fire!`
      });
    }
    
    // 6. Unwatched library reminder
    const unwatchedCount = Object.values(mediaMap).filter(m => m.status === 'unwatched').length;
    const recentActivity = completedSchedules.filter(s => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      return (s.started_at && new Date(s.started_at) >= threeDaysAgo) ||
             (s.last_resumed_at && new Date(s.last_resumed_at) >= threeDaysAgo) ||
             (s.rating_submitted_at && new Date(s.rating_submitted_at) >= threeDaysAgo);
    }).length;
    
    if (unwatchedCount > 10 && recentActivity === 0) {
      notifications.push({
        type: 'info',
        priority: 4,
        message: `You have ${unwatchedCount} unwatched titles collecting dust - explore your library!`
      });
    }
    
    // Sort by priority and take top 3
    setSmartNotifications(
      notifications
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3)
    );
  }, [schedules, mediaMap, currentTime, completedSchedules]);



  const greeting = useMemo(() => {
    const movieQuotes = [
      '"May the Force be with you"', '"I\'ll be back"', '"Here\'s looking at you, kid"', '"You talking to me?"', '"Life is like a box of chocolates"',
      '"I see dead people"', '"Houston, we have a problem"', '"Show me the money!"', '"Why so serious?"', '"To infinity and beyond!"',
      '"Just keep swimming"', '"Hakuna Matata"', '"I am inevitable"', '"With great power comes great responsibility"', '"This is the way"',
      '"You can\'t handle the truth!"', '"I\'m king of the world!"', '"Carpe diem. Seize the day"', '"Elementary, my dear Watson"', '"There\'s no place like home"',
      '"E.T. phone home"', '"You had me at hello"', '"Nobody puts Baby in a corner"', '"I\'m the king of the world!"', '"Keep your friends close, but your enemies closer"',
      '"Say hello to my little friend!"', '"The first rule is: you do not talk about Fight Club"', '"Hasta la vista, baby"', '"My precious"', '"I\'ll have what she\'s having"',
      '"You\'re gonna need a bigger boat"', '"Frankly, my dear, I don\'t give a damn"', '"I feel the need - the need for speed!"', '"Why so serious?"', '"I am your father"',
      '"Go ahead, make my day"', '"A martini. Shaken, not stirred"', '"Roads? Where we\'re going we don\'t need roads"', '"I\'ll never let go, Jack"', '"I\'m walking here!"',
      '"Fasten your seatbelts. It\'s going to be a bumpy night"', '"You can\'t fight in here! This is the War Room!"', '"Open the pod bay doors, HAL"', '"All right, Mr. DeMille, I\'m ready for my close-up"',
      '"Magic Mirror on the wall, who is the fairest one of all?"', '"We\'ll always have Paris"', '"I\'m as mad as hell, and I\'m not going to take this anymore!"', '"Round up the usual suspects"',
      '"I love the smell of napalm in the morning"', '"Louis, I think this is the beginning of a beautiful friendship"', '"A boy\'s best friend is his mother"', '"Greed, for lack of a better word, is good"',
      '"Keep your friends close, but your enemies closer"', '"As God is my witness, I\'ll never be hungry again"', '"Well, nobody\'s perfect"', '"It\'s alive! It\'s alive!"',
      '"Listen to them. Children of the night. What music they make!"', '"Oh, no, it wasn\'t the airplanes. It was Beauty killed the Beast"', '"There\'s no crying in baseball!"',
      '"La-dee-da, la-dee-da"', '"A census taker once tried to test me. I ate his liver with some fava beans and a nice Chianti"', '"Bond. James Bond"',
      '"You\'re killin\' me, Smalls!"', '"Smokey, this is not \'Nam. This is bowling. There are rules"', '"I\'m not bad. I\'m just drawn that way"',
      '"Toga! Toga!"', '"Listen to me, mister. You\'re my knight in shining armor"', '"Tell \'em to go out there with all they got and win just one for the Gipper"',
      '"A million dollars isn\'t cool. You know what\'s cool? A billion dollars"', '"I\'m the dude. So that\'s what you call me"', '"That\'s what I love about these high school girls, man. I get older, they stay the same age"',
      '"My mama always said life was like a box of chocolates. You never know what you\'re gonna get"', '"Stupid is as stupid does"', '"I\'m having an old friend for dinner"',
      '"You is kind. You is smart. You is important"', '"They may take our lives, but they\'ll never take our freedom!"', '"I drink your milkshake!"',
      '"There\'s a shortage of perfect breasts in this world. It would be a pity to damage yours"', '"Hello. My name is Inigo Montoya. You killed my father. Prepare to die"',
      '"Have fun storming the castle!"', '"As you wish"', '"Inconceivable!"', '"You keep using that word. I do not think it means what you think it means"',
      '"Life moves pretty fast. If you don\'t stop and look around once in a while, you could miss it"', '"Bueller? Bueller? Bueller?"',
      '"I\'m not going to be ignored, Dan!"', '"Warriors, come out to play!"', '"Wax on, wax off"', '"Sweep the leg"',
      '"I am serious. And don\'t call me Shirley"', '"Surely you can\'t be serious"', '"I picked the wrong week to quit smoking"',
      '"You guys give up, or are you thirsty for more?"', '"I\'m your huckleberry"', '"Say hello to my little friend!"',
      '"Every time a bell rings, an angel gets his wings"', '"No man is a failure who has friends"', '"Strange things are afoot at the Circle K"',
      '"Excellent!"', '"Party on, Wayne!"', '"We\'re not worthy!"', '"If you build it, he will come"',
      '"Get busy living, or get busy dying"', '"I guess it comes down to a simple choice, really. Get busy living or get busy dying"',
      '"Hope is a good thing, maybe the best of things, and no good thing ever dies"', '"Some birds aren\'t meant to be caged"',
      '"I have to remind myself that some birds aren\'t meant to be caged"', '"Forget it, Jake. It\'s Chinatown"',
      '"I\'m going to make him an offer he can\'t refuse"', '"A person is smart. People are dumb, panicky dangerous animals"',
      '"Old and busted. New hotness"', '"They call me MISTER Tibbs!"', '"What we\'ve got here is failure to communicate"',
      '"I coulda had class. I coulda been a contender. I coulda been somebody"', '"Winning isn\'t everything, it\'s the only thing"',
      '"Show me the money!"', '"You complete me"', '"Help me, help you"', '"The stuff that dreams are made of"',
      '"We rob banks"', '"Made it, Ma! Top of the world!"', '"I\'m walking here! I\'m walking here!"',
      '"Plastics"', '"We\'ll always have Paris"', '"Of all the gin joints in all the towns in all the world, she walks into mine"',
      '"Play it, Sam. Play \'As Time Goes By\'"', '"We\'ll always have Paris"', '"Here\'s Johnny!"',
      '"All work and no play makes Jack a dull boy"', '"They\'re here!"', '"Be afraid. Be very afraid"',
      '"I see you"', '"One ring to rule them all"', '"Even the smallest person can change the course of the future"',
      '"You shall not pass!"', '"My precious"', '"It\'s the job that\'s never started as takes longest to finish"',
      '"Not all those who wander are lost"', '"All we have to decide is what to do with the time that is given us"',
      '"The board is set, the pieces are moving"', '"I am Iron Man"', '"Avengers, assemble!"',
      '"I can do this all day"', '"I am Groot"', '"We are Groot"', '"Wakanda forever!"',
      '"I\'m always angry"', '"That\'s my secret, Cap. I\'m always angry"', '"Puny god"',
      '"We have a Hulk"', '"Doth mother know you weareth her drapes?"', '"I understood that reference"',
      '"I\'m Mary Poppins, y\'all!"', '"I\'m with you \'til the end of the line"', '"I could do this all day"',
      '"I love you 3000"', '"Part of the journey is the end"', '"Whatever it takes"',
      '"On your left"', '"I can do this all day"', '"The city is flying and we\'re fighting an army of robots"',
      '"There are no strings on me"', '"I had strings, but now I\'m free"', '"Language!"',
      '"If you\'re nothing without this suit, then you shouldn\'t have it"', '"With great power comes great responsibility"',
      '"Does whatever a spider can"', '"I\'m Batman"', '"Why do we fall? So we can learn to pick ourselves up"',
      '"It\'s not who I am underneath, but what I do that defines me"', '"Some men just want to watch the world burn"',
      '"You either die a hero or live long enough to see yourself become the villain"', '"The night is darkest just before the dawn"',
      '"I believe whatever doesn\'t kill you, simply makes you stranger"', '"Do I really look like a guy with a plan?"',
      '"Let\'s put a smile on that face!"', '"Very poor choice of words"', '"This city deserves a better class of criminal"',
      '"Madness, as you know, is like gravity. All it takes is a little push"', '"I\'m not a monster. I\'m just ahead of the curve"',
      '"The Joker is a dog chasing cars"', '"You complete me"', '"In brightest day, in blackest night"',
      '"Hope begins in the dark"', '"Men are still good"', '"The world only makes sense if you force it to"',
      '"I thought my life was a tragedy, but now I realize, it\'s a comedy"', '"All I have are negative thoughts"',
      '"Is it just me, or is it getting crazier out there?"', '"You get what you deserve"', '"What do you get when you cross a mentally ill loner with a society that abandons him?"',
      '"May the odds be ever in your favor"', '"I volunteer as tribute!"', '"Fire is catching! And if we burn, you burn with us!"',
      '"Remember who the real enemy is"', '"Hope, it is the only thing stronger than fear"', '"Destroying things is much easier than making them"',
      '"If we burn, you burn with us!"', '"Ladies and gentlemen, welcome to the 76th Hunger Games!"',
      '"People will do anything for you, when you\'re kind"', '"Nobody\'s born being prejudiced"',
      '"I am a leaf on the wind. Watch how I soar"', '"Can\'t stop the signal"', '"We\'ve done the impossible, and that makes us mighty"',
      '"I swear by my pretty floral bonnet, I will end you"', '"The special hell"', '"I\'m a big damn hero"',
      '"Going on a year now I ain\'t had nothin\' twixt my nethers weren\'t run on batteries"', '"Curse your sudden but inevitable betrayal!"',
      '"Two by two, hands of blue"', '"You can\'t stop the signal, Mal"', '"I\'m a leaf on the wind"',
      '"That\'s impossible!" "No, it\'s necessary"', '"Love is the one thing we\'re capable of perceiving that transcends time and space"',
      '"We used to look up at the sky and wonder at our place in the stars. Now we just look down and worry about our place in the dirt"',
      '"Do not go gentle into that good night"', '"Mankind was born on Earth. It was never meant to die here"',
      '"We will find a way. We always have"', '"Maybe we\'ve spent too long trying to figure all this out with theory"',
      '"It\'s not possible." "No, it\'s necessary"', '"Murphy\'s law doesn\'t mean that something bad will happen"',
      '"This world\'s a treasure, but it\'s been telling us to leave for a while now"', '"Once you\'re a parent, you\'re the ghost of your children\'s future"',
      '"I\'m not afraid of death. I\'m an old physicist. I\'m afraid of time"', '"We\'re still pioneers, we barely begun"',
      '"First, we\'ll kill him. Then I\'ll go to Texas and I\'ll kill him again"', '"I ain\'t got time to bleed"',
      '"Stick around"', '"Get to the chopper!"', '"If it bleeds, we can kill it"',
      '"You are one ugly motherf***er"', '"Run! Get to the chopper!"', '"Knock, knock"',
      '"Who\'s your daddy and what does he do?"', '"It\'s not a tumor!"', '"Stop whining!"',
      '"Consider that a divorce"', '"See you at the party, Richter!"', '"Get your a** to Mars"',
      '"Come with me if you want to live"', '"I\'ll be back"', '"Hasta la vista, baby"',
      '"She\'ll be back"', '"No problemo"', '"Talk to the hand"',
      '"That\'s what she said"', '"I declare bankruptcy!"', '"I am Beyoncé, always"',
      '"That\'s what he said"', '"I\'m not superstitious, but I am a little stitious"', '"Sometimes I\'ll start a sentence and I don\'t even know where it\'s going"',
      '"Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me"',
      '"I\'m an early bird and a night owl. So I\'m wise and I have worms"', '"You miss 100% of the shots you don\'t take"',
      '"Winter is coming"', '"A Lannister always pays his debts"', '"The night is dark and full of terrors"',
      '"Valar Morghulis"', '"When you play the game of thrones, you win or you die"', '"Chaos isn\'t a pit. Chaos is a ladder"',
      '"The man who passes the sentence should swing the sword"', '"A reader lives a thousand lives before he dies"',
      '"Never forget what you are. The rest of the world will not"', '"Power resides where men believe it resides"',
      '"The things I do for love"', '"Hodor"', '"I drink and I know things"',
      '"That\'s what I do: I drink and I know things"', '"A mind needs books as a sword needs a whetstone"',
      '"When people ask you what happened here, tell them the North remembers"', '"The North remembers"',
      '"I am the sword in the darkness. I am the watcher on the walls"', '"I am the fire that burns against the cold"',
      '"I\'m in the empire business"', '"Say my name"', '"I am the one who knocks"',
      '"Yeah, science!"', '"We\'re done when I say we\'re done"', '"I did it for me"',
      '"Tread lightly"', '"No more half-measures"', '"I am not in danger, I am the danger"',
      '"You\'re goddamn right"', '"Yeah, Mr. White! Yeah, science!"', '"Better call Saul"',
      '"I won"', '"All hail the king"', '"It\'s all good, man"',
      '"How you doing?"', '"We were on a break!"', '"Pivot! Pivot! Pivot!"',
      '"It\'s like all my life everyone has always told me, \'You\'re a shoe!\'"', '"I\'m not great at the advice. Can I interest you in a sarcastic comment?"',
      '"Welcome to the real world. It sucks. You\'re gonna love it"', '"Could I BE wearing any more clothes?"',
      '"Oh. My. God."', '"Smelly cat, smelly cat, what are they feeding you?"', '"We were on a break!"',
      '"The cushions are the essence of the chair!"', '"Unagi"', '"How YOU doin\'?"',
      '"That\'s a moo point"', '"I\'m hopeless and awkward and desperate for love!"', '"It\'s not that common, it doesn\'t happen to every guy, and it IS a big deal!"',
      '"Challenge accepted!"', '"Suit up!"', '"It\'s gonna be legen... wait for it... dary!"',
      '"When I get sad, I stop being sad and be awesome instead"', '"Nothing good happens after 2 A.M."',
      '"Have you met Ted?"', '"True story"', '"Haaaaave you met Ted?"',
      '"That\'s the dream"', '"A lie is just a great story that someone ruined with the truth"',
      '"D\'oh!"', '"Eat my shorts!"', '"Don\'t have a cow, man"',
      '"Ay, caramba!"', '"I didn\'t do it"', '"Why you little—!"',
      '"Mmm... donuts"', '"Kids, you tried your best and you failed miserably. The lesson is, never try"',
      '"To alcohol! The cause of, and solution to, all of life\'s problems"', '"I\'m normally not a praying man, but if you\'re up there, please save me Superman!"',
      '"I\'m in danger"', '"Ha ha!"', '"Everything\'s coming up Milhouse!"',
      '"It\'s a trap!"', '"Do or do not. There is no try"', '"Fear is the path to the dark side"',
      '"In my experience there is no such thing as luck"', '"The Force will be with you. Always"',
      '"Your eyes can deceive you. Don\'t trust them"', '"I find your lack of faith disturbing"',
      '"The Force is strong with this one"', '"I have a bad feeling about this"', '"These aren\'t the droids you\'re looking for"',
      '"Help me, Obi-Wan Kenobi. You\'re my only hope"', '"I am your father"', '"No, I am your father"',
      '"Luke, I am your father"', '"There is no try"', '"Only a Sith deals in absolutes"',
      '"Hello there"', '"General Kenobi"', '"You are a bold one"',
      '"This is where the fun begins"', '"I don\'t like sand"', '"Now this is podracing!"',
      '"Yippee!"', '"Are you an angel?"', '"I\'ll try spinning, that\'s a good trick"',
      '"It\'s over, Anakin! I have the high ground!"', '"You underestimate my power!"', '"Don\'t try it"',
      '"You were the chosen one!"', '"I hate you!"', '"You were my brother, Anakin"',
      '"I loved you"', '"Execute Order 66"', '"Good soldiers follow orders"',
      '"This is the way"', '"I have spoken"', '"Weapons are part of my religion"',
      '"I can bring you in warm, or I can bring you in cold"', '"Wherever I go, he goes"',
      '"That\'s my line"', '"I like those odds"', '"Never tell me the odds!"'
    ];
    
    return movieQuotes[Math.floor(Math.random() * movieQuotes.length)];
  }, []); // Empty deps - only runs on mount

  const canWatch = user?.role === 'admin' || userPermissions?.can_watch;
  const canSchedule = user?.role === 'admin' || userPermissions?.can_schedule;

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}>

        <Card className="bg-gradient-to-br from-purple-500/10 via-emerald-500/10 to-zinc-900/80 border-purple-500/30 overflow-hidden hover-shadow-purple w-full">
          <CardContent className="p-3 sm:p-4 md:p-8">
            <div className="flex flex-col gap-3 mb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                  <Sparkles className="w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8 text-amber-400 flex-shrink-0 mt-0.5" />
                  <h2 className="text-sm sm:text-lg md:text-xl font-bold text-white break-words leading-tight">
                    {greeting}, {user?.full_name || 'Movie Lover'}!
                  </h2>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-base md:text-xl font-bold text-white whitespace-nowrap">
                      {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                    <div className="text-[10px] sm:text-xs text-zinc-400 whitespace-nowrap">
                      {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {user?.profile_picture && (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-amber-400 object-cover flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 break-words">Welcome back to CineTracker. Ready for your next watch?</p>
            
            {/* Watch Party Quick Access */}
            <div className="mb-3">
              <WatchPartyButton 
                media={null} 
                schedule={null}
                size="sm"
                className="w-full sm:w-auto"
              />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 md:gap-3">
              <button onClick={() => onViewLibrary?.('movie')} className="bg-zinc-800/60 hover:bg-zinc-800 p-2 md:p-3 rounded-xl transition-all border border-zinc-700 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] text-left group">
                <Film className="w-4 md:w-5 h-4 md:h-5 text-amber-400 mb-1 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                <div className="text-base md:text-lg font-bold text-white">{Object.values(mediaMap).filter((m) => m.type === 'movie').length}</div>
                <div className="text-[10px] text-zinc-400">Movies</div>
              </button>
              <button onClick={() => onViewLibrary?.('series')} className="bg-zinc-800/60 hover:bg-zinc-800 p-2 md:p-3 rounded-xl transition-all border border-zinc-700 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] text-left group">
                <Tv className="w-4 md:w-5 h-4 md:h-5 text-purple-400 mb-1 group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                <div className="text-base md:text-lg font-bold text-white">{Object.values(mediaMap).filter((m) => m.type === 'series').length}</div>
                <div className="text-[10px] text-zinc-400">Series</div>
              </button>
              <button onClick={() => onViewLibrary?.('book')} className="bg-zinc-800/60 hover:bg-zinc-800 p-2 md:p-3 rounded-xl transition-all border border-zinc-700 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] text-left group">
                <Book className="w-4 md:w-5 h-4 md:h-5 text-blue-400 mb-1 group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <div className="text-base md:text-lg font-bold text-white">{Object.values(mediaMap).filter((m) => m.type === 'book').length}</div>
                <div className="text-[10px] text-zinc-400">Books</div>
              </button>
              {quickStats && (
                <>
                  <button onClick={() => onViewHistory?.()} className="bg-zinc-800/60 hover:bg-zinc-800 p-2 md:p-3 rounded-xl transition-all border border-zinc-700 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] text-left group">
                    <Clock className="w-4 md:w-5 h-4 md:h-5 text-emerald-400 mb-1 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    <div className="text-base md:text-lg font-bold text-white">{quickStats.totalHours}h</div>
                    <div className="text-[10px] text-zinc-400">Watched</div>
                  </button>
                  <button onClick={() => onViewHistory?.()} className="bg-zinc-800/60 hover:bg-zinc-800 p-2 md:p-3 rounded-xl transition-all border border-zinc-700 hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] text-left group">
                    <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-pink-400 mb-1 group-hover:drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
                    <div className="text-base md:text-lg font-bold text-white">{quickStats.watchStreak}</div>
                    <div className="text-[10px] text-zinc-400">Day Streak</div>
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Layout - Left: Notifications/Insights, Right: Today's Schedule/Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Smart Notifications */}
          {(notifications.length > 0 || smartNotifications.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-zinc-900/80 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-slate-50 text-base md:text-lg font-semibold tracking-tight flex items-center gap-2">
                    <Bell className="w-4 md:w-5 h-4 md:h-5 text-amber-500" />
                    Smart Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {smartNotifications.map((notif, idx) => (
                      <div
                        key={`smart-${idx}`}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${
                          notif.type === 'upcoming' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                          notif.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
                          notif.type === 'success' ? 'bg-purple-500/10 border border-purple-500/30' :
                          notif.type === 'info' ? 'bg-blue-500/10 border border-blue-500/30' :
                          'bg-orange-500/10 border border-orange-500/30'
                        }`}
                      >
                        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                          notif.type === 'upcoming' ? 'text-emerald-400' :
                          notif.type === 'warning' ? 'text-amber-400' :
                          notif.type === 'success' ? 'text-purple-400' :
                          notif.type === 'info' ? 'text-blue-400' :
                          'text-orange-400'
                        }`} />
                        <span className="text-white text-xs sm:text-sm break-words">
                          {notif.message}
                        </span>
                      </div>
                    ))}
                  {notifications.map((notif, idx) => {
                    // Add type label to notifications
                    const typeBreakdown = { movies: 0, series: 0, books: 0 };
                    schedules.forEach(s => {
                      const media = mediaMap[s.media_id];
                      if (notif.type === 'warning' && s.status === 'scheduled' && new Date(s.scheduled_date) < new Date() && s.elapsed_seconds === 0) {
                        if (media?.type === 'movie') typeBreakdown.movies++;
                        else if (media?.type === 'series') typeBreakdown.series++;
                        else if (media?.type === 'book') typeBreakdown.books++;
                      } else if (notif.type === 'info' && (s.status === 'in_progress' || s.status === 'paused')) {
                        if (media?.type === 'movie') typeBreakdown.movies++;
                        else if (media?.type === 'series') typeBreakdown.series++;
                        else if (media?.type === 'book') typeBreakdown.books++;
                      } else if (notif.type === 'success' && isToday(new Date(s.scheduled_date)) && s.status !== 'completed') {
                        if (media?.type === 'movie') typeBreakdown.movies++;
                        else if (media?.type === 'series') typeBreakdown.series++;
                        else if (media?.type === 'book') typeBreakdown.books++;
                      }
                    });

                    const typeDetails = [
                      typeBreakdown.movies > 0 ? `${typeBreakdown.movies} ${typeBreakdown.movies === 1 ? 'movie' : 'movies'}` : '',
                      typeBreakdown.series > 0 ? `${typeBreakdown.series} ${typeBreakdown.series === 1 ? 'series' : 'series'}` : '',
                      typeBreakdown.books > 0 ? `${typeBreakdown.books} ${typeBreakdown.books === 1 ? 'book' : 'books'}` : ''
                    ].filter(Boolean).join(', ');

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-2 md:p-3 rounded-lg ${
                          notif.type === 'warning' ? 'bg-orange-500/10 border border-orange-500/30' :
                          notif.type === 'info' ? 'bg-blue-500/10 border border-blue-500/30' :
                          'bg-emerald-500/10 border border-emerald-500/30'
                        }`}
                      >
                        <notif.icon className={`w-4 md:w-5 h-4 md:h-5 flex-shrink-0 ${
                          notif.type === 'warning' ? 'text-orange-400' :
                          notif.type === 'info' ? 'text-blue-400' :
                          'text-emerald-400'
                        }`} />
                        <div className="flex-1">
                          <span className="text-white text-xs md:text-sm block">{notif.message}</span>
                          {typeDetails && (
                            <span className="text-zinc-400 text-[10px] md:text-xs">({typeDetails})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Watch Fatigue Alert */}
          {fatigueAlert && userPreferences?.show_watch_fatigue_alerts !== false && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 md:w-6 h-5 md:h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-bold text-sm md:text-base mb-1">Watch Fatigue Alert</h3>
                      <p className="text-zinc-300 text-[10px] md:text-xs mb-2">{fatigueAlert.message}</p>
                      <p className="text-xs text-zinc-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {fatigueAlert.suggestion}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Seasonal Insights */}
          {seasonalInsights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-zinc-900/80 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm md:text-base flex items-center gap-2">
                    <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-amber-500" />
                    Seasonal Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {seasonalInsights.map((insight, idx) => {
                    const Icon = insight.icon;
                    return (
                      <div key={idx} className="p-2 md:p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-white text-xs md:text-sm break-words">{insight.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today's Schedule Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <TodaysScheduleTimeline
              schedules={schedules}
              mediaMap={mediaMap}
              onSchedule={onSchedule}
              allMedia={Object.values(mediaMap)}
            />
          </motion.div>

          {/* Upcoming This Week */}
          {upcomingSchedules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-zinc-900/80 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-base md:text-lg font-semibold tracking-tight flex items-center gap-2">
                    <Clock className="w-4 md:w-5 h-4 md:h-5 text-amber-500" />
                    Upcoming This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
                  {upcomingSchedules.map((schedule) => {
                    const media = mediaMap[schedule.media_id];
                    if (!media) return null;
                    const date = new Date(schedule.scheduled_date);

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => onNavigateToMedia?.(schedule.media_id, 'schedule')}
                        className="flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white text-xs md:text-sm font-medium truncate">{media.title}</h5>
                          <p className="text-[10px] md:text-xs text-white truncate">
                            {isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE, MMM d')} at {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] md:text-xs ml-2 flex-shrink-0">
                          {media.type === 'movie' ? 'Movie' : 'Series'}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Achievements & Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <AchievementsBadges schedules={schedules} mediaMap={mediaMap} />
          </motion.div>
        </div>
      </div>



      {/* Three Sections Side by Side with Equal Width and Height */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Hidden Gems */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-zinc-900/80 border-amber-500/30 flex flex-col h-[400px] sm:h-[500px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white text-base md:text-lg flex items-center gap-2">
                <Star className="w-4 md:w-5 h-4 md:h-5 text-amber-400 fill-amber-400" />
                Hidden Gems
              </CardTitle>
              <p className="text-[10px] md:text-xs text-zinc-400 mt-1">Highly rated but rarely watched</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                {hiddenGems.map((media) => (
                <div
                  key={media.id}
                  onClick={() => onNavigateToMedia?.(media.id, 'library')}
                  className="group cursor-pointer p-2 md:p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm text-white font-medium truncate">{media.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] md:text-xs text-amber-400">{media.rating.toFixed(1)}</span>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] border-0">
                            {media.type === 'series' ? 'Series' : 'Movie'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended for You */}
          <Card className="bg-zinc-900/80 border-zinc-800 flex flex-col h-[400px] sm:h-[500px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white text-base md:text-lg flex items-center gap-2">
                <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-amber-500" />
                Recommended
              </CardTitle>
              <p className="text-[10px] md:text-xs text-zinc-400 mt-1">Unwatched titles from your library</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                {recommendations.map((media) => (
                  <div
                    key={media.id}
                    className="group cursor-pointer p-2 md:p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-amber-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-white font-medium truncate">{media.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] border-0">
                            {media.type === 'series' ? 'Series' : 'Movie'}
                          </Badge>
                          {media.type === 'series' && media.nextSeason && media.nextEpisode && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-[10px] border-0">
                              S{String(media.nextSeason).padStart(2, '0')}E{String(media.nextEpisode).padStart(2, '0')}
                            </Badge>
                          )}
                          {media.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400">{media.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recently Added */}
          <Card className="bg-zinc-900/80 border-zinc-800 flex flex-col h-[400px] sm:h-[500px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white text-base md:text-lg flex items-center gap-2">
                <Film className="w-4 md:w-5 h-4 md:h-5 text-amber-500" />
                Recently Added
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                {recentlyAdded.map((media) => (
                  <div
                    key={media.id}
                    onClick={() => onNavigateToMedia?.(media.id, 'library')}
                    className="group cursor-pointer p-2 md:p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-amber-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-white font-medium truncate">{media.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] border-0">
                            {media.type === 'series' ? 'Series' : 'Movie'}
                          </Badge>
                          {media.type === 'series' && media.seasons_count && (
                            <span className="text-[10px] text-zinc-500">
                              {media.seasons_count} Season{media.seasons_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>



      {/* Floating Smart Icons */}
      <FloatingSmartIcons onOpenPanel={setActivePanel} />

      {/* Panels */}
      <SmartPanel
        isOpen={activePanel === 'releases'}
        onClose={() => setActivePanel(null)}
        panelId="releases"
        title="New OTT Releases This Week"
      >
        <ReleasesPanel
          onOpenAddForm={(data) => {
            onOpenAddFormWithData(data);
            setActivePanel(null);
          }}
          userPermissions={userPermissions}
        />
      </SmartPanel>

      <SmartPanel
        isOpen={activePanel === 'recommendations'}
        onClose={() => setActivePanel(null)}
        panelId="recommendations"
        title="AI Watchlist Recommendations"
      >
        <RecommendationsPanel
          mediaMap={mediaMap}
          completedSchedules={completedSchedules}
          schedules={schedules}
          onSchedule={(media) => {
            onSchedule(media);
            setActivePanel(null);
          }}
          userPermissions={userPermissions}
        />
      </SmartPanel>

      <SmartPanel
        isOpen={activePanel === 'news'}
        onClose={() => setActivePanel(null)}
        panelId="news"
        title="Facts & News About Your Library"
      >
        <NewsPanel mediaMap={mediaMap} />
      </SmartPanel>

      {/* Render floating bubbles */}
      {FloatingBubbles}
    </div>
  );
}