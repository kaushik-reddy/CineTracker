import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Clock, Film, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AchievementsBadges({ schedules, mediaMap }) {
  const completedSchedules = schedules.filter(s => s.status === 'completed');
  
  const nearingAchievements = useMemo(() => {
    const achievements = [];
    
    // Total watch time
    const totalMinutes = completedSchedules.reduce((sum, s) => {
      const media = mediaMap[s.media_id];
      return sum + (media?.runtime_minutes || 0);
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    
    const timeGoals = [25, 50, 100, 250, 500, 1000];
    const nextTimeGoal = timeGoals.find(g => g > totalHours);
    if (nextTimeGoal) {
      const progress = (totalHours / nextTimeGoal) * 100;
      if (progress >= 50) {
        achievements.push({
          name: `${nextTimeGoal}h Watch Time`,
          progress,
          current: totalHours,
          target: nextTimeGoal,
          icon: Clock,
          color: 'text-amber-400'
        });
      }
    }
    
    // Movie count
    const movieCount = completedSchedules.filter(s => mediaMap[s.media_id]?.type === 'movie').length;
    const movieGoals = [10, 25, 50, 100, 250, 500];
    const nextMovieGoal = movieGoals.find(g => g > movieCount);
    if (nextMovieGoal) {
      const progress = (movieCount / nextMovieGoal) * 100;
      if (progress >= 50) {
        achievements.push({
          name: `${nextMovieGoal} Movies`,
          progress,
          current: movieCount,
          target: nextMovieGoal,
          icon: Film,
          color: 'text-blue-400'
        });
      }
    }
    
    // Series count
    const uniqueSeries = new Set(completedSchedules.filter(s => mediaMap[s.media_id]?.type === 'series').map(s => s.media_id));
    const seriesCount = uniqueSeries.size;
    const seriesGoals = [5, 10, 25, 50, 100];
    const nextSeriesGoal = seriesGoals.find(g => g > seriesCount);
    if (nextSeriesGoal) {
      const progress = (seriesCount / nextSeriesGoal) * 100;
      if (progress >= 50) {
        achievements.push({
          name: `${nextSeriesGoal} Series`,
          progress,
          current: seriesCount,
          target: nextSeriesGoal,
          icon: Tv,
          color: 'text-purple-400'
        });
      }
    }
    
    return achievements.slice(0, 3);
  }, [completedSchedules, mediaMap]);

  if (nearingAchievements.length === 0) {
    return null;
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 h-full">
      <CardHeader>
        <CardTitle className="text-white text-base md:text-lg font-semibold tracking-tight flex items-center gap-2">
          <Trophy className="w-4 md:w-5 h-4 md:h-5 text-amber-500" />
          Nearing Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {nearingAchievements.map((ach, idx) => {
          const Icon = ach.icon;
          return (
            <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${ach.color}`} />
                  <span className="text-sm text-white font-medium">{ach.name}</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                  {Math.round(ach.progress)}%
                </Badge>
              </div>
              <div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  style={{ width: `${ach.progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {ach.current} / {ach.target}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}