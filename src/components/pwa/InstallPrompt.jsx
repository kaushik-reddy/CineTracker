import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, X, Smartphone } from "lucide-react";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone;
    setIsInStandaloneMode(standalone);

    // Show prompt after 30 seconds if not installed and hasn't been dismissed
    const hasSeenPrompt = localStorage.getItem('install_prompt_dismissed');
    if (iOS && !standalone && !hasSeenPrompt) {
      setTimeout(() => setShowPrompt(true), 30000);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install_prompt_dismissed', 'true');
  };

  if (!showPrompt || !isIOS || isInStandaloneMode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
      <Card className="bg-gradient-to-r from-purple-900/90 to-emerald-900/90 border-purple-500/50 backdrop-blur-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693d661aca82e178be7bb96f/ab2cb46cf_IMG_0700.png"
                alt="CineTracker"
                className="w-10 h-10 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Install CineTracker
              </h3>
              <p className="text-sm text-purple-200 mb-3">
                Add to your home screen for a better experience
              </p>
              <div className="flex items-center gap-2 text-xs text-white bg-black/30 rounded-lg p-2">
                <Share className="w-4 h-4 text-blue-400" />
                <span>
                  Tap <Share className="w-3 h-3 inline mx-1 text-blue-400" /> then "Add to Home Screen"
                </span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-purple-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}