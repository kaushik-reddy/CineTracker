import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Film, Tv, CheckCircle, Book } from "lucide-react";
import { motion } from "framer-motion";
import { StudioLogos } from "../common/StudioLogo";

export default function PlatformDrillDown({ open, onClose, platform, completedSchedules, mediaMap, allMedia }) {
  const platformTitles = useMemo(() => {
    if (!platform) return [];
    
    const titles = [];
    const processedMedia = new Set();
    
    completedSchedules.forEach(schedule => {
    const media = allMedia?.find(m => m.id === schedule.media_id) || mediaMap[schedule.media_id];
    if (!media || media.platform !== platform) return;
      
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
        const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      } else if (media.type === 'book') {
        runtime = schedule.session_duration || 30;
      }
      
      const key = media.type === 'series' ? `${media.id}-S${schedule.season_number}E${schedule.episode_number}` : media.id;
      
      if (!processedMedia.has(key)) {
        processedMedia.add(key);
        titles.push({
          id: key,
          title: media.title,
          type: media.type,
          poster: media.poster_url,
          runtime,
          season: schedule.season_number,
          episode: schedule.episode_number,
          watchedDate: schedule.rating_submitted_at || schedule.updated_date
        });
      }
    });
    
    return titles.sort((a, b) => new Date(b.watchedDate) - new Date(a.watchedDate));
  }, [platform, completedSchedules, mediaMap]);

  const totalHours = useMemo(() => {
    return platformTitles.reduce((sum, t) => sum + t.runtime, 0) / 60;
  }, [platformTitles]);

  if (!platform) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {platform}
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
              {platformTitles.length} watches
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-400 border-0">
              {totalHours.toFixed(1)}h total
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 pr-2">
          {platformTitles.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-purple-500/50 transition-all"
            >
              {item.poster ? (
                <img src={item.poster} alt={item.title} className="w-12 h-16 object-cover rounded" />
              ) : (
                <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center">
                  <span className="text-zinc-500 text-xl">{item.title[0]}</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h5 className="text-white font-semibold text-sm truncate flex-1">{item.title}</h5>
                  <StudioLogos studios={mediaMap[schedule.media_id]?.studios} size="xs" maxDisplay={1} />
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.type === 'movie' && <Film className="w-3 h-3 text-amber-400" />}
                  {item.type === 'series' && <Tv className="w-3 h-3 text-purple-400" />}
                  {item.type === 'book' && <Book className="w-3 h-3 text-blue-400" />}
                  
                  {item.season && (
                    <Badge className="bg-zinc-700 text-zinc-300 border-0 text-xs">
                      S{item.season}E{item.episode}
                    </Badge>
                  )}
                  
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(item.runtime / 60)}h {item.runtime % 60}m
                  </span>
                  
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}