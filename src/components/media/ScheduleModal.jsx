import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertCircle, Monitor, Volume2, Video, Smartphone, Book, CheckCircle, Sparkles, Sofa, Armchair, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PlatformBadge } from "../common/PlatformLogos";
import { motion, AnimatePresence } from "framer-motion";
import { useConfigurableOptions } from '../admin/ConfigLoader';
import { useAction } from '../feedback/useAction';

// Base options - always available
const baseDevices = [
  "TV", "Laptop", "Phone", "Tablet", "Projector", "Big Screen", "Theater",
  "E-Reader", "Kindle", "Physical Book", "Other"
];

const baseAudioFormats = [
  "Stereo", "Dolby Atmos", "Dolby Digital Plus", "DTS:X", "Spatial Audio",
  "5.1 Surround", "7.1 Surround", "IMAX Enhanced Audio", "Other"
];

const baseVideoFormats = [
  "SD", "HD", "Full HD", "4K UHD", "8K", "Dolby Vision", "HDR10", "HDR10+", 
  "IMAX", "IMAX Enhanced", "Other"
];

export default function ScheduleModal({ open, onClose, media, onSchedule, existingSchedule, completedEpisodes }) {
  const { executeAction } = useAction();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seasonNumber, setSeasonNumber] = useState('1');
  const [episodeNumber, setEpisodeNumber] = useState('1');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [device, setDevice] = useState('TV');
  const [audioFormat, setAudioFormat] = useState('Stereo');
  const [videoFormat, setVideoFormat] = useState('HD');
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  
  // Seat selection state (UI only)
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [selectedViewers, setSelectedViewers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Load dynamic options from Admin and merge with base
  const { options: deviceOptions } = useConfigurableOptions('device');
  const { options: audioFormatOptions } = useConfigurableOptions('audio_format');
  const { options: videoFormatOptions } = useConfigurableOptions('video_format');

  const devices = useMemo(() => {
    const adminValues = deviceOptions.map(o => o.value);
    const merged = [...baseDevices];
    adminValues.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  }, [deviceOptions]);

  const audioFormats = useMemo(() => {
    const adminValues = audioFormatOptions.map(o => o.value);
    const merged = [...baseAudioFormats];
    adminValues.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  }, [audioFormatOptions]);

  const videoFormats = useMemo(() => {
    const adminValues = videoFormatOptions.map(o => o.value);
    const merged = [...baseVideoFormats];
    adminValues.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  }, [videoFormatOptions]);

  useEffect(() => {
    if (!open) {
      // Reset loading state and seat selection when modal closes
      setLoading(false);
      setShowSeatSelection(false);
      setSelectedSeats([]);
      setSelectedViewers([]);
      return;
    }

    const initializeSchedule = async () => {
      if (existingSchedule) {
      const scheduleDate = new Date(existingSchedule.scheduled_date);
      setDate(scheduleDate.toISOString().split('T')[0]);
      setTime(scheduleDate.toTimeString().slice(0, 5));
      setSeasonNumber(existingSchedule.season_number?.toString() || '1');
      setEpisodeNumber(existingSchedule.episode_number?.toString() || '1');
      setSessionDuration(existingSchedule.session_duration || 30);
      setDevice(existingSchedule.device || media?.device || 'TV');
      setAudioFormat(existingSchedule.audio_format || 'Stereo');
      setVideoFormat(existingSchedule.video_format || 'HD');
    } else if (media?.type === 'book') {
      setSessionDuration(30);
      setDevice('E-Reader');
      setDate('');
      setTime('');
    } else if (media?.type === 'series') {
      // Find next unwatched episode based on completed + scheduled
      const allSchedules = await base44.entities.WatchSchedule.filter({ media_id: media.id });
      const watchedEpisodes = allSchedules.filter(s => s.status === 'completed');
      const scheduledEpisodes = allSchedules.filter(s => s.status !== 'completed');
      
      let foundNext = false;
      
      // Find next episode by checking each season
      for (let s = 1; s <= (media.seasons_count || 0); s++) {
        const episodesInSeason = media.episodes_per_season?.[s - 1] || 0;
        for (let e = 1; e <= episodesInSeason; e++) {
          const isWatched = watchedEpisodes.some(ep => ep.season_number === s && ep.episode_number === e);
          const isScheduled = scheduledEpisodes.some(ep => ep.season_number === s && ep.episode_number === e);
          
          if (!isWatched && !isScheduled) {
            setSeasonNumber(s.toString());
            setEpisodeNumber(e.toString());
            foundNext = true;
            break;
          }
        }
        if (foundNext) break;
      }
      
      if (!foundNext) {
        setSeasonNumber('1');
        setEpisodeNumber('1');
      }
      setDate('');
      setTime('');
    } else {
        setDate('');
        setTime('');
        setSeasonNumber('1');
        setEpisodeNumber('1');
      }
    };
    
    initializeSchedule();
    
    // Fetch all users for viewer selection
    const fetchUsers = async () => {
      try {
        const users = await base44.entities.User.list();
        setAllUsers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    
    if (open) fetchUsers();
  }, [open, existingSchedule, media]);

  // Check for conflicts and generate AI suggestions when date/time changes
  useEffect(() => {
    if (!date || !time || !media || !open) {
      setConflicts([]);
      setAiSuggestion(null);
      return;
    }

    const checkConflictsAndSuggestions = async () => {
      try {
        const scheduledDateTime = new Date(`${date}T${time}`);
        const hour = scheduledDateTime.getHours();
        
        // Calculate runtime for conflict detection
        let runtime = media.runtime_minutes;
        if (media.type === 'series' && seasonNumber && episodeNumber) {
          const epRuntime = media.episode_runtimes?.[parseInt(seasonNumber) - 1]?.[parseInt(episodeNumber) - 1];
          if (epRuntime) runtime = epRuntime;
        } else if (media.type === 'book') {
          runtime = sessionDuration;
        }
        
        const endTime = new Date(scheduledDateTime.getTime() + runtime * 60000);
        
        // Generate AI scheduling suggestion
        const genreLower = media.genre?.join(', ').toLowerCase() || '';
        let suggestion = null;
        
        if ((genreLower.includes('horror') || genreLower.includes('thriller')) && hour >= 22) {
          suggestion = { type: 'warning', message: 'Late night horror? Perfect for maximum scares!' };
        } else if ((genreLower.includes('horror') || genreLower.includes('thriller')) && hour < 12) {
          suggestion = { type: 'info', message: 'Watching horror in daylight? Less scary but still fun!' };
        } else if (genreLower.includes('comedy') && (hour >= 19 && hour <= 22)) {
          suggestion = { type: 'success', message: 'Evening is perfect for comedy - great time to unwind!' };
        } else if (genreLower.includes('action') && (hour >= 8 && hour <= 20)) {
          suggestion = { type: 'success', message: 'Daytime action - keeps your energy up!' };
        } else if ((genreLower.includes('drama') || genreLower.includes('romance')) && hour >= 20) {
          suggestion = { type: 'success', message: 'Evening drama - perfect for emotional immersion!' };
        } else if (media.runtime_minutes > 150 && hour >= 22) {
          suggestion = { type: 'warning', message: 'Long movie scheduled late - make sure you have time!' };
        }
        
        setAiSuggestion(suggestion);

        // Get all schedules for conflict detection
        const allSchedules = await base44.entities.WatchSchedule.filter({
          status: { $ne: 'completed' }
        });

        const allMedia = await base44.entities.Media.list();
        const mediaMap = allMedia.reduce((acc, m) => ({ ...acc, [m.id]: m }), {});

        const conflictList = [];
        allSchedules.forEach((schedule) => {
          if (existingSchedule && schedule.id === existingSchedule.id) return;
          
          const scheduleMedia = mediaMap[schedule.media_id];
          if (!scheduleMedia) return;

          // Calculate other schedule's runtime
          let otherRuntime = scheduleMedia.runtime_minutes;
          if (scheduleMedia.type === 'series' && schedule.season_number && schedule.episode_number) {
            const epRuntime = scheduleMedia.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
            if (epRuntime) otherRuntime = epRuntime;
          } else if (scheduleMedia.type === 'book') {
            otherRuntime = schedule.session_duration || 30;
          }

          const scheduleStart = new Date(schedule.scheduled_date);
          const scheduleEnd = new Date(scheduleStart.getTime() + otherRuntime * 60000);

          if ((scheduledDateTime < scheduleEnd && endTime > scheduleStart)) {
            conflictList.push({
              title: scheduleMedia.title,
              device: scheduleMedia.device,
              time: scheduleStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
              endTime: scheduleEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
            });
          }
        });

        setConflicts(conflictList);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    };

    checkConflictsAndSuggestions();
  }, [date, time, media, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    
    try {
      const scheduledDateTime = new Date(`${date}T${time}`).toISOString();
      const seasonNum = media.type === 'series' ? parseInt(seasonNumber) : undefined;
      const episodeNum = media.type === 'series' ? parseInt(episodeNumber) : undefined;

      const viewersData = selectedViewers.length > 0 ? selectedViewers.map(userId => {
        const user = allUsers.find(u => u.id === userId);
        return user ? {
          user_id: user.id,
          name: user.full_name,
          email: user.email,
          avatar: user.profile_picture || ''
        } : null;
      }).filter(Boolean) : [];

      await executeAction(existingSchedule ? 'Updating Schedule' : 'Scheduling', async () => {
        const result = await onSchedule(
          media.id, 
          scheduledDateTime, 
          seasonNum,
          episodeNum,
          existingSchedule?.id,
          device,
          media.type === 'book' ? null : audioFormat,
          media.type === 'book' ? null : videoFormat,
          media.type === 'book' ? sessionDuration : null,
          selectedSeats.length > 0 ? selectedSeats : undefined,
          viewersData.length > 0 ? viewersData : undefined
        );
        
        if (result !== true) {
          throw new Error('Failed to schedule');
        }
      }, {
        successTitle: existingSchedule ? 'Schedule Updated' : 'Scheduled Successfully',
        successSubtitle: `${media.title} has been ${existingSchedule ? 'rescheduled' : 'scheduled'}`
      });
      
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!media) return null;

  const getEpisodeCount = (season) => {
    if (!media.episodes_per_season || !media.episodes_per_season[season - 1]) return 10;
    return media.episodes_per_season[season - 1];
  };

  // Get seat layout based on device
  const getSeatLayout = () => {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('tv') || deviceLower === 'projector' || deviceLower === 'big screen' || deviceLower === 'theater') {
      return {
        type: 'sofa',
        seats: ['left', 'center', 'right'],
        icon: Sofa,
        label: 'Sofa Seating'
      };
    } else if (deviceLower.includes('phone') || deviceLower === 'e-reader' || deviceLower === 'kindle') {
      return {
        type: 'personal',
        seats: ['solo'],
        icon: Smartphone,
        label: 'Personal Viewing'
      };
    } else {
      return {
        type: 'desk',
        seats: ['left', 'center', 'right'],
        icon: Armchair,
        label: 'Desk/Casual Seating'
      };
    }
  };

  const seatLayout = getSeatLayout();

  const toggleSeat = (seat) => {
    setSelectedSeats(prev => 
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const toggleViewer = (userId) => {
    setSelectedViewers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-3 sm:p-6 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500" />
            {existingSchedule ? 'Reschedule Watch' : 'Schedule Watch Time'}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-zinc-800/50 rounded-xl flex gap-3 sm:gap-4">
          {media.poster_url ? (
            <img src={media.poster_url} alt={media.title} className="w-12 h-18 sm:w-16 sm:h-24 object-cover rounded-lg" />
          ) : (
            <div className="w-12 h-18 sm:w-16 sm:h-24 bg-zinc-700 rounded-lg flex items-center justify-center text-xl sm:text-2xl text-zinc-500">
              {media.title?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base truncate">{media.title}</h3>
            {media.type === 'book' ? (
              <p className="text-xs sm:text-sm text-white mt-1 flex items-center gap-1">
                <Book className="w-3 sm:w-4 h-3 sm:h-4 text-blue-400" />
                {media.total_pages} pages total
              </p>
            ) : media.type === 'series' && seasonNumber && episodeNumber ? (
              <p className="text-xs sm:text-sm text-white mt-1">
                {(() => {
                  const epRuntime = media.episode_runtimes?.[parseInt(seasonNumber) - 1]?.[parseInt(episodeNumber) - 1] || media.runtime_minutes;
                  return `${Math.floor(epRuntime / 60)}h ${epRuntime % 60}m`;
                })()}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-white mt-1">
                {Math.floor(media.runtime_minutes / 60)}h {media.runtime_minutes % 60}m
              </p>
            )}
            {media.platform && (
              <div className="mt-2">
                <PlatformBadge platform={media.platform} size="sm" />
              </div>
            )}
            {media.type === 'series' && completedEpisodes?.length > 0 && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {completedEpisodes.length} episode{completedEpisodes.length > 1 ? 's' : ''} completed
                {media.status === 'watched' && ' • Add more seasons to continue'}
              </p>
            )}
            {media.type === 'book' && media.pages_read > 0 && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <Book className="w-3 h-3" />
                {media.pages_read} / {media.total_pages} pages read ({Math.round((media.pages_read / media.total_pages) * 100)}%)
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
          {media.type === 'series' && media.seasons_count && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs sm:text-sm">Season</Label>
                <Select value={seasonNumber} onValueChange={setSeasonNumber}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {Array.from({ length: media.seasons_count }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white text-sm">
                        Season {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs sm:text-sm">Episode</Label>
                <Select value={episodeNumber} onValueChange={setEpisodeNumber}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                    {Array.from({ length: getEpisodeCount(parseInt(seasonNumber)) }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white text-sm">
                        Episode {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
              Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={media.is_future_release && media.release_date ? media.release_date : undefined}
              required
              className="bg-zinc-800 border-zinc-700 text-white focus:border-amber-500 h-9 text-sm"
            />
            {media.is_future_release && media.release_date && (
              <p className="text-xs text-blue-400">
                Can schedule from {new Date(media.release_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2 text-xs sm:text-sm">
              <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
              Start Time
            </Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white focus:border-amber-500 h-9 text-sm"
            />
          </div>

          {/* Session Duration for books */}
          {media.type === 'book' && (
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                Reading Duration (minutes)
              </Label>
              <Input
                type="number"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                min={5}
                max={480}
                className="bg-zinc-800 border-zinc-700 text-white focus:border-amber-500 h-9 text-sm"
              />
            </div>
          )}

          {/* Device Selection */}
          <div className="space-y-2">
            <Label className="text-zinc-300 flex items-center gap-2 text-xs sm:text-sm">
              <Monitor className="w-3 sm:w-4 h-3 sm:h-4" />
              {media.type === 'book' ? 'Reading Device' : 'Device'}
            </Label>
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {media.type === 'book' ? (
                  <>
                    <SelectItem value="E-Reader" className="text-white text-sm">E-Reader</SelectItem>
                    <SelectItem value="Tablet" className="text-white text-sm">Tablet</SelectItem>
                    <SelectItem value="Phone" className="text-white text-sm">Phone</SelectItem>
                    <SelectItem value="Laptop" className="text-white text-sm">Laptop</SelectItem>
                    <SelectItem value="Physical Book" className="text-white text-sm">Physical Book</SelectItem>
                    <SelectItem value="Other" className="text-white text-sm">Other</SelectItem>
                  </>
                ) : (
                 devices.filter(d => d && d.trim()).map(d => (
                   <SelectItem key={d} value={d} className="text-white text-sm">{d}</SelectItem>
                 ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Audio & Video Format (not for books) */}
          {media.type !== 'book' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2 text-xs sm:text-sm">
                  <Volume2 className="w-3 sm:w-4 h-3 sm:h-4" />
                  Audio
                </Label>
                <Select value={audioFormat} onValueChange={setAudioFormat}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                    {audioFormats.filter(a => a && a.trim()).map(a => (
                      <SelectItem key={a} value={a} className="text-white text-sm">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2 text-xs sm:text-sm">
                  <Video className="w-3 sm:w-4 h-3 sm:h-4" />
                  Video
                </Label>
                <Select value={videoFormat} onValueChange={setVideoFormat}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                    {videoFormats.filter(v => v && v.trim()).map(v => (
                      <SelectItem key={v} value={v} className="text-white text-sm">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Seat Selection & Watch/Reading Party Options */}
          <div className="pt-2 border-t border-zinc-800">
              <Button
                type="button"
                onClick={() => setShowSeatSelection(!showSeatSelection)}
                className="w-full bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30 text-white border border-purple-500/50 h-9 text-xs sm:text-sm"
              >
                <seatLayout.icon className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                {showSeatSelection ? `Hide ${media.type === 'book' ? 'Reading' : 'Watch'} Party Options` : `👥 ${media.type === 'book' ? 'Reading' : 'Watch'} Party & Seats (Optional)`}
              </Button>
            </div>

          {/* Seat Selection UI */}
          <AnimatePresence>
            {showSeatSelection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 sm:space-y-4 overflow-hidden"
              >
                {/* Seat Layout */}
                <div className="bg-zinc-800/50 rounded-xl p-3 sm:p-4 border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <seatLayout.icon className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                    <Label className="text-white text-xs sm:text-sm font-semibold">{seatLayout.label}</Label>
                  </div>
                  
                  {/* Seats Display */}
                  <div className={`flex ${seatLayout.seats.length === 1 ? 'justify-center' : 'justify-around'} gap-2 sm:gap-3`}>
                    {seatLayout.seats.map((seat) => (
                      <motion.button
                        key={seat}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSeat(seat)}
                        className={`
                          relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg
                          transition-all duration-300 border-2
                          ${selectedSeats.includes(seat) 
                            ? 'bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50' 
                            : 'bg-zinc-700 border-zinc-600 hover:border-purple-500/50'}
                        `}
                      >
                        <Armchair className={`w-5 h-5 sm:w-6 sm:h-6 ${selectedSeats.includes(seat) ? 'text-white' : 'text-zinc-400'}`} />
                        <span className={`text-[9px] sm:text-[10px] mt-1 capitalize ${selectedSeats.includes(seat) ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                          {seat}
                        </span>
                        {selectedSeats.includes(seat) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                          >
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {selectedSeats.length > 0 && (
                    <p className="text-xs text-emerald-400 mt-3 text-center">
                      {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Viewers Selection - Only show if multiple seats selected */}
                {selectedSeats.length > 1 && allUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-800/50 rounded-xl p-3 sm:p-4 border border-zinc-700"
                  >
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <Users className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400" />
                      <Label className="text-white text-xs sm:text-sm font-semibold">Add Viewers (Optional)</Label>
                    </div>
                    
                    <div className="space-y-1.5 sm:space-y-2 max-h-28 sm:max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                      {allUsers.map((user) => (
                        <motion.button
                          key={user.id}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleViewer(user.id)}
                          className={`
                            w-full flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-all
                            ${selectedViewers.includes(user.id)
                              ? 'bg-amber-500/20 border border-amber-500/50'
                              : 'bg-zinc-700/50 border border-zinc-600 hover:border-amber-500/50'}
                          `}
                        >
                          <div className={`
                            w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${selectedViewers.includes(user.id) ? 'bg-amber-500' : 'bg-zinc-600'}
                          `}>
                            {user.profile_picture ? (
                              <img src={user.profile_picture} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-white text-xs sm:text-sm font-bold">
                                {user.full_name?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className={`text-xs sm:text-sm font-medium truncate ${selectedViewers.includes(user.id) ? 'text-white' : 'text-zinc-300'}`}>
                              {user.full_name}
                            </p>
                            <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{user.email}</p>
                          </div>
                          {selectedViewers.includes(user.id) && (
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {selectedViewers.length > 0 && (
                      <p className="text-[10px] sm:text-xs text-amber-400 mt-2 sm:mt-3">
                        {selectedViewers.length} viewer{selectedViewers.length > 1 ? 's' : ''} added
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Runtime and End Time Display */}
          {date && time && (() => {
            let runtime = media.runtime_minutes;
            if (media.type === 'series' && seasonNumber && episodeNumber) {
              const epRuntime = media.episode_runtimes?.[parseInt(seasonNumber) - 1]?.[parseInt(episodeNumber) - 1];
              if (epRuntime && epRuntime > 0) runtime = epRuntime;
            } else if (media.type === 'book') {
              runtime = sessionDuration;
            }
            return (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
                <span className="text-zinc-400">
                  Runtime: <span className="text-white font-medium">
                    {Math.floor(runtime / 60)}h {runtime % 60}m
                  </span>
                </span>
                <span className="text-zinc-400">
                  Ends: <span className="text-amber-400 font-medium">
                    {new Date(new Date(`${date}T${time}`).getTime() + runtime * 60000)
                      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </span>
              </div>
            );
          })()}

          {/* AI Scheduling Assistant */}
          {aiSuggestion && (
            <div className={`rounded-lg p-3 sm:p-4 border-2 ${
              aiSuggestion.type === 'warning' ? 'bg-orange-500/10 border-orange-500' :
              aiSuggestion.type === 'info' ? 'bg-blue-500/10 border-blue-500' :
              'bg-emerald-500/10 border-emerald-500'
            }`}>
              <div className="flex items-start gap-2 sm:gap-3">
                <Sparkles className="w-4 sm:w-6 h-4 sm:h-6 text-purple-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold mb-1 text-xs sm:text-sm ${
                    aiSuggestion.type === 'warning' ? 'text-orange-400' :
                    aiSuggestion.type === 'info' ? 'text-blue-400' :
                    'text-emerald-400'
                  }`}>AI Assistant</h4>
                  <p className="text-xs sm:text-sm text-white">{aiSuggestion.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-red-500 font-semibold mb-2 text-xs sm:text-sm">Conflict Detected!</h4>
                  <p className="text-[10px] sm:text-xs text-zinc-300 mb-2">Other titles scheduled:</p>
                  {conflicts.map((conflict, idx) => (
                    <p key={idx} className="text-[10px] sm:text-xs text-white mb-1 truncate">
                      • "{conflict.title}" ({conflict.time} - {conflict.endTime})
                    </p>
                  ))}
                  <p className="text-[10px] sm:text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>You can still schedule</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" onClick={onClose} className="flex-1 bg-white text-black hover:bg-zinc-100 h-9 text-xs sm:text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-medium h-9 text-xs sm:text-sm">
              {loading ? 'Scheduling...' : (existingSchedule ? 'Update' : 'Schedule')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}