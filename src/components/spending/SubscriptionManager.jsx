import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Trash2, Edit, Package } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const getCurrencySymbol = (currency) => {
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$'
  };
  return symbols[currency] || currency;
};

export default function SubscriptionManager({ subscriptions, onUpdate, selectedCurrency = 'INR' }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    platform_name: '',
    cost: '',
    billing_cycle: 'monthly',
    currency: 'INR',
    is_bundle: false,
    bundle_platforms: []
  });

  const [platforms, setPlatforms] = React.useState([]);

  // Load platforms from ConfigurableOptions
  React.useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const platformOptions = await base44.entities.ConfigurableOption.filter({
          category: 'platform',
          is_active: true
        });
        const platformNames = platformOptions.map(p => p.value).sort();
        setPlatforms(platformNames);
      } catch (error) {
        console.error('Failed to load platforms:', error);
        // Fallback to basic list
        setPlatforms(['Netflix', 'Amazon Prime Video', 'Disney+ Hotstar', 'Other']);
      }
    };
    loadPlatforms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.platform_name || !formData.cost) {
      toast.error('Platform and cost are required');
      return;
    }

    try {
      if (editing) {
        await base44.entities.PlatformSubscription.update(editing.id, formData);
        toast.success('Subscription updated');
      } else {
        await base44.entities.PlatformSubscription.create({ ...formData, is_active: true });
        toast.success('Subscription added');
      }
      
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Failed to save subscription:', error);
      toast.error('Failed to save subscription');
    }
  };

  const resetForm = () => {
    setFormData({
      platform_name: '',
      cost: '',
      billing_cycle: 'monthly',
      currency: 'INR',
      is_bundle: false,
      bundle_platforms: []
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (sub) => {
    setEditing(sub);
    setFormData({
      platform_name: sub.platform_name,
      cost: sub.cost,
      billing_cycle: sub.billing_cycle,
      currency: sub.currency || 'INR',
      is_bundle: sub.is_bundle || false,
      bundle_platforms: sub.bundle_platforms || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subscription?')) return;
    
    try {
      await base44.entities.PlatformSubscription.delete(id);
      toast.success('Subscription deleted');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const totalMonthly = subscriptions
    .filter(s => s.is_active)
    .reduce((sum, s) => {
      // Only count each bundle once
      if (s.is_bundle) {
        const isDuplicate = subscriptions.some(other => 
          other.id !== s.id && 
          other.is_bundle && 
          other.platform_name === s.platform_name &&
          other.created_date < s.created_date
        );
        if (isDuplicate) return sum;
      }
      const cost = s.billing_cycle === 'yearly' ? s.cost / 12 : s.cost;
      return sum + cost;
    }, 0);

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              My Subscriptions
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl w-full sm:w-auto text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subscription
            </Button>
          </div>
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-xs sm:text-sm text-emerald-400">
              Total Monthly Spend: <span className="font-bold text-base sm:text-lg">{getCurrencySymbol(selectedCurrency)}{totalMonthly.toFixed(2)}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-4"
              >
                <h4 className="text-white font-semibold">
                  {editing ? 'Edit Subscription' : 'Add New Subscription'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!formData.is_bundle && (
                    <div>
                      <Label className="text-zinc-300">Platform</Label>
                      <Select 
                        value={formData.platform_name} 
                        onValueChange={(value) => setFormData({ ...formData, platform_name: value })}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                          {platforms.map(p => (
                            <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className={formData.is_bundle ? 'sm:col-span-2' : ''}>
                    <Label className="text-zinc-300">Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                      placeholder="299.00"
                      className="bg-zinc-900 border-zinc-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-300">Billing Cycle</Label>
                    <Select 
                      value={formData.billing_cycle} 
                      onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                        <SelectItem value="yearly" className="text-white">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-zinc-300">Currency</Label>
                    <Select 
                      value={formData.currency || 'INR'} 
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="INR" className="text-white">₹ INR</SelectItem>
                        <SelectItem value="USD" className="text-white">$ USD</SelectItem>
                        <SelectItem value="EUR" className="text-white">€ EUR</SelectItem>
                        <SelectItem value="GBP" className="text-white">£ GBP</SelectItem>
                        <SelectItem value="AUD" className="text-white">A$ AUD</SelectItem>
                        <SelectItem value="CAD" className="text-white">C$ CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                  <div>
                    <Label className="text-zinc-300 block mb-1">Bundle Subscription</Label>
                    <p className="text-xs text-zinc-500">One cost covers multiple platforms</p>
                  </div>
                  <Switch
                    checked={formData.is_bundle}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      is_bundle: checked,
                      platform_name: checked ? '' : formData.platform_name,
                      bundle_platforms: checked ? formData.bundle_platforms : []
                    })}
                  />
                </div>

                {formData.is_bundle && (
                  <div>
                    <Label className="text-zinc-300 mb-2 block">Bundle Name (Optional)</Label>
                    <Input
                      value={formData.platform_name}
                      onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                      placeholder="e.g., My Entertainment Bundle"
                      className="bg-zinc-900 border-zinc-700 text-white mb-3"
                    />
                    
                    <Label className="text-zinc-300 mb-2 block">Select Platforms in Bundle</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-900/50 rounded border border-zinc-700">
                      {platforms.filter(p => p !== 'Other').map(p => {
                        const isSelected = formData.bundle_platforms?.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              const newPlatforms = isSelected
                                ? formData.bundle_platforms.filter(bp => bp !== p)
                                : [...(formData.bundle_platforms || []), p];
                              setFormData({ ...formData, bundle_platforms: newPlatforms });
                            }}
                            className={`p-2 rounded-lg border text-xs transition-all ${
                              isSelected 
                                ? 'bg-purple-500/20 border-purple-500/50 text-white' 
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-emerald-500/50'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    {formData.bundle_platforms?.length > 0 && (
                      <p className="text-xs text-emerald-400 mt-2">
                        {formData.bundle_platforms.length} platform{formData.bundle_platforms.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                    {editing ? 'Update' : 'Add'} Subscription
                  </Button>
                  <Button type="button" onClick={resetForm} className="bg-white text-black hover:bg-zinc-100">
                    Cancel
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {subscriptions.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No subscriptions added yet</p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub, idx) => {
                const monthlyCost = sub.billing_cycle === 'yearly' ? sub.cost / 12 : sub.cost;
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      sub.is_active ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-800/20 border-zinc-800 opacity-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-white font-semibold text-sm sm:text-base truncate">{sub.platform_name}</h4>
                          {sub.is_bundle && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs flex items-center gap-1 flex-shrink-0">
                              <Package className="w-3 h-3" />
                              Bundle
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                          <span className="text-emerald-400 font-bold">
                            {getCurrencySymbol(sub.currency || 'INR')}{sub.cost.toFixed(2)}
                          </span>
                          <Badge className="bg-zinc-700 text-zinc-300 border-0 text-xs">
                            {sub.billing_cycle}
                          </Badge>
                          <span className="text-zinc-400 text-xs">
                            ≈ {getCurrencySymbol(sub.currency || 'INR')}{monthlyCost.toFixed(2)}/mo
                          </span>
                          {sub.is_bundle && sub.bundle_platforms?.length > 0 && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                              {sub.bundle_platforms.length} platforms
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(sub)}
                          className="text-zinc-400 hover:text-white h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(sub.id)}
                          className="text-zinc-400 hover:text-red-400 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}