import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tv, Star } from "lucide-react";

export default function SeriesSelector({ open, onClose, seriesList, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-purple-400" />
            Select Series to View Rating Meter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
          {seriesList.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No series with episodes found</p>
          ) : (
            seriesList.map(media => (
              <Card
                key={media.id}
                onClick={() => {
                  onSelect(media);
                  onClose();
                }}
                className="bg-zinc-800/50 border-zinc-700 p-4 hover:bg-zinc-700/50 hover:border-purple-500/50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  {media.poster_url ? (
                    <img 
                      src={media.poster_url} 
                      alt={media.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center text-zinc-500">
                      <Tv className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{media.title}</h4>
                    <p className="text-xs text-zinc-400">
                      {media.episodeCount} episodes • Avg {media.avgRating} <Star className="w-3 h-3 inline text-amber-400" />
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}