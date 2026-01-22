import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, X } from "lucide-react";

const APP_VERSION = '1.0.0'; // Increment this with each deployment
const VERSION_CHECK_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes

export default function UpdateManager() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkForUpdates();
    
    // Periodic update checks
    const interval = setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    try {
      // Store current version in localStorage
      const storedVersion = localStorage.getItem('app_version');
      
      if (!storedVersion) {
        localStorage.setItem('app_version', APP_VERSION);
        return;
      }

      // Simple version comparison
      if (storedVersion !== APP_VERSION) {
        setUpdateAvailable(true);
      }

      // Alternative: Check build timestamp from backend
      // const response = await fetch('/api/version');
      // const { version, buildTime } = await response.json();
      // Compare with stored values
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const handleUpdate = () => {
    // Save current state before reload
    localStorage.setItem('app_version', APP_VERSION);
    
    // Reload to get latest version
    window.location.reload();
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Show again after 1 hour
    setTimeout(() => setDismissed(false), 60 * 60 * 1000);
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-gradient-to-r from-purple-900 to-emerald-900 border-purple-500/50 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">Update Available</p>
              <p className="text-sm text-purple-200 mb-3">
                A new version of CineTracker is ready. Refresh to update.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  className="bg-white hover:bg-zinc-100 text-black"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Update Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/10"
                >
                  Later
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-purple-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Version display component
export function VersionDisplay() {
  return (
    <div className="text-xs text-zinc-500 text-center py-2">
      CineTracker v{APP_VERSION}
    </div>
  );
}