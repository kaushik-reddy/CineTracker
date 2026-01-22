import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, RotateCcw, AlertCircle, Play, Pause, Book, Tv, Film } from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInMinutes } from "date-fns";
import { PlatformBadge } from "../common/PlatformLogos";
import { AudioFormatBadge, VideoFormatBadge } from "../common/DeviceAudioVideoIcons";
import { StudioLogos } from "../common/StudioLogo";

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

export default function TimelineFlowCard({ 
  schedule, 
  media, 
  onMarkComplete, 
  onReschedule, 
  localElapsed,
  userRole,
  userPermissions,
  isHighlighted,
  onNavigate 
}) {
  if (!media) return null;

  const canMarkComplete = userRole === 'admin' || userPermissions?.can_mark_complete;
  const canEdit = userRole === 'admin' || userPermissions?.can_edit;

  // Calculate runtime
  let runtime = media.runtime_minutes;
  if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
    const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
    if (epRuntime) runtime = epRuntime;
  } else if (media.type === 'book') {
    runtime = schedule.session_duration || 30;
  }

  // Flow states
  const isScheduled = schedule.status === 'scheduled';
  const isStarted = schedule.status === 'in_progress' || schedule.status === 'paused' || schedule.status === 'completed';
  const isCompleted = schedule.status === 'completed';

  // Time calculations
  const scheduledTime = new Date(schedule.scheduled_date);
  const startedTime = schedule.started_at ? new Date(schedule.started_at) : null;
  const completedTime = schedule.rating_submitted_at 
    ? new Date(schedule.rating_submitted_at) 
    : schedule.status === 'completed' 
    ? new Date(schedule.updated_date) 
    : null;

  // Calculate total time spent (actual elapsed time including breaks)
  let totalTimeSpent = null;
  let timeOverrun = null;
  if (startedTime && completedTime) {
    const actualMinutes = differenceInMinutes(completedTime, startedTime);
    totalTimeSpent = actualMinutes;
    
    // Calculate overrun
    if (actualMinutes > runtime) {
      timeOverrun = actualMinutes - runtime;
    }
  }

  // Current elapsed for in-progress
  const currentElapsed = localElapsed?.[schedule.id] || schedule.elapsed_seconds;

  // Check if delayed
  const now = new Date();
  const isDelayed = scheduledTime < now && schedule.status === 'scheduled' && schedule.elapsed_seconds === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isHighlighted === media.id ? 'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.8)]' : ''}`}
    >
      <Card className="bg-zinc-800/40 border-zinc-700 hover:border-amber-500/50 transition-all overflow-hidden">
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Left: Poster & Title */}
            <div className="flex gap-2 lg:w-56 flex-shrink-0">
              {media.poster_url && (
                <img 
                  src={media.poster_url} 
                  alt={media.title}
                  className="w-20 h-28 object-cover rounded-lg border border-zinc-700 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <h4 
                    className="text-white font-bold text-xs lg:text-sm truncate cursor-pointer hover:text-amber-400 transition-colors flex-1"
                    onClick={() => onNavigate?.(media.id)}
                  >
                    {media.title}
                  </h4>
                  <StudioLogos studios={media.studios} size="xs" maxDisplay={1} />
                </div>
                {schedule.season_number && (
                  <p className="text-[10px] text-amber-400 mb-0.5">
                    S{String(schedule.season_number).padStart(2, '0')}E{String(schedule.episode_number).padStart(2, '0')}
                  </p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-400 mt-0.5">
                  <span className="flex items-center gap-0.5">
                    {media.type === 'book' ? <Book className="w-2.5 h-2.5" /> : media.type === 'series' ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                    {media.type === 'book' ? 'Book' : media.type === 'series' ? 'Series' : 'Movie'}
                  </span>
                  <span>•</span>
                  <span>{Math.floor(runtime / 60)}h {runtime % 60}m</span>
                </div>
                {/* Dynamic Ends On / Ended On Label */}
                <div className="mt-1 text-[10px]">
                  {schedule.status === 'completed' ? (
                    <span className="text-blue-400">
                      Ended On: {format(completedTime, 'MMM d, h:mm a')}
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      Ends On: {format(
                        schedule.status === 'in_progress' || schedule.status === 'paused'
                          ? new Date(Date.now() + (runtime * 60 - currentElapsed) * 1000)
                          : new Date(scheduledTime.getTime() + runtime * 60 * 1000),
                        'MMM d, h:mm a'
                      )}
                    </span>
                  )}
                </div>
                {media.platform && (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <PlatformBadge platform={media.platform} size="sm" />
                    {schedule.audio_format && (
                      <AudioFormatBadge format={schedule.audio_format} size="small" />
                    )}
                    {schedule.video_format && (
                      <VideoFormatBadge format={schedule.video_format} size="small" />
                    )}
                  </div>
                )}
                {isDelayed && (
                  <Badge className="bg-red-500 text-white border-0 text-[10px] mt-1 animate-pulse">
                    Delayed
                  </Badge>
                )}
              </div>
            </div>

            {/* Center: Flow Progress */}
            <div className="flex-1 min-w-0">
              {/* Flow Steps with Aligned Times */}
              <div className="relative flex items-center justify-between mb-2 px-2">
                {/* Scheduled */}
                <div className="flex flex-col items-center z-10 flex-1">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isScheduled || isStarted || isCompleted
                      ? 'bg-gradient-to-br from-purple-500 to-emerald-500 border-purple-500 shadow-lg'
                      : 'bg-zinc-800 border-zinc-600'
                  }`}>
                    <Calendar className={`w-4 h-4 lg:w-5 lg:h-5 ${
                      isScheduled || isStarted || isCompleted ? 'text-white' : 'text-zinc-500'
                    }`} />
                  </div>
                  <span className={`text-[10px] lg:text-xs font-semibold mt-1 ${
                    isScheduled || isStarted || isCompleted ? 'text-white' : 'text-zinc-500'
                  }`}>
                    Scheduled
                  </span>
                  <div className="mt-2 text-center">
                    <p className="text-zinc-400 text-[9px]">Scheduled Time</p>
                    <p className="text-white font-medium text-[10px]">
                      {format(scheduledTime, 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Connection Line 1 */}
                <div className={`flex-1 h-0.5 mx-1 transition-all ${
                  isStarted || isCompleted
                    ? 'bg-gradient-to-r from-purple-500 to-emerald-500'
                    : 'bg-zinc-700'
                }`} />

                {/* Started */}
                <div className="flex flex-col items-center z-10 flex-1">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    schedule.status === 'in_progress'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-400 border-emerald-500 shadow-lg'
                      : schedule.status === 'paused'
                      ? 'bg-gradient-to-br from-amber-500 to-amber-400 border-amber-500 shadow-lg'
                      : isStarted || isCompleted
                      ? 'bg-gradient-to-br from-emerald-500 to-amber-500 border-emerald-500 shadow-lg'
                      : 'bg-zinc-800 border-zinc-600'
                  }`}>
                    {schedule.status === 'paused' ? (
                      <Pause className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    ) : (
                      <Play className={`w-4 h-4 lg:w-5 lg:h-5 ${
                        isStarted || isCompleted ? 'text-white' : 'text-zinc-500'
                      }`} />
                    )}
                  </div>
                  <span className={`text-[10px] lg:text-xs font-semibold mt-1 whitespace-nowrap ${
                    schedule.status === 'in_progress' ? 'text-emerald-400' :
                    schedule.status === 'paused' ? 'text-amber-400' :
                    isStarted || isCompleted ? 'text-white' : 'text-zinc-500'
                  }`}>
                    {schedule.status === 'in_progress' ? 'Started · Playing' :
                     schedule.status === 'paused' ? 'Paused' :
                     'Started'}
                  </span>
                  {startedTime && (
                    <div className="mt-2 text-center">
                      <p className="text-zinc-400 text-[9px]">Start Time</p>
                      <p className="text-emerald-400 font-medium text-[10px]">
                        {format(startedTime, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Connection Line 2 */}
                <div className={`flex-1 h-0.5 mx-1 transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500'
                    : 'bg-zinc-700'
                }`} />

                {/* Completed */}
                <div className="flex flex-col items-center z-10 flex-1">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-blue-500 shadow-lg'
                      : 'bg-zinc-800 border-zinc-600'
                  }`}>
                    <CheckCircle className={`w-4 h-4 lg:w-5 lg:h-5 ${
                      isCompleted ? 'text-white' : 'text-zinc-500'
                    }`} />
                  </div>
                  <span className={`text-[10px] lg:text-xs font-semibold mt-1 ${
                    isCompleted ? 'text-white' : 'text-zinc-500'
                  }`}>
                    Completed
                  </span>
                  {completedTime && (
                    <div className="mt-2 text-center">
                      <p className="text-zinc-400 text-[9px]">End Time</p>
                      <p className="text-blue-400 font-medium text-[10px]">
                        {format(completedTime, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-zinc-900/50 rounded-lg p-2 space-y-1.5 text-[10px]">
                {/* Total Time Spent */}
                {totalTimeSpent !== null && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-[9px]">Total Time Spent</p>
                      <p className="text-white font-bold text-[10px]">
                        {Math.floor(totalTimeSpent / 60)}h {totalTimeSpent % 60}m
                      </p>
                    </div>
                    {timeOverrun !== null && timeOverrun > 0 && (
                      <div className="text-right">
                        <p className="text-zinc-400 text-[9px]">Overrun</p>
                        <p className="text-orange-400 font-medium text-[10px]">
                          +{Math.floor(timeOverrun / 60)}h {timeOverrun % 60}m
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* In-Progress Info */}
                {(schedule.status === 'in_progress' || schedule.status === 'paused') && (
                  <div className={`${totalTimeSpent !== null ? 'pt-1.5 border-t border-zinc-700' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-[9px]">Progress</p>
                        <p className="text-emerald-400 font-medium text-[10px]">
                          {Math.floor(currentElapsed / 60)}m {currentElapsed % 60}s / {runtime}m
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-400 text-[9px]">Remaining</p>
                        <p className="text-white font-medium text-[10px]">
                          {Math.max(0, Math.floor((runtime * 60 - currentElapsed) / 60))}m
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons for non-completed items */}
              {schedule.status !== 'completed' && (
                <div className="flex gap-1.5 mt-2">
                  <Button
                    size="sm"
                    disabled={!canMarkComplete}
                    onClick={() => canMarkComplete && onMarkComplete(schedule)}
                    className={`flex-1 text-[10px] px-2 py-1.5 h-auto ${
                      !canMarkComplete 
                        ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' 
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    disabled={!canEdit}
                    onClick={() => canEdit && onReschedule(schedule, false)}
                    className={`flex-1 text-[10px] px-2 py-1.5 h-auto ${
                      !canEdit 
                        ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50 border-zinc-700' 
                        : 'bg-white hover:bg-zinc-100 text-black'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reschedule
                  </Button>
                </div>
              )}
            </div>


          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}