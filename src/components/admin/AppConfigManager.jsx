import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Save, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AppConfigManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    // Global Application Configuration
    default_landing_page: 'home',
    default_schedule_view: 'day',
    default_timeline_granularity: 'day',
    default_layout_density: 'comfortable',
    
    // Feature Visibility & Toggles
    enable_spending_section: true,
    enable_achievements: true,
    enable_advanced_stats: true,
    enable_smart_notifications: true,
    enable_watch_fatigue_alerts: true,
    
    // Notification Configuration
    enable_notifications_globally: true,
    default_notification_preferences: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    
    // Data & Metadata Controls
    allowed_title_states: ['unwatched', 'scheduled', 'watching', 'watched'],
    enable_multiple_universe_assignment: false,
    enable_external_data_sources: true,
    
    // UI/UX Controls
    show_home_widgets: true,
    show_insights_blocks: true,
    animation_intensity: 'normal',
    default_chart_density: 'comfortable'
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const allConfigs = await base44.entities.AppConfig.list();
      
      // Load each config into state
      const loadedConfig = { ...config };
      allConfigs.forEach(cfg => {
        if (cfg.config_value && typeof cfg.config_value === 'object') {
          Object.assign(loadedConfig, cfg.config_value);
        }
      });
      
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save configs by category
      const categories = {
        global: {
          default_landing_page: config.default_landing_page,
          default_schedule_view: config.default_schedule_view,
          default_timeline_granularity: config.default_timeline_granularity,
          default_layout_density: config.default_layout_density
        },
        features: {
          enable_spending_section: config.enable_spending_section,
          enable_achievements: config.enable_achievements,
          enable_advanced_stats: config.enable_advanced_stats,
          enable_smart_notifications: config.enable_smart_notifications,
          enable_watch_fatigue_alerts: config.enable_watch_fatigue_alerts
        },
        notifications: {
          enable_notifications_globally: config.enable_notifications_globally,
          default_notification_preferences: config.default_notification_preferences,
          quiet_hours_start: config.quiet_hours_start,
          quiet_hours_end: config.quiet_hours_end
        },
        metadata: {
          allowed_title_states: config.allowed_title_states,
          enable_multiple_universe_assignment: config.enable_multiple_universe_assignment,
          enable_external_data_sources: config.enable_external_data_sources
        },
        ui: {
          show_home_widgets: config.show_home_widgets,
          show_insights_blocks: config.show_insights_blocks,
          animation_intensity: config.animation_intensity,
          default_chart_density: config.default_chart_density
        }
      };

      // Check if configs exist, update or create
      const existingConfigs = await base44.entities.AppConfig.list();
      
      for (const [category, value] of Object.entries(categories)) {
        const existing = existingConfigs.find(c => c.category === category);
        
        if (existing) {
          await base44.entities.AppConfig.update(existing.id, {
            config_value: value
          });
        } else {
          await base44.entities.AppConfig.create({
            config_key: category,
            config_value: value,
            category: category,
            description: `${category} configuration`,
            is_active: true
          });
        }
      }
      
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Application Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
                <Settings2 className="w-5 h-5 text-emerald-400" />
                Global Application Configuration
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-2">
                📌 Configure global app settings including feature toggles, notification preferences, metadata, and UI/UX settings that affect all users.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Default Landing Page</Label>
                <Select value={config.default_landing_page} onValueChange={(value) => setConfig({...config, default_landing_page: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="home" className="text-white">Home</SelectItem>
                    <SelectItem value="library" className="text-white">Library</SelectItem>
                    <SelectItem value="schedule" className="text-white">Schedule</SelectItem>
                    <SelectItem value="timeline" className="text-white">Timeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Default Schedule View</Label>
                <Select value={config.default_schedule_view} onValueChange={(value) => setConfig({...config, default_schedule_view: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="day" className="text-white">Day View</SelectItem>
                    <SelectItem value="week" className="text-white">Week View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Default Timeline Granularity</Label>
                <Select value={config.default_timeline_granularity} onValueChange={(value) => setConfig({...config, default_timeline_granularity: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="day" className="text-white">Day</SelectItem>
                    <SelectItem value="week" className="text-white">Week</SelectItem>
                    <SelectItem value="month" className="text-white">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Default Layout Density</Label>
                <Select value={config.default_layout_density} onValueChange={(value) => setConfig({...config, default_layout_density: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="compact" className="text-white">Compact</SelectItem>
                    <SelectItem value="comfortable" className="text-white">Comfortable</SelectItem>
                    <SelectItem value="spacious" className="text-white">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Visibility & Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Settings2 className="w-5 h-5 text-purple-400" />
              Feature Visibility & Toggles
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-2">Control feature visibility (data remains intact when disabled)</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Spending Section</Label>
                <Switch
                  checked={config.enable_spending_section}
                  onCheckedChange={(checked) => setConfig({...config, enable_spending_section: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Achievements</Label>
                <Switch
                  checked={config.enable_achievements}
                  onCheckedChange={(checked) => setConfig({...config, enable_achievements: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Advanced Stats & Charts</Label>
                <Switch
                  checked={config.enable_advanced_stats}
                  onCheckedChange={(checked) => setConfig({...config, enable_advanced_stats: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Smart Notifications</Label>
                <Switch
                  checked={config.enable_smart_notifications}
                  onCheckedChange={(checked) => setConfig({...config, enable_smart_notifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Watch Fatigue Alerts</Label>
                <Switch
                  checked={config.enable_watch_fatigue_alerts}
                  onCheckedChange={(checked) => setConfig({...config, enable_watch_fatigue_alerts: checked})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Settings2 className="w-5 h-5 text-amber-400" />
              Notification Configuration
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-2">Global notification settings (does not override user preferences)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
              <Label className="text-white text-sm">Enable Notifications Globally</Label>
              <Switch
                checked={config.enable_notifications_globally}
                onCheckedChange={(checked) => setConfig({...config, enable_notifications_globally: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
              <Label className="text-white text-sm">Default Notification Preferences for New Users</Label>
              <Switch
                checked={config.default_notification_preferences}
                onCheckedChange={(checked) => setConfig({...config, default_notification_preferences: checked})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Quiet Hours Start</Label>
                <Select value={config.quiet_hours_start} onValueChange={(value) => setConfig({...config, quiet_hours_start: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return <SelectItem key={hour} value={`${hour}:00`} className="text-white">{hour}:00</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Quiet Hours End</Label>
                <Select value={config.quiet_hours_end} onValueChange={(value) => setConfig({...config, quiet_hours_end: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return <SelectItem key={hour} value={`${hour}:00`} className="text-white">{hour}:00</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data & Metadata Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Settings2 className="w-5 h-5 text-emerald-400" />
              Data & Metadata Controls
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-2">Feature guardrails and data source controls</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
              <div>
                <Label className="text-white text-sm">Enable Multiple Universe Assignment</Label>
                <p className="text-xs text-zinc-500 mt-1">Allow titles to belong to multiple universes (future-ready)</p>
              </div>
              <Switch
                checked={config.enable_multiple_universe_assignment}
                onCheckedChange={(checked) => setConfig({...config, enable_multiple_universe_assignment: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
              <div>
                <Label className="text-white text-sm">Enable External Data Sources</Label>
                <p className="text-xs text-zinc-500 mt-1">Allow fetching from Wikipedia, TMDB, etc.</p>
              </div>
              <Switch
                checked={config.enable_external_data_sources}
                onCheckedChange={(checked) => setConfig({...config, enable_external_data_sources: checked})}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* UI/UX Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Settings2 className="w-5 h-5 text-pink-400" />
              UI / UX Controls
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-2">Control section visibility and display preferences</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Show Home Widgets</Label>
                <Switch
                  checked={config.show_home_widgets}
                  onCheckedChange={(checked) => setConfig({...config, show_home_widgets: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <Label className="text-white text-sm">Show Insights Blocks</Label>
                <Switch
                  checked={config.show_insights_blocks}
                  onCheckedChange={(checked) => setConfig({...config, show_insights_blocks: checked})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Animation Intensity</Label>
                <Select value={config.animation_intensity} onValueChange={(value) => setConfig({...config, animation_intensity: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="normal" className="text-white">Normal</SelectItem>
                    <SelectItem value="reduced" className="text-white">Reduced</SelectItem>
                    <SelectItem value="none" className="text-white">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 text-sm mb-2 block">Default Chart Density</Label>
                <Select value={config.default_chart_density} onValueChange={(value) => setConfig({...config, default_chart_density: value})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="compact" className="text-white">Compact</SelectItem>
                    <SelectItem value="comfortable" className="text-white">Comfortable</SelectItem>
                    <SelectItem value="spacious" className="text-white">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={loadConfig}
          variant="outline"
          className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> These settings act as defaults and guardrails. They do not override existing user preferences or delete any data. Changes take effect immediately for new users and applicable features.
        </p>
      </div>
    </div>
  );
}