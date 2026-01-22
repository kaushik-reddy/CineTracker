import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Send, Calendar as CalendarIcon, Loader2, Clock, CheckCircle2, XCircle, AlertCircle, History, Users, Code } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatIST } from '../utils/timezone';
import { useAction } from '../feedback/useAction';

export default function NotificationManager() {
  const queryClient = useQueryClient();
  const { executeAction } = useAction();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    template_id: '',
    recipient_type: 'all_users',
    recipient_emails: '',
    recipient_role: '',
    recipient_plan: '',
    variable_values: {}
  });
  const [scheduleData, setScheduleData] = useState({
    template_id: '',
    recipient_type: 'all_users',
    recipient_emails: '',
    recipient_role: '',
    recipient_plan: '',
    scheduled_for: '',
    variable_values: {}
  });

  // Fetch data
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date')
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['scheduled-notifications'],
    queryFn: () => base44.entities.ScheduledNotification.list('-created_date')
  });

  const { data: history = [] } = useQuery({
    queryKey: ['notification-history'],
    queryFn: () => base44.entities.NotificationHistory.list('-sent_at', 100)
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['all-plans'],
    queryFn: () => base44.entities.Plan.list()
  });

  // Send broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data) => {
      const template = templates.find(t => t.id === data.template_id);
      if (!template) throw new Error('Template not found');

      // Get recipients
      let recipients = [];
      if (data.recipient_type === 'all_users') {
        recipients = allUsers.map(u => u.email);
      } else if (data.recipient_type === 'specific_users') {
        recipients = data.recipient_emails.split(',').map(e => e.trim()).filter(e => e);
      } else if (data.recipient_type === 'role') {
        recipients = allUsers.filter(u => u.role === data.recipient_role).map(u => u.email);
      } else if (data.recipient_type === 'plan') {
        const subscriptions = await base44.entities.Subscription.filter({ plan_id: data.recipient_plan, status: 'active' });
        recipients = subscriptions.map(s => s.user_email);
      }

      // Create scheduled notification for immediate send
      const notification = await base44.entities.ScheduledNotification.create({
        template_id: data.template_id,
        recipient_type: data.recipient_type,
        recipient_emails: recipients,
        recipient_role: data.recipient_role,
        recipient_plan: data.recipient_plan,
        scheduled_for: new Date().toISOString(),
        status: 'sending'
      });

      // Send emails
      let sent = 0;
      let failed = 0;
      for (const email of recipients) {
        try {
          // Replace variables in template
          let htmlBody = template.html_body || '';
          let subject = template.subject || '';
          
          // Replace all variables with provided values
          const user = allUsers.find(u => u.email === email);
          
          // Replace each variable defined in template
          (template.variables || []).forEach(variable => {
            let value = data.variable_values?.[variable] || '';
            
            // Special handling for user_name - auto-fill from user data if not provided
            if (variable === 'user_name' && !value && user?.full_name) {
              value = user.full_name;
            }
            
            // Replace variable in both subject and body
            const regex = new RegExp(`{{${variable}}}`, 'g');
            htmlBody = htmlBody.replace(regex, value);
            subject = subject.replace(regex, value);
          });

          await base44.integrations.Core.SendEmail({
            to: email,
            subject: subject,
            body: htmlBody
          });

          // Log to history
          await base44.entities.NotificationHistory.create({
            notification_id: notification.id,
            template_id: template.id,
            recipient_email: email,
            subject: subject,
            status: 'sent',
            sent_at: new Date().toISOString()
          });
          sent++;
        } catch (error) {
          await base44.entities.NotificationHistory.create({
            notification_id: notification.id,
            template_id: template.id,
            recipient_email: email,
            subject: template.subject || 'No subject',
            status: 'failed',
            sent_at: new Date().toISOString(),
            error_message: error.message || 'Unknown error'
          });
          failed++;
        }
      }

      // Update notification status
      await base44.entities.ScheduledNotification.update(notification.id, {
        status: 'sent',
        sent_count: sent,
        failed_count: failed,
        sent_at: new Date().toISOString()
      });

      return { sent, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      toast.success(`Broadcast sent! ${result.sent} sent, ${result.failed} failed`);
      setShowBroadcast(false);
      setBroadcastData({
        template_id: '',
        recipient_type: 'all_users',
        recipient_emails: '',
        recipient_role: '',
        recipient_plan: '',
        variable_values: {}
      });
    },
    onError: (error) => {
      toast.error('Broadcast failed: ' + error.message);
    }
  });

  // Schedule notification mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      const recipients = data.recipient_type === 'specific_users' && data.recipient_emails
        ? data.recipient_emails.split(',').map(e => e.trim()).filter(e => e)
        : [];

      return await base44.entities.ScheduledNotification.create({
        ...data,
        recipient_emails: recipients.length > 0 ? recipients : undefined,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      toast.success('Notification scheduled!');
      setShowSchedule(false);
      setScheduleData({
        template_id: '',
        recipient_type: 'all_users',
        recipient_emails: '',
        recipient_role: '',
        recipient_plan: '',
        scheduled_for: '',
        variable_values: {}
      });
    }
  });

  // Cancel notification mutation
  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledNotification.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      toast.success('Notification cancelled');
    }
  });

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastData.template_id) {
      toast.error('Please select a template');
      return;
    }
    executeAction('Sending Broadcast', async () => {
      const result = await broadcastMutation.mutateAsync(broadcastData);
      setShowBroadcast(false);
      setBroadcastData({
        template_id: '',
        recipient_type: 'all_users',
        recipient_emails: '',
        recipient_role: '',
        recipient_plan: '',
        variable_values: {}
      });
      return result;
    }, {
      successTitle: 'Broadcast Sent',
      successSubtitle: 'Emails have been sent to recipients'
    });
  };

  const handleSchedule = (e) => {
    e.preventDefault();
    if (!scheduleData.template_id || !scheduleData.scheduled_for) {
      toast.error('Please fill all required fields');
      return;
    }
    executeAction('Scheduling Notification', async () => {
      await scheduleMutation.mutateAsync(scheduleData);
      setShowSchedule(false);
      setScheduleData({
        template_id: '',
        recipient_type: 'all_users',
        recipient_emails: '',
        recipient_role: '',
        recipient_plan: '',
        scheduled_for: '',
        variable_values: {}
      });
    }, {
      successTitle: 'Notification Scheduled',
      successSubtitle: 'Email will be sent at the scheduled time'
    });
  };

  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  const sentNotifications = notifications.filter(n => n.status === 'sent');

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Notification Manager
          </CardTitle>
          <p className="text-xs text-zinc-400 mt-2">
            Send broadcast emails, schedule notifications, and view history
          </p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="broadcast" className="w-full">
            <TabsList className="bg-zinc-950 border border-zinc-800 grid grid-cols-3">
              <TabsTrigger value="broadcast" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <Send className="w-4 h-4 mr-2" />
                Broadcast
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <Clock className="w-4 h-4 mr-2" />
                Scheduled ({pendingNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Broadcast Tab */}
            <TabsContent value="broadcast" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-400">Send immediate email notifications to users</p>
                <Button onClick={() => setShowBroadcast(true)} className="bg-gradient-to-r from-purple-500 to-indigo-500">
                  <Send className="w-4 h-4 mr-2" />
                  New Broadcast
                </Button>
              </div>

              <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Users className="w-8 h-8" />
                    <div>
                      <p className="text-white font-medium">Ready to send</p>
                      <p className="text-sm">Select a template and audience to broadcast instantly</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scheduled Tab */}
            <TabsContent value="scheduled" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-400">Manage scheduled notifications</p>
                <Button onClick={() => setShowSchedule(true)} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule New
                </Button>
              </div>

              {pendingNotifications.length === 0 ? (
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-8 text-center text-zinc-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No scheduled notifications</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingNotifications.map(notification => {
                    const template = templates.find(t => t.id === notification.template_id);
                    return (
                      <Card key={notification.id} className="bg-zinc-950 border-zinc-800">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-white font-medium mb-1">{template?.name || 'Unknown'}</h3>
                              <p className="text-sm text-zinc-400 mb-2">
                                To: {notification.recipient_type} {notification.recipient_type === 'role' && `(${notification.recipient_role})`}
                              </p>
                              <p className="text-xs text-zinc-500">
                                Scheduled: {formatIST(notification.scheduled_for, 'PPp')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                executeAction('Cancelling Notification', async () => {
                                  await cancelMutation.mutateAsync(notification.id);
                                }, {
                                  successTitle: 'Notification Cancelled',
                                  successSubtitle: 'Scheduled notification has been cancelled'
                                });
                              }}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <p className="text-sm text-zinc-400">View sent notification history</p>

              {history.length === 0 ? (
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-8 text-center text-zinc-500">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notification history</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {history.map(record => {
                    const template = templates.find(t => t.id === record.template_id);
                    return (
                      <Card key={record.id} className="bg-zinc-950 border-zinc-800">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {record.status === 'sent' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <div>
                                <p className="text-white text-sm">{record.recipient_email}</p>
                                <p className="text-xs text-zinc-500">{template?.name || 'Unknown'} - {record.subject}</p>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-500">{formatIST(record.sent_at, 'PPp')}</p>
                          </div>
                          {record.error_message && (
                            <p className="text-xs text-red-400 mt-2">{record.error_message}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* How to Use Guide */}
          <Card className="bg-emerald-500/10 border-emerald-500/30 mt-6">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                📨 How to Send Notifications
              </h3>
              <div className="space-y-3 text-sm text-zinc-300">
                <div>
                  <p className="font-semibold text-white mb-1">🚀 Broadcast (Immediate Send)</p>
                  <p className="mb-1">Use when you want to send emails RIGHT NOW:</p>
                  <p>1. Click "New Broadcast" in Broadcast tab</p>
                  <p>2. Select an email template from dropdown</p>
                  <p>3. Choose recipients:</p>
                  <p className="ml-4">• <strong>All Users</strong>: Send to everyone registered</p>
                  <p className="ml-4">• <strong>Specific Emails</strong>: Enter comma-separated emails (e.g., user1@email.com, user2@email.com)</p>
                  <p className="ml-4">• <strong>By Role</strong>: Send to all users or admins only</p>
                  <p className="ml-4">• <strong>By Plan</strong>: Send to users with specific subscription plan</p>
                  <p>4. Click "Send Now" - emails will be sent immediately!</p>
                </div>

                <div>
                  <p className="font-semibold text-white mb-1">⏰ Schedule (Future Send)</p>
                  <p className="mb-1">Use when you want to send emails LATER:</p>
                  <p>1. Click "Schedule New" in Scheduled tab</p>
                  <p>2. Select an email template</p>
                  <p>3. Pick date and time when to send</p>
                  <p>4. Choose recipients (same options as broadcast)</p>
                  <p>5. Click "Schedule" - emails will be sent automatically at scheduled time</p>
                  <p className="mt-1">• View pending notifications in Scheduled tab</p>
                  <p>• Cancel scheduled notifications anytime before send time</p>
                </div>

                <div>
                  <p className="font-semibold text-white mb-1">📊 History Tab</p>
                  <p>• View all sent notifications with status (Sent/Failed)</p>
                  <p>• See which users received emails and when</p>
                  <p>• Check error messages for failed deliveries</p>
                </div>

                <div className="pt-2 border-t border-emerald-500/20">
                  <p className="font-semibold text-white mb-1">⚠️ Important:</p>
                  <p>• Templates must be created first (go to Templates section)</p>
                  <p>• Variables like {'{{user_name}}'} are auto-replaced with real user data</p>
                  <p>• Test with "Specific Emails" to your own email first!</p>
                  <p>• Broadcast sends immediately - double check before clicking Send!</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </CardContent>
          </Card>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Broadcast</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <Label className="text-white">Email Template</Label>
              <Select value={broadcastData.template_id} onValueChange={(value) => setBroadcastData({ ...broadcastData, template_id: value, variable_values: {} })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select template" className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {templates.filter(t => t.is_active).map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variable Inputs */}
            {broadcastData.template_id && (() => {
              const selectedTemplate = templates.find(t => t.id === broadcastData.template_id);
              const variables = selectedTemplate?.variables || [];
              
              if (variables.length === 0) return null;
              
              return (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-purple-400" />
                    <Label className="text-white font-semibold">Template Variables</Label>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">Fill in the values for these variables. They will replace the {'{{variable}}'} tags in your email.</p>
                  
                  {variables.map(variable => (
                    <div key={variable}>
                      <Label className="text-zinc-300 text-sm">
                        {variable === 'user_name' ? (
                          <>
                            {variable} <span className="text-xs text-zinc-500">(auto-filled from user data if empty)</span>
                          </>
                        ) : (
                          variable
                        )}
                      </Label>
                      <Input
                        value={broadcastData.variable_values[variable] || ''}
                        onChange={(e) => setBroadcastData({
                          ...broadcastData,
                          variable_values: {
                            ...broadcastData.variable_values,
                            [variable]: e.target.value
                          }
                        })}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        placeholder={`Enter ${variable} value...`}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}

            <div>
              <Label className="text-white">Recipients</Label>
              <Select value={broadcastData.recipient_type} onValueChange={(value) => setBroadcastData({ ...broadcastData, recipient_type: value })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all_users" className="text-white">All Users ({allUsers.length})</SelectItem>
                  <SelectItem value="specific_users" className="text-white">Specific Emails</SelectItem>
                  <SelectItem value="role" className="text-white">By Role</SelectItem>
                  <SelectItem value="plan" className="text-white">By Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {broadcastData.recipient_type === 'specific_users' && (
              <div>
                <Label className="text-white">Email Addresses (comma-separated)</Label>
                <Textarea
                  value={broadcastData.recipient_emails}
                  onChange={(e) => setBroadcastData({ ...broadcastData, recipient_emails: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="user1@example.com, user2@example.com"
                />
              </div>
            )}

            {broadcastData.recipient_type === 'role' && (
              <div>
                <Label className="text-white">User Role</Label>
                <Select value={broadcastData.recipient_role} onValueChange={(value) => setBroadcastData({ ...broadcastData, recipient_role: value })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="user" className="text-white">Regular Users</SelectItem>
                    <SelectItem value="admin" className="text-white">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {broadcastData.recipient_type === 'plan' && (
              <div>
                <Label className="text-white">Plan</Label>
                <Select value={broadcastData.recipient_plan} onValueChange={(value) => setBroadcastData({ ...broadcastData, recipient_plan: value })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  This will send emails immediately. Make sure you've selected the correct template and recipients.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={() => setShowBroadcast(false)} variant="outline" className="flex-1 border-zinc-700">
                Cancel
              </Button>
              <Button type="submit" disabled={broadcastMutation.isPending} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
                {broadcastMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Notification</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <Label className="text-white">Email Template</Label>
              <Select value={scheduleData.template_id} onValueChange={(value) => setScheduleData({ ...scheduleData, template_id: value, variable_values: {} })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select template" className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {templates.filter(t => t.is_active).map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variable Inputs */}
            {scheduleData.template_id && (() => {
              const selectedTemplate = templates.find(t => t.id === scheduleData.template_id);
              const variables = selectedTemplate?.variables || [];
              
              if (variables.length === 0) return null;
              
              return (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-purple-400" />
                    <Label className="text-white font-semibold">Template Variables</Label>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">Fill in the values for these variables. They will replace the {'{{variable}}'} tags in your email.</p>
                  
                  {variables.map(variable => (
                    <div key={variable}>
                      <Label className="text-zinc-300 text-sm">
                        {variable === 'user_name' ? (
                          <>
                            {variable} <span className="text-xs text-zinc-500">(auto-filled from user data if empty)</span>
                          </>
                        ) : (
                          variable
                        )}
                      </Label>
                      <Input
                        value={scheduleData.variable_values[variable] || ''}
                        onChange={(e) => setScheduleData({
                          ...scheduleData,
                          variable_values: {
                            ...scheduleData.variable_values,
                            [variable]: e.target.value
                          }
                        })}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        placeholder={`Enter ${variable} value...`}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}

            <div>
              <Label className="text-white">Send Date & Time</Label>
              <Input
                type="datetime-local"
                value={scheduleData.scheduled_for}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduled_for: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white">Recipients</Label>
              <Select value={scheduleData.recipient_type} onValueChange={(value) => setScheduleData({ ...scheduleData, recipient_type: value })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all_users" className="text-white">All Users</SelectItem>
                  <SelectItem value="specific_users" className="text-white">Specific Emails</SelectItem>
                  <SelectItem value="role" className="text-white">By Role</SelectItem>
                  <SelectItem value="plan" className="text-white">By Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleData.recipient_type === 'specific_users' && (
              <div>
                <Label className="text-white">Email Addresses (comma-separated)</Label>
                <Textarea
                  value={scheduleData.recipient_emails}
                  onChange={(e) => setScheduleData({ ...scheduleData, recipient_emails: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="user1@example.com, user2@example.com"
                />
              </div>
            )}

            {scheduleData.recipient_type === 'role' && (
              <div>
                <Label className="text-white">User Role</Label>
                <Select value={scheduleData.recipient_role} onValueChange={(value) => setScheduleData({ ...scheduleData, recipient_role: value })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="user" className="text-white">Regular Users</SelectItem>
                    <SelectItem value="admin" className="text-white">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {scheduleData.recipient_type === 'plan' && (
              <div>
                <Label className="text-white">Plan</Label>
                <Select value={scheduleData.recipient_plan} onValueChange={(value) => setScheduleData({ ...scheduleData, recipient_plan: value })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={() => setShowSchedule(false)} variant="outline" className="flex-1 border-zinc-700">
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleMutation.isPending} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500">
                {scheduleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}