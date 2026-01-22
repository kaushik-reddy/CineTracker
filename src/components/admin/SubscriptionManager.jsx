import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Calendar, DollarSign, Gift, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatIST } from '../utils/timezone';
import { useAction } from '../feedback/useAction';

export default function SubscriptionManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [daysToAdd, setDaysToAdd] = useState('30');
  const [discountPercent, setDiscountPercent] = useState('100');
  const [processing, setProcessing] = useState(false);
  const { executeAction } = useAction();

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => base44.entities.User.list()
  });

  // Fetch all subscriptions
  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ['admin-all-subscriptions'],
    queryFn: () => base44.entities.Subscription.list()
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      toast.success('Subscription updated!');
    }
  });

  const filteredUsers = allUsers.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExtendSubscription = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    await executeAction('Extending Subscription', async () => {
      const userSub = allSubscriptions.find(s => 
        s.user_email === selectedUser.email && 
        s.status === 'active'
      );

      if (!userSub) {
        throw new Error('No active subscription found for this user');
      }

      const currentEndDate = new Date(userSub.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + parseInt(daysToAdd));

      await updateSubscriptionMutation.mutateAsync({
        id: userSub.id,
        data: {
          end_date: newEndDate.toISOString()
        }
      });

      setDaysToAdd('30');
    }, {
      successTitle: 'Subscription Extended',
      successSubtitle: `Added ${daysToAdd} days to ${selectedUser.email}'s subscription`
    });
  };

  const handleApplyCoupon = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    await executeAction('Applying Discount', async () => {
      const userSub = allSubscriptions.find(s => 
        s.user_email === selectedUser.email && 
        s.status === 'active'
      );

      if (!userSub) {
        throw new Error('No active subscription found for this user');
      }

      const plans = await base44.entities.Plan.filter({ id: userSub.plan_id });
      const plan = plans[0];

      if (!plan) {
        throw new Error('Plan not found');
      }

      const discountAmount = (plan.price * parseInt(discountPercent)) / 100;
      const newPrice = plan.price - discountAmount;

      await updateSubscriptionMutation.mutateAsync({
        id: userSub.id,
        data: {
          admin_notes: `${discountPercent}% discount applied - New price: ₹${(newPrice / 100).toLocaleString('en-IN')}`
        }
      });

      setDiscountPercent('100');
      return { newPrice, discountPercent };
    }, {
      successTitle: 'Discount Applied',
      successSubtitle: `${discountPercent}% discount applied to subscription`
    });
  };

  const selectedUserSubscription = selectedUser 
    ? allSubscriptions.find(s => s.user_email === selectedUser.email && s.status === 'active')
    : null;

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base lg:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              Subscription Manager
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-2">
              📌 View and manage all user subscriptions, renewal dates, and subscription status. Extend or apply discounts as needed.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6">
          {/* User Search */}
          <div>
            <Label className="text-white mb-2 text-xs sm:text-sm">Select User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email or name..."
                className="pl-9 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* User List */}
            {searchQuery && (
              <div className="mt-2 max-h-48 sm:max-h-60 overflow-y-auto space-y-2 p-2 bg-zinc-950 rounded border border-zinc-800">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No users found</p>
                ) : (
                  filteredUsers.map(user => {
                    const userSub = allSubscriptions.find(s => s.user_email === user.email && s.status === 'active');
                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                        }}
                        className={`p-2 sm:p-3 rounded cursor-pointer transition-all ${
                          selectedUser?.id === user.id
                            ? 'bg-purple-500/20 border border-purple-500/50'
                            : 'bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-xs sm:text-sm truncate">{user.full_name}</p>
                            <p className="text-zinc-400 text-[10px] sm:text-xs truncate">{user.email}</p>
                          </div>
                          {userSub ? (
                            <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {userSub.status}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-zinc-700 text-zinc-400">
                              No Sub
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected User Display */}
            {selectedUser && !searchQuery && (
              <div className="mt-2 p-2 sm:p-3 bg-purple-500/10 rounded border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{selectedUser.full_name}</p>
                    <p className="text-zinc-400 text-sm">{selectedUser.email}</p>
                    {selectedUserSubscription && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Expires: {formatIST(selectedUserSubscription.end_date, 'PPP')}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedUser(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Extend Subscription */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-semibold text-xs sm:text-sm">Extend Subscription</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-zinc-400 text-xs sm:text-sm">Days to Add</Label>
                <Select value={daysToAdd} onValueChange={setDaysToAdd}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="7" className="text-white">7 Days</SelectItem>
                    <SelectItem value="30" className="text-white">30 Days</SelectItem>
                    <SelectItem value="90" className="text-white">90 Days</SelectItem>
                    <SelectItem value="180" className="text-white">180 Days</SelectItem>
                    <SelectItem value="365" className="text-white">365 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleExtendSubscription}
                  disabled={!selectedUser || processing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Extend
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Apply Coupon */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-semibold text-xs sm:text-sm">Apply Discount Coupon</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-zinc-400 text-xs sm:text-sm">Discount %</Label>
                <Select value={discountPercent} onValueChange={setDiscountPercent}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="10" className="text-white">10% Off</SelectItem>
                    <SelectItem value="25" className="text-white">25% Off</SelectItem>
                    <SelectItem value="50" className="text-white">50% Off</SelectItem>
                    <SelectItem value="75" className="text-white">75% Off</SelectItem>
                    <SelectItem value="100" className="text-white">100% Off (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleApplyCoupon}
                  disabled={!selectedUser || processing}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 space-y-1">
                <p><strong>Extend Subscription:</strong> Adds days to the user's current subscription end date</p>
                <p><strong>Apply Coupon:</strong> Applies a discount to their subscription price (for display/reference)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}