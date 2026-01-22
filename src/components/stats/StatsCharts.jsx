import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function StatsCharts({ completedSchedules, mediaMap }) {
  // Platform distribution
  const platformData = useMemo(() => {
    const counts = {};
    completedSchedules.forEach((s) => {
      const media = mediaMap[s.media_id];
      if (media?.platform) {
        counts[media.platform] = (counts[media.platform] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return {
      labels: sorted.map(([platform]) => platform),
      datasets: [{
        data: sorted.map(([, count]) => count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 0,
      }],
    };
  }, [completedSchedules, mediaMap]);

  // Genre distribution
  const genreData = useMemo(() => {
    const counts = {};
    completedSchedules.forEach((s) => {
      const media = mediaMap[s.media_id];
      media?.genre?.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: sorted.map(([genre]) => genre),
      datasets: [{
        label: 'Titles Watched',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
      }],
    };
  }, [completedSchedules, mediaMap]);

  // Watch time by month
  const monthlyData = useMemo(() => {
    const monthCounts = {};
    completedSchedules.forEach((s) => {
      const media = mediaMap[s.media_id];
      if (!media) return;
      const date = new Date(s.updated_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthCounts[monthKey]) monthCounts[monthKey] = 0;
      
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      } else if (media.type === 'book') {
        runtime = s.session_duration || 30;
      }
      
      monthCounts[monthKey] += runtime;
    });

    const sorted = Object.entries(monthCounts).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    return {
      labels: sorted.map(([month]) => {
        const [year, m] = month.split('-');
        return new Date(year, parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        label: 'Watch Time (hours)',
        data: sorted.map(([, minutes]) => Math.round(minutes / 60)),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        tension: 0.4,
      }],
    };
  }, [completedSchedules, mediaMap]);

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={platformData} options={doughnutOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Top Genres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={genreData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold">Watch Time by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={monthlyData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}