
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Users, Send, X, Maximize2, Volume2, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAction } from "../feedback/useAction";

export default function WatchPartyPlayer({ open, onClose, party, media }) {
    const { executeAction } = useAction();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState(party?.participants || []);
    const [showChat, setShowChat] = useState(true);
    const [joinRequests, setJoinRequests] = useState(party?.join_requests || []);
    const intervalRef = useRef(null);
    const syncIntervalRef = useRef(null);
    const chatEndRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showRating, setShowRating] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);

    const totalSeconds = (media?.runtime_minutes || 0) * 60;
    const isHost = currentUser?.email === party?.host_email;

    useEffect(() => {
        if (!open) return;

        const init = async () => {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Join party if not already in participants
            if (!party.participants?.some(p => p.user_id === user.id)) {
                const updatedParticipants = [...(party.participants || []), {
                    user_id: user.id,
                    name: user.full_name,
                    email: user.email,
                    avatar: user.profile_picture || '',
                    joined_at: new Date().toISOString()
                }];

                await base44.entities.WatchParty.update(party.id, {
                    participants: updatedParticipants,
                    status: 'live'
                });

                // System message
                await base44.entities.ChatMessage.create({
                    party_id: party.id,
                    user_email: 'system',
                    user_name: 'System',
                    message: `${user.full_name} joined the party`,
                    message_type: 'system',
                    timestamp: new Date().toISOString()
                });
            }

            // Also ensure a personal WatchSchedule exists for the guest/host
            const existing = await base44.entities.WatchSchedule.filter({
                created_by: user.email,
                media_id: party.media_id,
                status: ['scheduled', 'in_progress', 'paused']
            });

            if (existing.length === 0) {
                // If it's a guest joined later, create it now
                await base44.entities.WatchSchedule.create({
                    created_by: user.email,
                    media_id: party.media_id,
                    status: 'in_progress',
                    scheduled_date: party.scheduled_start,
                    is_watch_party: true,
                    shared_party_id: party.id,
                    viewers: [{
                        user_id: user.id,
                        name: user.full_name,
                        email: user.email
                    }]
                });
            } else if (!isHost) {
                // For guests, update their personal schedule to in_progress when they enter
                await base44.entities.WatchSchedule.update(existing[0].id, {
                    status: 'in_progress'
                });
            }
        };

        init();
    }, [open, party]);

    // Real-time sync with WebSocket-like polling (500ms)
    useEffect(() => {
        if (!open || !party) return;

        let pollInterval = 500; // Fast polling for near-instant sync
        let lastPartyData = null;
        let lastMessagesCount = 0;

        const syncData = async () => {
            try {
                const updated = await base44.entities.WatchParty.filter({ id: party.id });
                if (updated.length > 0) {
                    const partyData = updated[0];

                    // Only update if data actually changed
                    const dataChanged = JSON.stringify(lastPartyData) !== JSON.stringify(partyData);
                    if (dataChanged) {
                        setParticipants(partyData.participants || []);
                        setJoinRequests(partyData.join_requests || []);

                        // Sync playback if not host
                        if (!isHost) {
                            setCurrentTime(partyData.current_time || 0);
                            setIsPlaying(partyData.is_playing || false);
                        }

                        lastPartyData = partyData;

                        // NEW: Detect if party ended to show rating
                        if (partyData.status === 'ended' || partyData.status === 'completed') {
                            if (!hasRated) {
                                setShowRating(true);
                                setIsPlaying(false);
                            }
                        }
                    }
                }

                // Check for new messages
                const msgs = await base44.entities.ChatMessage.filter(
                    { party_id: party.id },
                    'created_date'
                );

                if (msgs.length !== lastMessagesCount) {
                    setMessages(msgs);
                    lastMessagesCount = msgs.length;
                }
            } catch (error) {
                console.error('Sync error:', error);
            }

            // Schedule next poll
            syncIntervalRef.current = setTimeout(syncData, pollInterval);
        };

        syncData(); // Start immediately

        return () => {
            if (syncIntervalRef.current) {
                clearTimeout(syncIntervalRef.current);
            }
        };
    }, [open, party, isHost]);

    // Playback timer
    useEffect(() => {
        if (isPlaying && currentTime < totalSeconds) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + 1;
                    if (next >= totalSeconds) {
                        setIsPlaying(false);
                        if (isHost) syncPlayback(next, false);
                        return totalSeconds;
                    }
                    return next;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, totalSeconds, isHost]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);



    const syncPlayback = async (time, playing) => {
        if (!isHost) return;
        try {
            await base44.entities.WatchParty.update(party.id, {
                current_time: time,
                is_playing: playing,
                last_sync_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Sync failed:', error);
        }
    };

    const handlePlayPause = async () => {
        const newState = !isPlaying;
        setIsPlaying(newState);
        if (isHost) {
            await syncPlayback(currentTime, newState);

            // Sync with WatchSchedule if exists
            if (party.schedule_id) {
                try {
                    await base44.entities.WatchSchedule.update(party.schedule_id, {
                        status: newState ? 'in_progress' : 'paused',
                        elapsed_seconds: currentTime
                    });
                } catch (e) {
                    console.error('Schedule sync failed:', e);
                }
            }

            // System message
            await base44.entities.ChatMessage.create({
                party_id: party.id,
                user_email: 'system',
                user_name: 'System',
                message: `${currentUser.full_name} ${newState ? 'resumed' : 'paused'} playback`,
                message_type: 'system',
                timestamp: new Date().toISOString()
            });
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        try {
            await base44.entities.ChatMessage.create({
                party_id: party.id,
                user_email: currentUser.email,
                user_name: currentUser.full_name,
                user_avatar: currentUser.profile_picture || '',
                message: newMessage.trim(),
                message_type: 'chat',
                timestamp: new Date().toISOString()
            });

            setNewMessage('');
        } catch (error) {
            const { showDynamicIslandNotification } = await import('../pwa/DynamicIsland');
            showDynamicIslandNotification({
                icon: 'error',
                title: 'Error',
                message: 'Failed to send message'
            });
        }
    };

    const handleApproveRequest = (request) => {
        executeAction('Approving Request', async () => {
            const updatedParticipants = [...participants, {
                user_id: request.user_id,
                name: request.name,
                email: request.email,
                avatar: request.avatar,
                joined_at: new Date().toISOString()
            }];

            const updatedRequests = joinRequests.filter(r => r.user_id !== request.user_id);

            await base44.entities.WatchParty.update(party.id, {
                participants: updatedParticipants,
                join_requests: updatedRequests
            });

            await base44.entities.ChatMessage.create({
                party_id: party.id,
                user_email: 'system',
                user_name: 'System',
                message: `${request.name} joined the party`,
                message_type: 'system',
                timestamp: new Date().toISOString()
            });
        }, {
            successTitle: 'Request Approved',
            successSubtitle: `${request.name} joined the party`
        });
    };

    const handleRejectRequest = (request) => {
        executeAction('Rejecting Request', async () => {
            const updatedRequests = joinRequests.filter(r => r.user_id !== request.user_id);

            await base44.entities.WatchParty.update(party.id, {
                join_requests: updatedRequests
            });
        }, {
            successTitle: 'Request Rejected',
            successSubtitle: `${request.name}'s request was declined`
        });
    };

    const submitRating = async () => {
        if (userRating === 0) return;

        executeAction('Saving Rating', async () => {
            setHasRated(true);
            const now = new Date().toISOString();

            // Find personal schedule
            const schedules = await base44.entities.WatchSchedule.filter({
                created_by: currentUser.email,
                media_id: party.media_id,
                status: ['scheduled', 'in_progress', 'paused']
            });

            if (schedules.length > 0) {
                await base44.entities.WatchSchedule.update(schedules[0].id, {
                    status: 'completed',
                    rating: userRating,
                    rating_submitted_at: now,
                    elapsed_seconds: currentTime
                });
            }

            setShowRating(false);

            // If they are a guest, they can now leave
            if (!isHost) {
                onClose();
            }
        }, {
            successTitle: 'Rating Saved!',
            successSubtitle: 'Added to your history'
        });
    };

    const handleCompleteParty = async () => {
        executeAction('Completing Watch Party', async () => {
            const now = new Date().toISOString();

            // Update Party
            await base44.entities.WatchParty.update(party.id, {
                status: 'ended',
                is_playing: false,
                current_time: currentTime,
                ended_at: now
            });

            // Update Schedule if exists
            if (party.schedule_id) {
                await base44.entities.WatchSchedule.update(party.schedule_id, {
                    status: 'completed',
                    rating_submitted_at: now,
                    elapsed_seconds: currentTime
                });
            }

            // System message
            await base44.entities.ChatMessage.create({
                party_id: party.id,
                user_email: 'system',
                user_name: 'System',
                message: `Party ended by ${currentUser.full_name}`,
                message_type: 'system',
                timestamp: now
            });

            onClose();
        }, {
            successTitle: 'Party Completed!',
            successSubtitle: 'The session has been saved'
        });
    };

    const handleQuitParty = async () => {
        try {
            // Only update if not host or if host is leaving (which might end party or just remove them)
            // For now, simple remove from participants
            const updatedParticipants = participants.filter(p => p.user_id !== currentUser.id);
            await base44.entities.WatchParty.update(party.id, {
                participants: updatedParticipants
            });

            await base44.entities.ChatMessage.create({
                party_id: party.id,
                user_email: 'system',
                user_name: 'System',
                message: `${currentUser.full_name} left the party`,
                message_type: 'system',
                timestamp: new Date().toISOString()
            });

            onClose();
        } catch (error) {
            console.error('Failed to leave:', error);
            onClose();
        }
    };

    const handleClose = () => {
        // Just close the player, don't leave the party
        onClose();
    };

    const progress = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!party || !currentUser) {
        return null;
    }

    if (!media) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="bg-black border-zinc-800 text-white max-w-md p-8">
                    <div className="text-center">
                        <div className="text-zinc-500 mb-4">Loading media...</div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-black border-zinc-800 text-white max-w-[98vw] w-full h-[95vh] p-0 overflow-hidden flex flex-col gap-0 shadow-2xl">
                <div className="flex flex-1 overflow-hidden">
                    {/* Main Player Area */}
                    <div className="flex-1 flex flex-col bg-black relative group">
                        {/* Header Overlay - Auto Hide */}
                        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-white tracking-tight">{party.party_name}</h2>
                                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 rounded-full shadow-lg shadow-red-900/20">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-wider text-white">LIVE</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isHost && (
                                    <Button
                                        onClick={handleCompleteParty}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-900/20 gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Complete
                                    </Button>
                                )}
                                <Button
                                    onClick={handleQuitParty}
                                    className="bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20 gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Leave Party
                                </Button>
                            </div>
                        </div>

                        {/* Video Content */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                            {media?.poster_url ? (
                                <>
                                    <img
                                        src={media.poster_url}
                                        alt={media?.title || 'Media'}
                                        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-lg scale-110"
                                    />
                                    <img
                                        src={media.poster_url}
                                        alt={media?.title}
                                        className="relative max-h-[80%] max-w-[80%] object-contain shadow-2xl rounded-lg z-10"
                                    />
                                </>
                            ) : (
                                <div className="text-6xl text-zinc-700 z-10">🎬</div>
                            )}

                            {/* Play/Pause Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handlePlayPause}
                                    disabled={!isHost}
                                    className={`w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto shadow-2xl ${!isHost ? 'opacity-0 cursor-default' : 'cursor-pointer'}`}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-10 h-10 text-white fill-white" />
                                    ) : (
                                        <Play className="w-10 h-10 text-white fill-white ml-2" />
                                    )}
                                </motion.button>
                            </div>

                            {/* Host Indicator */}
                            {!isHost && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 mt-16">
                                    <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs text-white/70 border border-white/10">
                                        Synced with Host
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bottom Controls Overlay */}
                        <div className="p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                            <h3 className="text-3xl font-bold mb-2 text-white text-shadow-lg">{media?.title || 'Loading...'}</h3>
                            <div className="flex items-center justify-between text-sm text-zinc-400 mb-4">
                                {party?.season_number ? (
                                    <span className="text-amber-400 font-medium">S{String(party.season_number).padStart(2, '0')} E{String(party.episode_number).padStart(2, '0')}</span>
                                ) : (
                                    <span>Movie</span>
                                )}
                                <span className="font-mono">{formatTime(currentTime)} / {formatTime(totalSeconds)}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden backdrop-blur-sm cursor-pointer hover:h-2.5 transition-all">
                                <motion.div
                                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    style={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1, ease: "linear" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Chat Sidebar */}
                    <div className="w-[350px] bg-zinc-950 border-l border-zinc-900 flex flex-col z-30 shadow-xl">
                        {/* Participants Header */}
                        <div className="p-4 border-b border-zinc-900/50 bg-zinc-950/50 backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Participants ({participants.length})</h3>
                                {isHost && joinRequests.length > 0 && (
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                )}
                            </div>

                            {/* Avatar Stack */}
                            <div className="flex items-center mt-3 -space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                                {participants.map((p) => (
                                    <div key={p.user_id} className="relative group/avatar flex-shrink-0" title={p.name}>
                                        <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center overflow-hidden">
                                            {p.avatar ? (
                                                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-white">{(p.name || '?')[0]}</span>
                                            )}
                                        </div>
                                        {p.email === party.host_email && (
                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                                                <span className="text-[6px]">👑</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Join Requests (Host Only) */}
                        {isHost && joinRequests.length > 0 && (
                            <div className="p-3 bg-amber-500/10 border-b border-amber-500/10">
                                <div className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-wide">Pending Requests</div>
                                <div className="space-y-2">
                                    {joinRequests.map((request) => (
                                        <div key={request.user_id} className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg border border-amber-500/10">
                                            <span className="text-xs text-zinc-300 font-medium">{request.name}</span>
                                            <div className="flex gap-1">
                                                <Button size="icon" onClick={() => handleApproveRequest(request)} className="h-6 w-6 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3" />
                                                </Button>
                                                <Button size="icon" onClick={() => handleRejectRequest(request)} className="h-6 w-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20">
                                                    <XCircle className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`group ${msg.message_type === 'system' ? 'flex justify-center my-4' : ''}`}>
                                    {msg.message_type === 'system' ? (
                                        <span className="px-2 py-0.5 bg-zinc-900 rounded-full text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
                                            {msg.message}
                                        </span>
                                    ) : (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400 mt-1">
                                                {msg.user_avatar ? (
                                                    <img src={msg.user_avatar} alt={msg.user_name} className="w-full h-full rounded-full object-cover" />
                                                ) : (msg.user_name || '?')[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className={`text-xs font-bold ${msg.user_email === currentUser?.email ? 'text-amber-500' : 'text-zinc-300'}`}>
                                                        {msg.user_name}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600">
                                                        {new Date(msg.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed break-words">{msg.message}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                            <form onSubmit={sendMessage} className="relative">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 pr-10 focus-visible:ring-amber-500/20 focus-visible:border-amber-500/50 rounded-xl h-11"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="absolute right-1 top-1 h-9 w-9 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
                                    disabled={!newMessage.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Rating Overlay */}
                <AnimatePresence>
                    {showRating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="max-w-sm w-full space-y-6"
                            >
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-white">Party Finished!</h2>
                                    <p className="text-zinc-400">Hope you enjoyed watching "{media.title}". How would you rate it?</p>
                                </div>

                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setUserRating(star)}
                                            className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center text-xl font-bold ${userRating >= star
                                                ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-900/40'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                        >
                                            {star}
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    onClick={submitRating}
                                    disabled={userRating === 0}
                                    className="w-full h-12 text-lg bg-gradient-to-r from-emerald-500 to-purple-500 hover:opacity-90 disabled:opacity-50"
                                >
                                    Save to My History
                                </Button>

                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold pt-4">This session is now isolated in your personal history</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
