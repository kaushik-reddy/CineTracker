import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Clock } from "lucide-react";

export default function JumpTimeModal({ open, onClose, schedule, media, onJump }) {
  // Get actual episode/session runtime
  let episodeRuntime = media?.runtime_minutes || 0;
  if (media?.type === 'series' && schedule?.season_number && schedule?.episode_number) {
    const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
    if (epRuntime) episodeRuntime = epRuntime;
  } else if (media?.type === 'book') {
    episodeRuntime = schedule?.session_duration || 30;
  }
  
  const totalMinutes = episodeRuntime;
  const currentMinutes = Math.floor((schedule?.elapsed_seconds || 0) / 60);
  const [jumpMinutes, setJumpMinutes] = useState(currentMinutes);

  const handleSubmit = () => {
    if (jumpMinutes !== currentMinutes) {
      onJump(schedule.id, jumpMinutes * 60);
    }
    onClose();
  };

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Jump to Time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-2">Current: {formatTime(currentMinutes)}</p>
            <p className="text-xl font-bold text-white">{formatTime(jumpMinutes)}</p>
            <p className="text-sm text-zinc-400 mt-2">Total: {formatTime(totalMinutes)}</p>
          </div>

          <div className="px-4">
            <Slider
              value={[jumpMinutes]}
              onValueChange={(val) => setJumpMinutes(val[0])}
              min={0}
              max={totalMinutes}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-white text-black hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            >
              Jump to {formatTime(jumpMinutes)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}