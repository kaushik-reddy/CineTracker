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
      const { showDynamicIslandNotification } = require('../pwa/DynamicIsland');
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

  const handleLeave = async () => {
    try {
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
      <Dialog open={open} onOpenChange={handleLeave}>
        <DialogContent className="bg-black border-zinc-800 text-white max-w-md p-8">
          <div className="text-center">
            <div className="text-zinc-500 mb-4">Loading media...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleLeave}>
      <DialogContent className="bg-black border-zinc-800 text-white max-w-7xl w-[98vw] h-[95vh] p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/80 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">{party.party_name}</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400">LIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Users className="w-4 h-4" />
                {participants.length}
              </div>
              <Button size="sm" onClick={handleLeave} className="bg-red-500 hover:bg-red-600">
                Leave Party
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Player Area */}
            <div className="flex-1 flex flex-col bg-black">
              {/* Video Placeholder */}
              <div className="flex-1 relative bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center overflow-hidden">
                {media?.poster_url ? (
                  <img
                    src={media.poster_url}
                    alt={media?.title || 'Media'}
                    className="max-h-full max-w-full object-contain opacity-30 blur-sm"
                  />
                ) : (
                  <div className="text-6xl text-zinc-700">🎬</div>
                )}

                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePlayPause}
                    disabled={!isHost}
                    className={`w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all pointer-events-auto ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isPlaying ? (
                      <Pause className="w-10 h-10 text-white" />
                    ) : (
                      <Play className="w-10 h-10 text-white ml-1" />
                    )}
                  </motion.button>
                </div>

                {/* Host Indicator */}
                {!isHost && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/50 z-10">
                    <span className="text-xs text-purple-300">Host controls playback</span>
                  </div>
                )}

                {/* Media Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10">
                  <h3 className="text-2xl font-bold mb-2 text-white">{media?.title || 'Loading...'}</h3>
                  {party?.season_number && (
                    <p className="text-amber-400 mb-4">
                      S{String(party.season_number).padStart(2, '0')}E{String(party.episode_number).padStart(2, '0')}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(totalSeconds)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Sidebar - Always Visible */}
            <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col">
              {/* Join Requests (Host Only) */}
              {isHost && joinRequests.length > 0 && (
                <div className="p-4 border-b border-zinc-800 bg-amber-500/5">
                  <h3 className="text-sm font-semibold text-amber-400 mb-3">Join Requests ({joinRequests.length})</h3>
                  <div className="space-y-2">
                    {joinRequests.map((request) => (
                      <div key={request.user_id} className="flex items-center justify-between p-2 bg-zinc-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                            {request.name?.[0] || '?'}
                          </div>
                          <span className="text-xs text-white">{request.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" onClick={() => handleApproveRequest(request)} className="h-6 w-6 bg-emerald-500 hover:bg-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                          <Button size="icon" onClick={() => handleRejectRequest(request)} className="h-6 w-6 bg-red-500 hover:bg-red-600">
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Participants ({participants.length})</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-full"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center text-xs font-bold">
                        {p.name?.[0] || '?'}
                      </div>
                      <span className="text-xs text-white">
                        {p.name.split(' ')[0]}
                        {p.email === party.host_email && ' 👑'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={msg.message_type === 'system' ? 'text-center' : ''}>
                    {msg.message_type === 'system' ? (
                      <span className="text-xs text-zinc-500">{msg.message}</span>
                    ) : (
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {msg.user_name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{msg.user_name}</span>
                            <span className="text-xs text-zinc-500">
                              {new Date(msg.created_date).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-300">{msg.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button type="submit" size="icon" className="bg-amber-500 hover:bg-amber-600 text-black">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}