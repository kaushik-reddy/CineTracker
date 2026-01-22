import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book } from "lucide-react";

export default function PagesReadModal({ open, onClose, media, schedule, onSubmit }) {
  const suggestedPage = media?.suggestedPage || media?.pages_read || 0;
  const [stoppedAtPage, setStoppedAtPage] = useState(suggestedPage);
  const [confirming, setConfirming] = useState(false);

  const handleSubmit = async () => {
    const page = parseInt(stoppedAtPage);
    if (page && page > 0) {
      setConfirming(true);
      try {
        await onSubmit(page);
        setStoppedAtPage('');
      } finally {
        setConfirming(false);
      }
    }
  };

  const previousPage = media?.pages_read || 0;
  const totalPages = media?.total_pages || 0;
  const cappedPage = Math.min(parseInt(stoppedAtPage) || 0, totalPages);
  const progressPercent = totalPages > 0 ? Math.round((cappedPage / totalPages) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Book className="w-5 h-5 text-emerald-500" />
            At What Page Did You Stop?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-400 mb-2">Previous Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">Page {previousPage}</span>
              <span className="text-zinc-400">/ {totalPages}</span>
            </div>
          </div>

          <div>
            <Label className="text-white mb-2">Page Number Where You Stopped</Label>
            <Input
              type="number"
              value={stoppedAtPage}
              onChange={(e) => setStoppedAtPage(Math.min(parseInt(e.target.value) || 0, totalPages))}
              placeholder="Enter page number..."
              className="bg-zinc-800 border-zinc-700 text-white"
              min={0}
              max={totalPages}
              autoFocus
            />
          </div>

          {stoppedAtPage && parseInt(stoppedAtPage) > 0 && (
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <p className="text-sm text-emerald-400">
                New Progress: Page {cappedPage} / {totalPages} ({progressPercent}%)
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={confirming}
              className="flex-1 bg-white text-black hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!stoppedAtPage || parseInt(stoppedAtPage) <= 0 || confirming}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {confirming ? 'Confirming...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}