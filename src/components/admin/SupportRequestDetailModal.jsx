import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from "date-fns";
import { useAction } from "../feedback/useAction";
import { 
  Clock, User, Mail, MessageSquare, Paperclip, Users, Send, Upload, ExternalLink, ChevronLeft
} from "lucide-react";

const statusColors = {
  submitted: "bg-blue-600 text-white",
  acknowledged: "bg-cyan-600 text-white",
  under_review: "bg-yellow-600 text-white",
  approved: "bg-green-600 text-white",
  in_progress: "bg-orange-600 text-white",
  testing: "bg-purple-600 text-white",
  ready_for_release: "bg-indigo-600 text-white",
  live: "bg-emerald-600 text-white",
  closed: "bg-zinc-600 text-white",
  rejected: "bg-red-600 text-white",
  on_hold: "bg-amber-600 text-white",
  reopened: "bg-pink-600 text-white"
};

const severityMap = {
  low: "C - Minimal",
  medium: "B - Moderate",
  high: "A - Critical",
  critical: "A - Critical"
};

export default function SupportRequestDetailModal({ open, onClose, request }) {
  const [activeTab, setActiveTab] = useState('details');
  const [newMessage, setNewMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState(request?.admin_notes || '');
  const [newStatus, setNewStatus] = useState(request?.status || 'new');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const queryClient = useQueryClient();
  const { executeAction } = useAction();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
    }
  });

  const handleAddMessage = async () => {
    if (!newMessage.trim()) return;

    await executeAction('Sending Message', async () => {
      const currentUser = await base44.auth.me();
      const communications = request.communications || [];
      communications.push({
        from: currentUser.email,
        from_name: currentUser.full_name || 'Admin',
        message: newMessage,
        timestamp: new Date().toISOString(),
        type: 'admin_reply'
      });

      await updateMutation.mutateAsync({
        id: request.id,
        data: { communications }
      });
      setNewMessage('');
    }, {
      successTitle: 'Message Sent',
      successSubtitle: 'User will receive an email notification'
    });
  };

  const handleStatusUpdate = async () => {
    if (!request) return;
    
    await executeAction('Updating Status', async () => {
      const currentUser = await base44.auth.me();
      const statusHistory = [...(request.status_history || [])];
      
      if (newStatus !== request.status) {
        statusHistory.push({
          status: newStatus,
          changed_at: new Date().toISOString(),
          changed_by: currentUser.email,
          note: adminNotes || `Status changed to ${newStatus}`
        });
      }

      await updateMutation.mutateAsync({
        id: request.id,
        data: {
          status: newStatus,
          admin_notes: adminNotes,
          status_history: statusHistory,
          resolved_at: (newStatus === 'live' || newStatus === 'closed' || newStatus === 'not_required') 
            ? new Date().toISOString() 
            : request.resolved_at
        }
      });
    }, {
      successTitle: 'Request Updated',
      successSubtitle: 'Changes have been saved'
    });
  };

  const handleAddAttachment = async () => {
    if (!attachmentUrl.trim()) return;

    await executeAction('Adding Attachment', async () => {
      const attachments = request.attached_asset_urls || [];
      attachments.push(attachmentUrl);
      await updateMutation.mutateAsync({
        id: request.id,
        data: { attached_asset_urls: attachments }
      });
      setAttachmentUrl('');
    }, {
      successTitle: 'Attachment Added',
      successSubtitle: 'Link has been attached to request'
    });
  };

  if (!request) return null;

  const communications = request.communications || [];
  const attachments = request.attached_asset_urls || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-zinc-900 text-white overflow-hidden">
        {/* Header - CineTracker Style */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-purple-400 hover:bg-zinc-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693d661aca82e178be7bb96f/ab2cb46cf_IMG_0700.png"
                alt="CineTracker"
                className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500/50"
              />
              <span className="text-lg font-bold bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
                CineTracker
              </span>
              <span className="text-zinc-500 text-sm">Support Center</span>
            </div>
          </div>

          {/* Title and Status */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-white mb-2">
              {request.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Request ID:</span>
                <span className="font-mono text-white">{request.id?.substring(0, 12)?.toUpperCase()}</span>
              </div>
              <Badge className={statusColors[request.status]}>
                {request.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Severity:</span>
                <span className="font-semibold text-white">{severityMap[request.priority]}</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <span>Updated:</span>
              <span>{format(new Date(request.updated_date), 'MMM d, yyyy, h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Created:</span>
              <span>{format(new Date(request.created_date), 'MMM d, yyyy, h:mm a')}</span>
            </div>
          </div>

          {/* Timezone Notice */}
          <div className="mt-3 text-xs text-amber-400 font-medium">
            All times represented on this page are adjusted to show in the current user's time zone.
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-zinc-800 bg-zinc-900 px-4">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger 
                value="details" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 py-3 text-zinc-400 data-[state=active]:text-purple-400 font-medium"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="communications" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 py-3 text-zinc-400 data-[state=active]:text-purple-400 font-medium"
              >
                Communications
              </TabsTrigger>
              <TabsTrigger 
                value="attachments" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 py-3 text-zinc-400 data-[state=active]:text-purple-400 font-medium"
              >
                Attachments
              </TabsTrigger>
              <TabsTrigger 
                value="sharing" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 py-3 text-zinc-400 data-[state=active]:text-purple-400 font-medium"
              >
                Sharing
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto bg-zinc-950">
            <div className="p-6">
              {/* Details Tab */}
              <TabsContent value="details" className="mt-0 space-y-6">
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Support request details</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-zinc-400 mb-1">Country/region:</p>
                      <p className="text-sm text-white font-medium">India</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 mb-1">Product:</p>
                      <p className="text-sm text-purple-400 font-medium">CineTracker</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 mb-1">Time zone:</p>
                      <p className="text-sm text-white font-medium">India Standard Time</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 mb-1">Category:</p>
                      <p className="text-sm text-white font-medium capitalize">{request.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 mb-1">Support request owner:</p>
                      <p className="text-sm text-white font-medium">{request.user_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 mb-1">Issue:</p>
                      <p className="text-sm text-white font-medium capitalize">{request.request_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 mb-1">Preferred contact method:</p>
                      <p className="text-sm text-white font-medium">Email</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-zinc-400 mb-2">Description:</p>
                      <p className="text-sm text-white leading-relaxed">{request.description}</p>
                    </div>
                    {request.target_entity && (
                      <div className="col-span-2">
                        <p className="text-sm text-zinc-400 mb-1">Target Entity:</p>
                        <p className="text-sm text-white font-medium">{request.target_entity}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-zinc-300 mb-2 block font-medium">Title</label>
                        <Input
                          value={request.title}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300 mb-2 block font-medium">Status</label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                            <SelectItem value="submitted" className="text-blue-400">📥 Submitted</SelectItem>
                            <SelectItem value="acknowledged" className="text-cyan-400">👁️ Acknowledged</SelectItem>
                            <SelectItem value="under_review" className="text-yellow-400">🔍 Under Review</SelectItem>
                            <SelectItem value="approved" className="text-green-400">✅ Approved</SelectItem>
                            <SelectItem value="in_progress" className="text-orange-400">🚧 In Progress</SelectItem>
                            <SelectItem value="testing" className="text-purple-400">🧪 Testing</SelectItem>
                            <SelectItem value="ready_for_release" className="text-indigo-400">🎯 Ready for Release</SelectItem>
                            <SelectItem value="live" className="text-emerald-400">🚀 Live</SelectItem>
                            <SelectItem value="closed" className="text-zinc-400">🔒 Closed</SelectItem>
                            <SelectItem value="rejected" className="text-red-400">❌ Rejected</SelectItem>
                            <SelectItem value="on_hold" className="text-amber-400">⏸️ On Hold</SelectItem>
                            <SelectItem value="reopened" className="text-pink-400">🔁 Reopened</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300 mb-2 block font-medium">Category</label>
                        <Input
                          value={request.category}
                          className="bg-zinc-800 border-zinc-700 text-white capitalize"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300 mb-2 block font-medium">Priority</label>
                        <Input
                          value={severityMap[request.priority]}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300 mb-2 block font-medium">Request Type</label>
                        <Input
                          value={request.request_type}
                          className="bg-zinc-800 border-zinc-700 text-white capitalize"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-300 mb-2 block font-medium">User Email</label>
                        <Input
                          value={request.user_email}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-zinc-300 mb-2 block font-medium">Description</label>
                      <Textarea
                        value={request.description}
                        className="bg-zinc-800 border-zinc-700 text-white min-h-24"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-300 mb-2 block font-medium">Admin Notes</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes..."
                        className="bg-zinc-800 border-zinc-700 text-white min-h-24"
                      />
                    </div>

                    <Button
                      onClick={handleStatusUpdate}
                      className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white w-full"
                    >
                      Update Request
                    </Button>
                  </div>
                </div>

                {/* Status History */}
                {request.status_history && request.status_history.length > 0 && (
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Status History</h3>
                    <div className="space-y-3">
                      {request.status_history.map((history, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={statusColors[history.status]}>
                                {history.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-sm text-zinc-400">
                                by {history.changed_by}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500">{format(new Date(history.changed_at), 'PPpp')}</p>
                            {history.note && (
                              <p className="text-sm text-zinc-300 mt-1">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Communications Tab */}
              <TabsContent value="communications" className="mt-0 space-y-4">
                <div className="bg-purple-950/30 rounded-lg border border-purple-800/50 p-4 flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-purple-300 mb-1">Communication Center</h4>
                    <p className="text-sm text-purple-200/80">
                      Use this section to communicate updates and responses to the user.
                    </p>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                  {communications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No communications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {communications.map((comm, idx) => (
                        <div key={idx} className="p-4 hover:bg-zinc-800/50">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-white">
                                  {comm.type === 'user_message' ? 'User' : 'Internal User'}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {comm.from_name || comm.from}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 mb-2">
                                Internal note | {format(new Date(comm.timestamp), 'MMM d, yyyy, h:mm a')}
                              </p>
                              <p className="text-sm text-zinc-300 leading-relaxed">{comm.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* New Message */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white mb-4">
                    <Send className="w-4 h-4 mr-2" />
                    New message
                  </Button>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message to the user..."
                    className="bg-zinc-800 border-zinc-700 text-white min-h-24 mb-3"
                  />
                  <Button 
                    onClick={handleAddMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white"
                  >
                    Send Message
                  </Button>
                </div>
              </TabsContent>

              {/* Attachments Tab */}
              <TabsContent value="attachments" className="mt-0">
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">
                      Attachments ({attachments.length})
                    </h3>
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>

                  {attachments.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No attachments have been uploaded for this support request yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800 rounded border border-zinc-700 hover:bg-zinc-700">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                            <span className="text-sm text-white truncate">{url}</span>
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Attachment Form */}
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <label className="text-sm text-zinc-300 mb-2 block font-medium">Add Attachment URL</label>
                    <div className="flex gap-2">
                      <Input
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        placeholder="https://example.com/file.png"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      <Button 
                        onClick={handleAddAttachment}
                        disabled={!attachmentUrl.trim()}
                        className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Sharing Tab */}
              <TabsContent value="sharing" className="mt-0">
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">Shared with (1)</h3>
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white">
                      <Users className="w-4 h-4 mr-2" />
                      Add contact
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Request Owner */}
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded border border-zinc-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 text-white flex items-center justify-center font-semibold text-sm">
                          {request.user_email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white flex items-center gap-2">
                            {request.user_email}
                            <span className="text-amber-400">★</span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                            <Mail className="w-3 h-3" />
                            <span>{request.user_email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 mt-4">
                      ★ indicates the primary contact for this support request
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>

        {/* Sync Indicator (top right) */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(), 'M/d/yyyy h:mm:ss a')}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}