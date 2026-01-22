import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Clock, CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  new: "bg-blue-500",
  working: "bg-yellow-500",
  implemented: "bg-purple-500",
  tested: "bg-indigo-500",
  production: "bg-orange-500",
  live: "bg-green-500",
  closed: "bg-gray-500",
  not_required: "bg-red-500"
};

const statusIcons = {
  new: Clock,
  working: Loader2,
  implemented: CheckCircle2,
  tested: CheckCircle2,
  production: CheckCircle2,
  live: CheckCircle2,
  closed: XCircle,
  not_required: AlertCircle
};

export default function SupportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    request_type: 'logo',
    category: 'platform',
    target_entity: '',
    title: '',
    description: '',
    reference_links: ''
  });

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.UserRequest.filter({ user_email: user.email }, '-created_date');
      } catch (error) {
        console.error('Failed to load requests:', error);
        return [];
      }
    },
    enabled: !!user?.email
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.UserRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      setDialogOpen(false);
      setFormData({
        request_type: 'logo',
        category: 'platform',
        target_entity: '',
        title: '',
        description: '',
        reference_links: ''
      });
      toast.success('Request submitted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to submit request');
      console.error(error);
    }
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const requestData = {
      user_email: user.email,
      request_type: formData.request_type,
      category: formData.category,
      target_entity: formData.target_entity || null,
      title: formData.title,
      description: formData.description,
      reference_links: formData.reference_links ? formData.reference_links.split('\n').filter(l => l.trim()) : [],
      status: 'new',
      priority: 'medium',
      status_history: [{
        status: 'new',
        changed_at: new Date().toISOString(),
        changed_by: user.email,
        note: 'Request created'
      }]
    };

    createRequestMutation.mutate(requestData);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="ghost"
            className="text-zinc-400 hover:text-white mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Live Support</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Submit New Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Request Type *</label>
                      <Select value={formData.request_type} onValueChange={(value) => setFormData({ ...formData, request_type: value })}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="logo" className="text-white">Logo</SelectItem>
                          <SelectItem value="language" className="text-white">Language</SelectItem>
                          <SelectItem value="genre" className="text-white">Genre</SelectItem>
                          <SelectItem value="platform" className="text-white">Platform</SelectItem>
                          <SelectItem value="device" className="text-white">Device</SelectItem>
                          <SelectItem value="age_rating" className="text-white">Age Rating</SelectItem>
                          <SelectItem value="audio_format" className="text-white">Audio Format</SelectItem>
                          <SelectItem value="video_format" className="text-white">Video Format</SelectItem>
                          <SelectItem value="franchise" className="text-white">Franchise</SelectItem>
                          <SelectItem value="universe" className="text-white">Universe</SelectItem>
                          <SelectItem value="relationship" className="text-white">Relationship</SelectItem>
                          <SelectItem value="other" className="text-white">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Category *</label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="platform" className="text-white">Platform</SelectItem>
                          <SelectItem value="studio" className="text-white">Studio</SelectItem>
                          <SelectItem value="device" className="text-white">Device</SelectItem>
                          <SelectItem value="format" className="text-white">Format</SelectItem>
                          <SelectItem value="universe" className="text-white">Universe</SelectItem>
                          <SelectItem value="franchise" className="text-white">Franchise</SelectItem>
                          <SelectItem value="metadata" className="text-white">Metadata</SelectItem>
                          <SelectItem value="other" className="text-white">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Target Entity (optional)</label>
                    <Input
                      value={formData.target_entity}
                      onChange={(e) => setFormData({ ...formData, target_entity: e.target.value })}
                      placeholder="e.g., Netflix, Marvel Universe, etc."
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief title of your request"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of your request..."
                      className="bg-zinc-800 border-zinc-700 text-white min-h-32"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Reference Links (optional, one per line)</label>
                    <Textarea
                      value={formData.reference_links}
                      onChange={(e) => setFormData({ ...formData, reference_links: e.target.value })}
                      placeholder="https://example.com/reference1&#10;https://example.com/reference2"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={createRequestMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {createRequestMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm sm:text-base text-zinc-400">Submit requests for logos, metadata, universes, and more</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">My Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No requests yet</p>
                  <p className="text-sm mt-1">Click "New Request" to submit your first request</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((request) => {
                    const StatusIcon = statusIcons[request.status] || AlertCircle;
                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold">{request.title}</h3>
                              <Badge className={`${statusColors[request.status]} text-white`}>
                                <StatusIcon className={`w-3 h-3 mr-1 ${request.status === 'working' ? 'animate-spin' : ''}`} />
                                {request.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                              <span className="capitalize">{request.request_type}</span>
                              <span>•</span>
                              <span className="capitalize">{request.category}</span>
                              {request.target_entity && (
                                <>
                                  <span>•</span>
                                  <span>{request.target_entity}</span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-zinc-300 mb-2">{request.description}</p>
                            {request.reference_links && request.reference_links.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {request.reference_links.map((link, idx) => (
                                  <a
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Link {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                            {request.admin_notes && (
                              <div className="bg-zinc-900 p-2 rounded mt-2">
                                <p className="text-xs text-zinc-400 mb-1">Admin Notes:</p>
                                <p className="text-sm text-zinc-300">{request.admin_notes}</p>
                              </div>
                            )}
                            {request.status_history && request.status_history.length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-300">
                                  View Status History ({request.status_history.length})
                                </summary>
                                <div className="mt-2 space-y-1 pl-4 border-l-2 border-zinc-700">
                                  {request.status_history.map((history, idx) => (
                                    <div key={idx} className="text-xs">
                                      <span className={`${statusColors[history.status]} text-white px-2 py-0.5 rounded text-[10px]`}>
                                        {history.status}
                                      </span>
                                      <span className="text-zinc-400 ml-2">
                                        {new Date(history.changed_at).toLocaleString()}
                                      </span>
                                      {history.note && (
                                        <p className="text-zinc-400 mt-0.5">{history.note}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {new Date(request.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}