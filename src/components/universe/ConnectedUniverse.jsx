import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, PlayCircle, Calendar, CheckCircle, Plus, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function ConnectedUniverse({ currentMedia, allMedia, schedules, onNavigateToMedia }) {
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUniverse = async () => {
      if (!currentMedia?.universe_id) {
        setLoading(false);
        return;
      }

      try {
        const universeData = await base44.entities.Universe.filter({ id: currentMedia.universe_id });
        if (universeData && universeData.length > 0) {
          setUniverse(universeData[0]);
        }
      } catch (error) {
        console.error('Failed to load universe:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUniverse();
  }, [currentMedia?.universe_id]);

  const relatedTitles = useMemo(() => {
    if (!currentMedia?.universe_id || !allMedia) return [];
    
    return allMedia
      .filter(m => m.universe_id === currentMedia.universe_id && m.id !== currentMedia.id)
      .map(media => {
        // Determine watch status
        const completedSchedules = schedules.filter(s => s.media_id === media.id && s.status === 'completed');
        const activeSchedule = schedules.find(s => s.media_id === media.id && (s.status === 'in_progress' || s.status === 'paused'));
        const scheduledSchedule = schedules.find(s => s.media_id === media.id && s.status === 'scheduled');
        
        let status = 'not_started';
        let statusLabel = 'Not Started';
        let statusColor = 'bg-zinc-700 text-zinc-400';
        let StatusIcon = Plus;
        
        if (media.status === 'watched' || completedSchedules.length > 0) {
          status = 'completed';
          statusLabel = 'Completed';
          statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
          StatusIcon = CheckCircle;
        } else if (activeSchedule) {
          status = 'playing';
          statusLabel = 'Playing';
          statusColor = 'bg-purple-500/20 text-purple-400 border-purple-500/50';
          StatusIcon = PlayCircle;
        } else if (scheduledSchedule) {
          status = 'scheduled';
          statusLabel = 'Scheduled';
          statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/50';
          StatusIcon = Calendar;
        }
        
        return {
          ...media,
          watchStatus: status,
          statusLabel,
          statusColor,
          StatusIcon
        };
      })
      .sort((a, b) => {
        // Sort by year if available
        if (a.year && b.year) return a.year - b.year;
        return 0;
      });
  }, [currentMedia, allMedia, schedules]);

  if (loading || !universe || relatedTitles.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <Card className="bg-zinc-900/95 border-purple-500/30 overflow-hidden relative">
        {/* Universe Cover Image Background */}
        {universe.cover_image && (
          <div className="absolute inset-0 z-0">
            <img
              src={universe.cover_image}
              alt={universe.name}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/80 to-zinc-900/95" />
          </div>
        )}

        <div className="relative z-10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                Connected Universe
              </CardTitle>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                {relatedTitles.length + 1} Titles
              </Badge>
            </div>
            {universe.description && (
              <p className="text-xs text-zinc-400 mt-2">{universe.description}</p>
            )}
          </CardHeader>
          
          <CardContent className="pb-4">
            {/* Universe Header with Cover Image */}
            <div className="mb-4 relative rounded-lg overflow-hidden border border-purple-500/30">
              {universe.cover_image ? (
                <div className="relative h-32 sm:h-40">
                  <img
                    src={universe.cover_image}
                    alt={universe.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm sm:text-base font-bold text-white drop-shadow-lg">{universe.name}</h3>
                    <p className="text-xs text-zinc-200 mt-1 drop-shadow-md">
                      {universe.type === 'franchise' ? 'Franchise' :
                       universe.type === 'shared_world' ? 'Shared World' :
                       universe.type === 'prequel_sequel' ? 'Connected Timeline' :
                       universe.type === 'spin_off' ? 'Spin-offs & Extensions' :
                       universe.type === 'anthology' ? 'Anthology Series' : 'Connected Universe'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-emerald-500/10">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-purple-500/20 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-purple-400">
                      {universe.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{universe.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {universe.type === 'franchise' ? 'Franchise' :
                     universe.type === 'shared_world' ? 'Shared World' :
                     universe.type === 'prequel_sequel' ? 'Connected Timeline' :
                     universe.type === 'spin_off' ? 'Spin-offs & Extensions' :
                     universe.type === 'anthology' ? 'Anthology Series' : 'Connected Universe'}
                  </p>
                </div>
              )}
            </div>

          {/* Horizontal Scrollable Related Titles */}
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-zinc-700 scroll-smooth">
              {relatedTitles.map((title, idx) => {
                const Icon = title.StatusIcon;
                return (
                  <motion.div
                    key={title.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onNavigateToMedia?.(title.id)}
                    className="flex-shrink-0 w-32 sm:w-40 cursor-pointer group"
                  >
                    <div className="relative mb-2">
                      {title.poster_url ? (
                        <img
                          src={title.poster_url}
                          alt={title.title}
                          className="w-full h-44 sm:h-56 object-cover rounded-lg border-2 border-zinc-700 group-hover:border-purple-500/50 transition-all shadow-lg group-hover:shadow-purple-500/30"
                        />
                      ) : (
                        <div className="w-full h-44 sm:h-56 bg-zinc-800 rounded-lg border-2 border-zinc-700 group-hover:border-purple-500/50 flex items-center justify-center">
                          <span className="text-4xl text-zinc-600">{title.title[0]}</span>
                        </div>
                      )}
                      
                      {/* Status Badge Overlay */}
                      <div className="absolute top-2 right-2">
                        <Badge className={`${title.statusColor} border text-[10px] flex items-center gap-1 shadow-lg`}>
                          <Icon className="w-3 h-3" />
                          {title.statusLabel}
                        </Badge>
                      </div>

                      {/* Year Badge */}
                      {title.year && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-black/60 text-white border-0 text-[10px]">
                            {title.year}
                          </Badge>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-lg flex items-end p-2">
                        <ChevronRight className="w-5 h-5 text-white ml-auto" />
                      </div>
                    </div>

                    <div className="px-1">
                      <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight mb-1 group-hover:text-purple-400 transition-colors">
                        {title.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-zinc-800 text-zinc-300 border-0 text-[10px]">
                          {title.type === 'movie' ? 'Movie' : title.type === 'series' ? 'Series' : 'Book'}
                        </Badge>
                        {title.rating && (
                          <span className="text-[10px] text-amber-400">★ {title.rating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Connection Line Visual */}
            <div className="absolute top-24 sm:top-28 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/30 via-emerald-500/30 to-purple-500/30 pointer-events-none -z-10" />
          </div>

            {/* Universe Stats Footer */}
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-zinc-400">In Universe: </span>
                  <span className="text-white font-semibold">{relatedTitles.length + 1}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Completed: </span>
                  <span className="text-emerald-400 font-semibold">
                    {relatedTitles.filter(t => t.watchStatus === 'completed').length + (currentMedia.status === 'watched' ? 1 : 0)}
                  </span>
                </div>
              </div>
              <span className="text-zinc-500 text-[10px]">Scroll to explore →</span>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}