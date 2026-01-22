import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const getCurrencySymbol = (currency) => {
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$'
  };
  return symbols[currency] || currency;
};

export default function SpendingRecommendations({ subscriptions, completedSchedules, mediaMap, selectedCurrency = 'INR' }) {
  const recommendations = useMemo(() => {
    const insights = [];
    
    // Calculate platform usage
    const platformTime = {};
    completedSchedules.forEach(schedule => {
      const media = mediaMap[schedule.media_id];
      if (!media || !media.platform) return;
      
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
        const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      
      platformTime[media.platform] = (platformTime[media.platform] || 0) + runtime;
    });

    const activeSubs = subscriptions.filter(s => s.is_active);
    
    activeSubs.forEach(sub => {
      const platforms = sub.is_bundle ? sub.bundle_platforms : [sub.platform_name];
      const monthlyCost = sub.billing_cycle === 'yearly' ? sub.cost / 12 : sub.cost;
      const currency = sub.currency || 'INR';
      const symbol = getCurrencySymbol(currency);
      
      // For bundles, distribute cost across platforms
      const costPerPlatform = platforms.length > 0 ? monthlyCost / platforms.length : monthlyCost;
      
      platforms.forEach(platform => {
        const timeMinutes = platformTime[platform] || 0;
        const timeHours = timeMinutes / 60;
        const costPerHour = timeHours > 0 ? costPerPlatform / timeHours : Infinity;
        
        // Low usage warning
        if (timeHours < 5 && costPerPlatform > 5) {
          insights.push({
            type: 'warning',
            platform,
            icon: AlertTriangle,
            title: `Low Usage: ${platform}`,
            message: `Only ${timeHours.toFixed(1)}h watched this period. Consider if this subscription is worth ${symbol}${costPerPlatform.toFixed(2)}/month.`,
            priority: 3
          });
        }
        
        // High value detection
        if (timeHours > 20 && costPerHour < 1) {
          insights.push({
            type: 'success',
            platform,
            icon: Award,
            title: `Great Value: ${platform}`,
            message: `${timeHours.toFixed(0)}h watched at ${symbol}${costPerHour.toFixed(2)}/hour. Excellent utilization!`,
            priority: 1
          });
        }
        
        // Expensive per hour
        if (timeHours > 0 && costPerHour > 5) {
          insights.push({
            type: 'alert',
            platform,
            icon: AlertCircle,
            title: `High Cost: ${platform}`,
            message: `${symbol}${costPerHour.toFixed(2)} per hour watched. Consider watching more content to improve value.`,
            priority: 2
          });
        }
      });
    });

    // No usage at all
    const unusedSubs = activeSubs.filter(sub => {
      const platforms = sub.is_bundle ? sub.bundle_platforms : [sub.platform_name];
      return platforms.every(p => !platformTime[p] || platformTime[p] === 0);
    });

    unusedSubs.forEach(sub => {
      const monthlyCost = sub.billing_cycle === 'yearly' ? sub.cost / 12 : sub.cost;
      const currency = sub.currency || 'INR';
      const symbol = getCurrencySymbol(currency);
      
      insights.push({
        type: 'warning',
        platform: sub.platform_name,
        icon: AlertCircle,
        title: `Unused: ${sub.platform_name}`,
        message: `No watch activity detected. This costs ${symbol}${monthlyCost.toFixed(2)}/month.`,
        priority: 4
      });
    });

    return insights.sort((a, b) => b.priority - a.priority);
  }, [subscriptions, completedSchedules, mediaMap]);

  if (recommendations.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-400">No recommendations yet. Add subscriptions and watch titles to get insights.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400" />
          Recommendations & Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {recommendations.map((rec, idx) => {
          const Icon = rec.icon;
          const colorClass = 
            rec.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
            rec.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-red-500/10 border-red-500/30';
          
          const iconColor =
            rec.type === 'success' ? 'text-emerald-400' :
            rec.type === 'warning' ? 'text-amber-400' :
            'text-red-400';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 sm:p-4 rounded-lg border ${colorClass}`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <Icon className={`w-4 sm:w-5 h-4 sm:h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-xs sm:text-sm mb-1 break-words">{rec.title}</h4>
                  <p className="text-xs text-zinc-300 break-words">{rec.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}