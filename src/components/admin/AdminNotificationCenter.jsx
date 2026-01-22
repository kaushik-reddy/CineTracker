import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, DollarSign, Users, XCircle, Mail, Calendar, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminNotificationCenter() {
  const queryClient = useQueryClient();

  // Fetch persistent admin notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => base44.entities.AdminNotification.filter({ is_dismissed: false }, '-created_date'),
    refetchInterval: 15000 // Poll every 15 seconds
  });

  // Fetch subscriptions for expiry checks
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-subscriptions-check'],
    queryFn: () => base44.entities.Subscription.list(),
    refetchInterval: 60000
  });

  // Fetch payment requests
  const { data: paymentRequests = [] } = useQuery({
    queryKey: ['admin-payment-requests-check'],
    queryFn: () => base44.entities.PaymentRequest.list('-created_date'),
    refetchInterval: 30000
  });

  // Fetch scheduled notifications
  const { data: scheduledNotifs = [] } = useQuery({
    queryKey: ['admin-scheduled-notifications-check'],
    queryFn: () => base44.entities.ScheduledNotification.filter({ status: 'pending' }),
    refetchInterval: 60000
  });

  // Auto-create notifications for new events
  useEffect(() => {
    const createNotifications = async () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Check expiring subscriptions
      for (const sub of subscriptions) {
        if (sub.status === 'active' && sub.end_date) {
          const endDate = new Date(sub.end_date);
          const daysUntilExpiry = (endDate - now) / (1000 * 60 * 60 * 24);
          
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            const exists = notifications.some(n => n.reference_id === sub.id && n.type === 'subscription_expiring');
            if (!exists) {
              await base44.entities.AdminNotification.create({
                type: 'subscription_expiring',
                title: 'Subscription Expiring Soon',
                message: `${sub.user_email} - expires in ${Math.ceil(daysUntilExpiry)} days`,
                user_email: sub.user_email,
                reference_id: sub.id,
                priority: 'medium'
              });
              queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            }
          }
        }
      }
      
      // Check for new payment requests
      const pendingPayments = paymentRequests.filter(p => p.status === 'processing');
      for (const payment of pendingPayments) {
        const exists = notifications.some(n => n.reference_id === payment.id && n.type === 'payment_request');
        if (!exists) {
          await base44.entities.AdminNotification.create({
            type: 'payment_request',
            title: 'New Payment Verification',
            message: `${payment.user_email} - ₹${payment.amount / 100}`,
            user_email: payment.user_email,
            reference_id: payment.id,
            priority: 'high'
          });
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
      }
    };
    
    if (subscriptions.length > 0 || paymentRequests.length > 0) {
      createNotifications();
    }
  }, [subscriptions, paymentRequests]);

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminNotification.update(id, {
      is_dismissed: true,
      dismissed_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch(type) {
      case 'payment_request':
      case 'payment_approved':
      case 'payment_rejected':
        return DollarSign;
      case 'subscription_expiring':
      case 'subscription_expired':
      case 'subscription_cancelled':
        return Calendar;
      case 'user_request':
        return Users;
      case 'scheduled_notification_sent':
      case 'scheduled_notification_upcoming':
        return Mail;
      default:
        return Bell;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'from-red-500 to-orange-500';
      case 'high': return 'from-amber-500 to-yellow-500';
      case 'medium': return 'from-purple-500 to-emerald-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-white transition-all"
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold animate-pulse">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-zinc-900 border-zinc-800 text-white p-0" align="end">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Admin Notifications
          </h3>
          {notifications.length > 0 && (
            <span className="text-xs text-zinc-400">{notifications.length} active</span>
          )}
        </div>
        <ScrollArea className="max-h-[500px]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Bell className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active notifications</p>
              <p className="text-xs mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notif) => {
                const NotifIcon = getIcon(notif.type);
                const priorityGradient = getPriorityColor(notif.priority);
                return (
                  <div key={notif.id} className="p-3 hover:bg-zinc-800/30 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${priorityGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <NotifIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white mb-1">{notif.title}</p>
                            <p className="text-xs text-zinc-400 break-words">{notif.message}</p>
                            <p className="text-xs text-zinc-600 mt-1.5">
                              {new Date(notif.created_date).toLocaleString('en-US', { 
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissMutation.mutate(notif.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-950">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs text-zinc-400 hover:text-white"
              onClick={async () => {
                for (const notif of notifications) {
                  await dismissMutation.mutateAsync(notif.id);
                }
              }}
            >
              Dismiss All
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}