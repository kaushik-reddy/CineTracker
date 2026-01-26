
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Search, Clock, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAction } from "../feedback/useAction";
import WatchPartyPlayer from './WatchPartyPlayer';

export default function JoinWatchParty({ open, onClose }) {
    const { executeAction } = useAction();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundParty, setFoundParty] = useState(null);
    const [media, setMedia] = useState(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const searchParty = async () => {
        if (!inviteCode.trim()) {
            const { showDynamicIslandNotification } = await import('../pwa/DynamicIsland');
            showDynamicIslandNotification({
                icon: 'error',
                title: 'Error',
                message: 'Please enter an invite code'
            });
            return;
        }

        await executeAction('Searching Party', async () => {
            // Normalize input
            let normalizedCode = inviteCode.toUpperCase().replace(/\s/g, '');
            if (!normalizedCode.startsWith('CT-') && normalizedCode.length === 6) {
                normalizedCode = 'CT-' + normalizedCode;
            }

            console.log('Searching for code:', normalizedCode);

            let found = null;

            // Strategy 1: Direct Filter (Fastest)
            try {
                const parties = await base44.entities.WatchParty.filter({
                    invite_code: normalizedCode
                });
                if (parties && parties.length > 0) {
                    found = parties.find(p => ['scheduled', 'live'].includes(p.status));
                }
            } catch (e) {
                console.warn('Direct filter failed, attempting fallback...', e);
            }

            // Strategy 2: List All & Find (Fail-safe)
            if (!found) {
                console.log('Using fallback search strategy for code:', normalizedCode);
                try {
                    const allParties = await base44.entities.WatchParty.list();
                    console.log(`Scanning ${allParties.length} total parties...`);

                    found = allParties.find(p => {
                        const dbCode = (p.invite_code || '').toUpperCase().replace(/\s/g, '');
                        const isMatch = dbCode === normalizedCode;
                        const isStatusValid = ['scheduled', 'live'].includes(p.status);

                        if (isMatch) console.log(`Found MATCH but status is: ${p.status}`);
                        return isMatch && isStatusValid;
                    });
                } catch (e) {
                    console.error("Fallback search failed", e);
                }
            }

            if (!found) {
                throw new Error('Party not found or has ended');
            }

            // Check if party is full
            if (found.participants?.length >= found.max_participants) {
                throw new Error('Party is full');
            }

            // Load media
            const mediaData = await base44.entities.Media.filter({ id: found.media_id });
            if (mediaData.length > 0) {
                setMedia(mediaData[0]);
            }

            setFoundParty(found);
        }, {
            successTitle: 'Party Found!',
            successSubtitle: 'Ready to join'
        });
    };

    const joinParty = async () => {
        await executeAction('Joining Watch Party', async () => {
            const user = await base44.auth.me();

            // Check if already in party
            if (foundParty.participants?.some(p => p.user_id === user.id)) {
                setShowPlayer(true);
                return;
            }

            // Check if auto-admit is enabled
            if (foundParty.auto_admit) {
                // Auto-admit: add directly to participants
                const updatedParticipants = [...(foundParty.participants || []), {
                    user_id: user.id,
                    name: user.full_name,
                    email: user.email,
                    avatar: user.profile_picture || '',
                    joined_at: new Date().toISOString()
                }];

                await base44.entities.WatchParty.update(foundParty.id, {
                    participants: updatedParticipants
                });

                setShowPlayer(true);
            } else {
                // Manual approval: add to join requests
                const joinRequests = foundParty.join_requests || [];

                // Check if already requested
                if (joinRequests.some(r => r.user_id === user.id)) {
                    throw new Error('Join request already sent');
                }

                joinRequests.push({
                    user_id: user.id,
                    name: user.full_name,
                    email: user.email,
                    avatar: user.profile_picture || '',
                    requested_at: new Date().toISOString()
                });

                await base44.entities.WatchParty.update(foundParty.id, {
                    join_requests: joinRequests
                });

                setRequestSent(true);
            }
        }, {
            successTitle: foundParty.auto_admit ? 'Joined Successfully!' : 'Request Sent!',
            successSubtitle: foundParty.auto_admit ? 'Welcome to the party' : 'Waiting for host approval'
        });
    };

    return (
        <>
            <Dialog open={open && !showPlayer} onOpenChange={onClose}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Search className="w-5 h-5 text-emerald-400" />
                            Join Watch Party
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {!foundParty ? (
                            <>
                                <div>
                                    <Label className="text-zinc-300">Enter Invite Code</Label>
                                    <Input
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        placeholder="ABC12345"
                                        className="bg-zinc-800 border-zinc-700 text-white mt-2 text-lg font-mono tracking-wider"
                                        maxLength={8}
                                    />
                                </div>

                                <Button
                                    onClick={searchParty}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-purple-500"
                                >
                                    {loading ? 'Searching...' : 'Find Party'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
                                    {media?.poster_url && (
                                        <img src={media.poster_url} alt={media?.title} className="w-full h-48 object-cover rounded-lg" />
                                    )}
                                    <h3 className="text-xl font-bold text-white">{foundParty.party_name}</h3>

                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {foundParty.participants?.length || 0} / {foundParty.max_participants}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(foundParty.scheduled_start).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-zinc-700">
                                        <Label className="text-xs text-zinc-400">Host</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm text-white">{foundParty.participants?.[0]?.name}</span>
                                        </div>
                                    </div>

                                    {foundParty.participants?.length > 1 && (
                                        <div className="pt-3 border-t border-zinc-700">
                                            <Label className="text-xs text-zinc-400 mb-2 block">Also Watching</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {foundParty.participants.slice(1).map((p, i) => (
                                                    <div key={i} className="px-2 py-1 bg-zinc-700 rounded-full text-xs text-white">
                                                        {p.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {requestSent ? (
                                    <div className="text-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                        <p className="text-amber-400 text-sm">Join request sent! Waiting for host approval...</p>
                                        <Button onClick={onClose} className="w-full mt-3 bg-zinc-700 hover:bg-zinc-600">
                                            Close
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <Button onClick={() => {
                                            setFoundParty(null);
                                            setRequestSent(false);
                                        }} className="flex-1 bg-zinc-700 hover:bg-zinc-600">
                                            Back
                                        </Button>
                                        <Button onClick={joinParty} className="flex-1 bg-gradient-to-r from-emerald-500 to-purple-500">
                                            Join Party
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {showPlayer && foundParty && media && (
                <WatchPartyPlayer
                    open={showPlayer}
                    onClose={() => {
                        setShowPlayer(false);
                        onClose();
                    }}
                    party={foundParty}
                    media={media}
                />
            )}
        </>
    );
}
