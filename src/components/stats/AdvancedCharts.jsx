import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';

export default function AdvancedCharts({ completedSchedules, mediaMap }) {
  // Device usage over time
  const deviceTimeData = useMemo(() => {
    const deviceMinutes = {};
    completedSchedules.forEach((s) => {
      const media = mediaMap[s.media_id];
      const device = s.device || media?.device;
      if (device) {
        let runtime = media?.runtime_minutes || 0;
        if (media?.type === 'series' && s.season_number && s.episode_number) {
          const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
          if (epRuntime) runtime = epRuntime;
        } else if (media?.type === 'book') {
          runtime = s.session_duration || 30;
        }
        deviceMinutes[device] = (deviceMinutes[device] || 0) + runtime;
      }
    });
    
    const sorted = Object.entries(deviceMinutes).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(([device]) => device),
      datasets: [{
        label: 'Watch Time (hours)',
        data: sorted.map(([, minutes]) => Math.round(minutes / 60)),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      }],
    };
  }, [completedSchedules, mediaMap]);

  // Rating distribution
  const ratingData = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    completedSchedules.forEach((s) => {
      const rating = s.rating || mediaMap[s.media_id]?.rating;
      if (rating) counts[Math.round(rating)] = (counts[Math.round(rating)] || 0) + 1;
    });
    
    return {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        data: [counts[1], counts[2], counts[3], counts[4], counts[5]],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderWidth: 0,
      }],
    };
  }, [completedSchedules, mediaMap]);

  // Watch time by day of week
  const dayOfWeekData = useMemo(() => {
    const days = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    completedSchedules.forEach((s) => {
      const media = mediaMap[s.media_id];
      if (!media) return;
      const date = new Date(s.updated_date);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      } else if (media.type === 'book') {
        runtime = s.session_duration || 30;
      }
      
      days[dayName] += runtime;
    });
    
    return {
      labels: Object.keys(days),
      datasets: [{
        label: 'Watch Time (hours)',
        data: Object.values(days).map(m => Math.round(m / 60)),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
      }],
    };
  }, [completedSchedules, mediaMap]);

  // Language diversity
  const languageData = useMemo(() => {
    const counts = {};
    completedSchedules.forEach((s) => {
      const media = mediaMap[s.media_id];
      if (media?.language) {
        counts[media.language] = (counts[media.language] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return {
      labels: sorted.map(([lang]) => lang),
      datasets: [{
        data: sorted.map(([, count]) => count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      }],
    };
  }, [completedSchedules, mediaMap]);

  // Hourly watch pattern
  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0);
    completedSchedules.forEach((s) => {
      const date = new Date(s.started_at || s.updated_date);
      hours[date.getHours()]++;
    });
    
    return {
      labels: hours.map((_, i) => `${i}:00`),
      datasets: [{
        label: 'Watches Started',
        data: hours,
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
        tension: 0.4,
      }],
    };
  }, [completedSchedules]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#a1a1aa',
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: '#3f3f46',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: '#71717a', font: { size: 10 } },
        grid: { color: 'rgba(63, 63, 70, 0.3)' }
      },
      y: {
        ticks: { color: '#71717a', font: { size: 10 } },
        grid: { color: 'rgba(63, 63, 70, 0.3)' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#a1a1aa',
          font: { size: 11 },
          padding: 12,
          boxWidth: 12,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: '#3f3f46',
        borderWidth: 1,
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Device Usage (Time)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={deviceTimeData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={ratingData} options={doughnutOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Watch Time by Day of Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={dayOfWeekData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Language Diversity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={languageData} options={doughnutOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Watch Pattern by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={hourlyData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}