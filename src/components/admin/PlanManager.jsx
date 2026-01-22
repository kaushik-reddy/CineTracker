import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Crown, DollarSign, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PlanManager() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly',
    max_library_items: -1,
    max_schedules_per_month: -1,
    max_books: -1,
    enable_stats: true,
    enable_achievements: true,
    is_trial: false,
    trial_days: 7,
    stripe_price_id: '',
    is_active: true,
    features: [],
    sort_order: 0,
    // User action permissions
    can_add_title: true,
    can_schedule: true,
    can_watch: true,
    can_edit: true,
    can_delete: true,
    can_add_history: true,
    can_mark_complete: true
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const allPlans = await base44.entities.Plan.list();
      setPlans(allPlans.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingPlan) {
        await base44.entities.Plan.update(editingPlan.id, formData);
        toast.success('Plan updated');
      } else {
        await base44.entities.Plan.create(formData);
        toast.success('Plan created');
      }
      
      setShowDialog(false);
      setEditingPlan(null);
      resetForm();
      await loadPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const [deletePlanConfirm, setDeletePlanConfirm] = useState(null);

  const handleDelete = (planId) => {
    const plan = plans.find(p => p.id === planId);
    setDeletePlanConfirm(plan);
  };

  const confirmDeletePlan = async () => {
    try {
      await base44.entities.Plan.delete(deletePlanConfirm.id);
      toast.success('Plan deleted');
      setDeletePlanConfirm(null);
      await loadPlans();
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      max_library_items: plan.max_library_items ?? -1,
      max_schedules_per_month: plan.max_schedules_per_month ?? -1,
      max_books: plan.max_books ?? -1,
      enable_stats: plan.enable_stats ?? true,
      enable_achievements: plan.enable_achievements ?? true,
      is_trial: plan.is_trial ?? false,
      trial_days: plan.trial_days ?? 7,
      stripe_price_id: plan.stripe_price_id || '',
      is_active: plan.is_active ?? true,
      features: plan.features || [],
      sort_order: plan.sort_order || 0,
      // User action permissions
      can_add_title: plan.can_add_title ?? true,
      can_schedule: plan.can_schedule ?? true,
      can_watch: plan.can_watch ?? true,
      can_edit: plan.can_edit ?? true,
      can_delete: plan.can_delete ?? true,
      can_add_history: plan.can_add_history ?? true,
      can_mark_complete: plan.can_mark_complete ?? true
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      billing_cycle: 'monthly',
      max_library_items: -1,
      max_schedules_per_month: -1,
      max_books: -1,
      enable_stats: true,
      enable_achievements: true,
      is_trial: false,
      trial_days: 7,
      stripe_price_id: '',
      is_active: true,
      features: [],
      sort_order: 0,
      // User action permissions
      can_add_title: true,
      can_schedule: true,
      can_watch: true,
      can_edit: true,
      can_delete: true,
      can_add_history: true,
      can_mark_complete: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <>
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-400" />
                <CardTitle className="text-white">Subscription Plans</CardTitle>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                📌 Create and manage subscription tiers with custom pricing, features, and permission levels.
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setEditingPlan(null);
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{plan.name}</CardTitle>
                      <p className="text-xs text-zinc-400 mt-1">{plan.description}</p>
                    </div>
                    <Badge className={plan.is_active ? 'bg-emerald-500' : 'bg-red-500'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-semibold">
                      ₹{(plan.price / 100).toFixed(2)} / {plan.billing_cycle}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 space-y-1">
                    <p>Library: {plan.max_library_items === -1 ? 'Unlimited' : plan.max_library_items}</p>
                    <p>Schedules/mo: {plan.max_schedules_per_month === -1 ? 'Unlimited' : plan.max_schedules_per_month}</p>
                    <p>Stats: {plan.enable_stats ? 'Yes' : 'No'}</p>
                    <p>Achievements: {plan.enable_achievements ? 'Yes' : 'No'}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(plan)}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Premium"
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>

              <div>
                <Label>Billing Cycle</Label>
                <select
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="trial">Trial</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the plan"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (in paise)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="14900 = ₹149"
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>

              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Max Library Items</Label>
                <Input
                  type="number"
                  value={formData.max_library_items}
                  onChange={(e) => setFormData({ ...formData, max_library_items: parseInt(e.target.value) })}
                  placeholder="-1 for unlimited"
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>

              <div>
                <Label>Max Schedules/Month</Label>
                <Input
                  type="number"
                  value={formData.max_schedules_per_month}
                  onChange={(e) => setFormData({ ...formData, max_schedules_per_month: parseInt(e.target.value) })}
                  placeholder="-1 for unlimited"
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>

              <div>
                <Label>Max Books</Label>
                <Input
                  type="number"
                  value={formData.max_books}
                  onChange={(e) => setFormData({ ...formData, max_books: parseInt(e.target.value) })}
                  placeholder="-1 for unlimited"
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enable_stats}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable_stats: checked })}
                />
                <Label>Enable Stats</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enable_achievements}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable_achievements: checked })}
                />
                <Label>Enable Achievements</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_trial}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_trial: checked })}
                />
                <Label>Is Trial</Label>
              </div>

              {formData.is_trial && (
                <div>
                  <Input
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 7 })}
                    placeholder="Trial days"
                    className="bg-zinc-800 border-zinc-700 text-white w-24"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Stripe Price ID (optional)</Label>
              <Input
                value={formData.stripe_price_id}
                onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                placeholder="price_..."
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div className="border-t border-zinc-700 pt-4 mt-4">
              <Label className="text-base font-semibold mb-3 block">User Action Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.can_add_title}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_add_title: checked })}
                  />
                  <Label>Can Add Title</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.can_schedule}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_schedule: checked })}
                  />
                  <Label>Can Schedule</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.can_watch}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_watch: checked })}
                  />
                  <Label>Can Watch</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.can_edit}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_edit: checked })}
                  />
                  <Label>Can Edit</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.can_delete}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_delete: checked })}
                  />
                  <Label>Can Delete</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.can_add_history}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_add_history: checked })}
                  />
                  <Label>Can Add History</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.can_mark_complete}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_mark_complete: checked })}
                  />
                  <Label>Can Mark Complete</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowDialog(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
              >
                {editingPlan ? 'Update' : 'Create'} Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation */}
      {deletePlanConfirm && (
        <Dialog open={!!deletePlanConfirm} onOpenChange={() => setDeletePlanConfirm(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Plan?</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm">
              Are you sure you want to delete the plan "{deletePlanConfirm.name}"? This cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setDeletePlanConfirm(null)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeletePlan}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}