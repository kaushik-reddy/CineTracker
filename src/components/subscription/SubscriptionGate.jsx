import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Loader2, AlertCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createAndSendInvoice } from '../billing/InvoiceGenerator.jsx';

export default function SubscriptionGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Check authentication
      const user = await base44.auth.me();
      
      // Check subscription
      const subscriptions = await base44.entities.Subscription.filter({
        user_email: user.email,
        status: ['trial', 'active']
      });

      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        
        // Check if subscription is expired
        if (sub.end_date && new Date(sub.end_date) < new Date()) {
          setSubscriptionStatus('expired');
          setHasAccess(false);
        } else {
          setHasAccess(true);
        }
      } else {
        // Check for past_due subscriptions (allow limited access)
        const pastDueSubscriptions = await base44.entities.Subscription.filter({
          user_email: user.email,
          status: 'payment_failed'
        });

        if (pastDueSubscriptions.length > 0) {
          setSubscriptionStatus('payment_failed');
          setHasAccess(true); // Limited read-only access
        } else {
          setSubscriptionStatus('none');
          setHasAccess(false);
        }
      }
    } catch (error) {
      // Not authenticated
      console.error('Access check failed:', error);
      setHasAccess(false);
      setSubscriptionStatus('not_authenticated');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-amber-500/50 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {subscriptionStatus === 'not_authenticated' ? (
                <AlertCircle className="w-8 h-8 text-amber-400" />
              ) : (
                <Crown className="w-8 h-8 text-amber-400" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              {subscriptionStatus === 'not_authenticated' 
                ? 'Login Required' 
                : subscriptionStatus === 'expired'
                  ? 'Subscription Expired'
                  : 'Subscription Required'}
            </h2>
            
            <p className="text-zinc-400 mb-6">
              {subscriptionStatus === 'not_authenticated'
                ? 'Please log in to access CineTracker.'
                : subscriptionStatus === 'expired'
                  ? 'Your subscription has expired. Renew to continue tracking your entertainment.'
                  : 'Start your free trial to access all features and organize your entertainment.'}
            </p>

            <div className="space-y-3">
              {subscriptionStatus === 'not_authenticated' ? (
                <Button 
                  onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                  className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
                >
                  Login
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate(createPageUrl('Pricing'))}
                    className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    View Plans
                  </Button>
                  <Button 
                    onClick={() => navigate(createPageUrl('Landing'))}
                    variant="outline"
                    className="w-full text-white border-zinc-700 hover:bg-zinc-800"
                  >
                    Learn More
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show payment failed banner if applicable
  if (subscriptionStatus === 'payment_failed') {
    return (
      <div>
        <div className="bg-red-500/10 border-b border-red-500/50 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">
                Payment failed. Update your payment method to restore full access.
              </span>
            </div>
            <Button 
              size="sm"
              onClick={() => navigate(createPageUrl('Pricing'))}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Update Payment
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return children;
}