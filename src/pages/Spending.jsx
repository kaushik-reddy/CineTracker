import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SubscriptionManager from "../components/spending/SubscriptionManager";
import SpendingCharts from "../components/spending/SpendingCharts";
import SpendingRecommendations from "../components/spending/SpendingRecommendations";
import PlatformDrillDown from "../components/spending/PlatformDrillDown";

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

export default function Spending() {
  const [drillDownPlatform, setDrillDownPlatform] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  // Load user first
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  // Platform subscriptions (Netflix, Prime, etc - NOT CineTracker plans) - user-isolated
  const { data: platformSubscriptions = [], refetch: refetchSubs } = useQuery({
    queryKey: ['platform-subscriptions', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Admin sees all, users see only their own
      if (user.role === 'admin') {
        return await base44.entities.PlatformSubscription.list('-created_date');
      }
      return await base44.entities.PlatformSubscription.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user,
    initialData: []
  });

  // User's CineTracker subscription (only for non-admin users)
  const { data: userSubscription } = useQuery({
    queryKey: ['user-subscription', user?.email],
    queryFn: async () => {
      if (!user || user.role === 'admin') return null;
      const subs = await base44.entities.Subscription.filter({
        user_email: user.email,
        status: ['trial', 'active']
      });
      return subs[0] || null;
    },
    enabled: !!user && user.role !== 'admin'
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.filter({ is_active: true }),
    initialData: []
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Admin sees all, users see only their own
      if (user.role === 'admin') {
        return await base44.entities.WatchSchedule.list();
      }
      return await base44.entities.WatchSchedule.filter({ created_by: user.email });
    },
    enabled: !!user,
    initialData: []
  });

  const { data: mediaList = [] } = useQuery({
    queryKey: ['media', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Admin sees all, users see only their own
      if (user.role === 'admin') {
        return await base44.entities.Media.list();
      }
      return await base44.entities.Media.filter({ created_by: user.email });
    },
    enabled: !!user,
    initialData: []
  });

  // Load currency preference from user
  useEffect(() => {
    if (user?.spending_currency) {
      setSelectedCurrency(user.spending_currency);
    }
  }, [user]);

  const mediaMap = mediaList.reduce((acc, m) => ({ ...acc, [m.id]: m }), {});
  const completedSchedules = schedules.filter(s => s.status === 'completed');

  // Calculate overview stats (account for bundles correctly)
  const stats = useMemo(() => {
    const activeSubs = (platformSubscriptions || []).filter(s => s.is_active);
    const processedBundles = new Set();
    
    let totalMonthly = 0;
    let totalYearly = 0;
    
    activeSubs.forEach(s => {
      // For bundles, only count once per unique bundle name
      if (s.is_bundle) {
        const bundleKey = s.platform_name;
        if (processedBundles.has(bundleKey)) return;
        processedBundles.add(bundleKey);
      }
      
      totalMonthly += s.billing_cycle === 'yearly' ? s.cost / 12 : s.cost;
      totalYearly += s.billing_cycle === 'yearly' ? s.cost : s.cost * 12;
    });
    
    const totalHoursWatched = completedSchedules.reduce((sum, s) => {
      const media = mediaMap[s.media_id];
      if (!media) return sum;
      let runtime = media.runtime_minutes || 0;
      if (media.type === 'series' && s.season_number && s.episode_number) {
        const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
        if (epRuntime) runtime = epRuntime;
      }
      return sum + runtime;
    }, 0) / 60;
    
    return {
      totalMonthly,
      totalYearly,
      activeCount: activeSubs.length,
      totalHoursWatched
    };
  }, [platformSubscriptions, completedSchedules, mediaMap]);

  const avgCostPerHour = stats.totalHoursWatched > 0 ? stats.totalMonthly / stats.totalHoursWatched : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-4 sm:p-6">
      <div className="w-full space-y-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg sm:text-xl font-semibold text-white">Spending Analytics</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Currency:</span>
              <Select 
                value={selectedCurrency} 
                onValueChange={async (value) => {
                  setSelectedCurrency(value);
                  // Save to user preferences
                  try {
                    await base44.auth.updateMe({ spending_currency: value });
                  } catch (error) {
                    console.error('Failed to save currency preference:', error);
                  }
                }}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="INR" className="text-white">₹ INR</SelectItem>
                  <SelectItem value="USD" className="text-white">$ USD</SelectItem>
                  <SelectItem value="EUR" className="text-white">€ EUR</SelectItem>
                  <SelectItem value="GBP" className="text-white">£ GBP</SelectItem>
                  <SelectItem value="AUD" className="text-white">A$ AUD</SelectItem>
                  <SelectItem value="CAD" className="text-white">C$ CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">Track your entertainment costs and optimize subscription value</p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-zinc-900/80 border-emerald-500/30 hover-shadow-emerald">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <DollarSign className="w-8 sm:w-10 h-8 sm:h-10 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-white truncate">{getCurrencySymbol(selectedCurrency)}{stats.totalMonthly.toFixed(0)}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-400">Monthly Spend</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-zinc-900/80 border-purple-500/30 hover-shadow-purple">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="w-8 sm:w-10 h-8 sm:h-10 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-white truncate">{getCurrencySymbol(selectedCurrency)}{stats.totalYearly.toFixed(0)}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-400">Yearly Spend</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-zinc-900/80 border-amber-500/30 hover-shadow-amber">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Award className="w-8 sm:w-10 h-8 sm:h-10 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-white truncate">{stats.activeCount}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-400">Active Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-zinc-900/80 border-blue-500/30 hover-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingDown className="w-8 sm:w-10 h-8 sm:h-10 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-white truncate">{getCurrencySymbol(selectedCurrency)}{avgCostPerHour.toFixed(2)}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-400">Cost/Hour</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Subscription Card - Only for non-admin users */}
        {userSubscription && user?.role !== 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/40 to-emerald-900/40 border-purple-500/50">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Your CineTracker Plan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Current Plan</p>
                    <p className="text-white font-semibold">
                      {plans.find(p => p.id === userSubscription.plan_id)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Status</p>
                    <p className={`font-semibold capitalize ${
                      userSubscription.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {userSubscription.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">
                      {userSubscription.status === 'trial' ? 'Trial Ends' : 'Renews'}
                    </p>
                    <p className="text-white font-semibold">
                      {new Date(userSubscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => window.location.href = '/Pricing'}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={() => window.location.href = '/Pricing'}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Change Plan
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Platform Subscription Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SubscriptionManager 
          subscriptions={platformSubscriptions} 
          onUpdate={refetchSubs} 
          selectedCurrency={selectedCurrency}
        />
        </motion.div>

        {/* Charts */}
        {platformSubscriptions.length > 0 && completedSchedules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SpendingCharts
              subscriptions={platformSubscriptions}
              completedSchedules={completedSchedules}
              mediaMap={mediaMap}
              onPlatformClick={setDrillDownPlatform}
            />
          </motion.div>
        )}

        {/* Recommendations */}
        {platformSubscriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <SpendingRecommendations
              subscriptions={platformSubscriptions}
              completedSchedules={completedSchedules}
              mediaMap={mediaMap}
              selectedCurrency={selectedCurrency}
            />
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-3 sm:p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover-shadow"
        >
          <h3 className="text-white font-semibold mb-2 text-base">About Spending Analytics</h3>
          <ul className="space-y-1 text-sm text-zinc-400">
            <li>• Add your subscriptions to track monthly/yearly costs</li>
            <li>• Analytics are calculated from your watch history automatically</li>
            <li>• Recommendations help identify low-value subscriptions</li>
            <li>• Click on chart segments to see contributing titles</li>
            <li>• All data is private and stored securely</li>
          </ul>
        </motion.div>
      </div>

      {/* Drill-down Modal */}
      <PlatformDrillDown
        open={!!drillDownPlatform}
        onClose={() => setDrillDownPlatform(null)}
        platform={drillDownPlatform}
        completedSchedules={completedSchedules}
        mediaMap={mediaMap}
        allMedia={mediaList}
      />
    </div>
  );
}