import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Calendar, Clock, Tv } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BulkEpisodeModal({ open, onClose, media, onSubmit, completedEpisodes = [] }) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisodes, setSelectedEpisodes] = useState([]);
  const [episodeData, setEpisodeData] = useState({});
  const [adding, setAdding] = useState(false);

  const availableEpisodes = useMemo(() => {
    if (!media || !media.episodes_per_season) return [];
    const episodeCount = media.episodes_per_season[selectedSeason - 1] || 0;
    const episodes = [];
    for (let i = 1; i <= episodeCount; i++) {
      const alreadyCompleted = completedEpisodes.some(
        e => e.season_number === selectedSeason && e.episode_number === i
      );
      if (!alreadyCompleted) {
        episodes.push(i);
      }
    }
    return episodes;
  }, [media, selectedSeason, completedEpisodes]);

  const toggleEpisode = (ep) => {
    if (selectedEpisodes.includes(ep)) {
      setSelectedEpisodes(selectedEpisodes.filter(e => e !== ep));
      const newData = { ...episodeData };
      delete newData[ep];
      setEpisodeData(newData);
    } else {
      setSelectedEpisodes([...selectedEpisodes, ep]);
      setEpisodeData({
        ...episodeData,
        [ep]: {
          date: new Date().toISOString().split('T')[0],
          time: '20:00',
          rating: 0
        }
      });
    }
  };

  const updateEpisodeData = (ep, field, value) => {
    setEpisodeData({
      ...episodeData,
      [ep]: { ...episodeData[ep], [field]: value }
    });
  };

  const handleSubmit = async () => {
    setAdding(true);
    try {
      const submissions = selectedEpisodes.map(ep => ({
        seasonNumber: selectedSeason,
        episodeNumber: ep,
        ...episodeData[ep]
      }));
      
      // Dispatch event to trigger bulk add
      window.dispatchEvent(new CustomEvent('bulk-add-episodes', {
        detail: {
          mediaId: media.id,
          episodesData: submissions
        }
      }));
      
      setSelectedEpisodes([]);
      setEpisodeData({});
      onClose();
    } finally {
      setAdding(false);
    }
  };

  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-purple-400" />
            Add Multiple Episodes - {media.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Season Selector */}
          <div>
            <Label className="text-white mb-2">Select Season</Label>
            <Select value={selectedSeason.toString()} onValueChange={(v) => {
              setSelectedSeason(parseInt(v));
              setSelectedEpisodes([]);
              setEpisodeData({});
            }}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {Array.from({ length: media.seasons_count || 0 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white">
                    Season {i + 1} ({media.episodes_per_season?.[i] || 0} episodes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Episode Selection */}
          <div>
            <Label className="text-white mb-2">Select Episodes</Label>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-zinc-800/30 rounded-lg">
              {availableEpisodes.map(ep => (
                <button
                  key={ep}
                  onClick={() => toggleEpisode(ep)}
                  className={`p-2 rounded-lg text-sm font-bold transition-all ${
                    selectedEpisodes.includes(ep)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  E{ep}
                </button>
              ))}
            </div>
            {availableEpisodes.length === 0 && (
              <p className="text-sm text-zinc-400 mt-2">All episodes in this season are already in history</p>
            )}
          </div>

          {/* Episode Details */}
          {selectedEpisodes.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-zinc-800/30 rounded-lg">
              {selectedEpisodes.sort((a, b) => a - b).map(ep => (
                <div key={ep} className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                  <h4 className="text-white font-semibold mb-3">
                    S{String(selectedSeason).padStart(2, '0')}E{String(ep).padStart(2, '0')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Date</Label>
                      <Input
                        type="date"
                        value={episodeData[ep]?.date || ''}
                        onChange={(e) => updateEpisodeData(ep, 'date', e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Time</Label>
                      <Input
                        type="time"
                        value={episodeData[ep]?.time || ''}
                        onChange={(e) => updateEpisodeData(ep, 'time', e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Rating (0.1-5.0)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={episodeData[ep]?.rating || ''}
                        onChange={(e) => updateEpisodeData(ep, 'rating', parseFloat(e.target.value) || 0)}
                        className="bg-zinc-800 border-zinc-700 text-white text-sm"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <Button
              onClick={onClose}
              disabled={adding}
              className="flex-1 bg-white text-black hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedEpisodes.length === 0 || adding}
              className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white disabled:opacity-50"
            >
              {adding ? 'Adding...' : `Add ${selectedEpisodes.length} Episode${selectedEpisodes.length !== 1 ? 's' : ''} to History`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}