import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Tv } from "lucide-react";

export default function AddSeasonsModal({ open, onClose, media, onSubmit }) {
  const [mode, setMode] = useState('seasons');
  const [additionalSeasons, setAdditionalSeasons] = useState('');
  const [episodeInputs, setEpisodeInputs] = useState([]);
  const [episodeRuntimes, setEpisodeRuntimes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('1');
  const [additionalEpisodes, setAdditionalEpisodes] = useState('');
  const [newEpisodeRuntimes, setNewEpisodeRuntimes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && media) {
      setMode('seasons');
      setAdditionalSeasons('');
      setEpisodeInputs([]);
      setEpisodeRuntimes([]);
      setSelectedSeason('1');
      setAdditionalEpisodes('');
      setNewEpisodeRuntimes([]);
    }
  }, [open, media]);

  const handleAdditionalSeasonsChange = (value) => {
    setAdditionalSeasons(value);
    const count = parseInt(value) || 0;
    setEpisodeInputs(Array(count).fill(''));
    setEpisodeRuntimes(Array(count).fill([]));
  };

  const handleEpisodeChange = (index, value) => {
    const newInputs = [...episodeInputs];
    newInputs[index] = value;
    setEpisodeInputs(newInputs);
    
    const count = parseInt(value) || 0;
    const newRuntimes = [...episodeRuntimes];
    newRuntimes[index] = Array(count).fill('');
    setEpisodeRuntimes(newRuntimes);
  };

  const handleEpisodeRuntimeChange = (seasonIdx, episodeIdx, value) => {
    const newRuntimes = [...episodeRuntimes];
    if (!newRuntimes[seasonIdx]) newRuntimes[seasonIdx] = [];
    newRuntimes[seasonIdx][episodeIdx] = value;
    setEpisodeRuntimes(newRuntimes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'seasons') {
      const newSeasonsCount = (media.seasons_count || 0) + parseInt(additionalSeasons);
      const newEpisodesPerSeason = [
        ...(media.episodes_per_season || []),
        ...episodeInputs.map(e => Number(e) || 0)
      ];
      const newEpisodeRuntimes = [
        ...(media.episode_runtimes || []),
        ...episodeRuntimes.map(season => season.map(ep => Number(ep) || Number(media.runtime_minutes)))
      ];

      await onSubmit({
        seasons_count: newSeasonsCount,
        episodes_per_season: newEpisodesPerSeason,
        episode_runtimes: newEpisodeRuntimes
      });
    } else {
      // Add episodes to existing season
      const seasonIdx = parseInt(selectedSeason) - 1;
      const currentEpisodes = media.episodes_per_season?.[seasonIdx] || 0;
      const newEpisodeCount = currentEpisodes + parseInt(additionalEpisodes);
      
      const newEpisodesPerSeason = [...(media.episodes_per_season || [])];
      newEpisodesPerSeason[seasonIdx] = newEpisodeCount;
      
      const updatedEpisodeRuntimes = [...(media.episode_runtimes || [])];
      if (!updatedEpisodeRuntimes[seasonIdx]) updatedEpisodeRuntimes[seasonIdx] = [];
      
      // Add new episode runtimes from the input
      const runtimesToAdd = newEpisodeRuntimes.map(ep => Number(ep) || Number(media.runtime_minutes));
      updatedEpisodeRuntimes[seasonIdx] = [
        ...updatedEpisodeRuntimes[seasonIdx],
        ...runtimesToAdd
      ];

      await onSubmit({
        seasons_count: media.seasons_count,
        episodes_per_season: newEpisodesPerSeason,
        episode_runtimes: updatedEpisodeRuntimes
      });
    }

    setLoading(false);
    onClose();
  };

  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-amber-500" />
            Add Content - {media.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg text-sm">
          <p className="text-zinc-400">
            Current: <span className="text-white font-medium">{media.seasons_count || 0} seasons</span>
          </p>
        </div>

        <Tabs value={mode} onValueChange={setMode} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
            <TabsTrigger value="seasons" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Add Seasons
            </TabsTrigger>
            <TabsTrigger value="episodes" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Add Episodes
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'seasons' ? (
            <div className="space-y-2">
              <Label className="text-zinc-300">Number of Additional Seasons</Label>
              <Input
                type="number"
                value={additionalSeasons}
                onChange={(e) => handleAdditionalSeasonsChange(e.target.value)}
                placeholder="How many new seasons?"
                min="1"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Select Season</Label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 text-white rounded-md"
                >
                  {Array.from({ length: media.seasons_count || 0 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      Season {i + 1} (Currently {media.episodes_per_season?.[i] || 0} episodes)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Number of Episodes to Add</Label>
                <Input
                  type="number"
                  value={additionalEpisodes}
                  onChange={(e) => {
                    setAdditionalEpisodes(e.target.value);
                    const count = parseInt(e.target.value) || 0;
                    setNewEpisodeRuntimes(Array(count).fill(''));
                  }}
                  placeholder="How many episodes?"
                  min="1"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              {additionalEpisodes && parseInt(additionalEpisodes) > 0 && (
                <div className="space-y-2 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                  <Label className="text-zinc-300">Episode Runtimes in Minutes (Optional)</Label>
                  <p className="text-xs text-zinc-500">Leave blank to use default runtime ({media.runtime_minutes} min)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: parseInt(additionalEpisodes) }, (_, idx) => (
                      <div key={idx}>
                        <Input
                          type="number"
                          value={newEpisodeRuntimes[idx] || ''}
                          onChange={(e) => {
                            const newRuntimes = [...newEpisodeRuntimes];
                            newRuntimes[idx] = e.target.value;
                            setNewEpisodeRuntimes(newRuntimes);
                          }}
                          placeholder={`E${(media.episodes_per_season?.[parseInt(selectedSeason) - 1] || 0) + idx + 1}`}
                          className="bg-zinc-800 border-zinc-700 text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'seasons' && additionalSeasons && parseInt(additionalSeasons) > 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Episodes per New Season</Label>
                <div className="grid grid-cols-3 gap-2">
                  {episodeInputs.map((val, idx) => (
                    <Input
                      key={idx}
                      type="number"
                      value={val}
                      onChange={(e) => handleEpisodeChange(idx, e.target.value)}
                      placeholder={`S${(media.seasons_count || 0) + idx + 1} episodes`}
                      className="bg-zinc-800 border-zinc-700 text-white text-xs"
                    />
                  ))}
                </div>
              </div>

              {episodeInputs.some(e => e) && (
                <div className="space-y-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                  <Label className="text-zinc-300">Episode Runtimes (Optional)</Label>
                  {episodeInputs.map((count, seasonIdx) => {
                    if (!count || parseInt(count) === 0) return null;
                    const seasonNumber = (media.seasons_count || 0) + seasonIdx + 1;
                    return (
                      <div key={seasonIdx} className="space-y-2">
                        <p className="text-xs text-zinc-400">Season {seasonNumber} Episodes:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: parseInt(count) }, (_, episodeIdx) => (
                            <Input
                              key={episodeIdx}
                              type="number"
                              value={episodeRuntimes[seasonIdx]?.[episodeIdx] || ''}
                              onChange={(e) => handleEpisodeRuntimeChange(seasonIdx, episodeIdx, e.target.value)}
                              placeholder={`E${episodeIdx + 1} (min)`}
                              className="bg-zinc-800 border-zinc-700 text-white text-xs"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} className="flex-1 bg-white text-black hover:bg-zinc-100">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (mode === 'seasons' ? !additionalSeasons : !additionalEpisodes)} 
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? 'Adding...' : (mode === 'seasons' ? 'Add Seasons' : 'Add Episodes')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}