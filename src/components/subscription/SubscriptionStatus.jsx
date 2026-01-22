import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Crown, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function SubscriptionStatus({ compact = false }) {
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const user = await base44.auth.me();
      
      const subscriptions = await base44.entities.Subscription.filter({
        user_email: user.email,
        status: ['trial', 'active']
      });

      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        setSubscription(sub);

        // Load plan details
        const planData = await base44.entities.Plan.list();
        const currentPlan = planData.find(p => p.id === sub.plan_id);
        setPlan(currentPlan);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = () => {
    if (!subscription?.end_date) return 0;
    const end = new Date(subscription.end_date);
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isExpiringSoon = () => {
    return getDaysRemaining() <= 7;
  };

  if (loading || !subscription) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        subscription.status === 'trial' 
          ? 'bg-amber-500/10 border border-amber-500/30' 
          : 'bg-emerald-500/10 border border-emerald-500/30'
      }`}>
        <Crown className={`w-4 h-4 ${
          subscription.status === 'trial' ? 'text-amber-400' : 'text-emerald-400'
        }`} />
        <span className="text-xs text-white">
          {subscription.status === 'trial' ? 'Trial' : plan?.name || 'Active'}
        </span>
        {isExpiringSoon() && (
          <Badge className="bg-red-500 text-white text-xs ml-1">
            {getDaysRemaining()}d left
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={`${
      subscription.status === 'trial' 
        ? 'bg-amber-500/10 border-amber-500/30' 
        : 'bg-emerald-500/10 border-emerald-500/30'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown className={`w-5 h-5 ${
                subscription.status === 'trial' ? 'text-amber-400' : 'text-emerald-400'
              }`} />
              <h3 className="text-white font-semibold">
                {subscription.status === 'trial' ? 'Free Trial' : plan?.name || 'Active Plan'}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Calendar className="w-4 h-4" />
              <span>{getDaysRemaining()} days remaining</span>
            </div>

            {isExpiringSoon() && (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3" />
                <span>Plan expires soon!</span>
              </div>
            )}
          </div>

          {subscription.status === 'trial' && (
            <Button
              size="sm"
              onClick={() => navigate(createPageUrl('Pricing'))}
              className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
            >
              Upgrade
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}