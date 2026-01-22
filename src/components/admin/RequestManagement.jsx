import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Filter, Clock, CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import SupportRequestDetailModal from './SupportRequestDetailModal';

const statusColors = {
  submitted: "bg-blue-500",
  acknowledged: "bg-cyan-500",
  under_review: "bg-yellow-500",
  approved: "bg-green-500",
  in_progress: "bg-orange-500",
  testing: "bg-purple-500",
  ready_for_release: "bg-indigo-500",
  live: "bg-emerald-500",
  closed: "bg-zinc-500",
  rejected: "bg-red-500",
  on_hold: "bg-amber-500",
  reopened: "bg-pink-500"
};

const statusIcons = {
  submitted: Clock,
  acknowledged: CheckCircle2,
  under_review: Loader2,
  approved: CheckCircle2,
  in_progress: Loader2,
  testing: Loader2,
  ready_for_release: CheckCircle2,
  live: CheckCircle2,
  closed: XCircle,
  rejected: XCircle,
  on_hold: Clock,
  reopened: AlertCircle
};

const statusFlow = ['submitted', 'acknowledged', 'under_review', 'approved', 'in_progress', 'testing', 'ready_for_release', 'live', 'closed', 'rejected', 'on_hold', 'reopened'];

export default function RequestManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['all-requests'],
    queryFn: async () => {
      try {
        return await base44.entities.UserRequest.list('-created_date');
      } catch (error) {
        console.error('Failed to load requests:', error);
        return [];
      }
    },
    refetchInterval: 5000
  });



  const filteredRequests = allRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;
    const matchesSearch = !searchQuery || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });



  const getStatusStats = () => {
    const stats = {};
    statusFlow.forEach(status => {
      stats[status] = allRequests.filter(r => r.status === status).length;
    });
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {Object.entries(stats).map(([status, count]) => (
          <Card key={status} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-2 sm:p-4">
              <div className={`${statusColors[status]} w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1 sm:mb-2`}>
                <span className="text-white font-bold text-xs sm:text-base">{count}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 capitalize">{status.replace('_', ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              User Feature Requests
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-2">
              📌 View and manage user-submitted feature requests. Track status, prioritize requests, and communicate with users about their suggestions.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white text-sm h-9 sm:h-10"
            />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="all" className="text-white">All Statuses</SelectItem>
                  {statusFlow.map(status => (
                    <SelectItem key={status} value={status} className="capitalize text-white">
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="all" className="text-white">All Types</SelectItem>
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
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No requests found</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredRequests.map((request) => {
                const StatusIcon = statusIcons[request.status] || AlertCircle;
                return (
                  <div
                    key={request.id}
                    className="bg-zinc-800/50 rounded-lg p-3 sm:p-4 border border-zinc-700/50 hover:border-blue-500/50 transition-all cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-white font-semibold text-sm sm:text-base break-words hover:text-blue-400 transition-colors">{request.title}</h3>
                          <Badge className={`${statusColors[request.status]} text-white text-[10px] sm:text-xs`}>
                            <StatusIcon className={`w-2 h-2 sm:w-3 sm:h-3 mr-1 ${request.status === 'working' ? 'animate-spin' : ''}`} />
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px] sm:text-xs">
                            {request.priority}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-zinc-400 mb-2">
                          <span className="break-all">{request.user_email}</span>
                          <span>•</span>
                          <span className="capitalize">{request.request_type}</span>
                          <span>•</span>
                          <span className="capitalize">{request.category}</span>
                          {request.target_entity && (
                            <>
                              <span>•</span>
                              <span className="break-words">{request.target_entity}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 mb-2 break-words">{request.description}</p>
                        {request.reference_links && request.reference_links.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {request.reference_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] sm:text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Link {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                        {request.admin_notes && (
                          <div className="bg-zinc-900 p-2 rounded mt-2">
                            <p className="text-[10px] sm:text-xs text-zinc-400 mb-1">Admin Notes:</p>
                            <p className="text-xs sm:text-sm text-zinc-300 break-words">{request.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-zinc-500 break-words">
                      Created: {new Date(request.created_date).toLocaleString()}
                      {request.resolved_at && (
                        <span className="block sm:inline sm:ml-4 mt-1 sm:mt-0">
                          Resolved: {new Date(request.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SupportRequestDetailModal
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}