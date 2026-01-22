import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export default function RatingMeterModal({ open, onClose, media, allEpisodes }) {
  // Group episodes by season
  const episodesBySeason = useMemo(() => {
    const grouped = {};
    allEpisodes.forEach(ep => {
      const season = ep.season_number || 1;
      if (!grouped[season]) grouped[season] = [];
      grouped[season].push(ep);
    });
    
    // Sort episodes within each season
    Object.keys(grouped).forEach(season => {
      grouped[season].sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
    });
    
    return grouped;
  }, [allEpisodes]);

  const getRatingColor = (rating) => {
    if (!rating) return 'bg-zinc-700 text-zinc-400';
    if (rating >= 4.5) return 'bg-green-600 text-white';
    if (rating >= 4.0) return 'bg-green-500 text-white';
    if (rating >= 3.5) return 'bg-yellow-500 text-black';
    if (rating >= 3.0) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };
  
  const renderStars = (rating) => {
    if (!rating) return '?';
    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;
    let stars = '★'.repeat(fullStars);
    if (decimal >= 0.1) stars += '☆'; // Partial star indicator
    return `${rating.toFixed(1)}`;
  };

  const getRatingLabel = (rating) => {
    if (!rating) return 'Not Rated';
    if (rating >= 4.5) return 'Awesome';
    if (rating >= 4.0) return 'Great';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Regular';
    return 'Bad';
  };

  const getSeasonAvg = (seasonEps) => {
    const ratings = seasonEps.filter(ep => ep.rating).map(ep => ep.rating);
    if (ratings.length === 0) return 0;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Episode Rating Meter - {media?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center pb-4 border-b border-zinc-800">
            <Badge className="bg-green-600 text-white text-xs">Awesome (4.5-5)</Badge>
            <Badge className="bg-green-500 text-white text-xs">Great (4.0-4.4)</Badge>
            <Badge className="bg-yellow-500 text-black text-xs">Good (3.5-3.9)</Badge>
            <Badge className="bg-orange-500 text-white text-xs">Regular (3.0-3.4)</Badge>
            <Badge className="bg-red-500 text-white text-xs">Bad (&lt;3)</Badge>
            <Badge className="bg-zinc-700 text-zinc-400 text-xs">Not Rated</Badge>
          </div>

          {/* Seasons Grid */}
          {Object.keys(episodesBySeason).sort((a, b) => a - b).map(season => {
            const seasonEps = episodesBySeason[season];
            const avgRating = getSeasonAvg(seasonEps);
            
            return (
              <div key={season} className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Season {season}
                  {avgRating > 0 && (
                    <span className="text-xs text-zinc-400">(avg {avgRating})</span>
                  )}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {seasonEps.map(ep => (
                    <div
                      key={ep.id}
                      className={`${getRatingColor(ep.rating)} rounded-lg p-2 text-center transition-all hover:scale-105 cursor-pointer`}
                    >
                      <div className="text-[10px] font-medium mb-1">E{ep.episode_number}</div>
                      <div className="text-xs font-bold">{renderStars(ep.rating)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}