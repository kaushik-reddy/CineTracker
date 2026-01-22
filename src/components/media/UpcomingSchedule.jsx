import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Calendar as CalendarIcon, Clock, Play, Trash2, Users, Edit2, Pause, Tv, Monitor, Book, Smartphone, Rewind, FastForward, Film } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { motion } from "framer-motion";
import CountdownTimer from "../schedule/CountdownTimer";
import { PlatformBadge } from "../common/PlatformLogos";
import { AudioFormatBadge, VideoFormatBadge } from "../common/DeviceAudioVideoIcons";
import CinematicScheduleCard from "./CinematicScheduleCard";

const deviceIcons = {
  "TV": Tv,
  "Laptop": Monitor,
  "Phone": Smartphone,
  "Tablet": Smartphone,
  "Projector": Monitor,
  "E-Reader": Book,
  "Physical Book": Book,
  "Big Screen": Monitor,
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
  "Other": "bg-gray-500"
};

export default function UpcomingSchedule({ schedules, mediaMap, onWatch, onDelete, onEditSchedule, onPlayPause, playingScheduleId, onReschedule, onJumpToTime, onOpenJumpModal, localElapsed, userRole, userPermissions, isHighlighted, onNavigate }) {
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const canWatch = userRole === 'admin' || userPermissions?.can_watch;
  const canEdit = userRole === 'admin' || userPermissions?.can_edit;
  const canDelete = userRole === 'admin' || userPermissions?.can_delete;
  // Separate currently watching from upcoming
  const currentlyWatching = schedules.filter(s => 
    s.status === 'in_progress' || s.status === 'paused'
  );
  
  const upcomingSchedules = schedules.filter(s => 
    s.status === 'scheduled'
  ).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  
  const nextUpcoming = upcomingSchedules[0];

  // Calculate completion prediction for series
  const getCompletionPrediction = (schedule) => {
    const media = mediaMap[schedule.media_id];
    if (!media || media.type !== 'series') return null;
    
    const completedEpisodes = schedules.filter(s => 
      s.media_id === media.id && s.status === 'completed'
    );
    
    if (completedEpisodes.length === 0) return null;
    
    const totalEpisodes = media.episodes_per_season?.reduce((a, b) => a + b, 0) || 0;
    const remainingEpisodes = totalEpisodes - completedEpisodes.length;
    
    if (remainingEpisodes <= 0) return null;
    
    // Calculate average time between watches
    const sortedCompleted = completedEpisodes.sort((a, b) => 
      new Date(a.updated_date) - new Date(b.updated_date)
    );
    
    if (sortedCompleted.length < 2) return null;
    
    const totalDays = (new Date(sortedCompleted[sortedCompleted.length - 1].updated_date) - 
                      new Date(sortedCompleted[0].updated_date)) / (1000 * 60 * 60 * 24);
    const avgDaysPerEpisode = totalDays / (sortedCompleted.length - 1);
    const estimatedDays = Math.round(remainingEpisodes * avgDaysPerEpisode);
    
    return {
      remainingEpisodes,
      estimatedDays: estimatedDays > 0 ? estimatedDays : 1
    };
  };

  if (schedules.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-400">No scheduled watches yet</p>
        <p className="text-sm text-zinc-600 mt-1">Schedule a movie from your library to see it here</p>
      </Card>
    );
  }

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Currently Watching Section */}
      {currentlyWatching.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Currently Watching
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {currentlyWatching.map((schedule, index) => {
              const media = mediaMap[schedule.media_id];
              if (!media) return null;
              
              const isPlaying = playingScheduleId === schedule.id;
              const currentElapsed = isPlaying ? (localElapsed?.[schedule.id] || schedule.elapsed_seconds) : schedule.elapsed_seconds;
              
              // Get actual episode/session runtime
              let episodeRuntime = media.runtime_minutes;
              if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
                const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
                if (epRuntime) episodeRuntime = epRuntime;
              } else if (media.type === 'book') {
                episodeRuntime = schedule.session_duration || 30;
              }
              
              const progress = (currentElapsed / (episodeRuntime * 60)) * 100;
              const DeviceIcon = deviceIcons[media.device] || Monitor;
              const prediction = getCompletionPrediction(schedule);

              return (
                <CinematicScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  media={media}
                  onWatch={onWatch}
                  onDelete={onDelete}
                  onEditSchedule={onEditSchedule}
                  onPlayPause={onPlayPause}
                  playingScheduleId={playingScheduleId}
                  onReschedule={onReschedule}
                  onJumpToTime={onJumpToTime}
                  onOpenJumpModal={onOpenJumpModal}
                  localElapsed={localElapsed}
                  userRole={userRole}
                  userPermissions={userPermissions}
                  isHighlighted={isHighlighted}
                  onNavigate={onNavigate}
                  setDeleteConfirm={setDeleteConfirm}
                  isPlaying={isPlaying}
                  isCurrentlyWatching={true}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Schedules Section */}
      {upcomingSchedules.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-500" />
              Upcoming
            </h3>
            {nextUpcoming && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">Next:</span>
                <CountdownTimer 
                  targetDate={nextUpcoming.scheduled_date}
                  audioFormat={nextUpcoming.audio_format}
                  videoFormat={nextUpcoming.video_format}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {upcomingSchedules.map((schedule, index) => {
              const media = mediaMap[schedule.media_id];
              if (!media) return null;
              
              const scheduleDate = new Date(schedule.scheduled_date);
              const now = new Date();
              const isOverdue = isPast(scheduleDate) && schedule.elapsed_seconds === 0;
              const DeviceIcon = deviceIcons[media.device] || Monitor;

              return (
                <CinematicScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  media={media}
                  onWatch={onWatch}
                  onDelete={onDelete}
                  onEditSchedule={onEditSchedule}
                  onPlayPause={onPlayPause}
                  playingScheduleId={playingScheduleId}
                  onReschedule={onReschedule}
                  onJumpToTime={onJumpToTime}
                  onOpenJumpModal={onOpenJumpModal}
                  localElapsed={localElapsed}
                  userRole={userRole}
                  userPermissions={userPermissions}
                  isHighlighted={isHighlighted}
                  onNavigate={onNavigate}
                  setDeleteConfirm={setDeleteConfirm}
                  isPlaying={false}
                  isCurrentlyWatching={false}
                />
              );
            })}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => !isDeleting && setDeleteConfirm(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Schedule?</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm">Are you sure you want to delete this scheduled item?</p>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setDeleteConfirm(null)} disabled={isDeleting} className="flex-1 bg-white text-black hover:bg-zinc-100 disabled:opacity-50">
                Cancel
              </Button>
              <Button onClick={async () => {
                setIsDeleting(true);
                try {
                  await onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                } finally {
                  setIsDeleting(false);
                }
              }} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}