import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Crown, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function PlanLimitModal({ open, onClose, currentPlan, currentUsage, limitType }) {
  const limitInfo = {
    library: {
      title: "Library Limit Reached",
      description: "You've reached your plan's maximum number of titles",
      current: currentUsage?.library || 0,
      max: currentPlan?.max_library_items || 0
    },
    schedules: {
      title: "Monthly Schedule Limit Reached",
      description: "You've reached your plan's monthly scheduling limit",
      current: currentUsage?.schedules || 0,
      max: currentPlan?.max_schedules_per_month || 0
    },
    books: {
      title: "Books Limit Reached",
      description: "You've reached your plan's maximum number of books",
      current: currentUsage?.books || 0,
      max: currentPlan?.max_books || 0
    }
  };

  const info = limitInfo[limitType] || limitInfo.library;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-amber-500/30 text-white max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            {info.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-sm text-zinc-300">{info.description}</p>

          {/* Current Plan Info */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-amber-400" />
              <h4 className="text-white font-semibold text-sm">Current Plan: {currentPlan?.name}</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Usage:</span>
                <span className="text-white font-bold">{info.current} / {info.max}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((info.current / info.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-purple-500/10 to-emerald-500/10 rounded-lg p-4 border border-purple-500/30">
            <p className="text-sm text-zinc-300 mb-3">
              Upgrade to a higher plan to add more titles and unlock additional features!
            </p>
            <Link to={createPageUrl('Pricing')}>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white">
                <Crown className="w-4 h-4 mr-2" />
                View Plans & Upgrade
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}