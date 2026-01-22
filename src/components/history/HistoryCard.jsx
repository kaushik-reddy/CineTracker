import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Tv, Monitor, Calendar, Users, Star, Trash2, Book, Smartphone, Edit2 } from "lucide-react";
import StarRating from "../common/StarRating";
import { format } from "date-fns";
import EditRatingModal from "./EditRatingModal";
import SocialShare from "../common/SocialShare";
import { PlatformBadge } from "../common/PlatformLogos";
import { AudioFormatBadge, VideoFormatBadge } from "../common/DeviceAudioVideoIcons";
import { StudioLogos } from "../common/StudioLogo";
import { useAction } from "../feedback/useAction";

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

export default function HistoryCard({ media, schedule, onDelete, onRateChange, userRole, userPermissions, isHighlighted, onNavigate }) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const canDelete = userRole === 'admin' || userPermissions?.can_delete;
  const DeviceIcon = deviceIcons[media.device] || Monitor;
  const { executeAction } = useAction();
  
  const formatRuntime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <>
    <Card 
      className={`bg-zinc-900/80 border-zinc-800 hover:border-emerald-500/50 hover-shadow transition-all duration-300 overflow-hidden flex flex-col w-full ${
        isHighlighted ? 'ring-4 ring-amber-500 border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.8)]' : ''
      }`}>
      <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col flex-1">
        <div className="flex gap-3 sm:gap-4 flex-1">
          {/* Poster */}
          <div className="flex-shrink-0">
            {media.poster_url ? (
              <img 
                src={media.poster_url} 
                alt={media.title}
                className="w-16 sm:w-20 h-24 sm:h-30 object-cover rounded-lg border border-zinc-700"
                style={{ width: '64px', height: '96px' }}
              />
            ) : (
              <div className="w-16 sm:w-20 h-24 sm:h-30 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700" style={{ width: '64px', height: '96px' }}>
                <span className="text-xl sm:text-2xl text-zinc-600">{media.title?.[0]}</span>
              </div>
            )}
          </div>

          {/* Content - Flex column to push actions to bottom */}
          <div className="flex-1 min-w-0 flex flex-col w-full overflow-hidden">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 
                    className="font-bold text-white text-xs sm:text-sm cursor-pointer hover:text-amber-400 transition-colors line-clamp-2 flex-1"
                    onClick={onNavigate}
                  >
                    {media.title}
                    {schedule.season_number && (
                      <span className="text-xs sm:text-sm text-amber-400 ml-1 sm:ml-2">
                        S{String(schedule.season_number).padStart(2, '0')}E{String(schedule.episode_number).padStart(2, '0')}
                      </span>
                    )}
                  </h3>
                  <StudioLogos studios={media.studios} size="sm" maxDisplay={1} />
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-xs text-white mb-2">
                  {media.type === 'book' ? (
                    <>
                      <span className="flex items-center gap-1">
                        <Book className="w-3 h-3" />
                        {media.total_pages} pages
                      </span>
                      {schedule.pages_read_in_session && (
                        <>
                          <span>•</span>
                          <span>{schedule.pages_read_in_session} pages read</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(() => {
                        let runtime = media.runtime_minutes;
                        if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
                          const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
                          if (epRuntime) runtime = epRuntime;
                        }
                        return formatRuntime(runtime);
                      })()}
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <DeviceIcon className="w-3 h-3" />
                    {schedule.device || media.device}
                  </span>
                  {schedule.audio_format && (
                    <>
                      <span>•</span>
                      <AudioFormatBadge format={schedule.audio_format} size="small" />
                    </>
                  )}
                  {schedule.video_format && (
                    <>
                      <span>•</span>
                      <VideoFormatBadge format={schedule.video_format} size="small" />
                    </>
                  )}
                </div>

                {media.platform && (
                  <div className="mb-2">
                    <PlatformBadge platform={media.platform} size="default" />
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                <Badge className="bg-emerald-500/90 text-white border-0 flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 fill-white" />
                  {media.type === 'book' ? 'Read' : 'Watched'}
                </Badge>
              </div>
            </div>

            {/* Watched/Read date */}
            {schedule?.started_at && (
              <div className="flex items-center gap-1 text-xs text-white mb-2">
                <Calendar className="w-3 h-3" />
                {media.type === 'book' ? 'Read' : 'Watched'} on {format(new Date(schedule.started_at), 'MMM d, yyyy')}
              </div>
            )}

            {/* Description */}
            {media.description && (
              <p className="text-[10px] sm:text-xs text-white line-clamp-2 mb-2">
                {media.description}
              </p>
            )}

            {/* Actors / Author */}
            {media.type === 'book' && media.author ? (
            <div className="mb-2 sm:mb-3">
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-400 mb-1">
                <Users className="w-3 h-3" />
                <span className="font-medium text-white">Author:</span>
              </div>
              <p className="text-[10px] sm:text-xs text-white truncate">{media.author}</p>
            </div>
            ) : media.actors && media.actors.length > 0 && (
            <div className="mb-2 sm:mb-3">
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-400 mb-1">
                <Users className="w-3 h-3" />
                <span className="font-medium text-white">Cast:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {media.actors.slice(0, 3).map(actor => (
                  <span key={actor} className="text-[10px] sm:text-xs text-white bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded truncate max-w-[80px] sm:max-w-none">
                    {actor}
                  </span>
                ))}
                {media.actors.length > 3 && (
                  <span className="text-[10px] sm:text-xs text-white px-1">+{media.actors.length - 3}</span>
                )}
              </div>
            </div>
            )}

            </div>
          </div>
        </div>

        {/* Action buttons - Always at bottom */}
        <div className="pt-2 sm:pt-3 border-t border-zinc-800 space-y-2 mt-2 sm:mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRatingModal(true);
            }}
            className="w-full flex items-center justify-between p-2 sm:p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-amber-500/50 transition-all group"
          >
            <span className="text-xs sm:text-sm text-zinc-400 group-hover:text-white">Rating:</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <StarRating rating={schedule.rating || 0} size="sm" />
              <span className="text-xs sm:text-sm font-bold text-white">{schedule.rating ? schedule.rating.toFixed(1) : '0.0'}</span>
              <Edit2 className="w-3 sm:w-4 h-3 sm:h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
            </div>
          </button>

          {/* Share and Delete buttons */}
          <div className="flex gap-2">
            <div className="flex-1">
              <SocialShare media={media} schedule={schedule} type="completion" />
            </div>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/50 h-9 text-xs sm:text-sm"
              >
                <Trash2 className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden">Delete</span>
              </Button>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
    
    <EditRatingModal
      open={showRatingModal}
      onClose={() => setShowRatingModal(false)}
      currentRating={schedule.rating}
      title={media.title}
      onSubmit={(newRating) => onRateChange(schedule.id, newRating)}
    />

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Delete History Entry</DialogTitle>
        </DialogHeader>
        <p className="text-zinc-300 text-sm">
          Are you sure you want to delete this history entry for "{media.title}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-4">
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
                await onDelete(schedule.id, media.id);
              }, {
                successTitle: 'Deleted Successfully',
                successSubtitle: 'History entry has been removed'
              });
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}