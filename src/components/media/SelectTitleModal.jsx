import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Film, Tv } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SelectTitleModal({ open, onClose, mediaList, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = mediaList.filter(m => 
    m.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Select Title</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles..."
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
            {filtered.length === 0 ? (
              <p className="text-center text-zinc-400 py-8">No titles found</p>
            ) : (
              filtered.map(media => (
                <Card
                  key={media.id}
                  onClick={() => {
                    onSelect(media);
                    onClose();
                  }}
                  className="bg-zinc-800/50 border-zinc-700 p-4 hover:bg-zinc-700/50 cursor-pointer transition-all"
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
                        {media.type === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{media.title}</h4>
                      <p className="text-xs text-zinc-400">
                        {media.type === 'movie' ? 'Movie' : 'Series'} • {Math.floor(media.runtime_minutes / 60)}h {media.runtime_minutes % 60}m
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}