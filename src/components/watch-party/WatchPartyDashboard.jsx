
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search, Calendar, Clock } from "lucide-react";
import CreateWatchParty from './CreateWatchParty';
import JoinWatchParty from './JoinWatchParty';
import WatchPartyPlayer from './WatchPartyPlayer';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";

export default function WatchPartyDashboard({ open, onClose }) {
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [selectedParty, setSelectedParty] = useState(null);

    // Fetch user's parties
    const { data: parties = [] } = useQuery({
        queryKey: ['my-watch-parties'],
        queryFn: async () => {
            const user = await base44.auth.me();
            // Fetch parties where user is participant or host
            // Since filtering by array content might be limited in mock, we fetch all and filter in JS if needed
            // But let's try to filter by something if possible.
            // For now, let's fetch all active parties and filter client side
            const allParties = await base44.entities.WatchParty.filter({
                status: { $in: ['scheduled', 'live'] }
            });

            return allParties.filter(p =>
                p.host_email === user.email ||
                p.participants?.some(part => part.email === user.email)
            ).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
        },
        enabled: open
    });

    const handleCreateClose = () => {
        setShowCreate(false);
        // onClose(); // Optional: close dashboard? No, keep it open.
    };

    const handleJoinClose = () => {
        setShowJoin(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Users className="w-6 h-6 text-purple-500" />
                            Watch Parties
                        </DialogTitle>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <Button
                                onClick={() => setShowJoin(true)}
                                className="h-16 text-lg bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                            >
                                <Search className="w-6 h-6 mr-2" />
                                Join Party
                            </Button>
                            <Button
                                onClick={() => setShowCreate(true)}
                                className="h-16 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
                            >
                                <Plus className="w-6 h-6 mr-2" />
                                Create Party
                            </Button>
                        </div>

                        {/* My Parties List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-zinc-300">Your Upcoming Parties</h3>

                            {parties.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                                    <div className="w-16 h-16 mx-auto bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                        <Users className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <h4 className="text-white font-medium mb-1">No watch parties yet</h4>
                                    <p className="text-zinc-500 text-sm">Create or join a party to watch with friends</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {parties.map(party => (
                                        <div
                                            key={party.id}
                                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer group"
                                            onClick={() => setSelectedParty(party)}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                                        {party.party_name}
                                                    </h4>
                                                    <p className="text-sm text-zinc-400 mt-1">
                                                        {new Date(party.scheduled_start).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {party.status === 'live' && (
                                                    <div className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full animate-pulse">
                                                        LIVE
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(party.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {party.participants?.length || 0} / {party.max_participants}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <CreateWatchParty
                open={showCreate}
                onClose={handleCreateClose}
            />

            <JoinWatchParty
                open={showJoin}
                onClose={handleJoinClose}
            />

            {selectedParty && (
                <WatchPartyDashboardPlayerWrapper
                    party={selectedParty}
                    onClose={() => setSelectedParty(null)}
                />
            )}
        </>
    );
}

// Helper to fetch media before opening player
function WatchPartyDashboardPlayerWrapper({ party, onClose }) {
    const { data: media } = useQuery({
        queryKey: ['media', party.media_id],
        queryFn: () => base44.entities.Media.get(party.media_id)
    });

    if (!media) return null;

    return (
        <WatchPartyPlayer
            open={true}
            onClose={onClose}
            party={party}
            media={media}
        />
    );
}
