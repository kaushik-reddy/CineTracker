import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { BarChart3, TrendingUp, Clock, Film, BookOpen, Calendar } from "lucide-react";

export default function UsageAnalytics({ userEmail = null, isAdmin = false }) {
  const [analytics, setAnalytics] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    titlesAdded: 0,
    schedulesCreated: 0,
    watchTime: 0,
    pagesRead: 0,
    logins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userEmail]);

  const loadAnalytics = async () => {
    try {
      const user = userEmail || (await base44.auth.me()).email;
      
      const events = await base44.entities.UsageAnalytics.filter({
        user_email: user
      });

      setAnalytics(events);

      // Calculate stats
      const calculated = {
        totalEvents: events.length,
        titlesAdded: events.filter(e => e.event_type === 'title_added').length,
        schedulesCreated: events.filter(e => e.event_type === 'schedule_created').length,
        watchTime: events
          .filter(e => e.event_type === 'watch_completed')
          .reduce((sum, e) => sum + (e.metadata?.duration || 0), 0),
        pagesRead: events
          .filter(e => e.event_type === 'book_read')
          .reduce((sum, e) => sum + (e.metadata?.pages || 0), 0),
        logins: events.filter(e => e.event_type === 'login').length
      };

      setStats(calculated);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes % 60}m`;
  };

  if (loading) {
    return <div className="text-zinc-400">Loading analytics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Film className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.titlesAdded}</p>
                <p className="text-xs text-zinc-400">Titles Added</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.schedulesCreated}</p>
                <p className="text-xs text-zinc-400">Schedules Created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatWatchTime(stats.watchTime)}</p>
                <p className="text-xs text-zinc-400">Watch Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pagesRead}</p>
                <p className="text-xs text-zinc-400">Pages Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-pink-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.logins}</p>
                <p className="text-xs text-zinc-400">Login Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                <p className="text-xs text-zinc-400">Total Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}