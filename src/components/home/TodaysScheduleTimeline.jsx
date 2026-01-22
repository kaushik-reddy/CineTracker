import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, Plus, Clock as ClockIcon } from "lucide-react";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import CountdownTimer from "../schedule/CountdownTimer";

const COLORS = [
  'bg-emerald-400',
  'bg-orange-400', 
  'bg-purple-400',
  'bg-blue-400',
  'bg-pink-400',
  'bg-cyan-400',
  'bg-amber-400',
  'bg-teal-400'
];

export default function TodaysScheduleTimeline({ schedules, mediaMap, onSchedule, allMedia }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const timelineRef = useRef(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to current time on mount and when date changes
  useEffect(() => {
    if (timelineRef.current && isSameDay(selectedDate, new Date())) {
      setTimeout(() => {
        const currentTimePos = getCurrentTimePosition();
        if (currentTimePos !== null && timelineRef.current) {
          const scrollLeft = (currentTimePos / 100) * timelineRef.current.scrollWidth - timelineRef.current.clientWidth / 2;
          timelineRef.current.scrollLeft = Math.max(0, scrollLeft);
        }
      }, 100);
    }
  }, [selectedDate]);

  // Handle scroll beyond boundaries with smooth transitions
  useEffect(() => {
    if (!timelineRef.current) return;

    let scrollTimeout;
    const handleScroll = () => {
      const container = timelineRef.current;
      if (!container) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        // If scrolled to the end (with 50px threshold), go to next day
        if (container.scrollLeft >= maxScroll - 50) {
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setSelectedDate(nextDay);
          setTimeout(() => {
            if (timelineRef.current) {
              timelineRef.current.scrollTo({
                left: 100,
                behavior: 'smooth'
              });
            }
          }, 100);
        }
        
        // If scrolled to the beginning (with 50px threshold), go to previous day
        else if (container.scrollLeft <= 50) {
          const prevDay = new Date(selectedDate);
          prevDay.setDate(prevDay.getDate() - 1);
          setSelectedDate(prevDay);
          setTimeout(() => {
            if (timelineRef.current) {
              timelineRef.current.scrollTo({
                left: timelineRef.current.scrollWidth - timelineRef.current.clientWidth - 100,
                behavior: 'smooth'
              });
            }
          }, 100);
        }
      }, 150);
    };

    const container = timelineRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [selectedDate]);

  // Get schedules for selected date (show all including completed)
  const todaysSchedules = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    return schedules
      .filter(s => {
        const scheduleDate = new Date(s.scheduled_date);
        const media = mediaMap[s.media_id];
        
        // For completed schedules, check if end time falls on selected date
        if (s.status === 'completed' && s.rating_submitted_at) {
          const endTime = new Date(s.rating_submitted_at);
          return endTime >= dayStart && endTime <= dayEnd;
        }
        
        // For non-completed, check if schedule overlaps with selected date
        let runtime = media?.runtime_minutes || 120;
        if (media?.type === 'series' && s.season_number && s.episode_number) {
          const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
          if (epRuntime) runtime = epRuntime;
        } else if (media?.type === 'book') {
          runtime = s.session_duration || 30;
        }
        
        const endTime = new Date(scheduleDate.getTime() + runtime * 60000);
        
        // Show if either start or end time is on selected date
        return (scheduleDate >= dayStart && scheduleDate <= dayEnd) || 
               (endTime >= dayStart && endTime <= dayEnd);
      })
      .map((s, idx) => {
        // For completed schedules, calculate start time from end time
        let displayStartTime = s.scheduled_date;
        if (s.status === 'completed' && s.rating_submitted_at) {
          const endTime = new Date(s.rating_submitted_at);
          const media = mediaMap[s.media_id];
          let runtime = media?.runtime_minutes || 120;
          
          if (media?.type === 'series' && s.season_number && s.episode_number) {
            const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
            if (epRuntime) runtime = epRuntime;
          } else if (media?.type === 'book') {
            runtime = s.session_duration || 30;
          }
          
          displayStartTime = new Date(endTime.getTime() - runtime * 60000).toISOString();
        }
        
        return {
          ...s,
          scheduled_date: displayStartTime,
          media: mediaMap[s.media_id],
          color: COLORS[idx % COLORS.length]
        };
      })
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  }, [schedules, selectedDate, mediaMap]);

  // Time slots - 24 hours (0:00 to 23:30) in 30-minute intervals
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        slots.push({
          hour: h,
          minute: m,
          label: `${hour12}:${m.toString().padStart(2, '0')}${ampm}`,
          totalMinutes: h * 60 + m
        });
      }
    }
    return slots;
  }, []);

  // Calculate position for current time indicator
  const getCurrentTimePosition = () => {
    if (!isSameDay(currentTime, selectedDate)) return null;
    
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    
    const totalMinutes = hours * 60 + minutes;
    const totalRangeMinutes = 24 * 60; // 24 hours total
    return (totalMinutes / totalRangeMinutes) * 100;
  };

  // Calculate event position and width - use actual timespan for visual accuracy
  const getEventStyle = (schedule) => {
    const start = new Date(schedule.scheduled_date);
    const dayStart = startOfDay(selectedDate);
    
    // Calculate visual end time based on actual completion/activity
    let visualEndTime;
    
    if (schedule.status === 'completed') {
      // Use actual completion time for completed items
      visualEndTime = new Date(schedule.rating_submitted_at || schedule.updated_date);
    } else if (schedule.status === 'in_progress' || schedule.status === 'paused') {
      // For in-progress/paused, extend to last activity time or current time
      const lastActivity = new Date(schedule.last_resumed_at || schedule.started_at || schedule.scheduled_date);
      const now = new Date();
      visualEndTime = lastActivity > now ? lastActivity : now;
    } else {
      // For scheduled items, use planned runtime
      let runtime = schedule.media?.runtime_minutes || 120;
      if (schedule.media?.type === 'series' && schedule.season_number && schedule.episode_number) {
        const epRuntime = schedule.media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      } else if (schedule.media?.type === 'book') {
        runtime = schedule.session_duration || 30;
      }
      visualEndTime = new Date(start.getTime() + runtime * 60000);
    }
    
    // If event starts before selected day, clip to day start
    const displayStart = start < dayStart ? dayStart : start;
    
    // If event ends after selected day, clip to day end
    const dayEnd = endOfDay(selectedDate);
    const displayEnd = visualEndTime > dayEnd ? dayEnd : visualEndTime;
    
    // Calculate minutes from start of day
    const startMinutesFromDayStart = (displayStart.getTime() - dayStart.getTime()) / 60000;
    const endMinutesFromDayStart = (displayEnd.getTime() - dayStart.getTime()) / 60000;
    
    const totalRangeMinutes = 24 * 60; // 24 hours
    
    const left = (startMinutesFromDayStart / totalRangeMinutes) * 100;
    const width = ((endMinutesFromDayStart - startMinutesFromDayStart) / totalRangeMinutes) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(0, Math.min(100 - left, width))}%` };
  };

  const currentTimePos = getCurrentTimePosition();

  // Get next upcoming schedule
  const nextSchedule = useMemo(() => {
    const now = new Date();
    const upcoming = schedules
      .filter(s => s.status === 'scheduled' && new Date(s.scheduled_date) > now)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    return upcoming[0];
  }, [schedules]);

  // Filter media for selection
  const availableMedia = useMemo(() => {
    if (!allMedia) return [];
    return allMedia
      .filter(m => {
        const matchesSearch = m.title?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && m.status !== 'watched';
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allMedia, searchQuery]);

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-white">Today Schedule</h2>
          
          {/* Next Schedule Countdown */}
          {nextSchedule && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-lg text-xs">
              <span className="font-semibold text-zinc-300">Next:</span>
              <CountdownTimer
                targetDate={nextSchedule.scheduled_date}
                audioFormat={nextSchedule.audio_format}
                videoFormat={nextSchedule.video_format}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          {/* Date Selector */}
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-600 text-white transition-all text-xs sm:text-sm cursor-pointer flex-shrink-0"
          />
          
          {/* Schedule Title Button */}
          <Button
            onClick={() => setShowTitleSelector(true)}
            className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl font-semibold transition-all text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
            Schedule Title
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div 
        ref={timelineRef}
        className="relative bg-zinc-800/30 rounded-xl p-3 sm:p-6 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
        style={{ minHeight: '220px' }}
      >
        <div style={{ minWidth: '4800px', position: 'relative' }}>
          {/* Time Labels */}
          <div className="flex mb-4 relative">
            {timeSlots.map((slot) => (
              <div 
                key={`${slot.hour}-${slot.minute}`} 
                className="text-xs font-bold text-white"
                style={{ width: '150px', textAlign: 'left' }}
              >
                {slot.label}
              </div>
            ))}
          </div>

          {/* Grid Lines */}
          <div className="absolute left-0 right-0 top-10 bottom-0 flex pointer-events-none">
            {timeSlots.map((slot) => (
              <div 
                key={`grid-${slot.hour}-${slot.minute}`}
                className="border-l border-zinc-600/40"
                style={{ width: '150px', height: '100%' }}
              />
            ))}
          </div>

          {/* Events Container */}
          <div className="relative" style={{ height: '200px' }}>
            {todaysSchedules.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-400 text-sm font-medium">No schedules for this date</p>
              </div>
            ) : (
              todaysSchedules.map((schedule, idx) => {
                const style = getEventStyle(schedule);
                const isActive = schedule.status === 'in_progress' || schedule.status === 'paused';
                const isCompleted = schedule.status === 'completed';
                
                return (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: idx * 0.05,
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                    className={`absolute ${schedule.color} ${isCompleted ? 'opacity-70' : ''} rounded-lg cursor-pointer hover:shadow-xl transition-all backdrop-blur-sm border-l-4 overflow-hidden group`}
                    style={{
                      left: style.left,
                      width: style.width,
                      top: `${(idx % 4) * 25}%`,
                      minWidth: '180px',
                      maxHeight: '50px',
                      borderLeftColor: schedule.color.replace('bg-', 'rgb(var(--')
                    }}
                  >
                    <div className="flex items-center gap-2 p-1.5">
                      {schedule.media?.poster_url && (
                        <img 
                          src={schedule.media.poster_url} 
                          alt={schedule.media.title}
                          className="w-8 h-10 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {isActive && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0" />
                          )}
                          {isCompleted && (
                            <span className="text-white text-xs flex-shrink-0">✓</span>
                          )}
                          <p className="text-[11px] font-bold text-white leading-tight line-clamp-1">
                            {schedule.media?.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {schedule.season_number && (
                            <span className="text-[9px] text-white/90 font-semibold bg-black/20 px-1 rounded">
                              S{schedule.season_number}E{schedule.episode_number}
                            </span>
                          )}
                          {schedule.device && (
                            <span className="text-[9px] text-white/80">📱 {schedule.device}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Current Time Indicator */}
          {currentTimePos !== null && (
            <div
              className="absolute top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50 z-10 pointer-events-none"
              style={{ left: `${(currentTimePos / 100) * 4800}px` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
                {format(currentTime, 'h:mm a')}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Title Selector Modal */}
      <Dialog open={showTitleSelector} onOpenChange={setShowTitleSelector}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Select Title to Schedule</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <input
              type="text"
              placeholder="Search titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900/50 border border-purple-500/30 rounded-lg text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none hover:border-purple-500/50 transition-all"
            />
            
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {availableMedia.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">No titles found</p>
              ) : (
                availableMedia.map((media) => (
                  <button
                    key={media.id}
                    onClick={() => {
                      onSchedule(media);
                      setShowTitleSelector(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-purple-500/50 text-left transition-all"
                  >
                    {media.poster_url ? (
                      <img src={media.poster_url} alt={media.title} className="w-12 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center text-zinc-500 text-xl">
                        {media.title[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{media.title}</h4>
                      <p className="text-xs text-zinc-400">
                        {media.type === 'book' ? '📚 Book' : media.type === 'series' ? '📺 Series' : '🎬 Movie'}
                        {media.year && ` • ${media.year}`}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}