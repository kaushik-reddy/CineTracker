import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Play, Trash2, Edit2, Pause, Tv, Monitor, Book, Smartphone, Rewind, FastForward, Film, AlertCircle, Armchair, Users } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { motion } from "framer-motion";
import { PlatformBadge } from "../common/PlatformLogos";
import { AudioFormatBadge, VideoFormatBadge, DeviceLogo } from "../common/DeviceAudioVideoIcons";
import { StudioLogos } from "../common/StudioLogo";

// Device icons now handled by DeviceLogo component from DeviceAudioVideoIcons

export default function CinematicScheduleCard({
  schedule,
  media,
  onWatch,
  onDelete,
  onEditSchedule,
  onPlayPause,
  playingScheduleId,
  onReschedule,
  onJumpToTime,
  onOpenJumpModal,
  localElapsed,
  userRole,
  userPermissions,
  isHighlighted,
  onNavigate,
  setDeleteConfirm,
  isPlaying,
  isCurrentlyWatching
}) {
  if (!media) return null;

  const canWatch = userRole === 'admin' || userPermissions?.can_watch;
  const canEdit = userRole === 'admin' || userPermissions?.can_edit;
  const canDelete = userRole === 'admin' || userPermissions?.can_delete;

  const deviceName = schedule.device || media.device;
  const scheduleDate = new Date(schedule.scheduled_date);
  const now = new Date();
  const isOverdue = isPast(scheduleDate) && schedule.status === 'scheduled' && schedule.elapsed_seconds === 0;
  const isFutureRelease = media.is_future_release && media.release_date && new Date(media.release_date) > new Date();

  // Get actual episode/session runtime
  let episodeRuntime = media.runtime_minutes;
  if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
    const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
    if (epRuntime) episodeRuntime = epRuntime;
  } else if (media.type === 'book') {
    episodeRuntime = schedule.session_duration || 30;
  }

  const currentElapsed = isPlaying ? (localElapsed?.[schedule.id] || schedule.elapsed_seconds) : schedule.elapsed_seconds;
  const progress = (currentElapsed / (episodeRuntime * 60)) * 100;

  // Determine card state for styling
  const getCardState = () => {
    if (isFutureRelease) return 'coming-soon';
    if (schedule.status === 'in_progress') return 'playing';
    if (schedule.status === 'paused') return 'paused';
    if (isOverdue) return 'delayed';
    return 'scheduled';
  };

  const cardState = getCardState();

  // State-specific styling - matching image exactly
  const stateConfig = {
    'scheduled': {
      statusLabel: 'Scheduled Ticket',
      statusColor: 'text-zinc-400',
      bgColor: 'bg-[#2a2a2a]',
      buttonClass: 'bg-amber-500 hover:bg-amber-600 text-black font-semibold',
      buttonText: 'START SHOW'
    },
    'playing': {
      statusLabel: 'Playing Now',
      statusColor: 'text-emerald-400',
      bgColor: 'bg-[#2a2a2a]',
      buttonClass: 'bg-amber-500 hover:bg-amber-600 text-black font-semibold',
      buttonText: 'PAUSE'
    },
    'paused': {
      statusLabel: 'Paused',
      statusColor: 'text-yellow-400',
      bgColor: 'bg-[#2a2a2a]',
      buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white font-semibold',
      buttonText: 'RESUME'
    },
    'delayed': {
      statusLabel: 'Delayed',
      statusColor: 'text-orange-400',
      bgColor: 'bg-[#2a2a2a]',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white font-semibold',
      buttonText: 'RESCHEDULE'
    },
    'coming-soon': {
      statusLabel: 'Coming Soon',
      statusColor: 'text-blue-400',
      bgColor: 'bg-[#2a2a2a]',
      buttonClass: 'bg-zinc-700 text-zinc-500 cursor-not-allowed',
      buttonText: 'COMING SOON'
    }
  };

  const config = stateConfig[cardState];

  const getTimeLabel = () => {
    if (isToday(scheduleDate)) return `Today, ${format(scheduleDate, 'h:mm a')}`;
    if (isTomorrow(scheduleDate)) return `Tomorrow, ${format(scheduleDate, 'h:mm a')}`;
    return format(scheduleDate, 'MMM d, h:mm a');
  };

  const getScheduleTimeLabel = () => {
    if (isToday(scheduleDate)) return `Today • ${format(scheduleDate, 'h:mm a')}`;
    if (isTomorrow(scheduleDate)) return `Tomorrow • ${format(scheduleDate, 'h:mm a')}`;
    return format(scheduleDate, 'EEE, MMM d • h:mm a');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card
        className={`${config.bgColor} border border-zinc-700/50 overflow-hidden relative shadow-2xl h-[384px] flex flex-col transition-all duration-300 hover-shadow`}
        style={{
          clipPath: `path('M 20,0 L calc(100% - 20),0 
            C calc(100% - 20),0 calc(100% - 15),5 calc(100% - 15),10
            L calc(100% - 15),20 
            C calc(100% - 15),25 calc(100% - 10),30 calc(100% - 5),30
            L 100%,30
            L 100%,50
            L calc(100% - 5),50
            C calc(100% - 10),50 calc(100% - 15),55 calc(100% - 15),60
            L calc(100% - 15),70
            C calc(100% - 15),75 calc(100% - 10),80 calc(100% - 5),80
            L 100%,80
            L 100%,100
            L calc(100% - 5),100
            C calc(100% - 10),100 calc(100% - 15),105 calc(100% - 15),110
            L calc(100% - 15),120
            C calc(100% - 15),125 calc(100% - 10),130 calc(100% - 5),130
            L 100%,130
            L 100%,calc(100% - 30)
            L calc(100% - 5),calc(100% - 30)
            C calc(100% - 10),calc(100% - 30) calc(100% - 15),calc(100% - 25) calc(100% - 15),calc(100% - 20)
            L calc(100% - 15),calc(100% - 10)
            C calc(100% - 15),calc(100% - 5) calc(100% - 20),100% calc(100% - 20),100%
            L 20,100%
            C 20,100% 15,calc(100% - 5) 15,calc(100% - 10)
            L 15,calc(100% - 20)
            C 15,calc(100% - 25) 10,calc(100% - 30) 5,calc(100% - 30)
            L 0,calc(100% - 30)
            L 0,130
            L 5,130
            C 10,130 15,125 15,120
            L 15,110
            C 15,105 10,100 5,100
            L 0,100
            L 0,80
            L 5,80
            C 10,80 15,75 15,70
            L 15,60
            C 15,55 10,50 5,50
            L 0,50
            L 0,30
            L 5,30
            C 10,30 15,25 15,20
            L 15,10
            C 15,5 20,0 20,0 Z')`
        }}
      >
        {/* Subtle inner border for depth */}
        <div className="absolute inset-0 border border-zinc-600/30 pointer-events-none"
          style={{
            clipPath: `path('M 20,0 L calc(100% - 20),0 
              C calc(100% - 20),0 calc(100% - 15),5 calc(100% - 15),10
              L calc(100% - 15),20 
              C calc(100% - 15),25 calc(100% - 10),30 calc(100% - 5),30
              L 100%,30
              L 100%,50
              L calc(100% - 5),50
              C calc(100% - 10),50 calc(100% - 15),55 calc(100% - 15),60
              L calc(100% - 15),70
              C calc(100% - 15),75 calc(100% - 10),80 calc(100% - 5),80
              L 100%,80
              L 100%,100
              L calc(100% - 5),100
              C calc(100% - 10),100 calc(100% - 15),105 calc(100% - 15),110
              L calc(100% - 15),120
              C calc(100% - 15),125 calc(100% - 10),130 calc(100% - 5),130
              L 100%,130
              L 100%,calc(100% - 30)
              L calc(100% - 5),calc(100% - 30)
              C calc(100% - 10),calc(100% - 30) calc(100% - 15),calc(100% - 25) calc(100% - 15),calc(100% - 20)
              L calc(100% - 15),calc(100% - 10)
              C calc(100% - 15),calc(100% - 5) calc(100% - 20),100% calc(100% - 20),100%
              L 20,100%
              C 20,100% 15,calc(100% - 5) 15,calc(100% - 10)
              L 15,calc(100% - 20)
              C 15,calc(100% - 25) 10,calc(100% - 30) 5,calc(100% - 30)
              L 0,calc(100% - 30)
              L 0,130
              L 5,130
              C 10,130 15,125 15,120
              L 15,110
              C 15,105 10,100 5,100
              L 0,100
              L 0,80
              L 5,80
              C 10,80 15,75 15,70
              L 15,60
              C 15,55 10,50 5,50
              L 0,50
              L 0,30
              L 5,30
              C 10,30 15,25 15,20
              L 15,10
              C 15,5 20,0 20,0 Z')`
          }}
        />

        {/* Main content with padding for perforations */}
        <div className="px-4 py-3 flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed border-zinc-600 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-amber-500" />
              <span className="text-white font-bold text-xs">CineTracker</span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className={`${config.statusColor} text-[10px] font-semibold`}>{config.statusLabel}</span>
            </div>
            <span className="text-zinc-300 text-[10px] font-medium">{getTimeLabel()}</span>
          </div>

          {/* Main layout - Title section and poster */}
          <div className="flex gap-3 mb-2 flex-shrink-0">
            {/* Left - Content */}
            <div className="flex-1 min-w-0">
              {/* Title with episode after */}
              <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <h3
                    className="text-white font-bold text-base cursor-pointer hover:text-amber-400 transition-colors leading-tight"
                    onClick={() => onNavigate?.(media.id)}
                  >
                    {media.title}
                  </h3>
                  {schedule.season_number && (
                    <span className="text-amber-400 text-xs font-semibold whitespace-nowrap">
                      S{String(schedule.season_number).padStart(2, '0')}E{String(schedule.episode_number).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <StudioLogos studios={media.studios} size="sm" maxDisplay={1} className="flex-shrink-0" />
              </div>

              {/* Metadata row - duration, device, seats */}
              <div className="flex items-center gap-2 text-xs text-zinc-300 mb-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(episodeRuntime / 60)}h {episodeRuntime % 60}m
                </span>
                <span className="flex items-center">
                  <DeviceLogo device={deviceName} size="xl" className="text-zinc-300" />
                </span>
                {schedule.seats_selected && schedule.seats_selected.length > 0 && (
                  <span className="flex items-center gap-1 text-purple-400">
                    <Armchair className="w-3 h-3" />
                    {schedule.seats_selected.length} seat{schedule.seats_selected.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Platform and Formats row */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {media.platform && (
                  <PlatformBadge platform={media.platform} size="sm" />
                )}
                {schedule.audio_format && (
                  <AudioFormatBadge format={schedule.audio_format} size="sm" />
                )}
                {schedule.video_format && (
                  <VideoFormatBadge format={schedule.video_format} size="sm" />
                )}
              </div>

              {/* Viewers row */}
              {schedule.viewers && schedule.viewers.length > 0 && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-zinc-400">With:</span>
                    {schedule.viewers.slice(0, 3).map((viewer, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center"
                        title={viewer.name || viewer.email}
                      >
                        {viewer.avatar ? (
                          <img src={viewer.avatar} alt={viewer.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-[8px] text-amber-400 font-bold">
                            {(viewer.name || viewer.email)?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                    {schedule.viewers.length > 3 && (
                      <span className="text-[10px] text-zinc-400">+{schedule.viewers.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right - Poster */}
            <div className="flex-shrink-0">
              {media.poster_url ? (
                <img
                  src={media.poster_url}
                  alt={media.title}
                  className="w-20 h-28 object-cover rounded-lg border-2 border-zinc-700/50 shadow-lg"
                />
              ) : (
                <div className="w-20 h-28 bg-zinc-800 rounded-lg border-2 border-zinc-700/50 flex items-center justify-center text-2xl text-zinc-600">
                  {media.title?.[0]}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-dashed border-zinc-600 mb-2 flex-shrink-0"></div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto mb-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
            {/* Schedule time */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <CalendarIcon className="w-3 h-3" />
              <span>{getScheduleTimeLabel()}</span>
            </div>

            {/* Description */}
            {media.description && (
              <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-2">
                {media.description}
              </p>
            )}

            {/* Cast */}
            {media.actors && media.actors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {media.actors.slice(0, 5).map(actor => (
                  <span key={actor} className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700 rounded-full text-zinc-300 text-[10px]">
                    {actor}
                  </span>
                ))}
                {media.actors.length > 5 && (
                  <span className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700 rounded-full text-zinc-400 text-[10px]">
                    +{media.actors.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress bar for currently watching */}
          {isCurrentlyWatching && (
            <div className="mb-2 flex-shrink-0">
              <div className="border-t border-dotted border-zinc-600 mb-2 pt-2">
                <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>{Math.floor(currentElapsed / 3600)}h {Math.floor((currentElapsed % 3600) / 60)}m {currentElapsed % 60}s</span>
                  <span className="text-white font-semibold">{Math.round(progress)}%</span>
                  <span>{Math.floor((episodeRuntime * 60 - currentElapsed) / 3600)}h {Math.floor(((episodeRuntime * 60 - currentElapsed) % 3600) / 60)}m {(episodeRuntime * 60 - currentElapsed) % 60}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Skip buttons and Jump for watching */}
          {isCurrentlyWatching && canWatch && media.type !== 'book' && (
            <div className="flex gap-1.5 mb-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={async () => {
                  const newElapsed = Math.max(0, currentElapsed - 300);
                  await onJumpToTime(schedule.id, newElapsed);
                }}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 text-[10px] h-7"
              >
                <Rewind className="w-2.5 h-2.5 mr-0.5" />
                -5m
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenJumpModal({ schedule, media })}
                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 text-[10px] h-7"
              >
                Jump
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  const newElapsed = Math.min(currentElapsed + 300, episodeRuntime * 60);
                  await onJumpToTime(schedule.id, newElapsed);
                }}
                className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/50 text-[10px] h-7"
              >
                <FastForward className="w-2.5 h-2.5 mr-0.5" />
                +5m
              </Button>
            </div>
          )}

          {/* Adjust Progress for books */}
          {isCurrentlyWatching && canWatch && media.type === 'book' && (
            <div className="mb-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => onOpenJumpModal({ schedule, media })}
                className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 text-[10px] h-7"
              >
                Adjust Progress
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-1.5 flex-shrink-0">
            {isFutureRelease ? (
              <>
                <Button
                  size="sm"
                  disabled
                  className={`flex-1 ${config.buttonClass} h-9 rounded-lg text-xs`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                  {config.buttonText}
                </Button>
                <Button
                  size="sm"
                  disabled={!canEdit}
                  onClick={(e) => {
                    e.stopPropagation();
                    canEdit && onEditSchedule(schedule);
                  }}
                  className={`${!canEdit ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-white border border-zinc-600'} h-9 px-2.5 rounded-lg`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  disabled={!canDelete}
                  onClick={(e) => {
                    e.stopPropagation();
                    canDelete && setDeleteConfirm(schedule.id);
                  }}
                  className={`${!canDelete ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-red-400 border border-zinc-600'} h-9 px-2.5 rounded-lg`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : isCurrentlyWatching ? (
              <>
                <Button
                  size="sm"
                  disabled={!canWatch}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canWatch) return;
                    onPlayPause(schedule);
                  }}
                  className={`flex-1 ${!canWatch ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : config.buttonClass} h-9 rounded-lg text-xs`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                  {config.buttonText}
                </Button>
                {!isPlaying && (
                  <>
                    <Button
                      size="sm"
                      disabled={!canEdit}
                      onClick={(e) => {
                        e.stopPropagation();
                        canEdit && onEditSchedule(schedule);
                      }}
                      className={`${!canEdit ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-white border border-zinc-600'} h-9 px-2.5 rounded-lg`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      disabled={!canDelete}
                      onClick={(e) => {
                        e.stopPropagation();
                        canDelete && setDeleteConfirm(schedule.id);
                      }}
                      className={`${!canDelete ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-red-400 border border-zinc-600'} h-9 px-2.5 rounded-lg`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  disabled={!canWatch && !canEdit}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOverdue && canEdit) {
                      onReschedule(schedule);
                    } else if (!isOverdue && canWatch) {
                      onWatch(media);
                    }
                  }}
                  className={`flex-1 ${(!canWatch && !canEdit) ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : config.buttonClass} h-9 rounded-lg text-xs`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                  {config.buttonText}
                </Button>
                <Button
                  size="sm"
                  disabled={!canEdit}
                  onClick={(e) => {
                    e.stopPropagation();
                    canEdit && onEditSchedule(schedule);
                  }}
                  className={`${!canEdit ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-white border border-zinc-600'} h-9 px-2.5 rounded-lg`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  disabled={!canDelete}
                  onClick={(e) => {
                    e.stopPropagation();
                    canDelete && setDeleteConfirm(schedule.id);
                  }}
                  className={`${!canDelete ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-red-400 border border-zinc-600'} h-9 px-2.5 rounded-lg`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}