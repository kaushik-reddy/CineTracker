import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, Eye, Clock, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatIST } from '../utils/timezone';
import { createAndSendInvoice } from '../billing/InvoiceGenerator';
import { useAction } from '../feedback/useAction';

export default function PaymentVerification() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { executeAction } = useAction();

  // Fetch all payment requests with polling
  const { data: paymentRequests = [], refetch: refetchPayments } = useQuery({
    queryKey: ['admin-payment-requests'],
    queryFn: () => base44.entities.PaymentRequest.list('-submitted_at'),
    refetchInterval: 15000 // Auto-refresh every 15 seconds
  });

  // Show notification badge for new payment requests
  const processingCount = paymentRequests.filter(p => p.status === 'processing').length;
  
  React.useEffect(() => {
    if (processingCount > 0) {
      document.title = `(${processingCount}) Admin - Payment Verification`;
    } else {
      document.title = 'Admin - Payment Verification';
    }
    
    return () => {
      document.title = 'CineTracker Admin';
    };
  }, [processingCount]);

  // Fetch all plans for reference
  const { data: allPlans = [] } = useQuery({
    queryKey: ['admin-all-plans'],
    queryFn: () => base44.entities.Plan.list()
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (paymentRequest) => {
      const user = await base44.auth.me();
      
      // Update payment request
      await base44.entities.PaymentRequest.update(paymentRequest.id, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email
      });

      // Create Payment record for revenue tracking
      await base44.entities.Payment.create({
        user_email: paymentRequest.user_email,
        subscription_id: paymentRequest.subscription_id,
        amount: paymentRequest.amount,
        currency: 'inr',
        provider: 'upi_manual',
        transaction_id: paymentRequest.upi_reference_id || paymentRequest.id,
        status: 'success',
        payment_method: 'UPI Manual'
      });

      // Update subscription
      const plan = allPlans.find(p => p.id === paymentRequest.plan_id);
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (plan.billing_cycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billing_cycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (plan.billing_cycle === 'trial' && plan.trial_days) {
        endDate.setDate(endDate.getDate() + plan.trial_days);
      }

      await base44.entities.Subscription.update(paymentRequest.subscription_id, {
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      // Generate and send invoice automatically
      try {
        const subscriptionData = {
          user_email: paymentRequest.user_email,
          plan_id: paymentRequest.plan_id,
          status: 'active'
        };
        await createAndSendInvoice(subscriptionData, plan, {
          id: paymentRequest.id,
          amount: paymentRequest.amount
        });
      } catch (invoiceError) {
        console.error('Failed to generate invoice:', invoiceError);
        // Don't fail the whole approval if invoice fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-payments'] });
      toast.success('Payment approved! User subscription activated.');
      setReviewDialog(false);
      setSelectedPayment(null);
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ paymentRequest, reason }) => {
      const user = await base44.auth.me();
      
      // Update payment request
      await base44.entities.PaymentRequest.update(paymentRequest.id, {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email,
        rejection_reason: reason
      });

      // Update subscription
      await base44.entities.Subscription.update(paymentRequest.subscription_id, {
        status: 'rejected',
        admin_notes: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-payments'] });
      toast.success('Payment rejected.');
      setReviewDialog(false);
      setSelectedPayment(null);
      setRejectionReason('');
    }
  });

  const handleApprove = async () => {
    if (!selectedPayment) return;
    await executeAction('Approving Payment', async () => {
      await approveMutation.mutateAsync(selectedPayment);
      setReviewDialog(false);
      setSelectedPayment(null);
    }, {
      successTitle: 'Payment Approved',
      successSubtitle: 'User subscription has been activated'
    });
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    await executeAction('Rejecting Payment', async () => {
      await rejectMutation.mutateAsync({ 
        paymentRequest: selectedPayment, 
        reason: rejectionReason 
      });
      setReviewDialog(false);
      setSelectedPayment(null);
      setRejectionReason('');
    }, {
      successTitle: 'Payment Rejected',
      successSubtitle: 'User has been notified'
    });
  };

  const processingPayments = paymentRequests.filter(p => p.status === 'processing');
  const approvedPayments = paymentRequests.filter(p => p.status === 'approved');
  const rejectedPayments = paymentRequests.filter(p => p.status === 'rejected');

  const filterPayments = (payments) => {
    if (!searchQuery) return payments;
    return payments.filter(p => 
      p.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.upi_reference_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const PaymentCard = ({ payment }) => {
    const plan = allPlans.find(p => p.id === payment.plan_id);
    
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white font-medium truncate text-xs sm:text-sm">{payment.user_email}</p>
                {payment.status === 'processing' && (
                  <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                    Pending
                  </span>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-zinc-400">
                <p>Plan: <span className="text-white">{plan?.name || 'Unknown'}</span></p>
                <p>Amount: <span className="text-white">₹{payment.amount / 100}</span></p>
                {payment.upi_reference_id && (
                  <p>Ref: <span className="text-white font-mono text-xs">{payment.upi_reference_id}</span></p>
                )}
                <p className="text-xs">
                  Submitted: {formatIST(payment.submitted_at || payment.created_date, 'PPp')}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setSelectedPayment(payment);
                setReviewDialog(true);
              }}
              className="bg-purple-500 hover:bg-purple-600 flex-shrink-0 h-8 w-8 p-0"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                Manual Payment Verification
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-2">
                📌 Review and approve/reject user payment submissions. Verify UPI screenshots and activate subscriptions.
              </p>
            </div>
            <Button
              onClick={() => refetchPayments()}
              variant="outline"
              size="sm"
              className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
            >
              <Loader2 className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or reference ID..."
              className="pl-9 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="processing" className="w-full">
            <TabsList className="bg-zinc-800 border border-zinc-700 grid grid-cols-3 w-full sm:inline-flex">
              <TabsTrigger value="processing" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-xs sm:text-sm">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Processing </span>({processingPayments.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-xs sm:text-sm">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Approved </span>({approvedPayments.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-xs sm:text-sm">
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Rejected </span>({rejectedPayments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="processing" className="space-y-3 mt-4">
              {filterPayments(processingPayments).length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending payments</p>
                </div>
              ) : (
                filterPayments(processingPayments).map(payment => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3 mt-4">
              {filterPayments(approvedPayments).length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No approved payments yet</p>
                </div>
              ) : (
                filterPayments(approvedPayments).map(payment => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-3 mt-4">
              {filterPayments(rejectedPayments).length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No rejected payments</p>
                </div>
              ) : (
                filterPayments(rejectedPayments).map(payment => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedPayment && (
        <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Payment Proof</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4">
              {/* User Info */}
              <div className="bg-zinc-950 p-2 sm:p-3 rounded">
                <p className="text-sm text-zinc-400">User</p>
                <p className="text-white font-medium">{selectedPayment.user_email}</p>
              </div>

              {/* Plan Info */}
              <div className="bg-zinc-950 p-2 sm:p-3 rounded">
                <p className="text-xs sm:text-sm text-zinc-400">Plan</p>
                <p className="text-sm sm:text-base text-white font-medium">{selectedPayment.plan_name}</p>
                <p className="text-emerald-400 text-sm sm:text-base">₹{(selectedPayment.amount / 100).toLocaleString('en-IN')}</p>
              </div>

              {/* Reference ID */}
              {selectedPayment.upi_reference_id && selectedPayment.upi_reference_id !== 'N/A' && (
                <div className="bg-zinc-950 p-2 sm:p-3 rounded">
                  <p className="text-xs sm:text-sm text-zinc-400">UPI Reference ID</p>
                  <p className="text-white font-mono text-xs sm:text-sm break-all">{selectedPayment.upi_reference_id}</p>
                </div>
              )}

              {/* Screenshot */}
              {selectedPayment.screenshot_url && (
                <div>
                  <p className="text-xs sm:text-sm text-zinc-400 mb-2">Payment Screenshot</p>
                  <img 
                    src={selectedPayment.screenshot_url} 
                    alt="Payment proof"
                    className="w-full max-h-60 sm:max-h-96 object-contain bg-zinc-950 rounded border border-zinc-800"
                  />
                </div>
              )}

              {/* Rejection Reason (if reviewing processing) */}
              {selectedPayment.status === 'processing' && (
                <div>
                  <Label className="text-white mb-2 text-xs sm:text-sm">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons (processing) */}
              {selectedPayment.status === 'processing' && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800">
                    <Button
                      onClick={handleReject}
                      disabled={processing}
                      className="flex-1 bg-red-500 hover:bg-red-600 h-10 sm:h-11"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          <span className="text-sm sm:text-base">Reject</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-10 sm:h-11"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          <span className="text-sm sm:text-base">Approve & Activate</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        executeAction('Deleting Request', async () => {
                          await base44.entities.PaymentRequest.delete(selectedPayment.id);
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
                          setReviewDialog(false);
                          setSelectedPayment(null);
                        }, {
                          successTitle: 'Deleted Successfully',
                          successSubtitle: 'Payment request has been removed'
                        });
                      }}
                      variant="outline"
                      className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                    >
                      Delete Request
                    </Button>
                  </div>
                </>
              )}

              {/* Review Info and Delete (if already reviewed) */}
              {selectedPayment.status !== 'processing' && (
                <>
                  <div className="bg-zinc-950 p-2 sm:p-3 rounded">
                    <p className="text-xs sm:text-sm text-zinc-400">Reviewed By</p>
                    <p className="text-sm sm:text-base text-white">{selectedPayment.reviewed_by}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatIST(selectedPayment.reviewed_at, 'PPp')}
                    </p>
                    {selectedPayment.rejection_reason && (
                      <p className="text-red-400 text-xs sm:text-sm mt-2">
                        Reason: {selectedPayment.rejection_reason}
                      </p>
                    )}
                  </div>
                  
                  {/* Delete Button for reviewed records */}
                  <div className="flex gap-3 pt-4 border-t border-zinc-800">
                    <Button
                      onClick={() => {
                        executeAction('Deleting Record', async () => {
                          await base44.entities.PaymentRequest.delete(selectedPayment.id);
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
                          setReviewDialog(false);
                          setSelectedPayment(null);
                        }, {
                          successTitle: 'Deleted Successfully',
                          successSubtitle: 'Payment record has been removed'
                        });
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      Delete Record
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}