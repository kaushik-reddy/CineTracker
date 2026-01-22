import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Film, Tv, Clock, Calendar, Play, Check, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { motion } from "framer-motion";
import EntityLogo from "../common/EntityLogo";

export default function WeeklyReleasesSection({ onAddToLibrary, onOpenAddForm, userRole, userPermissions }) {
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedRelease, setSelectedRelease] = useState(null);
  const queryClient = useQueryClient();

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['weekly-releases'],
    queryFn: () => base44.entities.WeeklyRelease.filter({ is_active: true }),
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const { data: existingMedia = [] } = useQuery({
    queryKey: ['user-media-titles'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Media.filter({ created_by: user.email });
    },
    refetchInterval: 1000 * 60 * 2 // Refresh every 2 minutes
  });

  // Apply filters - show all active releases
  const filteredReleases = useMemo(() => {
    return releases.filter(r => {
      if (platformFilter !== 'all' && r.platform !== platformFilter) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (languageFilter !== 'all' && r.language !== languageFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  }, [releases, platformFilter, typeFilter, languageFilter]);

  const platforms = useMemo(() => [...new Set(releases.map(r => r.platform))], [releases]);
  const languages = useMemo(() => [...new Set(releases.map(r => r.language).filter(Boolean))], [releases]);

  const canAddTitle = userRole === 'admin' || userPermissions?.can_add_title;

  const handleAddToLibrary = (release) => {
    if (!canAddTitle || isAlreadyInLibrary(release)) return;
    
    const today = new Date();
    const releaseDate = new Date(release.release_date);
    const isFutureRelease = releaseDate > today;
    
    const mediaData = {
      title: release.title,
      type: release.type,
      platform: release.platform,
      genre: release.genre || [],
      language: release.language,
      runtime_minutes: release.runtime_minutes,
      seasons_count: release.seasons_count,
      episodes_per_season: release.type === 'series' && release.seasons_count ? Array(release.seasons_count).fill(10) : undefined,
      description: release.description,
      actors: release.actors || [],
      year: release.year,
      age_restriction: release.age_restriction,
      status: 'unwatched',
      is_future_release: isFutureRelease,
      release_date: isFutureRelease ? release.release_date : undefined
    };

    // Open add form with pre-filled data
    if (onOpenAddForm) {
      onOpenAddForm(mediaData);
    }
  };

  const isAlreadyInLibrary = (release) => {
    return existingMedia.some(m => m.title.toLowerCase() === release.title.toLowerCase());
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-8 text-center">
          <p className="text-zinc-400">Loading new releases...</p>
        </CardContent>
      </Card>
    );
  }

  if (releases.length === 0) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">🎬 No new releases available. Check back soon!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-500/10 to-emerald-500/10 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-white text-lg">New OTT Releases This Week</CardTitle>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs w-28">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-white">All Types</SelectItem>
                  <SelectItem value="movie" className="text-white">Movies</SelectItem>
                  <SelectItem value="series" className="text-white">Series</SelectItem>
                </SelectContent>
              </Select>

              {platforms.length > 0 && (
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs w-32">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-64">
                    <SelectItem value="all" className="text-white">All Platforms</SelectItem>
                    {platforms.map(p => (
                      <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {languages.length > 0 && (
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs w-28">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-64">
                    <SelectItem value="all" className="text-white">All Languages</SelectItem>
                    {languages.map(l => (
                      <SelectItem key={l} value={l} className="text-white">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-thin scrollbar-thumb-zinc-700">
            <div className="flex gap-3 pb-2" style={{ width: `${filteredReleases.length * 268}px` }}>
              {filteredReleases.map((release, idx) => {
                  const inLibrary = isAlreadyInLibrary(release);
                
                return (
                  <motion.div
                    key={release.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex-shrink-0 w-64"
                  >
                    <Card className="bg-zinc-800/50 border-zinc-700 hover:border-purple-500/50 transition-all cursor-pointer group h-full flex flex-col">
                      <CardContent className="p-3 flex flex-col h-full">
                        <div 
                          onClick={() => setSelectedRelease(release)}
                          className="flex-1 flex flex-col"
                        >
                          {/* Header with badges */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 flex-shrink-0">
                              {release.type === 'movie' ? <Film className="w-2.5 h-2.5 mr-0.5" /> : <Tv className="w-2.5 h-2.5 mr-0.5" />}
                              {release.type === 'movie' ? 'Movie' : 'Series'}
                            </Badge>
                            <EntityLogo entityName={release.platform} category="platform" size="sm" />
                          </div>

                        {/* Info - Fixed Height */}
                        <div className="flex-1 flex flex-col gap-1.5 mb-2">
                          <h4 className="text-white font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                            {release.title}
                          </h4>

                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 flex-wrap">
                            <Calendar className="w-2.5 h-2.5" />
                            {format(new Date(release.release_date), 'MMM d')}
                            {release.type === 'movie' && release.runtime_minutes && (
                              <>
                                <span>•</span>
                                <Clock className="w-2.5 h-2.5" />
                                {release.runtime_minutes}m
                              </>
                            )}
                            {release.type === 'series' && release.seasons_count && (
                              <>
                                <span>•</span>
                                {release.seasons_count}S
                              </>
                            )}
                          </div>

                          {release.genre && release.genre.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {release.genre.slice(0, 2).map(g => (
                                <Badge key={g} className="bg-purple-500/20 text-purple-300 border-0 text-[10px] px-1.5 py-0.5">
                                  {g}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {release.language && (
                            <p className="text-[10px] text-zinc-500">{release.language}</p>
                          )}
                        </div>

                          {/* Actions - Fixed at bottom */}
                          <div className="flex gap-1.5 mt-auto">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRelease(release);
                              }}
                              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] h-7 px-2"
                            >
                              <Play className="w-2.5 h-2.5 mr-0.5" />
                              Info
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToLibrary(release);
                              }}
                              disabled={!canAddTitle || inLibrary}
                              className={`flex-1 text-[10px] h-7 px-2 ${
                                inLibrary 
                                  ? 'bg-zinc-700/50 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50'
                                  : canAddTitle 
                                    ? 'bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white'
                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'
                              }`}
                            >
                              {inLibrary ? (
                                <>
                                  <Check className="w-2.5 h-2.5 mr-0.5" />
                                  Added
                                </>
                              ) : (
                                '+ Add'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {filteredReleases.length === 0 && (
            <p className="text-center text-zinc-400 py-4">No releases match your filters</p>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedRelease && (
        <Dialog open={!!selectedRelease} onOpenChange={() => setSelectedRelease(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                {selectedRelease.type === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                {selectedRelease.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amber-500/20 text-amber-400">
                  {selectedRelease.type === 'movie' ? 'Movie' : 'Series'}
                </Badge>
                {selectedRelease.platform && (
                  <Badge className="bg-purple-500/20 text-purple-300">
                    {selectedRelease.platform}
                  </Badge>
                )}
                {selectedRelease.year && (
                  <Badge variant="outline" className="text-zinc-400">
                    {selectedRelease.year}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-zinc-400">
                <Calendar className="w-4 h-4 inline mr-1" />
                Released {format(new Date(selectedRelease.release_date), 'MMMM d, yyyy')}
              </p>

              {selectedRelease.runtime_minutes && (
                <p className="text-sm text-zinc-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {selectedRelease.runtime_minutes} minutes
                </p>
              )}

              {selectedRelease.seasons_count && (
                <p className="text-sm text-zinc-400">
                  {selectedRelease.seasons_count} Season{selectedRelease.seasons_count > 1 ? 's' : ''}
                </p>
              )}

              {selectedRelease.language && (
                <p className="text-sm text-zinc-400">Language: {selectedRelease.language}</p>
              )}

              {selectedRelease.description && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Description</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">{selectedRelease.description}</p>
                </div>
              )}

              {selectedRelease.genre && selectedRelease.genre.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Genres</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRelease.genre.map(g => (
                      <Badge key={g} className="bg-purple-500/20 text-purple-300 border-0">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRelease.actors && selectedRelease.actors.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Cast</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRelease.actors.map(actor => (
                      <Badge key={actor} className="bg-zinc-800 text-white border-0">
                        {actor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRelease.trailer_url && (
                <div>
                  <Button
                    onClick={() => window.open(selectedRelease.trailer_url, '_blank')}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Trailer
                  </Button>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setSelectedRelease(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleAddToLibrary(selectedRelease);
                    setSelectedRelease(null);
                  }}
                  disabled={!canAddTitle || isAlreadyInLibrary(selectedRelease)}
                  className={`flex-1 ${
                    isAlreadyInLibrary(selectedRelease)
                      ? 'bg-zinc-700/50 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50'
                      : canAddTitle 
                        ? 'bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white'
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isAlreadyInLibrary(selectedRelease) ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Already Added
                    </>
                  ) : (
                    '+ Add to Library'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}