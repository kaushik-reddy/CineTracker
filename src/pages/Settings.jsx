import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import LibrarySyncSettings from "../components/settings/LibrarySyncSettings";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [notificationPrefs, setNotificationPrefs] = useState({
    scheduleReminders: true,
    weeklyReleases: true,
    achievements: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      setNotificationPrefs(JSON.parse(saved));
    }
  }, []);

  const updateNotificationPref = (key, value) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
    toast.success('Notification preference updated');
  };

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="ghost"
            className="text-zinc-400 hover:text-white mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-sm sm:text-base text-zinc-400">Manage your preferences and library settings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <LibrarySyncSettings />
          
          {/* Scheduled Notifications Settings */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  Scheduled Notifications
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-2">
                  📌 Configure automated email reminders for your scheduled watches and reading sessions.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Schedule Reminders (30min before)</Label>
                <Switch
                  checked={notificationPrefs.scheduleReminders}
                  onCheckedChange={(checked) => updateNotificationPref('scheduleReminders', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Weekly Release Updates</Label>
                <Switch
                  checked={notificationPrefs.weeklyReleases}
                  onCheckedChange={(checked) => updateNotificationPref('weeklyReleases', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Achievement Unlocks</Label>
                <Switch
                  checked={notificationPrefs.achievements}
                  onCheckedChange={(checked) => updateNotificationPref('achievements', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}