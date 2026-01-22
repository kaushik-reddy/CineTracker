import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";

export default function StripeSetupGuide() {
  return (
    <Card className="bg-zinc-900/80 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white">📘 Stripe Configuration Guide</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 text-sm">
        {/* Step 1 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-emerald-500">Step 1</Badge>
            <h4 className="text-white font-semibold">Create Stripe Account</h4>
          </div>
          <ul className="space-y-2 text-zinc-300 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Go to <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">stripe.com/register</a></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Complete business verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Enable payment methods (cards, UPI, etc.)</span>
            </li>
          </ul>
        </div>

        {/* Step 2 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-emerald-500">Step 2</Badge>
            <h4 className="text-white font-semibold">Get API Keys</h4>
          </div>
          <ul className="space-y-2 text-zinc-300 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Navigate to Developers → <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">API Keys</a></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Test Mode Keys (for development):</p>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>• Publishable key: <code className="bg-zinc-800 px-1 py-0.5 rounded">pk_test_...</code></li>
                  <li>• Secret key: <code className="bg-zinc-800 px-1 py-0.5 rounded">sk_test_...</code></li>
                </ul>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Live Mode Keys (for production):</p>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>• Publishable key: <code className="bg-zinc-800 px-1 py-0.5 rounded">pk_live_...</code></li>
                  <li>• Secret key: <code className="bg-zinc-800 px-1 py-0.5 rounded">sk_live_...</code></li>
                </ul>
              </div>
            </li>
          </ul>
        </div>

        {/* Step 3 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-emerald-500">Step 3</Badge>
            <h4 className="text-white font-semibold">Create Products & Prices</h4>
          </div>
          <ul className="space-y-2 text-zinc-300 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Go to Products → <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">Create Product</a></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p>Create pricing tiers (example):</p>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>• Monthly Plan: ₹149/month → Get Price ID: <code className="bg-zinc-800 px-1 py-0.5 rounded">price_...</code></li>
                  <li>• Yearly Plan: ₹1,499/year → Get Price ID: <code className="bg-zinc-800 px-1 py-0.5 rounded">price_...</code></li>
                </ul>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Copy the Price IDs for each plan</span>
            </li>
          </ul>
        </div>

        {/* Step 4 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-emerald-500">Step 4</Badge>
            <h4 className="text-white font-semibold">Configure in CineTracker</h4>
          </div>
          <ul className="space-y-2 text-zinc-300 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Go to Admin → Payments tab</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Toggle Test/Live mode based on your needs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Paste your Publishable Key and Secret Key</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Click "Validate Keys" to test connection</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Click "Save Configuration"</span>
            </li>
          </ul>
        </div>

        {/* Step 5 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-emerald-500">Step 5</Badge>
            <h4 className="text-white font-semibold">Create Subscription Plans</h4>
          </div>
          <ul className="space-y-2 text-zinc-300 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Go to Admin → Plans tab</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Click "Add Plan"</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p>Fill in plan details:</p>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>• Name: "Monthly Premium"</li>
                  <li>• Price: 14900 (₹149 in paise)</li>
                  <li>• Billing Cycle: monthly</li>
                  <li>• Stripe Price ID: paste from Step 3</li>
                  <li>• Set limits and features</li>
                </ul>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Save the plan</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Repeat for all pricing tiers</span>
            </li>
          </ul>
        </div>

        {/* Step 6 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-emerald-500">Step 6</Badge>
            <h4 className="text-white font-semibold">Test Payments</h4>
          </div>
          <ul className="space-y-2 text-zinc-300 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Use Stripe test cards:</span>
            </li>
            <li className="ml-4 text-xs">
              <ul className="space-y-1">
                <li>• Success: <code className="bg-zinc-800 px-1 py-0.5 rounded">4242 4242 4242 4242</code></li>
                <li>• Declined: <code className="bg-zinc-800 px-1 py-0.5 rounded">4000 0000 0000 0002</code></li>
                <li>• Use any future expiry date & any CVC</li>
              </ul>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Go to Pricing page and test subscription flow</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Verify in Stripe Dashboard → Payments</span>
            </li>
          </ul>
        </div>

        {/* Step 7 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-amber-500">Step 7</Badge>
            <h4 className="text-white font-semibold">Go Live</h4>
          </div>
          <ul className="space-y-2 text-zinc-300 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Complete Stripe account verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Switch to Live Mode in CineTracker Admin</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Update with live API keys</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Update plans with live Stripe Price IDs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Start accepting real payments! 🎉</span>
            </li>
          </ul>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-300 font-semibold mb-2">💡 Important Notes</h4>
          <ul className="space-y-1 text-xs text-blue-200">
            <li>• Never share your Secret Keys publicly</li>
            <li>• Test thoroughly in Test Mode before going live</li>
            <li>• Keep your Stripe dashboard email notifications enabled</li>
            <li>• Set up webhook endpoints for production (optional but recommended)</li>
            <li>• Monitor your Stripe dashboard regularly for disputes or issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}