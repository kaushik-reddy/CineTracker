import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Copy, Calendar, Clock, Film } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { useAction } from "../feedback/useAction";

export default function CreateWatchParty({ open, onClose, media, schedule }) {
  const { executeAction } = useAction();
  const [partyName, setPartyName] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [startTime, setStartTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPublic, setIsPublic] = useState(false);
  const [autoAdmit, setAutoAdmit] = useState(true);
  const [createdParty, setCreatedParty] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(media);
  const [seasonNumber, setSeasonNumber] = useState(schedule?.season_number || 1);
  const [episodeNumber, setEpisodeNumber] = useState(schedule?.episode_number || 1);

  const { data: allMedia = [] } = useQuery({
    queryKey: ['all-media-watchparty'],
    queryFn: () => base44.entities.Media.list('-created_date')
  });

  const generateInviteCode = () => {
    return 'CT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedMedia) return;

    const inviteCode = generateInviteCode();

    await executeAction('Creating Watch Party', async () => {
      const user = await base44.auth.me();

      const scheduledDateTime = new Date(`${scheduledStart}T${startTime}`).toISOString();

      const party = await base44.entities.WatchParty.create({
        host_email: user.email,
        media_id: selectedMedia.id,
        schedule_id: schedule?.id || null,
        season_number: selectedMedia.type === 'series' ? seasonNumber : null,
        episode_number: selectedMedia.type === 'series' ? episodeNumber : null,
        party_name: partyName,
        scheduled_start: scheduledDateTime,
        status: 'scheduled',
        max_participants: maxParticipants,
        is_public: isPublic,
        auto_admit: autoAdmit,
        invite_code: inviteCode,
        join_requests: [],
        participants: [{
          user_id: user.id,
          name: user.full_name || user.name || user.email?.split('@')[0],
          email: user.email,
          avatar: user.profile_picture || '',
          joined_at: new Date().toISOString()
        }]
      });

      setCreatedParty(party);
    }, {
      successTitle: 'Watch Party Created!',
      successSubtitle: `Party code: ${inviteCode}`
    });
  };

  const copyInviteCode = async () => {
    if (!createdParty) return;
    navigator.clipboard.writeText(createdParty.invite_code);
    const { showDynamicIslandNotification } = await import('../pwa/DynamicIsland');
    showDynamicIslandNotification({
      icon: 'success',
      title: 'Copied!',
      message: 'Invite code copied to clipboard'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Create Watch Party
          </DialogTitle>
        </DialogHeader>

        {!createdParty ? (
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            {!media && (
              <div>
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Film className="w-3 h-3" />
                  Select Title
                </Label>
                <Select value={selectedMedia?.id} onValueChange={(id) => setSelectedMedia(allMedia.find(m => m.id === id))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue placeholder="Choose a title..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                    {allMedia.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-white">
                        {m.title} ({m.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedMedia && (
              <>
                <div className="p-3 bg-zinc-800/50 rounded-lg flex gap-3">
                  {selectedMedia.poster_url && (
                    <img src={selectedMedia.poster_url} alt={selectedMedia.title} className="w-16 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{selectedMedia.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 capitalize">{selectedMedia.type}</p>
                  </div>
                </div>

                {selectedMedia.type === 'series' && selectedMedia.episodes_per_season && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-300">Season</Label>
                      <Select value={String(seasonNumber)} onValueChange={(val) => {
                        setSeasonNumber(parseInt(val));
                        setEpisodeNumber(1);
                      }}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                          {selectedMedia.episodes_per_season.map((_, idx) => (
                            <SelectItem key={idx + 1} value={String(idx + 1)} className="text-white">
                              Season {idx + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-300">Episode</Label>
                      <Select value={String(episodeNumber)} onValueChange={(val) => setEpisodeNumber(parseInt(val))}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                          {Array.from({ length: selectedMedia.episodes_per_season[seasonNumber - 1] || 1 }, (_, idx) => (
                            <SelectItem key={idx + 1} value={String(idx + 1)} className="text-white">
                              Episode {idx + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <Label className="text-zinc-300">Party Name</Label>
              <Input
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Time
                </Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-300">Max Participants</Label>
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                min={2}
                max={50}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <Label className="text-white">Public Party</Label>
                  <p className="text-xs text-zinc-400">Anyone can join with invite code</p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <Label className="text-white">Auto-Admit Invited Users</Label>
                  <p className="text-xs text-zinc-400">Invited users join instantly, others need approval</p>
                </div>
                <Switch checked={autoAdmit} onCheckedChange={setAutoAdmit} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600">
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedMedia} className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 disabled:opacity-50">
                Create Party
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Party Created!</h3>
              <p className="text-sm text-zinc-400">Share the invite code with your friends</p>
            </div>

            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <Label className="text-zinc-400 text-xs">Invite Code</Label>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-2xl font-mono font-bold text-amber-400 tracking-wider">
                  {createdParty.invite_code}
                </code>
                <Button size="icon" onClick={copyInviteCode} className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-zinc-400 text-center">
              Party starts at {new Date(createdParty.scheduled_start).toLocaleString()}
            </div>

            <Button onClick={onClose} className="w-full bg-gradient-to-r from-purple-500 to-emerald-500">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}