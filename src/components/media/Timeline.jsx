import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, addDays, isSameDay, isWithinInterval } from "date-fns";
import { Calendar, Tv, Monitor, AlertTriangle, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const deviceIcons = {
  "TV": Tv,
  "Laptop": Monitor,
  "Phone": Monitor,
  "Tablet": Monitor,
  "Projector": Monitor,
  "Other": Monitor
};

const deviceColors = {
  "TV": "bg-blue-500",
  "Laptop": "bg-purple-500",
  "Phone": "bg-green-500",
  "Tablet": "bg-orange-500",
  "Projector": "bg-pink-500",
  "Other": "bg-gray-500"
};

const platformColors = {
  "Netflix": "bg-red-600",
  "Amazon Prime Video": "bg-blue-500",
  "Disney+ Hotstar": "bg-blue-600",
  "HBO Max": "bg-purple-600",
  "Apple TV+": "bg-gray-700",
  "Hulu": "bg-green-500",
  "Paramount+": "bg-blue-600",
  "Peacock": "bg-yellow-500",
  "SonyLIV": "bg-indigo-600",
  "Zee5": "bg-purple-500",
  "Voot": "bg-orange-500",
  "MX Player": "bg-blue-700",
  "Jio Cinema": "bg-pink-600",
  "Aha": "bg-green-600",
  "Sun NXT": "bg-yellow-600",
  "Other": "bg-gray-500"
};

export default function Timeline({ schedules, mediaMap, onMarkComplete }) {
  // Get next 7 days
  const days = useMemo(() => {
    const result = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 7; i++) {
      result.push(addDays(today, i));
    }
    return result;
  }, []);

  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const grouped = {};
    days.forEach(day => {
      grouped[day.toISOString()] = [];
    });

    schedules.forEach(schedule => {
      if (schedule.status === 'completed') return;
      const scheduleDate = new Date(schedule.scheduled_date);
      const dayKey = days.find(day => isSameDay(day, scheduleDate))?.toISOString();
      if (dayKey && mediaMap[schedule.media_id]) {
        grouped[dayKey].push({
          ...schedule,
          media: mediaMap[schedule.media_id]
        });
      }
    });

    // Sort schedules within each day by time
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => 
        new Date(a.scheduled_date) - new Date(b.scheduled_date)
      );
    });

    return grouped;
  }, [schedules, mediaMap, days]);

  // Detect conflicts (overlapping times on same device)
  const detectConflicts = (daySchedules) => {
    const conflicts = new Set();
    
    for (let i = 0; i < daySchedules.length; i++) {
      for (let j = i + 1; j < daySchedules.length; j++) {
        const s1 = daySchedules[i];
        const s2 = daySchedules[j];
        
        // Only check if same device
        if (s1.media.device !== s2.media.device) continue;
        
        const start1 = new Date(s1.scheduled_date);
        const end1 = new Date(start1.getTime() + s1.media.runtime_minutes * 60000);
        const start2 = new Date(s2.scheduled_date);
        const end2 = new Date(start2.getTime() + s2.media.runtime_minutes * 60000);
        
        // Check for overlap
        if (
          (start1 <= start2 && end1 > start2) ||
          (start2 <= start1 && end2 > start1)
        ) {
          conflicts.add(s1.id);
          conflicts.add(s2.id);
        }
      }
    }
    
    return conflicts;
  };

  if (schedules.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-400">No scheduled watches to display</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day, dayIndex) => {
        const dayKey = day.toISOString();
        const daySchedules = schedulesByDay[dayKey] || [];
        const conflicts = detectConflicts(daySchedules);
        
        if (daySchedules.length === 0) return null;

        return (
          <motion.div
            key={dayKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.1 }}
          >
            <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
              {/* Day header */}
              <div className="bg-zinc-800/50 px-6 py-3 border-b border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {format(day, 'EEEE, MMMM d')}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {daySchedules.length} {daySchedules.length === 1 ? 'watch' : 'watches'} scheduled
                    </p>
                  </div>
                  {conflicts.size > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border border-red-500/50">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Conflicts detected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-700" />

                  <div className="space-y-6">
                    {daySchedules.map((schedule, index) => {
                      const DeviceIcon = deviceIcons[schedule.media.device] || Monitor;
                      const hasConflict = conflicts.has(schedule.id);
                      const scheduleDate = new Date(schedule.scheduled_date);
                      const endTime = new Date(scheduleDate.getTime() + schedule.media.runtime_minutes * 60000);

                      return (
                        <div key={schedule.id} className="relative pl-20">
                          {/* Time badge */}
                          <div className="absolute left-0 top-0">
                            <div className={`
                              relative z-10 w-16 h-16 rounded-xl flex flex-col items-center justify-center
                              ${hasConflict ? 'bg-red-500/20 border-2 border-red-500' : 'bg-zinc-800 border-2 border-zinc-700'}
                            `}>
                              <span className={`text-xs font-medium ${hasConflict ? 'text-red-400' : 'text-amber-400'}`}>
                                {format(scheduleDate, 'h:mm')}
                              </span>
                              <span className={`text-[10px] ${hasConflict ? 'text-red-400' : 'text-zinc-500'}`}>
                                {format(scheduleDate, 'a')}
                              </span>
                            </div>
                          </div>

                          {/* Schedule card */}
                          <Card className={`
                            bg-zinc-800/50 border-zinc-700 p-5
                            ${hasConflict ? 'border-red-500/50 bg-red-500/5' : ''}
                            ${schedule.status === 'in_progress' || schedule.status === 'paused' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
                          `}>
                            <div className="flex gap-4">
                              {/* Poster */}
                              {schedule.media.poster_url ? (
                                <img 
                                  src={schedule.media.poster_url} 
                                  alt={schedule.media.title}
                                  className="w-24 h-36 object-cover rounded-lg flex-shrink-0 border border-zinc-700"
                                />
                              ) : (
                                <div className="w-24 h-36 bg-zinc-700 rounded-lg flex items-center justify-center text-2xl text-zinc-600 flex-shrink-0 border border-zinc-700">
                                  {schedule.media.title?.[0]}
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-lg mb-2">{schedule.media.title}</h4>
                                    
                                    <div className="flex items-center gap-3 text-sm text-zinc-400 mb-2">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {Math.floor(schedule.media.runtime_minutes / 60)}h {schedule.media.runtime_minutes % 60}m
                                      </span>
                                      <span>•</span>
                                      <span>Ends {format(endTime, 'h:mm a')}</span>
                                    </div>
                                  </div>

                                  {/* Device badge */}
                                  <Badge className={`${deviceColors[schedule.media.device]} text-white border-0 flex items-center gap-1 flex-shrink-0`}>
                                    <DeviceIcon className="w-4 h-4" />
                                    {schedule.media.device}
                                  </Badge>
                                </div>

                                {/* Platform */}
                                {schedule.media.platform && (
                                  <Badge className={`${platformColors[schedule.media.platform]} text-white text-xs border-0 mb-3`}>
                                    {schedule.media.platform}
                                  </Badge>
                                )}

                                {/* Description with marquee effect */}
                                {schedule.media.description && (
                                  <div className="mb-3 overflow-hidden">
                                    <div className="relative group">
                                      <p className="text-sm text-zinc-400 whitespace-nowrap overflow-hidden group-hover:animate-marquee">
                                        {schedule.media.description}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Actors with marquee effect */}
                                {schedule.media.actors && schedule.media.actors.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-1 text-sm text-zinc-500 mb-1">
                                      <Users className="w-4 h-4" />
                                      <span className="font-medium">Cast:</span>
                                    </div>
                                    <div className="overflow-hidden">
                                      <div className="relative group">
                                        <p className="text-sm text-zinc-300 whitespace-nowrap overflow-hidden group-hover:animate-marquee">
                                          {schedule.media.actors.join(' • ')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Status badges and actions */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-700">
                                  <div className="flex gap-2">
                                    {schedule.status === 'in_progress' && (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs">
                                        In Progress
                                      </Badge>
                                    )}
                                    {schedule.status === 'paused' && (
                                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs">
                                        Paused
                                      </Badge>
                                    )}
                                    {hasConflict && (
                                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/50 text-xs flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Schedule Conflict
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {schedule.status !== 'completed' && (
                                    <Button
                                      size="sm"
                                      onClick={() => onMarkComplete(schedule)}
                                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Mark Complete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}