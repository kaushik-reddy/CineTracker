import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Film, Tv, Calendar, Clock, Play, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import EntityLogo from "../common/EntityLogo";

export default function ReleasesPanel({ onOpenAddForm, userPermissions }) {
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['weekly-releases'],
    queryFn: () => base44.entities.WeeklyRelease.filter({ is_active: true }),
    refetchInterval: 1000 * 60 * 5
  });

  const { data: existingMedia = [] } = useQuery({
    queryKey: ['user-media-titles'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Media.filter({ created_by: user.email });
    },
    refetchInterval: 1000 * 60 * 2
  });

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

  const isAlreadyInLibrary = (release) => {
    return existingMedia.some(m => m.title.toLowerCase() === release.title.toLowerCase());
  };

  const handleAddToLibrary = async (release) => {
    if (isAlreadyInLibrary(release)) return;
    
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

    if (onOpenAddForm) {
      onOpenAddForm(mediaData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-zinc-400 text-sm">Loading new releases...</p>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="text-center py-12">
        <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">No new releases available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="movie">Movies</SelectItem>
            <SelectItem value="series">Series</SelectItem>
          </SelectContent>
        </Select>

        {platforms.length > 0 && (
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {languages.length > 0 && (
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Releases Grid */}
      <div className="space-y-3">
        {filteredReleases.map((release, idx) => {
          const inLibrary = isAlreadyInLibrary(release);
          
          return (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-zinc-800/50 border-zinc-700 hover:border-purple-500/50 transition-all">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Poster */}
                    <div className="w-16 h-24 bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {release.poster_url ? (
                        <img src={release.poster_url} alt={release.title} className="w-full h-full object-cover" />
                      ) : (
                        release.type === 'movie' ? <Film className="w-6 h-6 text-zinc-500" /> : <Tv className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-white font-semibold text-sm line-clamp-2 flex-1">{release.title}</h4>
                        {release.platform && (
                          <div className="flex-shrink-0">
                            <EntityLogo entityName={release.platform} category="platform" size="xs" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(release.release_date), 'MMM d')}
                        {release.runtime_minutes && (
                          <>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            {release.runtime_minutes}m
                          </>
                        )}
                        {release.seasons_count && (
                          <>
                            <span>•</span>
                            {release.seasons_count}S
                          </>
                        )}
                      </div>

                      {release.genre && release.genre.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-2">
                          {release.genre.slice(0, 2).map(g => (
                            <Badge key={g} className="bg-purple-500/20 text-purple-300 border-0 text-xs px-1.5 py-0">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button
                        size="sm"
                        onClick={() => !inLibrary && handleAddToLibrary(release)}
                        disabled={inLibrary}
                        className={`w-full text-xs h-8 ${
                          inLibrary 
                            ? 'bg-zinc-700/50 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white'
                        }`}
                      >
                        {inLibrary ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Added
                          </>
                        ) : (
                          '+ Add to Library'
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

      {filteredReleases.length === 0 && (
        <p className="text-center text-zinc-400 py-8">No releases match your filters</p>
      )}
    </div>
  );
}