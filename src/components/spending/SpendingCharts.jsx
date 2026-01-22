import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { TrendingUp, Clock, DollarSign, Activity } from "lucide-react";

const COLORS = ['#a855f7', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function SpendingCharts({ subscriptions, completedSchedules, mediaMap, onPlatformClick }) {
  const analytics = useMemo(() => {
    // Calculate time spent per platform
    const platformTime = {};
    const platformCount = {};
    
    completedSchedules.forEach(schedule => {
      const media = mediaMap[schedule.media_id];
      if (!media || !media.platform) return;
      
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
        const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      } else if (media.type === 'book') {
        runtime = schedule.session_duration || 30;
      }
      
      platformTime[media.platform] = (platformTime[media.platform] || 0) + runtime;
      platformCount[media.platform] = (platformCount[media.platform] || 0) + 1;
    });

    // Match with subscriptions and calculate cost per hour
    const platformAnalytics = [];
    const activeSubs = subscriptions.filter(s => s.is_active);
    
    activeSubs.forEach(sub => {
      const platforms = sub.is_bundle ? sub.bundle_platforms : [sub.platform_name];
      const monthlyCost = sub.billing_cycle === 'yearly' ? sub.cost / 12 : sub.cost;
      
      platforms.forEach(platform => {
        const timeMinutes = platformTime[platform] || 0;
        const timeHours = timeMinutes / 60;
        const count = platformCount[platform] || 0;
        const costPerHour = timeHours > 0 ? monthlyCost / timeHours : 0;
        
        platformAnalytics.push({
          platform,
          cost: monthlyCost,
          hours: parseFloat(timeHours.toFixed(1)),
          count,
          costPerHour: parseFloat(costPerHour.toFixed(2)),
          utilization: timeHours > 0 ? Math.min((timeHours / 50) * 100, 100) : 0
        });
      });
    });

    return platformAnalytics;
  }, [subscriptions, completedSchedules, mediaMap]);

  const costVsUsageData = analytics.map(a => ({
    name: a.platform,
    cost: a.cost,
    hours: a.hours
  }));

  const costPerHourData = analytics
    .filter(a => a.hours > 0)
    .sort((a, b) => a.costPerHour - b.costPerHour)
    .map(a => ({
      name: a.platform,
      value: a.costPerHour
    }));

  const utilizationData = analytics.map(a => ({
    name: a.platform,
    value: a.utilization
  }));

  const distributionData = analytics
    .filter(a => a.hours > 0)
    .map(a => ({
      name: a.platform,
      value: a.hours
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Cost vs Usage */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Cost vs Watch Time
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costVsUsageData}>
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={9} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#a1a1aa" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="cost" fill="#a855f7" name="Monthly Cost (₹)" />
                  <Bar dataKey="hours" fill="#10b981" name="Hours Watched" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Per Hour */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Cost Per Hour
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costPerHourData} layout="vertical">
                  <XAxis type="number" stroke="#a1a1aa" fontSize={9} />
                  <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={9} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => `₹${value}/hr`}
                  />
                  <Bar dataKey="value" name="₹/Hour">
                    {costPerHourData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Distribution */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Watch Time Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}h`}
                    labelStyle={{ fontSize: 9, fill: '#fff' }}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={COLORS[index % COLORS.length]}
                        onClick={() => onPlatformClick?.(entry.name)}
                        className="cursor-pointer hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => `${value} hours`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utilization Efficiency */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Utilization Score
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={utilizationData}>
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={9} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#a1a1aa" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Bar dataKey="value" name="Utilization %">
                    {utilizationData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.value > 60 ? '#10b981' : entry.value > 30 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}