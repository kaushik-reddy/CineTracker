import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Send, Search, Loader2, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createAndSendInvoice } from '../billing/InvoiceGenerator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InvoiceManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteInvoiceConfirm, setDeleteInvoiceConfirm] = useState(null);

  // Fetch all invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin-all-invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date')
  });

  // Fetch users and plans for manual invoice
  const { data: users = [] } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-all-plans'],
    queryFn: () => base44.entities.Plan.list()
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-all-subscriptions'],
    queryFn: () => base44.entities.Subscription.list()
  });

  const handleSendManualInvoice = async () => {
    if (!selectedUser || !selectedPlan) {
      toast.error('Please select user and plan');
      return;
    }

    setSending(true);
    try {
      const targetUser = users.find(u => u.email === selectedUser);
      const plan = plans.find(p => p.id === selectedPlan);
      const userSub = subscriptions.find(s => s.user_email === selectedUser && s.plan_id === selectedPlan);

      if (!targetUser || !plan) {
        toast.error('Invalid user or plan selection');
        setSending(false);
        return;
      }

      // Create mock subscription data if no subscription exists
      const subscriptionData = userSub || {
        user_email: selectedUser,
        plan_id: selectedPlan,
        status: 'active'
      };

      // CRITICAL: Temporarily fetch and use target user context for invoice
      await createAndSendInvoice(subscriptionData, plan, null);
      
      toast.success(`Invoice sent to ${targetUser.full_name} (${targetUser.email})`);
      setShowSendDialog(false);
      setSelectedUser('');
      setSelectedPlan('');
      queryClient.invalidateQueries({ queryKey: ['admin-all-invoices'] });
    } catch (error) {
      console.error('Failed to send invoice:', error);
      toast.error('Failed to send invoice: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Invoice Management
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-2">
                📌 View all generated invoices and manually send invoices to specific users. Download PDF copies anytime.
              </p>
            </div>
            <Button
              onClick={() => setShowSendDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Manual Invoice
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or invoice number..."
              className="pl-9 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Invoices List */}
          <div className="space-y-2">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-zinc-400">{invoice.user_email}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(invoice.created_date).toLocaleDateString()} • 
                        {(invoice.currency || 'INR').toUpperCase()} {(invoice.amount / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {invoice.pdf_url && (
                        <Button
                          size="sm"
                          onClick={() => window.open(invoice.pdf_url, '_blank')}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setDeleteInvoiceConfirm(invoice)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Send Manual Invoice Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Send Manual Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                  <SelectValue placeholder="Choose user..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                  {users.filter(u => u.role !== 'admin').map(u => (
                    <SelectItem key={u.id} value={u.email} className="text-white">
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                  <SelectValue placeholder="Choose plan..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-white">
                      {p.name} - ₹{(p.price / 100).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowSendDialog(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendManualInvoice}
                disabled={sending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>

        {/* Delete Invoice Confirmation */}
        {deleteInvoiceConfirm && (
        <Dialog open={!!deleteInvoiceConfirm} onOpenChange={() => setDeleteInvoiceConfirm(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invoice?</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400 text-sm">
            Are you sure you want to delete invoice "{deleteInvoiceConfirm.invoice_number}"? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setDeleteInvoiceConfirm(null)}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await base44.entities.Invoice.delete(deleteInvoiceConfirm.id);
                  queryClient.invalidateQueries({ queryKey: ['admin-all-invoices'] });
                  toast.success('Invoice deleted');
                  setDeleteInvoiceConfirm(null);
                } catch (error) {
                  toast.error('Failed to delete invoice');
                }
              }}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
        </Dialog>
        )}
        </div>
        );
        }