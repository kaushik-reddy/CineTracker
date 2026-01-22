import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Users, Crown, TrendingUp, DollarSign, Calendar, 
  Clock, ArrowUpRight, ArrowDownRight, Loader2, Trash2 
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { formatIST } from '../utils/timezone';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function UserAnalytics() {
  const queryClient = useQueryClient();
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => base44.entities.User.list('-created_date')
  });

  // Fetch all subscriptions
  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['admin-all-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date')
  });

  // Fetch all plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['admin-all-plans'],
    queryFn: () => base44.entities.Plan.list()
  });

  // Fetch all payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-all-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date')
  });

  const isLoading = usersLoading || subsLoading || plansLoading || paymentsLoading;

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userEmail) => {
      // Delete user's subscriptions
      const userSubs = await base44.entities.Subscription.filter({ user_email: userEmail });
      await Promise.all(userSubs.map(s => base44.entities.Subscription.delete(s.id)));
      
      // Delete user's payments
      const userPayments = await base44.entities.Payment.filter({ user_email: userEmail });
      await Promise.all(userPayments.map(p => base44.entities.Payment.delete(p.id)));
      
      // Delete user's invoices
      const userInvoices = await base44.entities.Invoice.filter({ user_email: userEmail });
      await Promise.all(userInvoices.map(i => base44.entities.Invoice.delete(i.id)));
      
      // Delete user's analytics
      const userAnalytics = await base44.entities.UsageAnalytics.filter({ user_email: userEmail });
      await Promise.all(userAnalytics.map(a => base44.entities.UsageAnalytics.delete(a.id)));
      
      // Delete user's media
      const userMedia = await base44.entities.Media.filter({ created_by: userEmail });
      await Promise.all(userMedia.map(m => base44.entities.Media.delete(m.id)));
      
      // Delete user's schedules
      const userSchedules = await base44.entities.WatchSchedule.filter({ created_by: userEmail });
      await Promise.all(userSchedules.map(s => base44.entities.WatchSchedule.delete(s.id)));
      
      // Finally delete the user
      const userRecord = users.find(u => u.email === userEmail);
      if (userRecord) {
        await base44.entities.User.delete(userRecord.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-payments'] });
    }
  });

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!users.length || !subscriptions.length || !plans.length) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User metrics
    const totalUsers = users.filter(u => u.role !== 'admin').length;
    const newUsersLast30Days = users.filter(u => 
      u.role !== 'admin' && new Date(u.created_date) > thirtyDaysAgo
    ).length;
    const newUsersLast7Days = users.filter(u => 
      u.role !== 'admin' && new Date(u.created_date) > sevenDaysAgo
    ).length;

    // Subscription metrics
    const activeSubscriptions = subscriptions.filter(s => 
      s.status === 'active'
    );
    const processingSubscriptions = subscriptions.filter(s => s.status === 'processing');
    const paidSubscriptions = subscriptions.filter(s => s.status === 'active');
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired');

    // Revenue calculations
    const successfulPayments = payments.filter(p => p.status === 'success');
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthlyRevenue = successfulPayments
      .filter(p => new Date(p.created_date) > startOfMonth(now))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Plan distribution
    const planDistribution = plans.map(plan => {
      const planSubs = subscriptions.filter(s => s.plan_id === plan.id && s.status === 'active');
      
      // Calculate revenue from all successful payments for this plan's subscriptions
      const planRevenue = successfulPayments.reduce((sum, payment) => {
        // Check if this payment belongs to any subscription of this plan
        const belongsToThisPlan = planSubs.some(sub => sub.id === payment.subscription_id);
        return belongsToThisPlan ? sum + (payment.amount || 0) : sum;
      }, 0);

      return {
        name: plan.name,
        value: planSubs.length,
        revenue: planRevenue
      };
    });

    // Daily registrations (last 30 days)
    const dailyRegistrations = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = format(date, 'MMM dd');
      const count = users.filter(u => {
        const userDate = new Date(u.created_date);
        return u.role !== 'admin' && 
               userDate.toDateString() === date.toDateString();
      }).length;
      dailyRegistrations.push({ date: dateStr, users: count });
    }

    // Daily revenue (last 30 days)
    const dailyRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = format(date, 'MMM dd');
      const revenue = successfulPayments
        .filter(p => {
          const paymentDate = new Date(p.created_date);
          return paymentDate.toDateString() === date.toDateString();
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      dailyRevenue.push({ date: dateStr, revenue: revenue / 100 }); // Convert to rupees
    }

    // User list with subscription details
    const usersWithSubscriptions = users
      .filter(u => u.role !== 'admin')
      .map(user => {
        const userSub = subscriptions.find(s => 
          s.user_email === user.email && s.status === 'active'
        );
        const plan = userSub ? plans.find(p => p.id === userSub.plan_id) : null;
        const daysLeft = userSub?.end_date ? differenceInDays(new Date(userSub.end_date), now) : 0;
        
        return {
          ...user,
          subscription: userSub,
          plan: plan,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          hasActiveSubscription: !!userSub
        };
      })
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Expiring soon (next 7 days)
    const expiringSoon = usersWithSubscriptions.filter(u => 
      u.hasActiveSubscription && u.daysLeft > 0 && u.daysLeft <= 7
    );

    return {
      totalUsers,
      newUsersLast30Days,
      newUsersLast7Days,
      activeSubscriptions: activeSubscriptions.length,
      processingSubscriptions: processingSubscriptions.length,
      paidSubscriptions: paidSubscriptions.length,
      expiredSubscriptions: expiredSubscriptions.length,
      totalRevenue: totalRevenue / 100, // Convert to rupees
      monthlyRevenue: monthlyRevenue / 100,
      planDistribution,
      dailyRegistrations,
      dailyRevenue,
      usersWithSubscriptions,
      expiringSoon
    };
  }, [users, subscriptions, plans, payments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20 text-zinc-400">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-500/30">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-400" />
              <Badge className="bg-purple-500/20 text-purple-300 text-[10px] sm:text-xs">
                +{analytics.newUsersLast7Days}
              </Badge>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{analytics.totalUsers}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-zinc-400">Total Users</div>
            <div className="text-[10px] sm:text-xs text-emerald-400 mt-1 sm:mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-2 h-2 sm:w-3 sm:h-3" />
              {analytics.newUsersLast30Days} in 30d
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border-emerald-500/30">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-emerald-400" />
              <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs">
                {analytics.paidSubscriptions}
              </Badge>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{analytics.activeSubscriptions}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-zinc-400">Active Subs</div>
            <div className="text-[10px] sm:text-xs text-amber-400 mt-1 sm:mt-2">
              {analytics.processingSubscriptions} pending
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border-amber-500/30">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-amber-400" />
              <Badge className="bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs">Total</Badge>
            </div>
            <div className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-1">₹{analytics.totalRevenue.toLocaleString('en-IN')}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-zinc-400">Revenue</div>
            <div className="text-[10px] sm:text-xs text-emerald-400 mt-1 sm:mt-2">
              ₹{analytics.monthlyRevenue.toLocaleString('en-IN')} month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/40 to-red-800/40 border-red-500/30">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-400" />
              <Badge className="bg-red-500/20 text-red-300 text-[10px] sm:text-xs">Alert</Badge>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{analytics.expiringSoon.length}</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-zinc-400">Expiring</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 mt-1 sm:mt-2">
              Next 7 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 grid grid-cols-3 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="registrations" className="text-xs sm:text-sm">Registrations</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs sm:text-sm">Revenue</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs sm:text-sm">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="mt-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-sm sm:text-base lg:text-lg">Daily User Registrations (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={250} minWidth={300}>
                <LineChart data={analytics.dailyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-sm sm:text-base lg:text-lg">Daily Revenue (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={250} minWidth={300}>
                <BarChart data={analytics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-sm sm:text-base lg:text-lg">Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} minWidth={250}>
                  <PieChart>
                    <Pie
                      data={analytics.planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-sm sm:text-base lg:text-lg">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {analytics.planDistribution.map((plan, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-zinc-800/50 rounded">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div 
                          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-white font-medium text-xs sm:text-sm truncate">{plan.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-white font-bold text-xs sm:text-sm">₹{(plan.revenue / 100).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] sm:text-xs text-zinc-400">{plan.value} users</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Users Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-sm sm:text-base lg:text-lg">All Users & Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[800px]">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-zinc-400 font-medium text-[10px] sm:text-xs">User</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-zinc-400 font-medium text-[10px] sm:text-xs">Registered (IST)</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-zinc-400 font-medium text-[10px] sm:text-xs">Plan</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-zinc-400 font-medium text-[10px] sm:text-xs">Status</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-zinc-400 font-medium text-[10px] sm:text-xs">Days Left</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-zinc-400 font-medium text-[10px] sm:text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.usersWithSubscriptions.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <div className="text-white font-medium text-xs sm:text-sm">{user.full_name}</div>
                      <div className="text-[10px] sm:text-xs text-zinc-500 truncate max-w-[150px]">{user.email}</div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-zinc-300 text-xs sm:text-sm">
                      {formatIST(user.created_date, 'MMM dd, yyyy')}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      {user.plan ? (
                        <Badge className="bg-purple-500/20 text-purple-300 text-[10px] sm:text-xs">
                          {user.plan.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-500 text-[10px] sm:text-xs">No Plan</Badge>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      {user.subscription ? (
                        <Badge className={`text-[10px] sm:text-xs ${
                          user.subscription.status === 'trial' 
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {user.subscription.status}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-300 text-[10px] sm:text-xs">None</Badge>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      {user.hasActiveSubscription ? (
                        <span className={`text-xs sm:text-sm ${user.daysLeft <= 7 ? 'text-red-400 font-bold' : 'text-zinc-300'}`}>
                          {user.daysLeft}d
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs sm:text-sm">—</span>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <Button
                        onClick={() => setDeleteUserConfirm(user.email)}
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      {deleteUserConfirm && (
        <Dialog open={!!deleteUserConfirm} onOpenChange={() => !isDeletingUser && setDeleteUserConfirm(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Delete User & All Data?</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm">
              This will permanently delete the user and ALL their data including subscriptions, payments, invoices, media, and schedules. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button 
                onClick={() => setDeleteUserConfirm(null)} 
                disabled={isDeletingUser} 
                className="flex-1 bg-white text-black hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  setIsDeletingUser(true);
                  try {
                    await deleteUserMutation.mutateAsync(deleteUserConfirm);
                    setDeleteUserConfirm(null);
                  } finally {
                    setIsDeletingUser(false);
                  }
                }} 
                disabled={isDeletingUser} 
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {isDeletingUser ? 'Deleting...' : 'Delete User & Data'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}