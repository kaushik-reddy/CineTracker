import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format, startOfDay, addDays, isSameDay, differenceInHours } from "date-fns";
import { Calendar, Tv, Monitor, AlertTriangle, Clock, CheckCircle, Edit2, RotateCcw, Star, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";

const deviceIcons = {
  "TV": Tv,
  "Laptop": Monitor,
  "Phone": Monitor,
  "Tablet": Monitor,
  "Projector": Monitor,
  "Big Screen": Monitor,
  "Other": Monitor
};

const deviceColors = {
  "TV": "bg-blue-500",
  "Laptop": "bg-purple-500",
  "Phone": "bg-green-500",
  "Tablet": "bg-orange-500",
  "Projector": "bg-pink-500",
  "Big Screen": "bg-cyan-500",
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
  "Theater": "bg-gray-600",
  "Other": "bg-gray-500"
};

const getTimeOfDay = (date) => {
  const hour = date.getHours();
  if (hour >= 4 && hour < 6) return { label: 'Early Morning', color: 'bg-indigo-500/20 text-indigo-400' };
  if (hour >= 6 && hour < 12) return { label: 'Morning', color: 'bg-yellow-500/20 text-yellow-400' };
  if (hour >= 12 && hour < 15) return { label: 'Afternoon', color: 'bg-orange-500/20 text-orange-400' };
  if (hour >= 15 && hour < 18) return { label: 'Late Afternoon', color: 'bg-amber-500/20 text-amber-400' };
  if (hour >= 18 && hour < 21) return { label: 'Evening', color: 'bg-purple-500/20 text-purple-400' };
  if (hour >= 21 && hour < 24) return { label: 'Night', color: 'bg-blue-500/20 text-blue-400' };
  return { label: 'Late Night', color: 'bg-zinc-500/20 text-zinc-400' };
};

export default function TimelineView({ schedules, mediaMap, onMarkComplete, onReschedule, localElapsed }) {
  const [rescheduleDialog, setRescheduleDialog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateInfo, setDateInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Get 28 days (4 weeks) including past week
  const days = useMemo(() => {
    const result = [];
    const today = startOfDay(new Date());
    for (let i = -7; i < 21; i++) {
      result.push(addDays(today, i));
    }
    return result;
  }, []);

  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const grouped = {};
    days.forEach((day) => {
      grouped[day.toISOString()] = [];
    });

    schedules.forEach((schedule) => {
      if (schedule.status === 'completed') return;
      const scheduleDate = new Date(schedule.scheduled_date);
      const dayKey = days.find((day) => isSameDay(day, scheduleDate))?.toISOString();

      if (dayKey && mediaMap[schedule.media_id]) {
        grouped[dayKey].push({
          ...schedule,
          media: mediaMap[schedule.media_id]
        });
      }
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    });

    return grouped;
  }, [schedules, mediaMap, days]);

  // Detect conflicts
  const detectConflicts = (daySchedules) => {
    const conflicts = new Set();
    for (let i = 0; i < daySchedules.length; i++) {
      for (let j = i + 1; j < daySchedules.length; j++) {
        const s1 = daySchedules[i];
        const s2 = daySchedules[j];
        if (s1.media.device !== s2.media.device) continue;

        const start1 = new Date(s1.scheduled_date);
        const end1 = new Date(start1.getTime() + s1.media.runtime_minutes * 60000);
        const start2 = new Date(s2.scheduled_date);
        const end2 = new Date(start2.getTime() + s2.media.runtime_minutes * 60000);

        if ((start1 <= start2 && end1 > start2) || (start2 <= start1 && end2 > start1)) {
          conflicts.add(s1.id);
          conflicts.add(s2.id);
        }
      }
    }
    return conflicts;
  };

  const handleRescheduleClick = (schedule) => {
    const hoursSinceScheduled = differenceInHours(new Date(), new Date(schedule.scheduled_date));
    if (hoursSinceScheduled > 24 && schedule.elapsed_seconds > 0) {
      setRescheduleDialog(schedule);
    } else {
      onReschedule(schedule, false);
    }
  };

  // Fetch info for selected date
  useEffect(() => {
    if (!selectedDate) return;
    const daySchedules = schedulesByDay[selectedDate] || [];
    if (daySchedules.length === 0) {
      setDateInfo(null);
      return;
    }

    const fetchInfo = async () => {
      setLoadingInfo(true);
      const titles = daySchedules.map(s => s.media.title).join(', ');
      
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Give me brief information about these titles: ${titles}. For each, provide: public rating (IMDb/RT if available), budget, box office, and 1-2 sentence review summary. Return as JSON array.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              titles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    rating: { type: "string" },
                    budget: { type: "string" },
                    boxOffice: { type: "string" },
                    review: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setDateInfo(response?.titles || []);
      } catch (error) {
        console.error('Failed to fetch title info:', error);
        setDateInfo([]);
      }
      setLoadingInfo(false);
    };

    fetchInfo();
  }, [selectedDate, schedulesByDay]);

  const hasSchedules = schedules.some((s) => s.status !== 'completed');

  if (!hasSchedules) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-400">No scheduled watches to display</p>
      </Card>
    );
  }

  const selectedDaySchedules = selectedDate ? (schedulesByDay[selectedDate] || []) : [];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Calendar */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 border-zinc-700 shadow-xl sticky top-24">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  Calendar
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                  {schedules.filter((s) => s.status !== 'completed').length} Active
                </Badge>
              </div>
              
              <div className="grid grid-cols-7 gap-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs font-semibold text-zinc-400 pb-2">
                    {day}
                  </div>
                ))}
                
                {days.map((day) => {
                  const daySchedules = schedulesByDay[day.toISOString()] || [];
                  const hasSchedule = daySchedules.length > 0;
                  const isToday = isSameDay(day, new Date());
                  const isPast = day < startOfDay(new Date());
                  const isSelected = selectedDate === day.toISOString();

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day.toISOString())}
                      className={`
                        relative p-2 rounded-lg text-center transition-all aspect-square
                        ${isSelected ? 'ring-2 ring-amber-500 bg-amber-500/20' : ''}
                        ${hasSchedule && !isSelected ? 'bg-emerald-500/20 border border-emerald-500/60' : ''}
                        ${!hasSchedule && isPast ? 'bg-zinc-800/20' : ''}
                        ${!hasSchedule && !isPast && !isSelected ? 'bg-zinc-800/50 border border-zinc-700' : ''}
                        ${isToday ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900' : ''}
                        hover:scale-110 hover:z-10
                      `}
                    >
                      <div className={`text-xs font-bold ${
                        hasSchedule ? 'text-emerald-300' :
                        isToday ? 'text-blue-400' :
                        isPast ? 'text-zinc-600' : 'text-white'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {hasSchedule && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center">
                          {daySchedules.length}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Web Info */}
        <div className="lg:col-span-3">
          {!selectedDate ? (
            <Card className="bg-zinc-900/50 border-zinc-800 p-8 md:p-12 text-center">
              <CardContent className="p-4 md:p-8">
                <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400 text-sm md:text-lg">Select a date to view details</p>
              </CardContent>
            </Card>
          ) : selectedDaySchedules.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800 p-8 md:p-12 text-center">
              <CardContent className="p-4 md:p-8">
                <p className="text-zinc-400 text-sm md:text-base">No schedules for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-amber-500/10 to-zinc-900/80 border-amber-500/30">
                <CardContent className="p-4 md:p-5">
                  <h3 className="text-white font-bold text-lg md:text-xl">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</h3>
                  <p className="text-xs md:text-sm text-zinc-400 mt-1">{selectedDaySchedules.length} scheduled {selectedDaySchedules.length === 1 ? 'watch' : 'watches'}</p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {/* Web Info */}
                {loadingInfo ? (
                  <Card className="bg-zinc-900/80 border-zinc-800 p-6 md:p-8 text-center">
                    <CardContent className="p-4 md:p-8">
                      <p className="text-zinc-400 text-sm">Loading information...</p>
                    </CardContent>
                  </Card>
                ) : dateInfo && dateInfo.length > 0 ? (
                  <Card className="bg-zinc-900/80 border-zinc-800">
                    <CardContent className="p-4">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-amber-400" />
                        Title Information
                      </h4>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                        {dateInfo.map((info, idx) => (
                          <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <h5 className="font-semibold text-white mb-2 text-xs">{info.title}</h5>
                            <div className="space-y-1 text-xs text-white">
                              {info.rating && (
                                <p className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400" />
                                  {info.rating}
                                </p>
                              )}
                              {info.budget && (
                                <p className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-green-400" />
                                  {info.budget}
                                </p>
                              )}
                              {info.boxOffice && (
                                <p className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-blue-400" />
                                  {info.boxOffice}
                                </p>
                              )}
                              {info.review && (
                                <p className="text-zinc-300 italic mt-2 text-[11px] leading-relaxed">"{info.review}"</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Timeline at Bottom */}
      {selectedDate && selectedDaySchedules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm md:text-base">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                Visual Timeline
              </h3>
              
              {/* Timeline */}
              <div className="relative">
                {/* Time markers */}
                <div className="flex justify-between text-xs text-zinc-500 mb-2 px-2">
                  <span>12 AM</span>
                  <span className="hidden sm:inline">6 AM</span>
                  <span>12 PM</span>
                  <span className="hidden sm:inline">6 PM</span>
                  <span>12 AM</span>
                </div>

                {/* Timeline bar */}
                <div className="relative h-24 md:h-32 bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-x-auto">
                  <div className="absolute inset-0 flex">
                    {/* Hour markers */}
                    {Array.from({ length: 25 }, (_, i) => (
                      <div key={i} className="flex-1 border-r border-zinc-700/50 relative">
                        {i % 6 === 0 && (
                          <div className="absolute -bottom-5 left-0 text-[10px] text-zinc-600 hidden sm:block">
                            {i}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Schedule blocks */}
                  {selectedDaySchedules.map((schedule) => {
                    const scheduleDate = new Date(schedule.scheduled_date);
                    const currentElapsed = localElapsed?.[schedule.id] || schedule.elapsed_seconds;
                    const remainingMinutes = schedule.media.runtime_minutes - Math.floor(currentElapsed / 60);
                    const startHour = scheduleDate.getHours() + scheduleDate.getMinutes() / 60;
                    const durationHours = remainingMinutes / 60;
                    const left = (startHour / 24) * 100;
                    const width = (durationHours / 24) * 100;
                    const hasConflict = detectConflicts(selectedDaySchedules).has(schedule.id);

                    return (
                      <motion.div
                        key={schedule.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute top-2 h-20 md:h-28 rounded-lg overflow-hidden cursor-pointer group ${
                          hasConflict ? 'ring-2 ring-red-500' : ''
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(width, 2)}%`,
                          background: `linear-gradient(135deg, ${platformColors[schedule.media.platform]?.replace('bg-', 'rgba(') || 'rgba(100, 100, 100'}, 0.3), ${platformColors[schedule.media.platform]?.replace('bg-', 'rgba(') || 'rgba(80, 80, 80'}, 0.5))`
                        }}
                      >
                        <div className="p-2 h-full flex flex-col justify-between">
                          <div className="flex-1 min-h-0">
                            <div className="font-bold text-white text-[10px] md:text-xs truncate">
                              {schedule.media.title}
                            </div>
                            {schedule.season_number && (
                              <div className="text-[8px] md:text-[10px] text-amber-400">
                                S{String(schedule.season_number).padStart(2, '0')}E{String(schedule.episode_number).padStart(2, '0')}
                              </div>
                            )}
                          </div>
                          <div className="text-[8px] md:text-[10px] text-white font-medium">
                            {format(scheduleDate, 'h:mm a')}
                          </div>
                          {(schedule.status === 'in_progress' || schedule.status === 'paused') && (
                            <div className="absolute top-1 right-1">
                              <div className={`w-2 h-2 rounded-full ${schedule.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            </div>
                          )}
                        </div>

                        {/* Hover details */}
                        <div className="absolute inset-x-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl text-xs text-white whitespace-nowrap">
                            <div className="font-bold">{schedule.media.title}</div>
                            <div className="text-zinc-400">{format(scheduleDate, 'h:mm a')} • {remainingMinutes}min</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-400" />
                    <span className="text-zinc-400">Playing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-400" />
                    <span className="text-zinc-400">Paused</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded ring-2 ring-red-500" />
                    <span className="text-zinc-400">Conflict</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <div className="p-4">
            <p className="text-sm text-white mb-4">
              This watch is overdue by more than 24 hours. Would you like to continue from where you left off or start fresh?
            </p>
            <div className="flex gap-3">
              <Button onClick={() => { onReschedule(rescheduleDialog, false); setRescheduleDialog(null); }} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                <RotateCcw className="w-4 h-4 mr-2" />
                Resume Progress
              </Button>
              <Button onClick={() => { onReschedule(rescheduleDialog, true); setRescheduleDialog(null); }} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                <Clock className="w-4 h-4 mr-2" />
                Start Fresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}