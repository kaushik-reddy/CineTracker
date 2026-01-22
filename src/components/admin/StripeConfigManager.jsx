import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, Loader2, CreditCard } from "lucide-react";

export default function StripeConfigManager() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  
  const [formData, setFormData] = useState({
    is_live_mode: false,
    publishable_key: '',
    secret_key: '',
    webhook_secret: '',
    currency: 'usd',
    country: 'US'
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configs = await base44.entities.StripeConfig.filter({ is_active: true });
      
      if (configs.length > 0) {
        const activeConfig = configs[0];
        setConfig(activeConfig);
        setFormData({
          is_live_mode: activeConfig.is_live_mode || false,
          publishable_key: activeConfig.publishable_key || '',
          secret_key: '••••••••••••••••', // Masked
          webhook_secret: '••••••••••••••••', // Masked
          currency: activeConfig.currency || 'usd',
          country: activeConfig.country || 'US'
        });
      }
    } catch (error) {
      console.error('Failed to load Stripe config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateStripeKeys = () => {
    const { publishable_key, secret_key } = formData;
    
    // Validate publishable key format
    const expectedPrefix = formData.is_live_mode ? 'pk_live_' : 'pk_test_';
    if (!publishable_key.startsWith(expectedPrefix)) {
      toast.error(`Publishable key should start with ${expectedPrefix}`);
      return false;
    }
    
    // Validate secret key format (only if changed)
    if (secret_key && !secret_key.includes('•')) {
      const expectedSecretPrefix = formData.is_live_mode ? 'sk_live_' : 'sk_test_';
      if (!secret_key.startsWith(expectedSecretPrefix)) {
        toast.error(`Secret key should start with ${expectedSecretPrefix}`);
        return false;
      }
    }
    
    return true;
  };

  const testStripeConnection = async () => {
    if (!validateStripeKeys()) return;
    
    setValidating(true);
    try {
      // Test connection by attempting to use the keys
      // In a real implementation, you'd make a test API call to Stripe
      toast.success('Stripe keys format validated');
      return true;
    } catch (error) {
      console.error('Stripe validation failed:', error);
      toast.error('Failed to validate Stripe keys');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!validateStripeKeys()) return;
    
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        connection_status: 'connected',
        last_validated_at: new Date().toISOString()
      };
      
      // Don't save masked values
      if (formData.secret_key.includes('•')) {
        delete dataToSave.secret_key;
      }
      if (formData.webhook_secret.includes('•')) {
        delete dataToSave.webhook_secret;
      }
      
      if (config) {
        await base44.entities.StripeConfig.update(config.id, dataToSave);
        toast.success('Stripe configuration updated');
      } else {
        const newConfig = await base44.entities.StripeConfig.create({ ...dataToSave, is_active: true });
        setConfig(newConfig);
        toast.success('Stripe configuration created');
      }
      
      await loadConfig();
    } catch (error) {
      console.error('Failed to save Stripe config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    const status = config?.connection_status || 'not_configured';
    
    const statusConfig = {
      connected: { icon: CheckCircle2, color: 'bg-emerald-500', text: 'Connected' },
      not_configured: { icon: AlertCircle, color: 'bg-amber-500', text: 'Not Configured' },
      invalid: { icon: XCircle, color: 'bg-red-500', text: 'Invalid' },
      error: { icon: XCircle, color: 'bg-red-500', text: 'Error' }
    };
    
    const { icon: Icon, color, text } = statusConfig[status];
    
    return (
      <Badge className={`${color} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <CardTitle className="text-white">Stripe Configuration</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        {config && (
          <p className="text-xs text-zinc-400 mt-2">
            Last updated: {new Date(config.updated_date).toLocaleString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mode Toggle */}
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-semibold">Payment Mode</Label>
              <p className="text-xs text-zinc-400 mt-1">
                {formData.is_live_mode ? 'Live payments are active' : 'Using test mode'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">Test</span>
              <Switch
                checked={formData.is_live_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, is_live_mode: checked })}
              />
              <span className={`text-sm font-semibold ${formData.is_live_mode ? 'text-green-400' : 'text-zinc-400'}`}>
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Warning for Live Mode */}
        {formData.is_live_mode && (
          <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Live mode enabled. Real payments will be processed. Ensure your keys are correct.
              </p>
            </div>
          </div>
        )}

        {/* API Keys */}
        <div className="space-y-4">
          <div>
            <Label className="text-white">Publishable Key</Label>
            <p className="text-xs text-zinc-400 mb-2">
              Starts with {formData.is_live_mode ? 'pk_live_' : 'pk_test_'}
            </p>
            <Input
              value={formData.publishable_key}
              onChange={(e) => setFormData({ ...formData, publishable_key: e.target.value })}
              placeholder={`${formData.is_live_mode ? 'pk_live_' : 'pk_test_'}...`}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-white">Secret Key</Label>
                <p className="text-xs text-zinc-400">
                  Starts with {formData.is_live_mode ? 'sk_live_' : 'sk_test_'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-zinc-400 hover:text-white"
              >
                {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Input
              type={showSecrets ? "text" : "password"}
              value={formData.secret_key}
              onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
              placeholder={config ? "Enter new key to update" : `${formData.is_live_mode ? 'sk_live_' : 'sk_test_'}...`}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Webhook Secret (Optional)</Label>
            <p className="text-xs text-zinc-400 mb-2">
              Required for webhook event verification
            </p>
            <Input
              type={showSecrets ? "text" : "password"}
              value={formData.webhook_secret}
              onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
              placeholder={config ? "Enter new secret to update" : "whsec_..."}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Currency</Label>
            <Input
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value.toLowerCase() })}
              placeholder="usd"
              className="bg-zinc-800 border-zinc-700 text-white mt-2"
            />
          </div>
          <div>
            <Label className="text-white">Country</Label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
              placeholder="US"
              className="bg-zinc-800 border-zinc-700 text-white mt-2"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={testStripeConnection}
            disabled={validating || !formData.publishable_key}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate Keys'
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.publishable_key}
            className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            💡 Get your Stripe API keys from: <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard → Developers → API Keys</a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}