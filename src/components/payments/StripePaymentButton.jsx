import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';

export default function StripePaymentButton({ 
  amount, 
  currency = 'usd', 
  description = 'Payment',
  onSuccess,
  onError,
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [stripeConfig, setStripeConfig] = useState(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    loadStripeConfig();
  }, []);

  const loadStripeConfig = async () => {
    try {
      const configs = await base44.entities.StripeConfig.filter({ is_active: true });
      
      if (configs.length === 0) {
        setConfigError(true);
        return;
      }
      
      const config = configs[0];
      
      if (config.connection_status !== 'connected') {
        setConfigError(true);
        return;
      }
      
      setStripeConfig(config);
    } catch (error) {
      console.error('Failed to load Stripe config:', error);
      setConfigError(true);
    }
  };

  const handlePayment = async () => {
    if (!stripeConfig) {
      toast.error('Payment system not configured. Please contact admin.');
      return;
    }

    setLoading(true);
    
    try {
      // Initialize Stripe with stored publishable key
      const stripe = await loadStripe(stripeConfig.publishable_key);
      
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      // Create checkout session (you'll need to implement this server-side or via integration)
      // For now, this is a placeholder showing the pattern
      toast.info('Creating payment session...');
      
      // Example: Create session via your backend
      // const session = await base44.integrations.Stripe.CreateCheckoutSession({
      //   amount,
      //   currency: stripeConfig.currency,
      //   description
      // });
      
      // const result = await stripe.redirectToCheckout({
      //   sessionId: session.id
      // });
      
      // if (result.error) {
      //   throw new Error(result.error.message);
      // }
      
      // For demo purposes:
      toast.success('Payment flow would start here with configured Stripe account');
      onSuccess?.();
      
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed: ' + error.message);
      onError?.();
    } finally {
      setLoading(false);
    }
  };

  if (configError) {
    return (
      <Button
        disabled
        className={`bg-zinc-700 text-zinc-400 cursor-not-allowed ${className}`}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Payments Unavailable
      </Button>
    );
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || !stripeConfig}
      className={`bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay {currency.toUpperCase()} {(amount / 100).toFixed(2)}
        </>
      )}
    </Button>
  );
}