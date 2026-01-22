import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { XCircle, Calendar, User, CheckCircle, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useAction } from "../feedback/useAction";

export default function CancellationManager() {
  const queryClient = useQueryClient();
  const { executeAction } = useAction();

  const { data: cancelledSubscriptions = [] } = useQuery({
    queryKey: ['cancelled-subscriptions'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        status: { $in: ['cancelled', 'expired'] }
      }, '-cancelled_at');
      return subs;
    }
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['all-plans'],
    queryFn: () => base44.entities.Plan.list()
  });

  const reinstateMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Subscription.update(id, {
      status: 'active',
      cancelled_at: null,
      cancellation_reason: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancelled-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
    }
  });

  const handleReinstate = (subscription) => {
    executeAction('Reinstating Subscription', async () => {
      await reinstateMutation.mutateAsync({ id: subscription.id });
    }, {
      successTitle: 'Subscription Reinstated',
      successSubtitle: 'User subscription has been reactivated'
    });
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          Cancelled Subscriptions
        </CardTitle>
        <p className="text-xs text-zinc-400 mt-2">
          View and manage cancelled subscriptions
        </p>
      </CardHeader>

      <CardContent>
        {cancelledSubscriptions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
            <p className="text-zinc-400">No cancelled subscriptions</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {cancelledSubscriptions.map((sub) => {
              const plan = allPlans.find(p => p.id === sub.plan_id);
              return (
                <Card key={sub.id} className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <p className="text-white font-medium text-sm truncate">{sub.user_email}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                              {plan?.name || 'Unknown Plan'}
                            </Badge>
                            <Badge className={`text-xs ${
                              sub.status === 'cancelled' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {sub.status === 'cancelled' ? 'Cancelled (Pending Expiry)' : 'Expired'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Cancelled: {sub.cancelled_at ? format(new Date(sub.cancelled_at), 'PP') : 'N/A'}
                            </div>
                            {sub.end_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Ends: {format(new Date(sub.end_date), 'PP')}
                              </div>
                            )}
                          </div>
                          
                          {sub.cancellation_reason && (
                            <p className="text-xs text-zinc-500 mt-2">
                              Reason: {sub.cancellation_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleReinstate(sub)}
                        className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 ml-2"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reinstate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}