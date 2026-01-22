import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Crown, Zap, Star, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upiReferenceId, setUpiReferenceId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check authentication first
      let currentUser;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        // Not authenticated, redirect to login with return to pricing
        base44.auth.redirectToLogin('/Pricing');
        return;
      }

      // Load active plans
      const activePlans = await base44.entities.Plan.filter({ is_active: true });
      const sortedPlans = activePlans.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setPlans(sortedPlans);

      // Load current subscription
      const subscriptions = await base44.entities.Subscription.filter({
        user_email: currentUser.email,
        status: ['active', 'pending_payment', 'processing']
      });

      if (subscriptions.length > 0) {
        setCurrentSubscription(subscriptions[0]);
      }
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  // Fetch UPI config
  // Fetch UPI config from AppConfig (list)
  const { data: upiConfig } = useQuery({
    queryKey: ['upi-config'],
    queryFn: async () => {
      try {
        const configs = await base44.entities.AppConfig.filter({
          config_key: 'upi_accounts_list'
        });

        const accounts = configs[0]?.config_value || [];

        // Smart Rotation Logic
        // Filter accounts that have not reached their daily limit (if set)
        const validAccounts = accounts.filter(acc => {
          if (!acc.daily_limit) return true; // No limit
          const limit = parseFloat(acc.daily_limit);
          const collected = parseFloat(acc.collected_amount || 0);
          return collected < limit;
        });

        // If all reached limit, fallback to all accounts (or empty?) - For now fallback to all to avoid blockage
        const availableAccounts = validAccounts.length > 0 ? validAccounts : accounts;

        if (availableAccounts.length === 0) return { upi_id: '', qr_code_url: '' };

        // Randomly select one to distribute load
        const selected = availableAccounts[Math.floor(Math.random() * availableAccounts.length)];
        return selected;
      } catch (e) {
        console.error("Failed to fetch UPI config", e);
        return { upi_id: '', qr_code_url: '' };
      }
    }
  });

  const handleSelectPlan = async (plan) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      base44.auth.redirectToLogin();
      return;
    }

    // Check for previous trial usage if selecting trial plan
    if (plan.billing_cycle === 'trial') {
      try {
        const allSubs = await base44.entities.Subscription.filter({
          user_email: user.email
        });
        // Check if any subscription (active or not) was a trial
        const hasUsedTrial = allSubs.some(s => s.plan_id.includes('trial'));

        if (hasUsedTrial) {
          toast.error("You have already used your trial period.");
          return;
        }
      } catch (e) {
        console.error("Trial check failed", e);
      }
    }

    // Set selected plan and show payment dialog immediately
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPaymentScreenshot(file_url);
      toast.success('Screenshot uploaded!');
    } catch (error) {
      toast.error('Failed to upload screenshot');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentScreenshot && !upiReferenceId) {
      toast.error('Please provide either screenshot or UPI transaction ID');
      return;
    }

    if (!selectedPlan) return;

    setProcessingPlanId(selectedPlan.id);

    try {
      // Create subscription with pending_payment status
      const subscription = await base44.entities.Subscription.create({
        user_email: user.email,
        plan_id: selectedPlan.id,
        status: 'pending_payment',
        payment_method: 'upi_manual'
      });

      // Create payment request
      const paymentRequest = await base44.entities.PaymentRequest.create({
        user_email: user.email,
        subscription_id: subscription.id,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        amount: selectedPlan.price,
        payment_method: 'upi_manual',
        upi_reference_id: upiReferenceId || 'N/A',
        screenshot_url: paymentScreenshot || '',
        status: 'processing',
        submitted_at: new Date().toISOString(),
        admin_upi_id: upiConfig?.id || null // Store which admin account was used
      });

      console.log('Payment request created:', paymentRequest);

      // Update subscription status to processing
      await base44.entities.Subscription.update(subscription.id, {
        status: 'processing'
      });

      toast.success('Payment submitted! Waiting for admin verification.');

      // Reset and redirect
      setShowPaymentDialog(false);
      setSelectedPlan(null);
      setUpiReferenceId('');
      setPaymentScreenshot(null);

      setTimeout(() => {
        window.location.replace('/Home');
      }, 2000);

    } catch (error) {
      console.error('Failed to submit payment:', error);
      toast.error('Failed to submit payment proof: ' + error.message);
    } finally {
      setProcessingPlanId(null);
    }
  };

  const getPlanIcon = (billingCycle) => {
    if (billingCycle === 'trial') return Zap;
    if (billingCycle === 'yearly') return Crown;
    return Star;
  };

  const formatPrice = (price, billingCycle) => {
    const amount = price / 100; // Convert paise to rupees
    if (billingCycle === 'trial') return 'Free';
    return `₹${amount}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-purple-900/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">CineTracker</span> Plan
          </h1>
          <p className="text-zinc-400 text-lg">Track, organize, and never miss a moment</p>

          {currentSubscription && (
            <Badge className="mt-4 bg-emerald-500 text-white text-sm">
              Current Plan Active: {currentSubscription.status}
            </Badge>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.billing_cycle);
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const isTrial = plan.billing_cycle === 'trial';
            const isYearly = plan.billing_cycle === 'yearly';

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden border-2 transition-all duration-300 ${isYearly
                  ? 'bg-gradient-to-br from-purple-900/40 to-emerald-900/40 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.3)] scale-105'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                  }`}
              >
                {isYearly && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    BEST VALUE
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${isYearly ? 'bg-gradient-to-br from-purple-500 to-emerald-500' : 'bg-zinc-800'
                      }`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
                  <p className="text-zinc-400 text-sm">{plan.description}</p>

                  <div className="mt-4">
                    <div className="text-4xl font-bold text-white">
                      {formatPrice(plan.price, plan.billing_cycle)}
                    </div>
                    {!isTrial && (
                      <div className="text-zinc-400 text-sm mt-1">
                        /{plan.billing_cycle}
                      </div>
                    )}
                    {isTrial && plan.trial_days && (
                      <div className="text-emerald-400 text-sm mt-1">
                        {plan.trial_days}-day trial
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </div>
                    ))}

                    {/* Limits */}
                    {plan.max_library_items !== -1 && (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">
                          {plan.max_library_items === -1 ? 'Unlimited' : plan.max_library_items} library items
                        </span>
                      </div>
                    )}

                    {plan.max_schedules_per_month !== -1 && (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">
                          {plan.max_schedules_per_month === -1 ? 'Unlimited' : plan.max_schedules_per_month} schedules/month
                        </span>
                      </div>
                    )}

                    {plan.enable_stats && (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">Advanced stats</span>
                      </div>
                    )}

                    {plan.enable_achievements && (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">Achievements enabled</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan || processingPlanId === plan.id}
                    className={`w-full mt-6 ${isYearly
                      ? 'bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white'
                      : isCurrentPlan
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : 'bg-white hover:bg-zinc-100 text-black'
                      }`}
                  >
                    {processingPlanId === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      currentSubscription?.status === 'processing' ? 'Payment Processing' : 'Current Plan'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>

                  {isYearly && (
                    <p className="text-center text-xs text-emerald-400 mt-2">
                      Save 2 months with yearly plan!
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-zinc-500">
          <p>All plans include 24/7 email support</p>
          <p className="mt-2">Cancel anytime • No hidden fees • Secure UPI payments</p>
        </div>
      </div>

      {/* UPI Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Complete Payment</DialogTitle>
          </DialogHeader>

          {upiConfig ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-zinc-400 text-sm mb-4">
                  Scan QR code or use UPI ID to pay ₹{selectedPlan ? (selectedPlan.price / 100) : 0}
                </p>

                {/* UPI QR Code */}
                {upiConfig.qr_code_url && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={upiConfig.qr_code_url}
                      alt="UPI QR Code"
                      className="w-48 h-48 object-contain border border-zinc-700 rounded"
                    />
                  </div>
                )}

                {/* UPI ID */}
                <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
                  <p className="text-xs text-zinc-400 mb-1">UPI ID</p>
                  <p className="text-white font-mono">{upiConfig.upi_id}</p>
                  {upiConfig.account_holder_name && (
                    <p className="text-xs text-zinc-400 mt-1">{upiConfig.account_holder_name}</p>
                  )}
                </div>
              </div>

              {/* Payment Proof Upload */}
              <div className="space-y-3">
                <div>
                  <Label className="text-zinc-400 text-sm">UPI Reference/Transaction ID (Optional)</Label>
                  <Input
                    value={upiReferenceId}
                    onChange={(e) => setUpiReferenceId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400 text-sm">Upload Payment Screenshot *</Label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label htmlFor="screenshot-upload">
                      <div className="border-2 border-dashed border-zinc-700 rounded p-4 text-center cursor-pointer hover:border-purple-500 transition-colors">
                        {uploadingScreenshot ? (
                          <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin" />
                        ) : paymentScreenshot ? (
                          <div>
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                            <p className="text-emerald-400 text-sm">Screenshot uploaded!</p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                            <p className="text-zinc-400 text-sm">Click to upload screenshot</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitPayment}
                disabled={(!paymentScreenshot && !upiReferenceId) || processingPlanId === selectedPlan?.id}
                className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600"
              >
                {processingPlanId === selectedPlan?.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Payment Paid - Submit for Verification'
                )}
              </Button>

              <p className="text-xs text-zinc-500 text-center">
                Your subscription will be activated after admin verification (usually within 24 hours). Either screenshot or transaction ID is required.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin mb-4" />
              <p className="text-zinc-400">Loading payment details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}