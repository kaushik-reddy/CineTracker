import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Star } from "lucide-react";

export default function AddHistoryModal({ open, onClose, media, onSubmit }) {
  const [watchedDate, setWatchedDate] = useState('');
  const [watchedTime, setWatchedTime] = useState('');
  const [rating, setRating] = useState(0);
  const [seasonNumber, setSeasonNumber] = useState('1');
  const [episodeNumber, setEpisodeNumber] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const completedDateTime = new Date(`${watchedDate}T${watchedTime}`).toISOString();
    await onSubmit(
      media.id, 
      completedDateTime, 
      rating || undefined,
      media.type === 'series' ? parseInt(seasonNumber) : undefined,
      media.type === 'series' ? parseInt(episodeNumber) : undefined
    );
    
    setLoading(false);
    setWatchedDate('');
    setWatchedTime('');
    setRating(0);
    setSeasonNumber('1');
    setEpisodeNumber('1');
    onClose();
  };

  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Add to Watch History
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-zinc-800/50 rounded-xl flex gap-4">
          {media.poster_url ? (
            <img src={media.poster_url} alt={media.title} className="w-16 h-24 object-cover rounded-lg" />
          ) : (
            <div className="w-16 h-24 bg-zinc-700 rounded-lg flex items-center justify-center text-2xl text-zinc-500">
              {media.title?.[0]}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{media.title}</h3>
            <p className="text-sm text-white mt-1">
              {Math.floor(media.runtime_minutes / 60)}h {media.runtime_minutes % 60}m
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {media.type === 'series' && media.seasons_count && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Season</Label>
                <Select value={seasonNumber} onValueChange={setSeasonNumber}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {Array.from({ length: media.seasons_count }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white">
                        Season {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Episode</Label>
                <Select value={episodeNumber} onValueChange={setEpisodeNumber}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                    {Array.from({ length: media.episodes_per_season?.[parseInt(seasonNumber) - 1] || 10 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white">
                        Episode {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Watched
            </Label>
            <Input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Watched
            </Label>
            <Input
              type="time"
              value={watchedTime}
              onChange={(e) => setWatchedTime(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Rating (Optional)
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-colors ${
                    star <= rating ? 'text-amber-400' : 'text-zinc-700 hover:text-amber-400'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} className="flex-1 bg-white text-black hover:bg-zinc-100">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
              {loading ? 'Adding...' : 'Add to History'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}