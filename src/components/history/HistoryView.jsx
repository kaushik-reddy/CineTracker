import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, History as HistoryIcon, Plus, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import HistoryCard from "./HistoryCard";
import RatingMeterModal from "./RatingMeterModal";
import SeriesSelector from "./SeriesSelector";
import BulkEpisodeModal from "./BulkEpisodeModal";

export default function HistoryView({ completedSchedules = [], mediaMap, onDelete, onAddEntry, onRateChange, userRole, userPermissions, schedules, isHighlighted, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [ratingMeterMedia, setRatingMeterMedia] = useState(null);
  const [showSeriesSelector, setShowSeriesSelector] = useState(false);
  const [bulkEpisodeMedia, setBulkEpisodeMedia] = useState(null);

  // Calculate total unique count (books counted once)
  const totalUniqueCount = useMemo(() => {
    const bookIds = new Set();
    let nonBookCount = 0;
    
    completedSchedules.forEach(schedule => {
      const media = mediaMap[schedule.media_id];
      if (!media) return;
      
      if (media.type === 'book') {
        bookIds.add(media.id);
      } else {
        nonBookCount++;
      }
    });
    
    return bookIds.size + nonBookCount;
  }, [completedSchedules, mediaMap]);

  const filteredAndSorted = useMemo(() => {
    // For books, only show ONE entry (the latest session)
    const bookEntries = new Map();
    const nonBookSchedules = [];
    
    completedSchedules.forEach(schedule => {
      const media = mediaMap[schedule.media_id];
      if (!media) return;
      
      if (media.type === 'book') {
        const existing = bookEntries.get(media.id);
        if (!existing || new Date(schedule.updated_date) > new Date(existing.updated_date)) {
          bookEntries.set(media.id, schedule);
        }
      } else {
        nonBookSchedules.push(schedule);
      }
    });
    
    const combinedSchedules = [...Array.from(bookEntries.values()), ...nonBookSchedules];
    
    let filtered = combinedSchedules.filter(s => {
      const media = mediaMap[s.media_id];
      if (!media) return false;
      
      const searchLower = searchQuery.toLowerCase();
      return media.title?.toLowerCase().includes(searchLower) ||
             media.actors?.some(a => a.toLowerCase().includes(searchLower));
    });

    filtered.sort((a, b) => {
      const mediaA = mediaMap[a.media_id];
      const mediaB = mediaMap[b.media_id];
      
      switch (sortBy) {
        case 'newest':
          return new Date(b.updated_date) - new Date(a.updated_date);
        case 'oldest':
          return new Date(a.updated_date) - new Date(b.updated_date);
        case 'title-az':
          return mediaA?.title.localeCompare(mediaB?.title);
        case 'title-za':
          return mediaB?.title.localeCompare(mediaA?.title);
        case 'rating-high':
          return (mediaB?.rating || 0) - (mediaA?.rating || 0);
        case 'rating-low':
          return (mediaA?.rating || 0) - (mediaB?.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [completedSchedules, mediaMap, searchQuery, sortBy]);

  if (completedSchedules.length === 0) {
    return (
      <div className="text-center py-20">
        <HistoryIcon className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
        <h3 className="text-xl font-semibold text-zinc-300 mb-2">No watch history yet</h3>
        <p className="text-zinc-500">Mark movies as completed to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Entry and Rating Meter Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
        <Button
          onClick={() => setShowSeriesSelector(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl text-white text-xs sm:text-sm h-9"
        >
          <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
          Rating Meter
        </Button>
        <Button
          onClick={() => {
            // Show modal to select series for bulk add
            const seriesWithHistory = Object.values(mediaMap).filter(m => {
              if (m.type !== 'series') return false;
              const completed = schedules.filter(s => s.media_id === m.id && s.status === 'completed');
              const total = m.episodes_per_season?.reduce((a, b) => a + b, 0) || 0;
              return completed.length < total;
            });
            if (seriesWithHistory.length > 0) {
              setBulkEpisodeMedia({ 
                showSelector: true,
                seriesList: seriesWithHistory 
              });
            }
          }}
          disabled={userRole !== 'admin' && !userPermissions?.can_add_history}
          className={`text-xs sm:text-sm h-9 ${userRole === 'admin' || userPermissions?.can_add_history ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'}`}
        >
          <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Bulk Add Episodes</span>
          <span className="sm:hidden">Bulk Add</span>
        </Button>
        <Button
          onClick={onAddEntry}
          disabled={userRole !== 'admin' && !userPermissions?.can_add_history}
          className={`text-xs sm:text-sm h-9 ${userRole === 'admin' || userPermissions?.can_add_history ? 'bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'}`}
        >
          <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add Watch Entry</span>
          <span className="sm:hidden">Add Entry</span>
        </Button>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or actor..."
            className="pl-9 sm:pl-10 bg-zinc-900/50 border-emerald-500/30 text-white placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 h-9 text-sm hover:border-emerald-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 sm:w-auto w-full">
          <ArrowUpDown className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="sm:w-48 w-full bg-zinc-900/50 border-amber-500/30 text-white h-9 text-sm hover:border-amber-500/50 transition-all">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-amber-500/50">
              <SelectItem value="newest" className="text-white">Newest First</SelectItem>
              <SelectItem value="oldest" className="text-white">Oldest First</SelectItem>
              <SelectItem value="title-az" className="text-white">Title (A-Z)</SelectItem>
              <SelectItem value="title-za" className="text-white">Title (Z-A)</SelectItem>
              <SelectItem value="rating-high" className="text-white">Rating (Highest)</SelectItem>
              <SelectItem value="rating-low" className="text-white">Rating (Lowest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-white">
        Showing {filteredAndSorted.length} of {totalUniqueCount} watched titles
      </p>

      {/* History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {filteredAndSorted.map(schedule => {
          const media = mediaMap[schedule.media_id];
          if (!media) return null;
          return (
            <HistoryCard
              key={schedule.id}
              media={media}
              schedule={schedule}
              onDelete={onDelete}
              onRateChange={onRateChange}
              userRole={userRole}
              userPermissions={userPermissions}
              isHighlighted={isHighlighted === media.id}
              onNavigate={() => onNavigate?.(media.id)}
            />
          );
        })}
      </div>

      {/* Series Selector */}
      <SeriesSelector
        open={showSeriesSelector}
        onClose={() => setShowSeriesSelector(false)}
        seriesList={(() => {
          const seriesWithEps = Object.values(mediaMap).filter(m => {
            if (m.type !== 'series') return false;
            const eps = completedSchedules.filter(s => s.media_id === m.id);
            return eps.length > 0;
          }).map(m => {
            const eps = completedSchedules.filter(s => s.media_id === m.id);
            const ratings = eps.filter(e => e.rating).map(e => e.rating);
            const avgRating = ratings.length > 0 ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1) : 'N/A';
            return { ...m, episodeCount: eps.length, avgRating };
          });
          return seriesWithEps;
        })()}
        onSelect={setRatingMeterMedia}
      />

      {/* Rating Meter Modal */}
      {ratingMeterMedia && (
        <RatingMeterModal
          open={!!ratingMeterMedia}
          onClose={() => setRatingMeterMedia(null)}
          media={ratingMeterMedia}
          allEpisodes={completedSchedules.filter(s => s.media_id === ratingMeterMedia.id)}
        />
      )}

      {/* Series Selector for Bulk Add */}
      {bulkEpisodeMedia?.showSelector && (
        <Dialog open={true} onOpenChange={() => setBulkEpisodeMedia(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Select Series for Bulk Add</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bulkEpisodeMedia.seriesList.map(series => (
                <button
                  key={series.id}
                  onClick={() => {
                    const completed = schedules.filter(s => s.media_id === series.id && s.status === 'completed');
                    setBulkEpisodeMedia({ media: series, completed });
                  }}
                  className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-purple-500/50 text-left transition-all"
                >
                  <p className="text-white font-medium">{series.title}</p>
                  <p className="text-xs text-zinc-400">
                    {series.seasons_count} seasons • {series.episodes_per_season?.reduce((a, b) => a + b, 0) || 0} episodes
                  </p>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Episode Modal */}
      {bulkEpisodeMedia && !bulkEpisodeMedia.showSelector && (
        <BulkEpisodeModal
          open={true}
          onClose={() => setBulkEpisodeMedia(null)}
          media={bulkEpisodeMedia.media}
          completedEpisodes={bulkEpisodeMedia.completed || []}
          onSubmit={(episodesData) => {
            window.dispatchEvent(new CustomEvent('bulk-add-episodes', { 
              detail: { mediaId: bulkEpisodeMedia.media.id, episodesData } 
            }));
            setBulkEpisodeMedia(null);
          }}
        />
      )}
    </div>
  );
}