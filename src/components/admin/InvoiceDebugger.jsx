import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { createAndSendInvoice } from "../billing/InvoiceGenerator";
import { toast } from "sonner";
import { FileText, Send, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function InvoiceDebugger() {
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] [${type}] ${message}`);
  };

  const testInvoiceGeneration = async () => {
    setTesting(true);
    setLogs([]);
    
    try {
      addLog('Starting invoice generation test...');
      
      // Get test user subscription
      addLog(`Looking for subscription for email: ${testEmail}`);
      const subscriptions = await base44.entities.Subscription.filter({ 
        user_email: testEmail 
      });
      
      if (subscriptions.length === 0) {
        throw new Error('No subscription found for this email');
      }
      
      const subscription = subscriptions[0];
      addLog(`Found subscription: ${subscription.id}, status: ${subscription.status}`);
      
      // Get plan
      addLog(`Fetching plan: ${subscription.plan_id}`);
      const plans = await base44.entities.Plan.filter({ id: subscription.plan_id });
      
      if (plans.length === 0) {
        throw new Error('Plan not found');
      }
      
      const plan = plans[0];
      addLog(`Found plan: ${plan.name}, price: ${plan.price}`);
      
      // Test PDF generation
      addLog('Generating invoice PDF...');
      const invoice = await createAndSendInvoice(subscription, plan);
      addLog(`Invoice created successfully! ID: ${invoice.id}`, 'success');
      addLog(`Invoice number: ${invoice.invoice_number}`, 'success');
      addLog(`PDF URL: ${invoice.pdf_url}`, 'success');
      
      toast.success('Invoice generated and sent successfully!');
    } catch (error) {
      addLog(`ERROR: ${error.message}`, 'error');
      addLog(`Stack: ${error.stack}`, 'error');
      toast.error('Invoice generation failed - check logs below');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Invoice Generation Debugger
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Test User Email</label>
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="user@example.com"
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <Button
          onClick={testInvoiceGeneration}
          disabled={testing || !testEmail}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Test Invoice Generation
            </>
          )}
        </Button>

        {logs.length > 0 && (
          <div className="mt-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800 max-h-96 overflow-y-auto">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Debug Logs
            </h3>
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    'text-zinc-400'
                  }`}
                >
                  {log.type === 'error' && <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  {log.type === 'success' && <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-zinc-500 bg-zinc-950 p-3 rounded">
          <strong>How to use:</strong> Enter a user email with an active subscription, then click test. 
          This will generate a new invoice and send it to the user. Check the logs below for detailed information.
        </div>
      </CardContent>
    </Card>
  );
}