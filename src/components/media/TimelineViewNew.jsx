import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format, startOfDay, addDays, isSameDay, differenceInHours, startOfMonth, endOfMonth, addMonths, subMonths, isBefore, setYear, getYear, setMonth } from "date-fns";
import { Calendar, Tv, Monitor, Clock, CheckCircle, RotateCcw, AlertCircle, ChevronLeft, ChevronRight, Book, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import TimelineFlowCard from "../timeline/TimelineFlowCard";

const deviceIcons = {
  "TV": Tv,
  "Laptop": Monitor,
  "Phone": Smartphone,
  "Tablet": Smartphone,
  "Projector": Monitor,
  "Big Screen": Monitor,
  "E-Reader": Book,
  "Physical Book": Book,
  "Theater": Monitor,
  "Other": Monitor
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
  if (hour >= 22 || hour < 4) return { label: 'LATE NIGHT', color: 'text-zinc-400' };
  if (hour >= 4 && hour < 7) return { label: 'EARLY MORNING', color: 'text-indigo-400' };
  if (hour >= 7 && hour < 12) return { label: 'MORNING', color: 'text-yellow-400' };
  if (hour >= 12 && hour < 15) return { label: 'AFTERNOON', color: 'text-orange-400' };
  if (hour >= 15 && hour < 18) return { label: 'LATE AFTERNOON', color: 'text-amber-400' };
  if (hour >= 18 && hour < 21) return { label: 'EVENING', color: 'text-purple-400' };
  if (hour >= 21 && hour < 22) return { label: 'NIGHT', color: 'text-blue-400' };
  return { label: 'LATE NIGHT', color: 'text-zinc-400' };
};

export default function TimelineViewNew({ schedules, mediaMap, onMarkComplete, onReschedule, localElapsed, userRole, userPermissions, playingScheduleId, isHighlighted, onNavigate }) {
  const canMarkComplete = userRole === 'admin' || userPermissions?.can_mark_complete;
  const canEdit = userRole === 'admin' || userPermissions?.can_edit;
  const [rescheduleDialog, setRescheduleDialog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()).toISOString());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get days in current month view
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfDay(monthStart);
    
    // Get the start of the week for the first day of month
    const calendarStart = addDays(startDate, -startDate.getDay());
    
    const result = [];
    let currentDay = calendarStart;
    
    // Get 42 days (6 weeks) to fill calendar grid
    for (let i = 0; i < 42; i++) {
      result.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }
    
    return result;
  }, [currentMonth]);

  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const grouped = {};
    days.forEach((day) => {
      grouped[day.toISOString()] = [];
    });

    schedules.forEach((schedule) => {
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

  const handleRescheduleClick = (schedule) => {
    const hoursSinceScheduled = differenceInHours(new Date(), new Date(schedule.scheduled_date));
    if (hoursSinceScheduled > 24 && schedule.elapsed_seconds > 0) {
      setRescheduleDialog(schedule);
    } else {
      onReschedule(schedule, false);
    }
  };

  const hasSchedules = schedules.length > 0;

  if (!hasSchedules) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-400">No scheduled watches to display</p>
      </Card>
    );
  }

  const selectedDaySchedules = selectedDate ? (schedulesByDay[selectedDate] || []) : [];
  
  // If no schedules for selected day, find next scheduled day
  const nextScheduledDate = useMemo(() => {
    if (selectedDaySchedules.length > 0) return null;
    
    const futureDays = days.filter(day => day >= new Date(selectedDate));
    for (const day of futureDays) {
      const daySchedules = schedulesByDay[day.toISOString()] || [];
      if (daySchedules.length > 0) {
        return day;
      }
    }
    return null;
  }, [selectedDaySchedules, days, selectedDate, schedulesByDay]);

  const displaySchedules = selectedDaySchedules.length > 0 
    ? selectedDaySchedules 
    : (nextScheduledDate ? schedulesByDay[nextScheduledDate.toISOString()] || [] : []);
  
  // Check for delayed schedules
  const delayedSchedules = useMemo(() => {
    const today = startOfDay(new Date());
    return schedules.filter(schedule => {
      if (schedule.status === 'completed') return false;
      const scheduleDate = startOfDay(new Date(schedule.scheduled_date));
      return isBefore(scheduleDate, today);
    }).map(schedule => ({
      ...schedule,
      media: mediaMap[schedule.media_id]
    }));
  }, [schedules, mediaMap]);
  
  // Group by time of day
  const groupedByTimeOfDay = useMemo(() => {
    const groups = {};
    displaySchedules.forEach((schedule) => {
      const date = new Date(schedule.scheduled_date);
      const timeOfDay = getTimeOfDay(date);
      if (!groups[timeOfDay.label]) {
        groups[timeOfDay.label] = { color: timeOfDay.color, schedules: [] };
      }
      groups[timeOfDay.label].schedules.push(schedule);
    });
    return groups;
  }, [displaySchedules]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Left: Compact Calendar */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-900/20 border-purple-500/30 shadow-xl lg:sticky lg:top-24">
          <CardContent className="p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 
                  onClick={() => setShowYearPicker(!showYearPicker)}
                  className="text-sm font-bold text-white cursor-pointer hover:text-amber-400 transition-colors"
                >
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                  {schedules.length} Total
                </Badge>
              </div>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded transition-colors text-[10px] text-emerald-400 border border-emerald-500/30"
              >
                Today
              </button>
            </div>

            {/* Year Picker */}
            {showYearPicker && (
              <div className="mb-3 p-2 bg-zinc-800/50 rounded-lg border border-purple-500/30">
                <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30">
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        setCurrentMonth(setYear(currentMonth, year));
                        setSelectedYear(year);
                        setShowYearPicker(false);
                      }}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        year === getYear(currentMonth) 
                          ? 'bg-gradient-to-r from-purple-500 to-amber-500 text-white shadow-lg' 
                          : 'bg-zinc-700/50 text-zinc-300 hover:bg-purple-500/20 hover:border-purple-500/50 border border-transparent'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Month Navigation */}
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-0.5 w-5 h-5 bg-zinc-800/50 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded transition-all flex items-center justify-center flex-shrink-0"
              >
                <ChevronLeft className="w-2.5 h-2.5 text-purple-400" />
              </button>
              <div className="grid grid-cols-3 gap-1 flex-1">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                  <button
                    key={month}
                    onClick={() => setCurrentMonth(setMonth(currentMonth, idx))}
                    className={`px-1 py-0.5 rounded text-[10px] transition-all ${
                      currentMonth.getMonth() === idx 
                        ? 'bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-bold shadow-lg' 
                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-purple-500/20 border border-transparent hover:border-purple-500/50'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-0.5 w-5 h-5 bg-zinc-800/50 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded transition-all flex items-center justify-center flex-shrink-0"
              >
                <ChevronRight className="w-2.5 h-2.5 text-purple-400" />
              </button>
            </div>
          </div>
              
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-[10px] font-semibold text-purple-400 pb-1">
                    {day}
                  </div>
                ))}
                
                {days.map((day) => {
                  const daySchedules = schedulesByDay[day.toISOString()] || [];
                  const hasSchedule = daySchedules.length > 0;
                  const isToday = isSameDay(day, new Date());
                  const isPast = day < startOfDay(new Date());
                  const isSelected = selectedDate === day.toISOString();
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day.toISOString())}
                      className={`
                        relative p-1.5 rounded-md text-center transition-all aspect-square text-[11px] font-bold
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                        ${isSelected ? 'ring-2 ring-amber-500 bg-gradient-to-br from-amber-500/30 to-purple-500/20 shadow-lg' : ''}
                        ${hasSchedule && !isSelected ? 'bg-gradient-to-br from-emerald-500/20 to-purple-500/10 border border-emerald-500/30' : ''}
                        ${!hasSchedule && isPast ? 'bg-zinc-800/20 text-zinc-600' : ''}
                        ${!hasSchedule && !isPast && !isSelected ? 'bg-zinc-800/30 text-zinc-400 border border-zinc-700/50' : ''}
                        ${isToday ? 'ring-1 ring-blue-400' : ''}
                        ${hasSchedule ? 'text-emerald-300' : ''}
                        hover:scale-105 hover:shadow-lg
                      `}
                    >
                      {format(day, 'd')}
                      {hasSchedule && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-purple-500 text-white text-[7px] font-bold flex items-center justify-center shadow-lg">
                          {daySchedules.length}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Day's Overview */}
              <div className="mt-4 pt-4 border-t border-purple-500/30 space-y-1.5 text-xs">
                <h4 className="font-semibold text-purple-400 mb-2">
                  {selectedDate && isSameDay(new Date(selectedDate), new Date()) ? "Today's" : "Selected Day's"} Overview
                </h4>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Scheduled</span>
                  <span className="text-white font-medium">
                    {selectedDate ? (schedulesByDay[selectedDate]?.filter(s => s.status === 'scheduled').length || 0) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">In Progress</span>
                  <span className="text-emerald-400 font-medium">
                    {selectedDate ? (schedulesByDay[selectedDate]?.filter(s => s.status === 'in_progress' || s.status === 'paused').length || 0) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Completed</span>
                  <span className="text-blue-400 font-medium">
                    {selectedDate ? (schedulesByDay[selectedDate]?.filter(s => s.status === 'completed').length || 0) : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Schedule Details */}
        <div className="lg:col-span-3 min-w-0">
          {/* Delayed Schedules Banner */}
          {delayedSchedules.length > 0 && (
            <Card className="bg-red-500/10 border-red-500/50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-red-400 font-semibold mb-2">Delayed Schedules</h4>
                    <p className="text-sm text-red-300 mb-3">
                      {delayedSchedules.length} {delayedSchedules.length === 1 ? 'title is' : 'titles are'} overdue from previous days
                    </p>
                    <div className="space-y-2">
                      {delayedSchedules.slice(0, 3).map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between bg-zinc-900/50 rounded p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{schedule.media?.title}</p>
                            <p className="text-xs text-zinc-400">
                              Scheduled: {new Date(schedule.scheduled_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => canEdit && handleRescheduleClick(schedule)}
                            className={`ml-2 text-xs ${!canEdit ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-white hover:bg-zinc-100 text-black'}`}
                          >
                            Reschedule
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedDate ? (
            <Card className="bg-zinc-900/50 border-zinc-800 p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">Select a date to view schedule</p>
            </Card>
          ) : selectedDaySchedules.length === 0 && !nextScheduledDate ? (
            <Card className="bg-zinc-900/50 border-zinc-800 p-12 text-center">
              <p className="text-zinc-400">No schedules for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
            </Card>
          ) : selectedDaySchedules.length === 0 && nextScheduledDate ? (
            <Card className="bg-zinc-900/50 border-zinc-800 p-8">
              <CardContent className="text-center">
                <p className="text-zinc-400 mb-4">No schedules for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
                <p className="text-white mb-4">Next scheduled watch:</p>
                <Button
                  onClick={() => setSelectedDate(nextScheduledDate.toISOString())}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  View {format(nextScheduledDate, 'MMMM d, yyyy')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Date Header */}
              <div className="bg-gradient-to-br from-amber-500/10 to-zinc-900/80 border border-amber-500/30 rounded-xl p-4">
                <h2 className="text-xl font-bold text-white">
                  {nextScheduledDate && selectedDaySchedules.length === 0 
                    ? `Next Scheduled: ${format(nextScheduledDate, 'EEEE, MMMM d')}`
                    : isSameDay(new Date(selectedDate), new Date()) ? 'Today' : format(new Date(selectedDate), 'EEEE')}
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {nextScheduledDate && selectedDaySchedules.length === 0 
                    ? format(nextScheduledDate, 'MMMM d, yyyy')
                    : format(new Date(selectedDate), 'MMMM d, yyyy')}
                </p>
              </div>

              {/* Grouped Schedule Cards */}
              {Object.entries(groupedByTimeOfDay).map(([timeLabel, { color, schedules: timeSchedules }]) => (
                <div key={timeLabel}>
                  <h3 className={`text-xs font-bold ${color} mb-3 tracking-wider`}>
                    {timeLabel}
                  </h3>
                  <div className="space-y-4">
                    {timeSchedules.map((schedule) => (
                      <TimelineFlowCard
                        key={schedule.id}
                        schedule={schedule}
                        media={schedule.media}
                        onMarkComplete={onMarkComplete}
                        onReschedule={onReschedule}
                        localElapsed={localElapsed}
                        userRole={userRole}
                        userPermissions={userPermissions}
                        isHighlighted={isHighlighted}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                </div>
              ))}
              </div>
              )}
              </div>
              </div>


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

      {rescheduleDialog && (
        <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-white">Reschedule Options</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm mb-4">Do you want to keep your current progress?</p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  onReschedule(rescheduleDialog, false);
                  setRescheduleDialog(null);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                Keep Progress & Reschedule
              </Button>
              <Button 
                onClick={() => {
                  onReschedule(rescheduleDialog, true);
                  setRescheduleDialog(null);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Reset Progress & Start Fresh
              </Button>
              <Button 
                onClick={() => setRescheduleDialog(null)}
                className="w-full bg-white text-black hover:bg-zinc-100"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}