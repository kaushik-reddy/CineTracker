import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import SocialShare from "./SocialShare";

export default function RatingModal({ open, onClose, title, onSubmit, media, schedule }) {
  const [rating, setRating] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const finalRating = parseFloat(rating);
    if (finalRating >= 0.1 && finalRating <= 5.0) {
      setSubmitting(true);
      try {
        await onSubmit(finalRating);
        setRating('');
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSkip = () => {
    onSubmit(null);
    setRating('');
    onClose();
  };

  const handleClose = () => {
    setSubmitted(false);
    setRating('');
    onClose();
  };

  const fillPercent = (star) => {
    const r = parseFloat(rating) || 0;
    return Math.max(0, Math.min(100, (r - (star - 1)) * 100));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            {submitted ? 'Share Your Rating' : 'Rate Your Experience'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!submitted ? (
            <>
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <p className="text-sm font-medium text-white mb-1">{title}</p>
              </div>

              <div>
                <Label className="text-white mb-2">Rating (0.1 - 5.0)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="Enter rating..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                  autoFocus
                />
              </div>

              {/* Preview Stars */}
              {rating && parseFloat(rating) > 0 && (
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <p className="text-xs text-zinc-400 mb-2">Preview:</p>
                  <div className="flex gap-1 justify-center">
                    {[1,2,3,4,5].map(star => (
                      <div key={star} className="relative w-8 h-8">
                        <span className="absolute inset-0 flex items-center justify-center text-2xl text-zinc-700 select-none">★</span>
                        <div 
                          className="absolute inset-0 overflow-hidden transition-all"
                          style={{ width: `${fillPercent(star)}%` }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-2xl text-amber-400 select-none">★</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-white font-bold mt-2">{parseFloat(rating).toFixed(1)} / 5.0</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSkip}
                  disabled={submitting}
                  className="flex-1 bg-white text-black hover:bg-zinc-100"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!rating || parseFloat(rating) < 0.1 || parseFloat(rating) > 5.0 || submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Thanks for rating!</h3>
                <p className="text-sm text-zinc-400 mb-4">Share your experience with friends</p>
              </div>

              {media && schedule && (
                <div className="flex flex-col gap-3">
                  <SocialShare media={media} schedule={{ ...schedule, rating: parseFloat(rating) }} type="rating" />
                  <Button
                    onClick={handleClose}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white"
                  >
                    Done
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}