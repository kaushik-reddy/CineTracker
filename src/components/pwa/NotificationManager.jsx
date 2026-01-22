import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, X } from "lucide-react";
import { toast } from "sonner";

export default function NotificationManager() {
  const [permission, setPermission] = useState('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [preferences, setPreferences] = useState({
    scheduleReminders: true,
    newReleases: true,
    achievements: true,
    readingProgress: false
  });

  useEffect(() => {
    // Load saved preferences
    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    // Check current permission status
    const hasPermission = localStorage.getItem('notification_permission');
    if (hasPermission) {
      setPermission(hasPermission);
    }
    
    // Never auto-show prompt
  }, []);

  const requestPermission = async () => {
    // Store that we've prompted
    localStorage.setItem('notification_prompted', 'true');
    
    // For now, just store the preference
    // In future, this could integrate with actual push notifications
    setPermission('granted');
    localStorage.setItem('notification_permission', 'granted');
    setShowPrompt(false);
    toast.success('Notifications enabled! You\'ll receive updates about your watchlist.');
  };

  const denyPermission = () => {
    localStorage.setItem('notification_prompted', 'true');
    localStorage.setItem('notification_permission', 'denied');
    setPermission('denied');
    setShowPrompt(false);
  };

  const updatePreferences = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
  };

  // In-app notification display (for when push isn't available)
  return (
    <>
      {showPrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="bg-zinc-900 border-purple-500/50 max-w-md w-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Stay Updated
                  </h3>
                  <p className="text-zinc-300 text-sm mb-4">
                    Get notified about upcoming schedules, new releases, and achievements. 
                    You can customize what you receive in settings.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={requestPermission}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Enable
                    </Button>
                    <Button
                      onClick={denyPermission}
                      variant="outline"
                      className="text-white border-zinc-700 hover:bg-zinc-800"
                    >
                      Not Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Notification Preferences Component
export function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    scheduleReminders: true,
    newReleases: true,
    achievements: true,
    readingProgress: false
  });

  useEffect(() => {
    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const updatePreference = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardContent className="p-4 space-y-3">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          Notification Preferences
        </h4>
        
        {Object.entries({
          scheduleReminders: 'Schedule reminders',
          newReleases: 'New releases in watchlist',
          achievements: 'Achievement unlocks',
          readingProgress: 'Reading milestones'
        }).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-zinc-300">{label}</span>
            <input
              type="checkbox"
              checked={preferences[key]}
              onChange={(e) => updatePreference(key, e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-purple-500"
            />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

// Show in-app notification banner
export function showInAppNotification(message, action) {
  // Store notification for display
  const notifications = JSON.parse(localStorage.getItem('in_app_notifications') || '[]');
  notifications.push({
    id: Date.now(),
    message,
    action,
    timestamp: Date.now(),
    read: false
  });
  localStorage.setItem('in_app_notifications', JSON.stringify(notifications));
  
  // Trigger a custom event for the UI to listen to
  window.dispatchEvent(new CustomEvent('in-app-notification', { detail: { message, action } }));
}