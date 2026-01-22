import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book } from "lucide-react";

export default function AdjustBookProgressModal({ open, onClose, media, onSubmit }) {
  const [pages, setPages] = useState(media?.pages_read || 0);

  const handleSubmit = () => {
    const pagesNum = parseInt(pages);
    if (pagesNum >= 0 && pagesNum <= media.total_pages) {
      onSubmit(pagesNum);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Book className="w-5 h-5 text-purple-500" />
            Adjust Reading Progress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-400 mb-2">Book</p>
            <p className="text-lg font-bold text-white">{media?.title}</p>
            <p className="text-xs text-zinc-500 mt-1">Total: {media?.total_pages} pages</p>
          </div>

          <div>
            <Label className="text-white mb-2">Current Page (0 - {media?.total_pages})</Label>
            <Input
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="Enter current page"
              className="bg-zinc-800 border-zinc-700 text-white"
              min={0}
              max={media?.total_pages}
              autoFocus
            />
          </div>

          {pages && parseInt(pages) >= 0 && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p className="text-sm text-purple-400">
                Progress: {pages} / {media?.total_pages} pages ({Math.round((parseInt(pages) / media?.total_pages) * 100)}%)
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-white text-black hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!pages || parseInt(pages) < 0 || parseInt(pages) > media?.total_pages}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            >
              Update Progress
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}