import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Trash2, RefreshCw, Download, Calendar, Film, Tv, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import EntityLogo from "../common/EntityLogo";

export default function WeeklyReleasesManager() {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['admin-weekly-releases'],
    queryFn: () => base44.entities.WeeklyRelease.list('-release_date')
  });

  const deleteReleaseMutation = useMutation({
    mutationFn: (id) => base44.entities.WeeklyRelease.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-releases'] });
      toast.success('Release deleted');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.WeeklyRelease.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-releases'] });
      toast.success('Status updated');
    }
  });

  const fetchFromIMDB = async () => {
    setIsFetching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Get ALL the latest OTT releases for this week (January 3-9, 2026) from multiple sources: IMDB, Netflix, Amazon Prime Video, Disney+ Hotstar, Apple TV+, HBO Max, Hulu, Paramount+, Peacock, SonyLIV, Zee5, and other major streaming platforms.
        
        For each release, provide:
        - title (string, exact title)
        - type ("movie" or "series")
        - release_date (YYYY-MM-DD format, must be within January 3-9, 2026)
        - platform (Netflix, Amazon Prime Video, Disney+ Hotstar, Apple TV+, HBO Max, Hulu, Paramount+, Peacock, SonyLIV, Zee5, Voot, MX Player, Jio Cinema, Aha, etc.)
        - genre (array of strings, max 3)
        - language (primary language - English, Hindi, Telugu, Tamil, Malayalam, Kannada, Bengali, etc.)
        - runtime_minutes (for movies, approximate runtime in minutes)
        - seasons_count (for series, number of seasons available)
        - description (brief 2-3 sentence plot summary)
        - actors (array of main cast members, max 5)
        - year (release year as number, should be 2025 or 2026)
        - age_restriction (U, UA, A, PG-13, R, TV-MA, etc.)
        
        IMPORTANT: 
        - Include releases from ALL major OTT platforms: Netflix, Prime Video, Disney+ Hotstar, Apple TV+, HBO Max, Hulu, Paramount+, Peacock, SonyLIV, Zee5, Voot, MX Player, Jio Cinema, Aha, etc.
        - Don't limit to just one platform - get diverse content from all sources
        - Only include confirmed releases for THIS WEEK (January 3-9, 2026)
        - Include both international and regional content
        - Aim for 25-30+ titles across ALL platforms
        - Verify release dates are accurate
        - Include movies AND series from all platforms`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            releases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  type: { type: "string", enum: ["movie", "series"] },
                  release_date: { type: "string" },
                  platform: { type: "string" },
                  genre: { type: "array", items: { type: "string" } },
                  language: { type: "string" },
                  runtime_minutes: { type: "number" },
                  seasons_count: { type: "number" },
                  description: { type: "string" },
                  actors: { type: "array", items: { type: "string" } },
                  year: { type: "number" },
                  age_restriction: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response?.releases && response.releases.length > 0) {
        // Generate posters for all releases using AI
        toast.success(`Fetched ${response.releases.length} releases. Generating posters...`);
        
        const releasesWithPosters = await Promise.all(
          response.releases.map(async (r) => {
            try {
              const posterPrompt = `Create a professional, cinematic movie poster for "${r.title}". ${r.description}. Genre: ${r.genre?.join(', ')}. Style: theatrical, dramatic, professional quality with bold title text.`;
              const { url } = await base44.integrations.Core.GenerateImage({ prompt: posterPrompt });
              return { ...r, poster_url: url, is_active: true };
            } catch (error) {
              console.error(`Failed to generate poster for ${r.title}:`, error);
              return { ...r, is_active: true }; // Still add without poster
            }
          })
        );

        await base44.entities.WeeklyRelease.bulkCreate(releasesWithPosters);
        
        queryClient.invalidateQueries({ queryKey: ['admin-weekly-releases'] });
        queryClient.invalidateQueries({ queryKey: ['weekly-releases'] });
        toast.success(`Added ${releasesWithPosters.length} releases with AI-generated posters!`);
      } else {
        toast.error('No releases found');
      }
    } catch (error) {
      console.error('Failed to fetch from IMDB:', error);
      toast.error('Failed to fetch releases from IMDB');
    } finally {
      setIsFetching(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [generatePosterFor, setGeneratePosterFor] = useState(null);

  const handleDelete = (id) => {
    const release = releases.find(r => r.id === id);
    setDeleteConfirm(release);
  };

  const confirmDelete = async () => {
    await deleteReleaseMutation.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleGeneratePoster = async (release) => {
    setGeneratePosterFor(release);
    try {
      const prompt = `Create a cinematic movie poster for "${release.title}". ${release.description}. Genre: ${release.genre?.join(', ')}. Make it look professional, dramatic, and theatrical with bold title text.`;
      
      const { url } = await base44.integrations.Core.GenerateImage({ prompt });
      
      await base44.entities.WeeklyRelease.update(release.id, {
        poster_url: url
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-releases'] });
      toast.success('Poster generated!');
    } catch (error) {
      toast.error('Failed to generate poster');
    } finally {
      setGeneratePosterFor(null);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    await toggleActiveMutation.mutateAsync({ id, is_active: !currentStatus });
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <CardTitle className="text-white">Weekly OTT Releases</CardTitle>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              📌 Manage upcoming movie/series releases to display on user homepages. Keep users informed about new content. AI-generate posters if needed.
            </p>
          </div>
          
          <Button
            onClick={fetchFromIMDB}
            disabled={isFetching}
            className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching from IMDB...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Fetch This Week from IMDB
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-zinc-400 mt-2">
          Automatically fetch new releases from IMDB or manage manually
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {releases.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 mb-4">No releases added yet</p>
              <Button
                onClick={fetchFromIMDB}
                disabled={isFetching}
                className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Fetch from IMDB
              </Button>
            </div>
          ) : (
            releases.map((release) => (
              <Card key={release.id} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-white font-semibold">{release.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                              {release.type === 'movie' ? 'Movie' : 'Series'}
                            </Badge>
                            {release.platform && (
                              <div className="flex items-center gap-1">
                                <EntityLogo entityName={release.platform} category="platform" size="xs" />
                              </div>
                            )}
                            <Badge className={release.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-600 text-zinc-400'} variant="outline">
                              {release.is_active ? 'Active' : 'Hidden'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                        {release.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(release.release_date), 'MMM d, yyyy')}
                        </span>
                        {release.runtime_minutes && (
                          <span>{release.runtime_minutes}m</span>
                        )}
                        {release.seasons_count && (
                          <span>{release.seasons_count} Season{release.seasons_count > 1 ? 's' : ''}</span>
                        )}
                        {release.language && (
                          <span>{release.language}</span>
                        )}
                      </div>

                      {release.genre && release.genre.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-3">
                          {release.genre.map(g => (
                            <Badge key={g} className="bg-zinc-700 text-zinc-300 text-xs">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {!release.poster_url && (
                          <Button
                            size="sm"
                            onClick={() => handleGeneratePoster(release)}
                            disabled={generatePosterFor?.id === release.id}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 text-xs"
                          >
                            {generatePosterFor?.id === release.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3 mr-1" />
                            )}
                            Generate Poster
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleToggleActive(release.id, release.is_active)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {release.is_active ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(release.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}