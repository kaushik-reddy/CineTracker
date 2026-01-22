import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Tv, Monitor, Calendar, Play, Edit2, Trash2, Users, Star, Plus, RotateCcw, Smartphone, Book } from "lucide-react";
import { format } from "date-fns";
import StarRating from "../common/StarRating";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { PlatformBadge } from "../common/PlatformLogos";
import ConnectedUniverse from "../universe/ConnectedUniverse";
import { StudioLogos } from "../common/StudioLogo";
import UniverseBadge from "../common/UniverseBadge";
import OfflineBookBadge from "./OfflineBookBadge";
import { useAction } from "../feedback/useAction";


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

const deviceIcons = {
  "TV": Tv,
  "Laptop": Monitor,
  "Phone": Smartphone,
  "Tablet": Monitor,
  "Projector": Monitor,
  "E-Reader": Book,
  "Physical Book": Book,
  "Other": Monitor
};

export default function MediaCard({ media, onSchedule, onWatch, onEdit, onDelete, hasSchedule, onAddSeasons, userRole, userPermissions, schedule, isHighlighted, allMedia, schedules, onNavigateToMedia }) {
  const canEdit = userRole === 'admin' || userPermissions?.can_edit;
  const canDelete = userRole === 'admin' || userPermissions?.can_delete;
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rewatchCount, setRewatchCount] = useState(0);
  const DeviceIcon = deviceIcons[media.device] || Monitor;
  const { executeAction } = useAction();

  // Real-time button status determination
  const getButtonStatus = () => {
    if (!schedule) return 'none';
    const now = new Date();
    const scheduleDate = schedule.scheduled_date ? new Date(schedule.scheduled_date) : null;
    const isDelayed = scheduleDate && scheduleDate < now && schedule.status === 'scheduled' && schedule.elapsed_seconds === 0;
    
    if (schedule.status === 'in_progress') return 'watching';
    if (schedule.status === 'paused') return 'paused';
    if (isDelayed) return 'delayed';
    return 'scheduled';
  };

  const buttonStatus = getButtonStatus();

  // Calculate rewatch count (only for movies)
  useMemo(async () => {
    if (media.status === 'watched' && media.type === 'movie') {
      try {
        const completed = await base44.entities.WatchSchedule.filter({
          media_id: media.id,
          status: 'completed'
        });
        setRewatchCount(completed.length - 1); // Subtract 1 for first watch
      } catch (error) {
        console.error('Error fetching rewatch count:', error);
      }
    }
  }, [media.id, media.status, media.type]);
  
  const formatRuntime = (minutes, media) => {
    // For books, show total pages
    if (media?.type === 'book') {
      return `${media.total_pages || 0} pages`;
    }
    // For series, calculate average runtime from all episodes
    if (media?.type === 'series' && media.episode_runtimes && media.episode_runtimes.length > 0) {
      const allEpisodeRuntimes = media.episode_runtimes.flat().filter(r => r > 0);
      if (allEpisodeRuntimes.length > 0) {
        const avgRuntime = Math.round(allEpisodeRuntimes.reduce((sum, r) => sum + r, 0) / allEpisodeRuntimes.length);
        const hrs = Math.floor(avgRuntime / 60);
        const mins = avgRuntime % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      }
    }
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Check if future release is available to watch or schedule
  const isFutureReleaseAvailable = () => {
    if (!media.is_future_release) return true;
    if (!media.release_date) return true;
    return new Date(media.release_date) <= new Date();
  };

  const canScheduleFromReleaseDate = () => {
    if (!media.is_future_release) return true;
    if (!media.release_date) return false;
    // Can schedule from release date onwards
    return true;
  };

  const isWatchable = isFutureReleaseAvailable() && (userRole === 'admin' || userPermissions?.can_watch);
  const isSchedulable = canScheduleFromReleaseDate() && (userRole === 'admin' || userPermissions?.can_schedule);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card 
        data-media-id={media.id}
        className={`group bg-zinc-900/80 border-zinc-800 hover:border-amber-500/50 hover-shadow transition-all duration-300 overflow-hidden h-full flex flex-col w-full ${
          isHighlighted ? 'ring-4 ring-amber-500 border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.8)]' : ''
        }`}>
        <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col h-full">
          <div className="flex gap-3 sm:gap-4 flex-1">
            {/* Left: Small Poster */}
            <div className="flex-shrink-0">
              {media.poster_url ? (
                <img 
                  src={media.poster_url} 
                  alt={media.title}
                  className="w-16 sm:w-20 md:w-24 h-24 sm:h-28 md:h-36 object-cover rounded-lg border border-zinc-700"
                />
              ) : (
                <div className="w-16 sm:w-20 md:w-24 h-24 sm:h-28 md:h-36 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                  <span className="text-xl sm:text-2xl md:text-3xl text-zinc-600">{media.title?.[0]}</span>
                </div>
              )}
            </div>

            {/* Right: Title, Runtime, Platform, Device */}
            <div className="flex-1 min-w-0 flex flex-col w-full overflow-hidden">
              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-white text-xs sm:text-sm leading-tight line-clamp-2 flex-1">
                    {media.title}
                  </h3>
                  <StudioLogos studios={media.studios} size="sm" maxDisplay={1} />
                </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-zinc-400 mb-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRuntime(media.runtime_minutes, media)}{media.type === 'series' ? '/ep' : ''}
                    </span>
                    {media.year && <span>• {media.year}</span>}
                    {media.age_restriction && (
                      <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1 py-0">{media.age_restriction}</Badge>
                    )}
                    {media.device && (
                      <span className="flex items-center gap-1">
                        <DeviceIcon className="w-3 h-3" />
                        {media.device}
                      </span>
                    )}
                  </div>

                  {/* Book progress */}
                  {media.type === 'book' && media.total_pages > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Progress: {media.pages_read || 0} / {media.total_pages} pages</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canEdit) {
                              // Pass to parent for modal
                              window.dispatchEvent(new CustomEvent('adjust-book-progress', { detail: media }));
                            }
                          }}
                          disabled={!canEdit}
                          className={`text-[10px] ${canEdit ? 'text-purple-400 hover:text-purple-300' : 'text-zinc-600'}`}
                        >
                          {Math.round(((media.pages_read || 0) / media.total_pages) * 100)}% {canEdit && '• Adjust'}
                        </button>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                          style={{ width: `${Math.min(((media.pages_read || 0) / media.total_pages) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-2">
                    {media.platform && (
                      <PlatformBadge platform={media.platform} size="sm" />
                    )}
                    {media.universe_id && (
                      <UniverseBadge universeId={media.universe_id} />
                    )}
                    <OfflineBookBadge mediaId={media.id} media={media} />
                    {media.language && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-[10px] border-0 px-2 py-0">
                        {media.language}
                      </Badge>
                    )}
                    {media.genre && media.genre.slice(0, 2).map(g => (
                      <Badge key={g} className="bg-purple-500/20 text-purple-400 text-[10px] border-0 px-2 py-0">
                        {g}
                      </Badge>
                    ))}
                  </div>

                  {media.type === 'series' && media.seasons_count && (
                    <p className="text-xs text-white mb-2 flex items-center gap-1">
                      <Tv className="w-3 h-3 text-purple-400" />
                      {media.seasons_count} Season{media.seasons_count > 1 ? 's' : ''} • {media.episodes_per_season?.reduce((a, b) => a + b, 0) || 0} Episodes
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-col gap-2">
                  <Badge className="bg-amber-500/90 text-black border-0 font-medium text-xs">
                    {media.type === 'series' ? 'Series' : media.type === 'book' ? 'Book' : 'Movie'}
                  </Badge>
                  {media.status === 'watched' && (
                    <Badge className="bg-emerald-500/90 text-white border-0 flex items-center gap-1 text-xs">
                      {media.type === 'book' ? (
                        <>
                          <Star className="w-3 h-3 fill-white" />
                          Read
                        </>
                      ) : media.type === 'movie' && rewatchCount > 0 ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          Rewatched {rewatchCount}x
                        </>
                      ) : (
                        <>
                          <Star className="w-3 h-3 fill-white" />
                          Watched
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description below title - fixed height with scroll */}
              <div className="flex-1 mt-2 min-h-0">
                {media.description && (
                  <div className="h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
                    <p className="text-[10px] text-zinc-400 leading-relaxed pr-2">
                      {media.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Cast / Author - fixed height with scroll */}
              {media.type === 'book' && media.author ? (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium">Author:</span>
                  </div>
                  <p className="text-xs text-white">{media.author}</p>
                </div>
              ) : media.actors && media.actors.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium">Cast:</span>
                  </div>
                  <div className="h-12 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
                    <div className="flex flex-wrap gap-1 pr-2">
                      {media.actors.map(actor => (
                        <span key={actor} className="text-[10px] text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rating */}
              {media.rating && (
                <div className="mt-2">
                  <StarRating rating={media.rating} size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Action buttons at bottom - always at same position */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-zinc-800">
            {media.type === 'series' && media.status === 'watched' ? (
              <>
                <Button 
                  size="sm"
                  onClick={() => isSchedulable && onSchedule(media)}
                  disabled={!isSchedulable}
                  className={`flex-1 min-w-0 font-medium shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 ${!isSchedulable ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 
                    buttonStatus === 'watching' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 animate-pulse' :
                    buttonStatus === 'paused' ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30' :
                    buttonStatus === 'delayed' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' :
                    'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/30'
                  }`}
                  >
                  <Play className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">
                  {buttonStatus === 'watching' ? (media.type === 'book' ? 'Reading' : 'Watching') :
                   buttonStatus === 'paused' ? 'Paused' :
                   buttonStatus === 'delayed' ? 'Delayed' :
                   media.type === 'book' ? 'Reread' : 'Rewatch'}
                  </span>
                  </Button>
                <Button 
                  size="sm"
                  onClick={() => canEdit && onAddSeasons?.(media)}
                  disabled={!canEdit}
                  className={`flex-1 min-w-0 font-medium shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 ${!canEdit ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/30'}`}
                >
                  <Plus className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Add Seasons</span>
                  <span className="sm:hidden">+S</span>
                </Button>
              </>
            ) : media.type === 'series' ? (
              <Button 
                size="sm"
                onClick={() => isSchedulable && onSchedule(media)}
                disabled={!isSchedulable}
                className={`flex-1 font-medium shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 ${!isSchedulable ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' :
                  buttonStatus === 'watching' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 animate-pulse' :
                  buttonStatus === 'paused' ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30' :
                  buttonStatus === 'delayed' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' :
                  'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30'
                }`}
              >
                <Calendar className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">
                  {buttonStatus === 'watching' ? 'Watching' :
                   buttonStatus === 'paused' ? 'Paused' :
                   buttonStatus === 'delayed' ? 'Delayed' :
                   'Schedule'}
                </span>
                <span className="sm:hidden">
                  {buttonStatus === 'watching' ? 'Watch' :
                   buttonStatus === 'paused' ? 'Pause' :
                   buttonStatus === 'delayed' ? 'Delay' :
                   'Sched'}
                </span>
              </Button>
            ) : media.status === 'watched' ? (
              <Button 
                size="sm"
                onClick={() => isSchedulable && onSchedule(media)}
                disabled={!isSchedulable}
                className={`flex-1 font-medium shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 ${!isSchedulable ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' :
                  buttonStatus === 'watching' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 animate-pulse' :
                  buttonStatus === 'paused' ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30' :
                  buttonStatus === 'delayed' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' :
                  'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/30'
                }`}
              >
                <Play className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">
                {buttonStatus === 'watching' ? 'Watching' :
                 buttonStatus === 'paused' ? 'Paused' :
                 buttonStatus === 'delayed' ? 'Delayed' :
                 'Rewatch'}
                </span>
              </Button>
            ) : media.is_future_release && media.release_date && new Date(media.release_date) > new Date() ? (
              <Button 
                size="sm"
                disabled
                className="flex-1 font-medium shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
              >
                <Calendar className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Releases {format(new Date(media.release_date), 'MMM d')}</span>
                <span className="sm:hidden">Soon</span>
              </Button>
            ) : !hasSchedule ? (
              <Button 
                size="sm"
                onClick={() => isSchedulable && onSchedule(media)}
                disabled={!isSchedulable}
                className={`flex-1 font-medium shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 ${!isSchedulable ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30'}`}
              >
                <Calendar className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">{media.type === 'book' ? 'Schedule' : 'Schedule'}</span>
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={() => isWatchable && onWatch(media)}
                disabled={!isWatchable}
                className={`flex-1 font-medium shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 ${!isWatchable ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50' :
                  buttonStatus === 'watching' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 animate-pulse' :
                  buttonStatus === 'paused' ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30' :
                  buttonStatus === 'delayed' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' :
                  'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                }`}
              >
                <Play className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">
                {buttonStatus === 'watching' ? (media.type === 'book' ? 'Reading' : 'Watching') :
                 buttonStatus === 'paused' ? 'Paused' :
                 buttonStatus === 'delayed' ? 'Delayed' :
                 media.type === 'book' ? 'Read' : 'Watch'}
                </span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => canEdit && onEdit(media)}
              disabled={!canEdit}
              className={`font-medium text-[10px] sm:text-xs px-2 sm:px-3 ${!canEdit ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50 border-zinc-700' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50'}`}
            >
              <Edit2 className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              size="sm"
              onClick={() => canDelete && setShowDeleteConfirm(true)}
              disabled={!canDelete}
              className={`font-medium text-[10px] sm:text-xs px-2 sm:px-3 ${!canDelete ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50 border-zinc-700' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'}`}
            >
              <Trash2 className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="relative">
              {/* Header with poster */}
              <div className="relative h-64 overflow-hidden">
                {media.poster_url ? (
                  <img 
                    src={media.poster_url} 
                    alt={media.title}
                    className="w-full h-full object-cover blur-sm opacity-40"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
                  {media.poster_url && (
                    <img 
                      src={media.poster_url} 
                      alt={media.title}
                      className="w-28 h-40 object-cover rounded-xl shadow-2xl border border-zinc-700"
                    />
                  )}
                  <div className="flex-1">
                    <Badge className={`${platformColors[media.platform]} text-white text-xs border-0 mb-2`}>
                      {media.type === 'series' ? 'Series' : 'Movie'}
                    </Badge>
                    <h2 className="text-3xl font-bold text-white mb-2">{media.title}</h2>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatRuntime(media.runtime_minutes)}
                      </span>
                      {media.device && (
                        <span className="flex items-center gap-1">
                          <DeviceIcon className="w-4 h-4" />
                          {media.device}
                        </span>
                      )}
                      {media.platform && (
                        <PlatformBadge platform={media.platform} size="default" />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <span className="text-white text-xl">×</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Rating */}
                {media.rating && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Rating</h3>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-2xl ${star <= media.rating ? 'text-amber-400' : 'text-zinc-700'}`}>★</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {media.description && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
                    <p className="text-zinc-300 leading-relaxed">{media.description}</p>
                  </div>
                )}

                {/* Actors */}
                {media.actors && media.actors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Cast
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {media.actors.map(actor => (
                        <Badge key={actor} className="bg-zinc-800 text-zinc-300 border-zinc-700">
                          {actor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={(e) => { e.stopPropagation(); setShowDetails(false); onEdit(media); }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); setShowDetails(false); onDelete(media.id); }}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>

                {/* Connected Universe Section */}
                <ConnectedUniverse
                  currentMedia={media}
                  allMedia={allMedia}
                  schedules={schedules}
                  onNavigateToMedia={(mediaId) => {
                    setShowDetails(false);
                    onNavigateToMedia?.(mediaId);
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-white mb-2">Delete Title</h3>
            <p className="text-zinc-300 text-sm mb-6">
              Are you sure you want to delete "{media.title}" from your library? This will also delete all schedules and history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  executeAction('Deleting', async () => {
                    await onDelete(media.id);
                  }, {
                    successTitle: 'Deleted Successfully',
                    successSubtitle: `${media.title} has been removed from your library`
                  });
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}