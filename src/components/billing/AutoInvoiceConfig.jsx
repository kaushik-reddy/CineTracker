import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { FileText, Mail, Loader2 } from "lucide-react";

export default function AutoInvoiceConfig() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    auto_generate: true,
    auto_email: true,
    include_tax: false,
    tax_percentage: 0
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configs = await base44.entities.AppConfig.filter({ 
        config_key: 'invoice_settings' 
      });
      
      if (configs.length > 0) {
        setConfig(configs[0].config_value);
      }
    } catch (error) {
      console.error('Failed to load invoice config:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.AppConfig.filter({ 
        config_key: 'invoice_settings' 
      });

      if (existing.length > 0) {
        await base44.entities.AppConfig.update(existing[0].id, {
          config_value: config
        });
      } else {
        await base44.entities.AppConfig.create({
          config_key: 'invoice_settings',
          config_value: config,
          category: 'global',
          description: 'Automatic invoice generation settings'
        });
      }

      toast.success('Invoice settings saved');
    } catch (error) {
      console.error('Failed to save invoice config:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Auto Invoice Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">Auto-generate Invoices</span>
            </div>
            <p className="text-sm text-zinc-400">
              Automatically create invoice records for all payments
            </p>
          </div>
          <Switch
            checked={config.auto_generate}
            onCheckedChange={(checked) => setConfig({ ...config, auto_generate: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">Auto-email Invoices</span>
            </div>
            <p className="text-sm text-zinc-400">
              Automatically send invoice emails to users after payment
            </p>
          </div>
          <Switch
            checked={config.auto_email}
            onCheckedChange={(checked) => setConfig({ ...config, auto_email: checked })}
          />
        </div>

        <Button
          onClick={saveConfig}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}