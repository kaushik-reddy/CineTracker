import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Film, Tv, Calendar, Library, Loader2, History, BarChart3, Home as HomeIcon, ArrowUpDown, User, Trophy, Shield, Book, Edit2, Save, LogOut, Star, Clock as ClockIcon, XCircle, Users, DollarSign, Play, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAction } from "@/components/feedback/useAction";
import { toast } from "@/components/ui/use-toast";

import MediaCard from "@/components/media/MediaCard";
import MediaForm from "@/components/media/MediaForm";
import ScheduleModal from "@/components/media/ScheduleModal";
import AddHistoryModal from "@/components/media/AddHistoryModal";
import SelectTitleModal from "@/components/media/SelectTitleModal";
import AddSeasonsModal from "@/components/media/AddSeasonsModal";
import RatingModal from "@/components/common/RatingModal";
import PagesReadModal from "@/components/common/PagesReadModal";
import UpcomingSchedule from "@/components/media/UpcomingSchedule";

import JumpTimeModal from "@/components/schedule/JumpTimeModal";
import AdjustBookProgressModal from "@/components/media/AdjustBookProgressModal";
import TimelineView from "@/components/media/TimelineViewNew";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import HistoryView from "@/components/history/HistoryView";
import StatsView from "@/components/stats/StatsView";
import HomePage from "@/components/home/HomePage";
import Footer from "@/components/common/Footer";
import AppHeader from "@/components/common/AppHeader";
import PageHelpButton from "@/components/common/PageHelpButton";
import AchievementsView from "@/components/achievements/AchievementsView";
import PDFViewer from "@/components/books/PDFViewer";
import IllustratedBookReader from "@/components/books/IllustratedBookReader";

import WatchPartyDashboard from "@/components/watch-party/WatchPartyDashboard";
import AdminSpace from "./AdminSpace";
import Spending from "./Spending";

import { useRealTimeSubscription } from "@/hooks/useRealTimeSubscription";

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [scheduleMedia, setScheduleMedia] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [addHistoryMedia, setAddHistoryMedia] = useState(null);
  const [showSelectTitle, setShowSelectTitle] = useState(false);
  const [addSeasonsMedia, setAddSeasonsMedia] = useState(null);
  const [ratingModal, setRatingModal] = useState(null);
  const [pagesReadModal, setPagesReadModal] = useState(null);
  const [adjustProgressModal, setAdjustProgressModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState('home');
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [preferencesApplied, setPreferencesApplied] = useState(false);
  const [highlightedMediaId, setHighlightedMediaId] = useState(null);
  const [playingScheduleId, setPlayingScheduleId] = useState(null);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // Apply library filter when view changes to library
  useEffect(() => {
    if (view === 'library' && libraryFilter !== 'all') {
      setActiveTab(libraryFilter);
      setLibraryFilter('all');
    }
  }, [view, libraryFilter]);

  // Highlight effect with scroll
  useEffect(() => {
    if (highlightedMediaId) {
      setTimeout(() => {
        const element = document.querySelector(`[data-media-id="${highlightedMediaId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      const timer = setTimeout(() => setHighlightedMediaId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMediaId]);
  const [user, setUser] = useState(null);
  const [jumpTimeModal, setJumpTimeModal] = useState(null);
  const [pdfViewerData, setPdfViewerData] = useState(null);
  const timerRef = useRef(null);
  const { executeAction } = useAction();

  // Watch Party state
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);
  const [showJoinPartyModal, setShowJoinPartyModal] = useState(false);

  useEffect(() => {
    const handleOpenJoinParty = () => setShowJoinPartyModal(true);
    window.addEventListener('open-join-party', handleOpenJoinParty);
    return () => window.removeEventListener('open-join-party', handleOpenJoinParty);
  }, []);


  // Profile page state
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);

  // Apply user preferences on load (once)
  useEffect(() => {
    if (user && !preferencesApplied) {
      // Apply default view preference only on first load
      if (user.default_view && !sessionStorage.getItem('user_navigated')) {
        setView(user.default_view);
      }

      // Apply default filters
      if (user.default_platform && user.default_platform !== 'all') {
        setFilterPlatform(user.default_platform);
      }
      if (user.default_language && user.default_language !== 'all') {
        setFilterLanguage(user.default_language);
      }

      setPreferencesApplied(true);
    }
  }, [user, preferencesApplied]);

  // Join Watch Party state
  // Listen for view navigation events
  useEffect(() => {
    const handleNavigateToView = (e) => {
      const { view: targetView } = e.detail;
      if (targetView) {
        setView(targetView);
      }
    };

    window.addEventListener('navigate-to-view', handleNavigateToView);

    return () => {
      window.removeEventListener('navigate-to-view', handleNavigateToView);
    };
  }, []);

  // Track user navigation
  useEffect(() => {
    if (view !== 'home' && view !== (user?.default_view || 'home')) {
      sessionStorage.setItem('user_navigated', 'true');
    }
  }, [view, user]);



  // Poll subscription status when user has pending subscription
  const { data: polledSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['user-subscription-status', user?.email],
    queryFn: async () => {
      if (!user?.email || user.role === 'admin') return null;
      const subs = await base44.entities.Subscription.filter({
        user_email: user.email,
        status: ['active', 'pending_payment', 'processing', 'rejected']
      });
      return subs[0] || null;
    },
    enabled: !!user?.pendingSubscription,
    refetchInterval: 10000 // Poll every 10 seconds when waiting for approval
  });

  // Auto-update user status when subscription changes
  useEffect(() => {
    if (polledSubscription && user?.pendingSubscription) {
      if (polledSubscription.status === 'active') {
        // Subscription was approved! Reload the page to get access
        window.location.reload();
      } else if (polledSubscription.status !== user.pendingSubscription.status) {
        // Status changed, update user object
        setUser({ ...user, pendingSubscription: polledSubscription });
      }
    }
  }, [polledSubscription]);

  // CRITICAL: Check subscription before rendering anything
  useEffect(() => {
    let isMounted = true;

    const checkSubscriptionAccess = async () => {
      try {
        // Get current user
        const currentUser = await base44.auth.me();

        // Admin can access without subscription
        if (currentUser.role === 'admin') {
          if (isMounted) setUser(currentUser);

          // Preload admin data
          const { preloadAllOptions } = await import('@/components/admin/ConfigLoader');
          const { preloadAllLogos } = await import('@/components/admin/LogoCache');
          Promise.all([preloadAllOptions(), preloadAllLogos()]);
          return;
        }

        // For regular users, check subscription status
        const activeSubscriptions = await base44.entities.Subscription.filter({
          user_email: currentUser.email,
          status: ['active', 'pending_payment', 'processing', 'rejected', 'trial']
        });

        // No subscription - redirect to Landing to choose plan
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
          window.location.replace('/Landing');
          return;
        }

        // If subscription exists but not active, show waiting screen
        const userSub = activeSubscriptions[0];
        if (userSub.status !== 'active') {
          // Show payment pending/processing screen
          if (isMounted) {
            setUser({ ...currentUser, pendingSubscription: userSub });
          }
          return;
        }

        // User has valid subscription
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // Not authenticated - redirect to Login
        window.location.replace('/Login');
      }
    };

    checkSubscriptionAccess();

    // Listen for adjust book progress events
    const handleAdjustProgress = (e) => {
      setAdjustProgressModal(e.detail);
    };
    window.addEventListener('adjust-book-progress', handleAdjustProgress);

    return () => {
      isMounted = false;
      window.removeEventListener('adjust-book-progress', handleAdjustProgress);
    };
  }, []);



  // Fetch media (user-isolated + media from shared schedules)
  const { data: mediaList = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['media', user?.email, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // All users (including admin) see only their own media - strict isolation
      // Get user's own media
      const ownMedia = await base44.entities.Media.filter({ created_by: user.email }, '-created_date');

      // Get all schedules where user is involved (including shared)
      const allSchedules = await base44.entities.WatchSchedule.list();
      const userSchedules = allSchedules.filter(s =>
        s.created_by === user.email ||
        s.viewers?.some(v => v.user_id === user.id || v.email === user.email)
      );

      // Extract unique media IDs from schedules
      const scheduleMediaIds = userSchedules.map(s => s.media_id);

      // Also get media IDs from Watch Parties
      const allParties = await base44.entities.WatchParty.list();
      const userParties = allParties.filter(p =>
        p.host_email === user.email || p.participants?.some(part => part.email === user.email)
      );
      const partyMediaIds = userParties.map(p => p.media_id);

      // Combine all media IDs
      const mediaIds = [...new Set([...scheduleMediaIds, ...partyMediaIds])];

      // Fetch media for these IDs
      const allMedia = await base44.entities.Media.list('-created_date');
      const scheduledMedia = allMedia.filter(m => mediaIds.includes(m.id));

      // Combine and deduplicate
      const combined = [...ownMedia, ...scheduledMedia];
      const uniqueMedia = Array.from(new Map(combined.map(m => [m.id, m])).values());

      return uniqueMedia.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Get last library update date
  const lastLibraryUpdate = useMemo(() => {
    if (!mediaList || mediaList.length === 0) return null;
    return mediaList[0]?.created_date; // Already sorted by -created_date
  }, [mediaList]);

  // Real-time sync for schedules
  useRealTimeSubscription('WatchSchedule', {
    enabled: !!user,
  }, (payload) => {
    console.log('Real-time update received (Schedule):', payload);
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
    queryClient.invalidateQueries({ queryKey: ['media'] });
  });

  // Real-time sync for watch parties
  // Real-time sync for watch parties
  useRealTimeSubscription('WatchParty', {
    enabled: !!user,
  }, async (payload) => {
    console.log('Real-time update received (Party):', payload);
    // Invalidate generic and user-specific queries
    await queryClient.invalidateQueries({ queryKey: ['schedules'], exact: false });
    await queryClient.invalidateQueries({ queryKey: ['media'], exact: false });

    // Force immediate refetch for active views
    await queryClient.refetchQueries({ queryKey: ['schedules'], exact: false });
  });



  // Fetch schedules (user-isolated + shared schedules)
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', user?.email, user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('[Home] Refreshing schedules heartbeat...');

      // All users (including admin) see only their own schedules - strict isolation
      // Users see their own schedules + schedules where they're invited
      const ownSchedules = await base44.entities.WatchSchedule.filter({ created_by: user.email }, '-scheduled_date');

      // Get all schedules to filter by viewers
      const allSchedules = await base44.entities.WatchSchedule.list('-scheduled_date');
      const sharedSchedules = allSchedules.filter(s =>
        s.created_by !== user.email &&
        s.viewers?.some(v => v.user_id === user.id || v.email === user.email)
      );

      // Combine and deduplicate
      const combined = [...ownSchedules, ...sharedSchedules];

      // Fetch Watch Parties to show in schedule
      const allParties = await base44.entities.WatchParty.list();
      const userParties = allParties.filter(p =>
        (p.host_email === user.email || p.participants?.some(part => part.email === user.email)) &&
        p.status !== 'ended' // Only show active/scheduled parties
      );

      // Map parties to schedule format
      const partySchedules = userParties.map(p => ({
        id: `party_${p.id}`,
        media_id: p.media_id,
        scheduled_date: p.scheduled_start,
        status: p.is_playing ? 'in_progress' : (p.status === 'live' ? 'paused' : 'scheduled'),
        created_by: p.host_email,
        is_watch_party: true,
        party_data: p,
        elapsed_seconds: p.current_time || 0,
        last_resumed_at: p.last_sync_at,
        viewers: p.participants || []
      }));

      // Filter out personal schedules that are redundant because there's an active party mapping
      const activePartyScheduleIds = partySchedules.map(p => p.party_data?.id);
      const filteredPersonal = combined.filter(s =>
        !(s.is_watch_party && activePartyScheduleIds.includes(s.shared_party_id))
      );

      const allItems = [...filteredPersonal, ...partySchedules];
      const uniqueSchedules = Array.from(new Map(allItems.map(s => [s.id, s])).values());

      return uniqueSchedules.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
    },
    enabled: !!user,
    refetchInterval: 10000, // 10s heartbeat
    staleTime: 5000,
    refetchOnMount: 'always'
  });

  // Get user's subscription and plan permissions
  const { data: userSubscription } = useQuery({
    queryKey: ['user-subscription', user?.email],
    queryFn: async () => {
      if (!user || user.role === 'admin') return null;
      const subs = await base44.entities.Subscription.filter({
        user_email: user.email,
        status: ['trial', 'active']
      });
      return subs[0] || null;
    },
    enabled: !!user && user.role !== 'admin'
  });

  const { data: userPlan } = useQuery({
    queryKey: ['user-plan', userSubscription?.plan_id],
    queryFn: () => base44.entities.Plan.filter({ id: userSubscription.plan_id }),
    enabled: !!userSubscription,
    select: (data) => data?.[0] || null
  });

  // Determine user permissions based on role and plan
  const userPermissions = React.useMemo(() => {
    if (user?.role === 'admin') {
      // Admin has all permissions
      return {
        can_add_title: true,
        can_schedule: true,
        can_watch: true,
        can_edit: true,
        can_delete: true,
        can_add_history: true,
        can_mark_complete: true
      };
    }

    // Regular users get permissions from their plan
    return {
      can_add_title: userPlan?.can_add_title ?? true,
      can_schedule: userPlan?.can_schedule ?? true,
      can_watch: userPlan?.can_watch ?? true,
      can_edit: userPlan?.can_edit ?? true,
      can_delete: userPlan?.can_delete ?? true,
      can_add_history: userPlan?.can_add_history ?? true,
      can_mark_complete: userPlan?.can_mark_complete ?? true
    };
  }, [user, userPlan]);



  // Create media mutation
  const createMediaMutation = useMutation({
    mutationFn: (data) => base44.entities.Media.create({
      ...data,
      created_by: user?.email
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] })
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.WatchSchedule.create({
      ...data,
      created_by: user?.email
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      await queryClient.refetchQueries({ queryKey: ['schedules', user?.email, user?.id] });
    }
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WatchSchedule.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      await queryClient.refetchQueries({ queryKey: ['schedules', user?.email, user?.id] });
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchSchedule.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      await queryClient.refetchQueries({ queryKey: ['schedules', user?.email, user?.id] });
    }
  });

  // Update media mutation
  const updateMediaMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Media.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] })
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: (id) => base44.entities.Media.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] })
  });

  // Delete Watch Party mutation
  const deleteWatchPartyMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchParty.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['schedules'] });
    }
  });

  // Fetch all users for admin
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin'
  });

  // Profile page mutations
  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
      // Fetch updated user immediately
      const updatedUser = await base44.auth.me();
      return updatedUser;
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      setProfileFormData({});
      setProfileEditing(false);
      // Invalidate all queries that depend on user data
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      await queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      // Force refetch to update UI immediately
      await queryClient.refetchQueries({ queryKey: ['current-user'] });
      await queryClient.refetchQueries({ queryKey: ['all-users'] });
    }
  });

  // Delete user mutation with data cleanup
  const deleteUserMutation = useMutation({
    mutationFn: async (userEmail) => {
      // Delete user's subscriptions
      const userSubs = await base44.entities.Subscription.filter({ user_email: userEmail });
      await Promise.all(userSubs.map(s => base44.entities.Subscription.delete(s.id)));

      // Delete user's payments
      const userPayments = await base44.entities.Payment.filter({ user_email: userEmail });
      await Promise.all(userPayments.map(p => base44.entities.Payment.delete(p.id)));

      // Delete user's invoices
      const userInvoices = await base44.entities.Invoice.filter({ user_email: userEmail });
      await Promise.all(userInvoices.map(i => base44.entities.Invoice.delete(i.id)));

      // Delete user's analytics
      const userAnalytics = await base44.entities.UsageAnalytics.filter({ user_email: userEmail });
      await Promise.all(userAnalytics.map(a => base44.entities.UsageAnalytics.delete(a.id)));

      // Delete user's media
      const userMedia = await base44.entities.Media.filter({ created_by: userEmail });
      await Promise.all(userMedia.map(m => base44.entities.Media.delete(m.id)));

      // Delete user's schedules
      const userSchedules = await base44.entities.WatchSchedule.filter({ created_by: userEmail });
      await Promise.all(userSchedules.map(s => base44.entities.WatchSchedule.delete(s.id)));

      // Finally delete the user
      const userRecord = allUsers.find(u => u.email === userEmail);
      if (userRecord) {
        await base44.entities.User.delete(userRecord.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-payments'] });
    }
  });

  // Create media map for quick lookup
  const mediaMap = useMemo(() => {
    return mediaList.reduce((acc, m) => ({ ...acc, [m.id]: m }), {});
  }, [mediaList]);

  // Get schedule map for quick lookup
  const scheduleMap = useMemo(() => {
    return schedules.reduce((acc, s) => {
      if (s.status !== 'completed') {
        acc[s.media_id] = s;
      }
      return acc;
    }, {});
  }, [schedules]);

  // Filters state
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [filterActor, setFilterActor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter and sort media
  const filteredMedia = useMemo(() => {
    let filtered = mediaList.filter((m) => {
      const matchesSearch = m.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeTab === 'all' || m.type === activeTab;
      const matchesLanguage = filterLanguage === 'all' || m.language === filterLanguage;
      const matchesYear = filterYear === 'all' || m.year?.toString() === filterYear;
      const matchesGenre = filterGenre === 'all' || m.genre?.includes(filterGenre);
      const matchesPlatform = filterPlatform === 'all' || m.platform === filterPlatform;
      const matchesAge = filterAge === 'all' || m.age_restriction === filterAge;
      const matchesActor = filterActor === 'all' || m.actors?.includes(filterActor);

      // Advanced Status Filter
      const hasInProgressSchedule = schedules.some(s =>
        s.media_id === m.id && (s.status === 'in_progress' || s.status === 'paused')
      );
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'completed' && m.status === 'watched') ||
        (filterStatus === 'in_progress' && hasInProgressSchedule) ||
        (filterStatus === 'not_started' && m.status === 'unwatched' && !hasInProgressSchedule);

      return matchesSearch && matchesType && matchesLanguage && matchesYear && matchesGenre && matchesPlatform && matchesAge && matchesActor && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      // Always put watched at the end
      if (a.status === 'watched' && b.status !== 'watched') return 1;
      if (a.status !== 'watched' && b.status === 'watched') return -1;

      switch (sortBy) {
        case 'newest':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'oldest':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        case 'runtime-short':
          return a.runtime_minutes - b.runtime_minutes;
        case 'runtime-long':
          return b.runtime_minutes - a.runtime_minutes;
        case 'rating-high':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating-low':
          return (a.rating || 0) - (b.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [mediaList, searchQuery, activeTab, sortBy, filterLanguage, filterYear, filterGenre, filterPlatform, filterAge, filterActor, filterStatus, schedules]);

  // Get active/upcoming schedules
  const activeSchedules = useMemo(() => {
    return schedules.filter((s) => s.status !== 'completed').sort((a, b) => {
      // Prioritize in_progress and paused
      if (a.status === 'in_progress' || a.status === 'paused') return -1;
      if (b.status === 'in_progress' || b.status === 'paused') return 1;
      return new Date(a.scheduled_date) - new Date(b.scheduled_date);
    });
  }, [schedules]);

  // Get completed schedules for history
  const completedSchedules = useMemo(() => {
    return schedules.
      filter((s) => s.status === 'completed').
      sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  }, [schedules]);

  // Calculate unique history count (books counted once)
  const historyCount = useMemo(() => {
    const bookIds = new Set();
    let nonBookCount = 0;

    completedSchedules.forEach(schedule => {
      const media = mediaMap[schedule.media_id];
      if (!media) return;

      if (media.type === 'book') {
        bookIds.add(media.id);
      } else {
        nonBookCount++;
      }
    });

    return bookIds.size + nonBookCount;
  }, [completedSchedules, mediaMap]);

  // Get completed episodes for a media
  const getCompletedEpisodes = (mediaId) => {
    return schedules.filter((s) => s.media_id === mediaId && s.status === 'completed');
  };

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const languages = new Set();
    const years = new Set();
    const genres = new Set();
    const platforms = new Set();
    const ageRatings = new Set();
    const actors = new Set();

    mediaList.forEach((m) => {
      if (m.language && m.language.trim()) languages.add(m.language);
      if (m.year) years.add(m.year.toString());
      if (m.genre) m.genre.forEach((g) => { if (g && g.trim()) genres.add(g); });
      if (m.platform && m.platform.trim()) platforms.add(m.platform);
      if (m.age_restriction && m.age_restriction.trim()) ageRatings.add(m.age_restriction);
      if (m.actors) m.actors.forEach((a) => { if (a && a.trim()) actors.add(a); });
    });

    return {
      languages: Array.from(languages).filter(Boolean).sort(),
      years: Array.from(years).filter(Boolean).sort((a, b) => b - a),
      genres: Array.from(genres).filter(Boolean).sort(),
      platforms: Array.from(platforms).filter(Boolean).sort(),
      ageRatings: Array.from(ageRatings).filter(Boolean),
      actors: Array.from(actors).filter(Boolean).sort()
    };
  }, [mediaList]);

  const handleAddMedia = async (data) => {
    if (editingMedia) {
      await updateMediaMutation.mutateAsync({ id: editingMedia.id, data });
      setEditingMedia(null);
    } else {
      await createMediaMutation.mutateAsync(data);
    }
  };

  const handleAddSeasons = async (media, data) => {
    await updateMediaMutation.mutateAsync({
      id: media.id,
      data: {
        ...data,
        status: 'unwatched' // Reset status when adding new seasons
      }
    });
  };

  const handleEditMedia = (media) => {
    setEditingMedia(media);
    setShowAddForm(true);
  };

  const handleDeleteMedia = async (mediaId) => {
    const media = mediaMap[mediaId];
    if (!media) return;

    await executeAction('Deleting', async () => {
      await deleteMediaMutation.mutateAsync(mediaId);
    }, {
      successTitle: 'Deleted Successfully',
      successSubtitle: `${media.title} has been removed from your library`
    });
  };

  const handleSchedule = async (mediaId, scheduledDate, seasonNumber, episodeNumber, existingScheduleId, device, audioFormat, videoFormat, sessionDuration, seatsSelected, viewers) => {
    try {
      const media = mediaMap[mediaId];
      if (!media) {
        console.error('Media not found for id:', mediaId);
        return false;
      }

      // Check for scheduling conflicts
      const scheduledTime = new Date(scheduledDate);
      let episodeRuntime = media.runtime_minutes;
      if (media.type === 'series' && seasonNumber && episodeNumber) {
        const epRuntime = media.episode_runtimes?.[seasonNumber - 1]?.[episodeNumber - 1];
        if (epRuntime) episodeRuntime = epRuntime;
      } else if (media.type === 'book') {
        episodeRuntime = sessionDuration || 30;
      }

      const endTime = new Date(scheduledTime.getTime() + episodeRuntime * 60 * 1000);

      const conflicts = schedules.filter(s => {
        if (s.status === 'completed') return false;
        if (existingScheduleId && s.id === existingScheduleId) return false;

        const otherMedia = mediaMap[s.media_id];
        if (!otherMedia) return false;

        let otherRuntime = otherMedia.runtime_minutes;
        if (otherMedia.type === 'series' && s.season_number && s.episode_number) {
          const epRuntime = otherMedia.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
          if (epRuntime) otherRuntime = epRuntime;
        }

        const otherStart = new Date(s.scheduled_date);
        const otherEnd = new Date(otherStart.getTime() + otherRuntime * 60 * 1000);

        return (scheduledTime < otherEnd && endTime > otherStart);
      });

      if (conflicts.length > 0) {
        return false;
      }

      if (existingScheduleId) {
        await updateScheduleMutation.mutateAsync({
          id: existingScheduleId,
          data: {
            scheduled_date: scheduledDate,
            season_number: seasonNumber,
            episode_number: episodeNumber,
            status: 'scheduled',
            elapsed_seconds: 0,
            device: device,
            audio_format: audioFormat,
            video_format: videoFormat,
            seats_selected: seatsSelected,
            viewers: viewers
          }
        });

        // Show Dynamic Island notification
        const { showDynamicIslandNotification } = await import('@/components/pwa/DynamicIsland');
        showDynamicIslandNotification({
          icon: 'schedule',
          title: 'Schedule Updated',
          message: media.title
        });
      } else {
        const existingForMedia = schedules.find(s =>
          s.media_id === mediaId &&
          s.status !== 'completed' &&
          (!seasonNumber || (s.season_number === seasonNumber && s.episode_number === episodeNumber))
        );

        if (existingForMedia) {
          await updateScheduleMutation.mutateAsync({
            id: existingForMedia.id,
            data: {
              scheduled_date: scheduledDate,
              season_number: seasonNumber,
              episode_number: episodeNumber,
              status: 'scheduled',
              elapsed_seconds: 0,
              device: device,
              audio_format: audioFormat,
              video_format: videoFormat,
              seats_selected: seatsSelected,
              viewers: viewers
            }
          });
        } else {
          // Create schedule for the current user (host)
          const hostSchedule = await createScheduleMutation.mutateAsync({
            media_id: mediaId,
            scheduled_date: scheduledDate,
            season_number: seasonNumber,
            episode_number: episodeNumber,
            status: 'scheduled',
            elapsed_seconds: 0,
            device: device,
            audio_format: audioFormat,
            video_format: videoFormat,
            session_duration: sessionDuration,
            seats_selected: seatsSelected,
            viewers: viewers
          });

          // Create schedules for all invited viewers
          if (viewers && viewers.length > 0) {
            const { createViewerSchedules } = await import('@/components/media/MultiViewerHandler');
            await createViewerSchedules(hostSchedule, media, viewers);
          }

          if (media.type !== 'series' && media.type !== 'book') {
            await updateMediaMutation.mutateAsync({
              id: mediaId,
              data: { status: 'scheduled' }
            });
          } else if (media.status === 'watched') {
            await updateMediaMutation.mutateAsync({
              id: mediaId,
              data: { status: 'watching' }
            });
          }
        }
      }

      // Invalidate queries to trigger automatic refetch
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      return true;
    } catch (error) {
      console.error('Schedule error:', error);
      return false;
    }
  };

  const handleUpdateProgress = async (scheduleId, status, elapsedSeconds) => {
    const updateData = {
      status,
      elapsed_seconds: elapsedSeconds
    };
    if (status === 'in_progress') {
      updateData.last_resumed_at = new Date().toISOString();
    }
    await updateScheduleMutation.mutateAsync({ id: scheduleId, data: updateData });
  };

  const handleComplete = async (scheduleId, mediaId, rating) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const media = mediaMap[mediaId];

    // Use exact client-side time when completed (when reaches 100% or button clicked)
    const endTime = new Date();

    await updateScheduleMutation.mutateAsync({
      id: scheduleId,
      data: {
        status: 'completed',
        updated_date: endTime.toISOString()
      }
    });
    await updateMediaMutation.mutateAsync({
      id: mediaId,
      data: { status: 'watched', rating: rating || undefined }
    });

    // Show Dynamic Island notification
    const { showDynamicIslandNotification } = await import('@/components/pwa/DynamicIsland');
    showDynamicIslandNotification({
      icon: 'complete',
      title: 'Watch Complete!',
      message: `Finished: ${media.title}`
    });
  };

  const handleDeleteSchedule = async (scheduleId) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    if (schedule.is_watch_party) {
      const partyId = schedule.party_data.id;

      if (schedule.created_by === user?.email) {
        // Host: Delete the entire party
        await deleteWatchPartyMutation.mutateAsync(partyId);
      } else {
        // Guest: Just leave the party
        const updatedParticipants = schedule.party_data.participants?.filter(p => p.email !== user?.email) || [];
        await base44.entities.WatchParty.update(partyId, {
          participants: updatedParticipants
        });
        await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      }
      return;
    }

    if (schedule) {
      await deleteScheduleMutation.mutateAsync(scheduleId);
      await updateMediaMutation.mutateAsync({
        id: schedule.media_id,
        data: { status: 'unwatched' }
      });
    }
  };

  const handleWatch = (media) => {
    if (!media || !media.id) {
      console.error('Invalid media:', media);
      return;
    }
    const schedule = scheduleMap[media.id];
    if (schedule) {
      handlePlayPause(schedule);
    }
  };

  const handlePlayPause = async (schedule) => {
    if (!schedule || !schedule.media_id) {
      console.error('Invalid schedule:', schedule);
      return;
    }
    const media = mediaMap[schedule.media_id];
    if (!media) {
      console.error('Media not found for schedule:', schedule.media_id);
      return;
    }

    if (schedule.is_watch_party) {
      window.dispatchEvent(new CustomEvent('open-watch-party-player', {
        detail: { party: schedule.party_data }
      }));
      return;
    }

    if (playingScheduleId === schedule.id) {
      // Pause
      await updateScheduleMutation.mutateAsync({
        id: schedule.id,
        data: { status: 'paused' }
      });
      setPlayingScheduleId(null);
      // Close PDF viewer if open
      setPdfViewerData(null);
    } else {
      // Start/Resume - CRITICAL: Auto-reschedule if resuming on a different day
      const scheduledDate = new Date(schedule.scheduled_date);
      const now = new Date();
      const scheduledDay = scheduledDate.toDateString();
      const todayDay = now.toDateString();

      const updateData = {
        status: 'in_progress',
        last_resumed_at: now.toISOString()
      };

      // If resuming on a different day, auto-reschedule to current time
      if (scheduledDay !== todayDay && (schedule.status === 'paused' || schedule.status === 'scheduled')) {
        updateData.scheduled_date = now.toISOString();
      }

      if (schedule.elapsed_seconds === 0) {
        updateData.started_at = now.toISOString();
      }

      await updateScheduleMutation.mutateAsync({
        id: schedule.id,
        data: updateData
      });
      await updateMediaMutation.mutateAsync({
        id: schedule.media_id,
        data: { status: 'watching' }
      });
      setPlayingScheduleId(schedule.id);

      // Auto-open PDF viewer for books with PDF
      if (media.type === 'book' && media.pdf_url) {
        setPdfViewerData({
          schedule,
          media,
          initialPage: media.pages_read || 1
        });
      }
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleMedia(mediaMap[schedule.media_id]);
  };

  const handleReschedule = (schedule, resetProgress) => {
    if (resetProgress) {
      // Reset progress when starting fresh
      updateScheduleMutation.mutate({
        id: schedule.id,
        data: { elapsed_seconds: 0, status: 'scheduled' }
      });
    } else if (schedule.status === 'in_progress' || schedule.status === 'paused') {
      // Keep progress but change to scheduled
      updateScheduleMutation.mutate({
        id: schedule.id,
        data: { status: 'scheduled' }
      });
    }
    setEditingSchedule(schedule);
    setScheduleMedia(mediaMap[schedule.media_id]);
  };

  const handleMarkComplete = async (schedule) => {
    const media = mediaMap[schedule.media_id];
    if (!media) return;

    // For books, ask for pages read first
    if (media.type === 'book') {
      setPagesReadModal({ schedule, media });
      return;
    }

    // CRITICAL: Capture exact client-side time when user clicks complete or reaches 100%
    // Add 5hr 30min (19800000 ms) to compensate for timezone difference
    const exactCompletionTime = new Date(Date.now() + 19800000);

    // Immediately update the schedule with adjusted completion time
    await updateScheduleMutation.mutateAsync({
      id: schedule.id,
      data: {
        status: 'completed',
        updated_date: exactCompletionTime.toISOString()
      }
    });

    // Store the completion time to use in rating submit
    setRatingModal({ schedule, media, completionTime: exactCompletionTime });
  };

  const handlePagesReadSubmit = async (currentPage) => {
    const { schedule, media } = pagesReadModal;
    // Current page is the absolute page where user stopped
    const stoppedAtPage = Math.min(currentPage, media.total_pages);
    const isFullyRead = stoppedAtPage >= media.total_pages;

    const exactSubmitTime = new Date();

    // Update media with page where user stopped
    await updateMediaMutation.mutateAsync({
      id: media.id,
      data: {
        pages_read: stoppedAtPage,
        status: isFullyRead ? 'watched' : 'watching'
      }
    });

    // Update schedule with end page
    await updateScheduleMutation.mutateAsync({
      id: schedule.id,
      data: {
        status: 'completed',
        end_page: stoppedAtPage,
        updated_date: exactSubmitTime.toISOString(),
        rating_submitted_at: isFullyRead ? null : exactSubmitTime.toISOString()
      }
    });

    setPagesReadModal(null);

    // Only ask for rating if fully read (last session)
    if (isFullyRead) {
      setRatingModal({ schedule, media: { ...media, pages_read: stoppedAtPage }, completionTime: exactSubmitTime });
    }
  };

  const handleRatingSubmit = async (rating) => {
    if (!ratingModal) return;
    const { schedule, media, completionTime } = ratingModal;

    // CRITICAL: Use rating submit time as completion time in IST
    const ratingSubmitTime = new Date();

    // Update schedule with rating and rating_submitted_at
    await updateScheduleMutation.mutateAsync({
      id: schedule.id,
      data: {
        rating: rating,
        rating_submitted_at: ratingSubmitTime.toISOString()
      }
    });

    // For series, calculate average and check completion
    if (media.type === 'series' && media.episodes_per_season) {
      // Get ALL completed episodes (including this one)
      const allCompleted = await base44.entities.WatchSchedule.filter({
        media_id: media.id,
        status: 'completed'
      });

      const totalEpisodes = media.episodes_per_season.reduce((sum, count) => sum + count, 0);
      const completedCount = allCompleted.length;

      // Calculate average from schedule ratings (not media rating)
      const ratingsArray = allCompleted.map((s) => s.rating).filter((r) => r);
      const avgRating = ratingsArray.length > 0 ?
        ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length :
        undefined;

      // Mark as watched if all episodes completed
      const isFullyWatched = completedCount >= totalEpisodes;

      await updateMediaMutation.mutateAsync({
        id: media.id,
        data: {
          status: isFullyWatched ? 'watched' : media.status,
          rating: avgRating
        }
      });
    } else {
      // For movies
      await updateMediaMutation.mutateAsync({
        id: media.id,
        data: {
          status: 'watched',
          rating: rating
        }
      });
    }
  };

  const handleDeleteHistory = async (scheduleId, mediaId) => {
    // This is just setting up the data - actual deletion handled in HistoryCard
    // Keeping for compatibility with child components
  };

  const handleJumpToTime = (schedule) => {
    setJumpTimeModal({ schedule, media: mediaMap[schedule.media_id] });
  };

  const handleJumpSubmit = async (scheduleId, newElapsedSeconds) => {
    await updateScheduleMutation.mutateAsync({
      id: scheduleId,
      data: {
        elapsed_seconds: newElapsedSeconds,
        last_resumed_at: new Date().toISOString()
      }
    });
    setJumpTimeModal(null);
  };

  const handleSkipAction = async (scheduleId, newElapsedSeconds) => {
    // If currently playing, update local state too
    if (playingScheduleId === scheduleId) {
      setLocalElapsed(prev => ({ ...prev, [scheduleId]: newElapsedSeconds }));
    }

    await updateScheduleMutation.mutateAsync({
      id: scheduleId,
      data: {
        elapsed_seconds: newElapsedSeconds,
        last_resumed_at: new Date().toISOString()
      }
    });
  };

  // Listen for navigation events from Universe Explorer
  useEffect(() => {
    const handleNavigate = (e) => {
      const { mediaId, view: targetView } = e.detail;
      setView(targetView);
      setHighlightedMediaId(mediaId);
    };
    window.addEventListener('navigate-to-media', handleNavigate);
    return () => window.removeEventListener('navigate-to-media', handleNavigate);
  }, []);

  // Listen for bulk episode additions
  useEffect(() => {
    const handleBulkAdd = async (e) => {
      try {
        const { mediaId, episodesData } = e.detail;
        const media = mediaMap[mediaId];
        if (!media) return;

        for (const epData of episodesData) {
          const watchedDateTime = new Date(`${epData.date}T${epData.time}`).toISOString();
          let episodeRuntime = media.runtime_minutes;
          if (media.type === 'series') {
            const epRuntime = media.episode_runtimes?.[epData.seasonNumber - 1]?.[epData.episodeNumber - 1];
            if (epRuntime) episodeRuntime = epRuntime;
          }
          const totalSeconds = episodeRuntime * 60;
          await createScheduleMutation.mutateAsync({
            media_id: mediaId,
            scheduled_date: watchedDateTime,
            season_number: epData.seasonNumber,
            episode_number: epData.episodeNumber,
            status: 'completed',
            elapsed_seconds: totalSeconds,
            started_at: watchedDateTime,
            last_resumed_at: watchedDateTime,
            rating: epData.rating > 0 ? epData.rating : undefined
          });
        }

        if (media.type === 'series' && media.episodes_per_season) {
          const allCompleted = await base44.entities.WatchSchedule.filter({
            media_id: mediaId,
            status: 'completed'
          });
          const ratingsArray = allCompleted.map((s) => s.rating).filter((r) => r);
          const avgRating = ratingsArray.length > 0 ? ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length : undefined;
          const totalEpisodes = media.episodes_per_season.reduce((sum, count) => sum + count, 0);
          const isFullyWatched = allCompleted.length >= totalEpisodes;

          await updateMediaMutation.mutateAsync({
            id: mediaId,
            data: {
              status: isFullyWatched ? 'watched' : media.status,
              rating: avgRating
            }
          });
        }

        // Force refresh queries
        await queryClient.invalidateQueries({ queryKey: ['schedules'] });
        await queryClient.invalidateQueries({ queryKey: ['media'] });
      } catch (error) {
        console.error('Bulk add failed:', error);
      }
    };

    window.addEventListener('bulk-add-episodes', handleBulkAdd);
    return () => window.removeEventListener('bulk-add-episodes', handleBulkAdd);
  }, [mediaMap, createScheduleMutation, updateMediaMutation, queryClient]);

  const handleAddToHistory = async (mediaId, watchedDateTime, rating, seasonNumber, episodeNumber) => {
    const media = mediaMap[mediaId];

    // Get actual episode runtime
    let episodeRuntime = media.runtime_minutes;
    if (media.type === 'series' && seasonNumber && episodeNumber) {
      const epRuntime = media.episode_runtimes?.[seasonNumber - 1]?.[episodeNumber - 1];
      if (epRuntime) episodeRuntime = epRuntime;
    }

    const totalSeconds = episodeRuntime * 60;
    await createScheduleMutation.mutateAsync({
      media_id: mediaId,
      scheduled_date: watchedDateTime,
      season_number: seasonNumber,
      episode_number: episodeNumber,
      status: 'completed',
      elapsed_seconds: totalSeconds,
      started_at: watchedDateTime,
      last_resumed_at: watchedDateTime,
      rating: rating || undefined
    });

    if (media.type === 'series' && media.episodes_per_season) {
      // Recalculate series rating
      const allCompleted = schedules.filter((s) => s.media_id === mediaId && s.status === 'completed');
      const ratingsArray = [...allCompleted.map((s) => s.rating), rating].filter((r) => r);
      const avgRating = ratingsArray.length > 0 ? ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length : undefined;

      const totalEpisodes = media.episodes_per_season.reduce((sum, count) => sum + count, 0);
      const isFullyWatched = allCompleted.length + 1 >= totalEpisodes;

      await updateMediaMutation.mutateAsync({
        id: mediaId,
        data: {
          status: isFullyWatched ? 'watched' : media.status,
          rating: avgRating
        }
      });
    } else if (rating) {
      await updateMediaMutation.mutateAsync({
        id: mediaId,
        data: { status: 'watched', rating }
      });
    }
  };

  const handleRateChange = async (scheduleId, newRating) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    await updateScheduleMutation.mutateAsync({
      id: scheduleId,
      data: { rating: newRating }
    });

    // Recalculate media rating
    const media = mediaMap[schedule.media_id];
    if (media && media.type === 'series') {
      const allCompleted = schedules.filter((s) => s.media_id === media.id && s.status === 'completed');
      const ratingsArray = allCompleted.map((s) => s.id === scheduleId ? newRating : s.rating).filter((r) => r);
      const avgRating = ratingsArray.length > 0 ? ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length : undefined;

      await updateMediaMutation.mutateAsync({
        id: media.id,
        data: { rating: avgRating }
      });
    } else {
      await updateMediaMutation.mutateAsync({
        id: media.id,
        data: { rating: newRating }
      });
    }
  };

  // Client-side timer with local state for instant updates
  const [localElapsed, setLocalElapsed] = useState({});

  useEffect(() => {
    if (playingScheduleId) {
      const schedule = schedules.find((s) => s.id === playingScheduleId);
      const media = schedule ? mediaMap[schedule.media_id] : null;
      if (!schedule || !media) return;

      const startTime = Date.now();
      const initialElapsed = schedule.elapsed_seconds;

      // Get actual episode/session runtime
      let episodeRuntime = media.runtime_minutes;
      if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
        const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
        if (epRuntime) episodeRuntime = epRuntime;
      } else if (media.type === 'book') {
        episodeRuntime = schedule.session_duration || 30;
      }

      const updateLocal = async () => {
        // Show live activity in Dynamic Island
        const { showDynamicIslandLiveActivity } = await import('@/components/pwa/DynamicIsland');

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newElapsed = initialElapsed + elapsed;
        setLocalElapsed((prev) => ({ ...prev, [playingScheduleId]: newElapsed }));

        const progress = Math.min((newElapsed / (episodeRuntime * 60)) * 100, 100);

        // Update live activity
        showDynamicIslandLiveActivity({
          active: true,
          title: media.title,
          subtitle: `${Math.floor(newElapsed / 60)}m / ${episodeRuntime}m`,
          progress,
          icon: 'playing'
        });

        if (newElapsed >= episodeRuntime * 60) {
          clearInterval(timerRef.current);
          setPlayingScheduleId(null);
          showDynamicIslandLiveActivity({ active: false });
          // Mark complete with exact time when 100% reached
          handleMarkComplete(schedule);
        }
      };

      const syncToServer = async () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newElapsed = initialElapsed + elapsed;
        await updateScheduleMutation.mutateAsync({
          id: schedule.id,
          data: { elapsed_seconds: newElapsed }
        });
      };

      timerRef.current = setInterval(updateLocal, 100);
      const syncInterval = setInterval(syncToServer, 3000);

      return () => {
        clearInterval(timerRef.current);
        clearInterval(syncInterval);
        import('@/components/pwa/DynamicIsland').then(({ showDynamicIslandLiveActivity }) => {
          showDynamicIslandLiveActivity({ active: false });
        });
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateScheduleMutation.mutate({
          id: schedule.id,
          data: { elapsed_seconds: initialElapsed + elapsed }
        });
      };
    }
  }, [playingScheduleId]);

  const isLoading = mediaLoading || schedulesLoading;

  // Don't render anything until user is verified
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Checking access...</div>
      </div>
    );
  }

  // Show pending subscription screen if waiting for payment/verification
  if (user.pendingSubscription) {
    const status = user.pendingSubscription.status;
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <Card className="bg-zinc-900/80 border-zinc-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            {status === 'pending_payment' && (
              <>
                <Calendar className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Payment Pending</h2>
                <p className="text-zinc-400 mb-6">
                  Please complete your payment to activate your subscription.
                </p>
                <Button
                  onClick={() => window.location.href = '/Pricing'}
                  className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600"
                >
                  Complete Payment
                </Button>
              </>
            )}
            {status === 'processing' && (
              <>
                <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-bold text-white mb-2">Payment Under Verification</h2>
                <p className="text-zinc-400 mb-4">
                  Your payment proof is being reviewed by our team.
                </p>
                <p className="text-sm text-amber-400">
                  ⏰ Activation may take up to 24 hours
                </p>
                <p className="text-xs text-zinc-500 mt-4">
                  Checking status every 10 seconds...
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => refetchSubscription()}
                    variant="outline"
                  >
                    Check Now
                  </Button>
                  <Button
                    onClick={() => base44.auth.logout()}
                    variant="outline"
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
            {status === 'rejected' && (
              <>
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Payment Rejected</h2>
                <p className="text-zinc-400 mb-4">
                  Your payment could not be verified. Please try again with correct payment details.
                </p>
                <Button
                  onClick={() => window.location.href = '/Pricing'}
                  className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600"
                >
                  Try Again
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col pb-0 sm:pb-0">
      <AppHeader
        scheduleCount={activeSchedules.length}
        historyCount={historyCount}
        userRole={user?.role}
        currentView={view}
        onViewChange={setView}
        completedSchedules={completedSchedules}
        mediaMap={mediaMap}
      />

      <main className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-4 sm:pb-8 max-w-[1920px] mx-auto mt-14 sm:mt-16">
        <AnimatePresence mode="wait">
          {view === 'home' ?
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}>

              <HomePage
                schedules={schedules}
                mediaMap={mediaMap}
                user={user}
                userPreferences={user}
                onWatch={handleWatch}
                onSchedule={setScheduleMedia}
                onViewSchedule={() => setView('schedule')}
                onViewHistory={() => setView('history')}
                onViewTimeline={() => setView('timeline')}
                onViewLibrary={(filter) => {
                  setView('library');
                  if (filter) setLibraryFilter(filter);
                }}
                onNavigateToMedia={(mediaId, targetView) => {
                  setView(targetView);
                  setHighlightedMediaId(mediaId);
                }}
                onOpenAddFormWithData={(data) => {
                  setEditingMedia(data);
                  setShowAddForm(true);
                }}
              />

            </motion.div> :
            view === 'library' ?
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}>

                {/* Page title with help */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Library</h2>
                  <PageHelpButton
                    title="How to use Library"
                    content={
                      <div className="space-y-3">
                        <p>Your Library is where all your movies, series, and books are stored.</p>
                        <div className="space-y-2">
                          <p className="font-semibold text-white">Main Features:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Add Title: Create new entries for movies, series, or books</li>
                            <li>Search: Find titles quickly by name</li>
                            <li>Filter: Use dropdowns to filter by type, language, genre, platform, etc.</li>
                            <li>Sort: Arrange titles by date, name, runtime, or rating</li>
                            <li>Watch Parties: Create shared viewing sessions with friends</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-white">On Each Title Card:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Schedule: Set a time to watch</li>
                            <li>Watch: Start watching immediately</li>
                            <li>Edit: Modify title details</li>
                            <li>Delete: Remove from library</li>
                          </ul>
                        </div>
                        <p className="text-sm text-amber-400">Tip: Completed titles move to the bottom automatically</p>
                      </div>
                    }
                  />
                </div>

                {/* Search and filters */}
                <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search titles..."
                        className="pl-9 sm:pl-10 bg-zinc-900/50 border-purple-500/30 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-9 sm:h-10 text-sm hover:border-purple-500/50 transition-all" />

                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                      <TabsList className="bg-zinc-800/50 border border-zinc-700 w-full sm:w-auto grid grid-cols-4 sm:flex">
                        <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-xs sm:text-sm">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="movie" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-xs sm:text-sm">
                          <Film className="w-3 sm:w-4 h-3 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Movies</span>
                        </TabsTrigger>
                        <TabsTrigger value="series" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-xs sm:text-sm">
                          <Tv className="w-3 sm:w-4 h-3 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Series</span>
                        </TabsTrigger>
                        <TabsTrigger value="book" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-xs sm:text-sm">
                          <Book className="w-3 sm:w-4 h-3 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Books</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="bg-zinc-900/50 border-emerald-500/30 text-white text-xs sm:text-sm h-9 hover:border-emerald-500/50 transition-all">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-emerald-500/50">
                        <SelectItem value="all" className="text-white">All Status</SelectItem>
                        <SelectItem value="not_started" className="text-white">Not Started</SelectItem>
                        <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                        <SelectItem value="completed" className="text-white">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                      <SelectTrigger className="bg-zinc-900/50 border-emerald-500/30 text-white text-xs sm:text-sm h-9 hover:border-emerald-500/50 transition-all">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-emerald-500/50 max-h-60">
                        <SelectItem value="all" className="text-white">All Languages</SelectItem>
                        {filterOptions.languages.filter(l => l && l.trim()).map((l) =>
                          <SelectItem key={l} value={l} className="text-white">{l}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="bg-zinc-900/50 border-emerald-500/30 text-white text-xs sm:text-sm h-9 hover:border-emerald-500/50 transition-all">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-emerald-500/50 max-h-60">
                        <SelectItem value="all" className="text-white">All Years</SelectItem>
                        {filterOptions.years.filter(y => y && y.trim()).map((y) =>
                          <SelectItem key={y} value={y} className="text-white">{y}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={filterGenre} onValueChange={setFilterGenre}>
                      <SelectTrigger className="bg-zinc-900/50 border-emerald-500/30 text-white text-xs sm:text-sm h-9 hover:border-emerald-500/50 transition-all">
                        <SelectValue placeholder="Genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-emerald-500/50 max-h-60">
                        <SelectItem value="all" className="text-white">All Genres</SelectItem>
                        {filterOptions.genres.filter(g => g && g.trim()).map((g) =>
                          <SelectItem key={g} value={g} className="text-white">{g}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                      <SelectTrigger className="bg-zinc-900/50 border-emerald-500/30 text-white text-xs sm:text-sm h-9 hover:border-emerald-500/50 transition-all">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-emerald-500/50 max-h-60">
                        <SelectItem value="all" className="text-white">All Platforms</SelectItem>
                        {filterOptions.platforms.filter(p => p && p.trim()).map((p) =>
                          <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={filterAge} onValueChange={setFilterAge}>
                      <SelectTrigger className="bg-zinc-900/50 border-emerald-500/30 text-white text-xs sm:text-sm h-9 hover:border-emerald-500/50 transition-all">
                        <SelectValue placeholder="Age Rating" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-emerald-500/50 max-h-60">
                        <SelectItem value="all" className="text-white">All Ages</SelectItem>
                        {filterOptions.ageRatings.filter(a => a && a.trim()).map((a) =>
                          <SelectItem key={a} value={a} className="text-white">{a}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={filterActor} onValueChange={setFilterActor}>
                      <SelectTrigger className="bg-zinc-900/50 border-emerald-500/30 text-white text-xs sm:text-sm h-9 hover:border-emerald-500/50 transition-all">
                        <SelectValue placeholder="Actor" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-emerald-500/50 max-h-60">
                        <SelectItem value="all" className="text-white">All Actors</SelectItem>
                        {filterOptions.actors.filter(a => a && a.trim()).map((a) =>
                          <SelectItem key={a} value={a} className="text-white">{a}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort dropdown */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ArrowUpDown className="w-4 h-4 text-amber-400" />
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-amber-500/30 text-white text-xs sm:text-sm h-9 hover:border-amber-500/50 transition-all">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-amber-500/50">
                          <SelectItem value="newest" className="text-white">Newest First</SelectItem>
                          <SelectItem value="oldest" className="text-white">Oldest First</SelectItem>
                          <SelectItem value="title-az" className="text-white">Title (A-Z)</SelectItem>
                          <SelectItem value="title-za" className="text-white">Title (Z-A)</SelectItem>
                          <SelectItem value="runtime-short" className="text-white">Runtime (Shortest)</SelectItem>
                          <SelectItem value="runtime-long" className="text-white">Runtime (Longest)</SelectItem>
                          <SelectItem value="rating-high" className="text-white">Rating (Highest)</SelectItem>
                          <SelectItem value="rating-low" className="text-white">Rating (Lowest)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => setShowWatchPartyModal(true)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl text-white text-xs sm:text-sm h-9"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Watch Parties
                      </Button>
                      {userPermissions.can_add_title && (
                        <Button
                          onClick={() => setShowAddForm(true)}
                          className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white text-xs sm:text-sm h-9"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Title
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media grid */}
                {isLoading ?
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div> :
                  filteredMedia.length === 0 ?
                    <div className="text-center py-20">
                      <Film className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
                      <h3 className="text-xl font-semibold text-zinc-300 mb-2">No titles yet</h3>
                      <p className="text-zinc-500 mb-6">Add your first movie or series to get started</p>
                      <Button onClick={() => setShowAddForm(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Title
                      </Button>
                    </div> :

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {filteredMedia.map((media) =>
                        <MediaCard
                          key={media.id}
                          media={media}
                          onSchedule={setScheduleMedia}
                          onWatch={handleWatch}
                          onEdit={handleEditMedia}
                          onDelete={handleDeleteMedia}
                          onAddSeasons={setAddSeasonsMedia}
                          hasSchedule={!!scheduleMap[media.id]}
                          schedule={scheduleMap[media.id]}
                          userRole={user?.role}
                          userPermissions={userPermissions}
                          isHighlighted={highlightedMediaId === media.id}
                          allMedia={mediaList}
                          schedules={schedules}
                          onNavigateToMedia={(mediaId) => {
                            setHighlightedMediaId(mediaId);
                            setTimeout(() => {
                              const element = document.querySelector(`[data-media-id="${mediaId}"]`);
                              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }} />

                      )}
                    </div>
                }
              </motion.div> :
              view === 'schedule' ?
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}>

                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      Upcoming Watches
                    </h2>
                    <PageHelpButton
                      title="How to use Schedule"
                      content={
                        <div className="space-y-3">
                          <p>Schedule shows all your planned watches and active sessions.</p>
                          <div className="space-y-2">
                            <p className="font-semibold text-white">Status Types:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>In Progress: Currently watching (green)</li>
                              <li>Paused: Started but paused (yellow)</li>
                              <li>Scheduled: Planned for future (blue)</li>
                              <li>Delayed: Past scheduled time but not started (red)</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="font-semibold text-white">Actions Available:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>Play/Pause: Control playback with live timer</li>
                              <li>Edit: Change schedule time or details</li>
                              <li>Reschedule: Move to a different date/time</li>
                              <li>Complete: Mark as finished</li>
                              <li>Delete: Remove schedule</li>
                            </ul>
                          </div>
                          <p className="text-sm text-amber-400">Tip: The app prevents scheduling conflicts automatically</p>
                        </div>
                      }
                    />
                  </div>
                  <UpcomingSchedule
                    schedules={activeSchedules}
                    mediaMap={mediaMap}
                    onWatch={handleWatch}
                    onDelete={handleDeleteSchedule}
                    onEditSchedule={handleEditSchedule}
                    onPlayPause={handlePlayPause}
                    playingScheduleId={playingScheduleId}
                    onReschedule={handleReschedule}
                    onJumpToTime={(scheduleId, newElapsed) => handleSkipAction(scheduleId, newElapsed)}
                    onOpenJumpModal={setJumpTimeModal}
                    localElapsed={localElapsed}
                    userRole={user?.role}
                    userPermissions={userPermissions}
                    isHighlighted={highlightedMediaId}
                    onNavigate={(mediaId) => {
                      setView('library');
                      setHighlightedMediaId(mediaId);
                    }} />

                </motion.div> :
                view === 'timeline' ?
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}>

                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-500" />
                        Timeline
                      </h2>
                      <PageHelpButton
                        title="How to use Timeline"
                        content={
                          <div className="space-y-3">
                            <p>Timeline provides a chronological view of all your schedules, both past and upcoming.</p>
                            <div className="space-y-2">
                              <p className="font-semibold text-white">Features:</p>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>See all schedules in date order</li>
                                <li>Visual progress bars for active watches</li>
                                <li>Quick complete and reschedule actions</li>
                                <li>Navigate to library to see full title details</li>
                              </ul>
                            </div>
                            <p className="text-sm text-amber-400">Tip: Use this view to plan your watching week ahead</p>
                          </div>
                        }
                      />
                    </div>
                    <TimelineView
                      schedules={schedules}
                      mediaMap={mediaMap}
                      onMarkComplete={handleMarkComplete}
                      onReschedule={handleReschedule}
                      localElapsed={localElapsed}
                      userRole={user?.role}
                      playingScheduleId={playingScheduleId}
                      isHighlighted={highlightedMediaId}
                      onNavigate={(mediaId) => {
                        setView('library');
                        setHighlightedMediaId(mediaId);
                      }} />

                  </motion.div> :
                  view === 'history' ?
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}>

                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                          <History className="w-5 h-5 text-emerald-500" />
                          Watch History
                        </h2>
                        <PageHelpButton
                          title="How to use History"
                          content={
                            <div className="space-y-3">
                              <p>History shows everything you have completed watching or reading.</p>
                              <div className="space-y-2">
                                <p className="font-semibold text-white">Main Features:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>View all completed titles with completion dates</li>
                                  <li>See your ratings for each entry</li>
                                  <li>Add manual history entries for past watches</li>
                                  <li>Bulk add multiple episodes at once</li>
                                  <li>Update or delete history entries</li>
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <p className="font-semibold text-white">For Series:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>Each episode appears separately</li>
                                  <li>Season and episode numbers are shown</li>
                                  <li>Overall series rating is calculated from all episodes</li>
                                </ul>
                              </div>
                              <p className="text-sm text-amber-400">Tip: Use filters to find specific titles or time periods</p>
                            </div>
                          }
                        />
                      </div>
                      <HistoryView
                        completedSchedules={completedSchedules}
                        mediaMap={mediaMap}
                        onDelete={async (scheduleId, mediaId) => {
                          const media = mediaMap[mediaId];
                          if (media?.type === 'book') {
                            const allBookSessions = schedules.filter(s => s.media_id === mediaId && s.status === 'completed');
                            await Promise.all(allBookSessions.map(s => deleteScheduleMutation.mutateAsync(s.id)));
                            await updateMediaMutation.mutateAsync({
                              id: mediaId,
                              data: { status: 'unwatched', rating: null, pages_read: 0 }
                            });
                            queryClient.invalidateQueries({ queryKey: ['media'] });
                          } else {
                            await deleteScheduleMutation.mutateAsync(scheduleId);
                            const otherCompletedEpisodes = schedules.filter((s) =>
                              s.media_id === mediaId && s.status === 'completed' && s.id !== scheduleId
                            );
                            if (otherCompletedEpisodes.length === 0) {
                              await updateMediaMutation.mutateAsync({
                                id: mediaId,
                                data: { status: 'unwatched', rating: null }
                              });
                              queryClient.invalidateQueries({ queryKey: ['media'] });
                            } else if (media?.type === 'series') {
                              const remainingRatings = otherCompletedEpisodes.map((s) => s.rating).filter((r) => r);
                              const avgRating = remainingRatings.length > 0 ?
                                remainingRatings.reduce((sum, r) => sum + r, 0) / remainingRatings.length : null;
                              const totalEpisodes = media.episodes_per_season?.reduce((sum, count) => sum + count, 0) || 0;
                              const isStillFullyWatched = otherCompletedEpisodes.length >= totalEpisodes;
                              await updateMediaMutation.mutateAsync({
                                id: mediaId,
                                data: { status: isStillFullyWatched ? 'watched' : 'watching', rating: avgRating }
                              });
                            } else {
                              await updateMediaMutation.mutateAsync({
                                id: mediaId,
                                data: { status: 'unwatched', rating: null }
                              });
                              queryClient.invalidateQueries({ queryKey: ['media'] });
                            }
                          }
                        }}
                        onAddEntry={() => setShowSelectTitle(true)}
                        onRateChange={handleRateChange}
                        userRole={user?.role}
                        userPermissions={userPermissions}
                        schedules={schedules}
                        isHighlighted={highlightedMediaId}
                        onNavigate={(mediaId) => {
                          setView('library');
                          setHighlightedMediaId(mediaId);
                        }} />

                    </motion.div> :

                    view === 'achievements' ?
                      <motion.div
                        key="achievements"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}>

                        <AchievementsView
                          completedSchedules={completedSchedules}
                          mediaMap={mediaMap}
                          mediaList={mediaList}
                        />
                      </motion.div> :

                      view === 'profile' ?
                        <motion.div
                          key="profile"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}>

                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Profile & Settings</h2>
                            <PageHelpButton
                              title="How to use Profile"
                              content={
                                <div className="space-y-3">
                                  <p>Manage your account details, preferences, and subscription here.</p>
                                  <div className="space-y-2">
                                    <p className="font-semibold text-white">Account Info:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                      <li>Update your name and profile picture</li>
                                      <li>View your watching statistics</li>
                                      <li>See member since date and library size</li>
                                    </ul>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-semibold text-white">Preferences:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                      <li>Viewing Preferences: Set default quality, audio format, device</li>
                                      <li>Display Settings: Choose landing page, layout density, card style</li>
                                      <li>Default Filters: Pre-select platform and language</li>
                                      <li>Notifications: Toggle alerts and visual effects</li>
                                    </ul>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-semibold text-white">Subscription:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                      <li>View current plan and status</li>
                                      <li>Check subscription end date</li>
                                      <li>Cancel subscription if needed</li>
                                    </ul>
                                  </div>
                                  <p className="text-sm text-amber-400">Tip: All preference changes save automatically</p>
                                </div>
                              }
                            />
                          </div>

                          {/* Profile Content */}
                          {(() => {
                            const handleEdit = () => {
                              setProfileFormData({
                                full_name: user?.full_name || '',
                                profile_picture: user?.profile_picture || '',
                                preferred_viewing_time: user?.preferred_viewing_time || 'evening',
                                default_video_quality: user?.default_video_quality || '4K UHD',
                                default_audio_format: user?.default_audio_format || 'Dolby Atmos',
                                favorite_genre: user?.favorite_genre || '',
                                preferred_device: user?.preferred_device || 'TV',
                                default_view: user?.default_view || 'home',
                                default_platform: user?.default_platform || 'all',
                                default_language: user?.default_language || 'all',
                                enable_animations: user?.enable_animations !== false,
                                layout_density: user?.layout_density || 'comfortable',
                                card_style: user?.card_style || 'detailed',
                                time_format: user?.time_format || '12h',
                                show_watch_fatigue_alerts: user?.show_watch_fatigue_alerts !== false,
                                show_ai_recommendations: user?.show_ai_recommendations !== false,
                                show_movie_news: user?.show_movie_news !== false
                              });
                              setProfileEditing(true);
                            };

                            const totalMinutes = completedSchedules.reduce((sum, s) => {
                              const media = mediaMap[s.media_id];
                              if (!media) return sum;
                              let runtime = media.runtime_minutes;
                              if (media.type === 'series' && s.season_number && s.episode_number) {
                                const epRuntime = media.episode_runtimes?.[s.season_number - 1]?.[s.episode_number - 1];
                                if (epRuntime) runtime = epRuntime;
                              }
                              return sum + runtime;
                            }, 0);
                            const totalHours = Math.floor(totalMinutes / 60);

                            const avgRating = completedSchedules.filter(s => s.rating).length > 0
                              ? (completedSchedules.filter(s => s.rating).reduce((sum, s) => sum + s.rating, 0) / completedSchedules.filter(s => s.rating).length).toFixed(1)
                              : 0;

                            const genreCounts = {};
                            completedSchedules.forEach(s => {
                              const media = mediaMap[s.media_id];
                              media?.genre?.forEach(g => {
                                genreCounts[g] = (genreCounts[g] || 0) + 1;
                              });
                            });
                            const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];

                            const platformCounts = {};
                            completedSchedules.forEach(s => {
                              const media = mediaMap[s.media_id];
                              if (media?.platform) platformCounts[media.platform] = (platformCounts[media.platform] || 0) + 1;
                            });
                            const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];

                            const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
                            const inProgressCount = schedules.filter(s => s.status === 'in_progress' || s.status === 'paused').length;

                            return (
                              <div className="space-y-6 max-w-[1920px] mx-auto">
                                {/* Profile Card */}
                                <Card className="bg-gradient-to-br from-purple-500/10 to-emerald-500/10 border-purple-500/30 hover-shadow-purple w-full">
                                  <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-4">
                                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                        {user?.profile_picture ? (
                                          <img src={user.profile_picture} alt="Profile" className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover border-2 border-purple-400 flex-shrink-0" />
                                        ) : (
                                          <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gradient-to-br from-purple-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                                            <User className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{user?.full_name}</h2>
                                          <p className="text-xs sm:text-sm text-zinc-400 truncate">{user?.email}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Shield className="w-3 sm:w-4 h-3 sm:h-4 text-purple-400" />
                                            <span className="text-xs sm:text-sm text-purple-400 font-medium uppercase">{user?.role}</span>
                                          </div>
                                        </div>
                                      </div>
                                      {!profileEditing && (
                                        <Button onClick={handleEdit} className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white w-full sm:w-auto text-xs sm:text-sm h-9">
                                          <Edit2 className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                                          Edit Profile
                                        </Button>
                                      )}
                                    </div>

                                    {profileEditing && (
                                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                                        <div>
                                          <Label className="text-white text-xs sm:text-sm">Full Name (Username)</Label>
                                          <Input
                                            value={profileFormData.full_name}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
                                            className="bg-zinc-800 border-zinc-700 text-white text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-white text-xs sm:text-sm">Profile Picture URL</Label>
                                          <Input
                                            value={profileFormData.profile_picture || ''}
                                            onChange={(e) => setProfileFormData({ ...profileFormData, profile_picture: e.target.value })}
                                            className="bg-zinc-800 border-zinc-700 text-white text-sm"
                                            placeholder="https://example.com/profile.jpg"
                                          />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                          <Button onClick={() => setProfileEditing(false)} className="flex-1 bg-white text-black hover:bg-zinc-100">
                                            Cancel
                                          </Button>
                                          <Button onClick={() => updateUserMutation.mutate(profileFormData)} className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white">
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Preferences - Always Visible */}
                                    {!profileEditing && (
                                      <div className="mt-6 space-y-6">
                                        {/* Viewing Preferences */}
                                        <Card className="bg-zinc-900/80 border-zinc-800">
                                          <CardContent className="p-4 sm:p-6 space-y-4">
                                            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Viewing Preferences</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Preferred Viewing Time</Label>
                                                <Select
                                                  value={user?.preferred_viewing_time || 'evening'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ preferred_viewing_time: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="morning">Morning</SelectItem>
                                                    <SelectItem value="afternoon">Afternoon</SelectItem>
                                                    <SelectItem value="evening">Evening</SelectItem>
                                                    <SelectItem value="night">Night</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Default Video Quality</Label>
                                                <Select
                                                  value={user?.default_video_quality || '4K UHD'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ default_video_quality: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="HD">HD</SelectItem>
                                                    <SelectItem value="Full HD">Full HD</SelectItem>
                                                    <SelectItem value="4K UHD">4K UHD</SelectItem>
                                                    <SelectItem value="8K">8K</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Default Audio Format</Label>
                                                <Select
                                                  value={user?.default_audio_format || 'Dolby Atmos'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ default_audio_format: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="Stereo">Stereo</SelectItem>
                                                    <SelectItem value="5.1 Surround">5.1 Surround</SelectItem>
                                                    <SelectItem value="7.1 Surround">7.1 Surround</SelectItem>
                                                    <SelectItem value="Dolby Atmos">Dolby Atmos</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Preferred Device</Label>
                                                <Select
                                                  value={user?.preferred_device || 'TV'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ preferred_device: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="TV">TV</SelectItem>
                                                    <SelectItem value="Laptop">Laptop</SelectItem>
                                                    <SelectItem value="Phone">Phone</SelectItem>
                                                    <SelectItem value="Tablet">Tablet</SelectItem>
                                                    <SelectItem value="Projector">Projector</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>

                                        {/* Display Preferences */}
                                        <Card className="bg-zinc-900/80 border-zinc-800">
                                          <CardContent className="p-4 sm:p-6 space-y-4">
                                            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Display & Layout</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Default Landing View</Label>
                                                <Select
                                                  value={user?.default_view || 'home'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ default_view: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="home">Home</SelectItem>
                                                    <SelectItem value="library">Library</SelectItem>
                                                    <SelectItem value="schedule">Schedule</SelectItem>
                                                    <SelectItem value="timeline">Timeline</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Layout Density</Label>
                                                <Select
                                                  value={user?.layout_density || 'comfortable'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ layout_density: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="compact">Compact</SelectItem>
                                                    <SelectItem value="comfortable">Comfortable</SelectItem>
                                                    <SelectItem value="spacious">Spacious</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Card Display Style</Label>
                                                <Select
                                                  value={user?.card_style || 'detailed'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ card_style: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="minimal">Minimal</SelectItem>
                                                    <SelectItem value="detailed">Detailed</SelectItem>
                                                    <SelectItem value="poster-focus">Poster Focus</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Time Format</Label>
                                                <Select
                                                  value={user?.time_format || '12h'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ time_format: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700">
                                                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                                                    <SelectItem value="24h">24-hour</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>

                                        {/* Default Filters */}
                                        <Card className="bg-zinc-900/80 border-zinc-800">
                                          <CardContent className="p-4 sm:p-6 space-y-4">
                                            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Default Filters</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Default Platform</Label>
                                                <Select
                                                  value={user?.default_platform || 'all'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ default_platform: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                                                    <SelectItem value="all">All Platforms</SelectItem>
                                                    {filterOptions.platforms.map(p => (
                                                      <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label className="text-zinc-300 text-xs">Default Language</Label>
                                                <Select
                                                  value={user?.default_language || 'all'}
                                                  onValueChange={(value) => updateUserMutation.mutate({ default_language: value })}
                                                >
                                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                                                    <SelectItem value="all">All Languages</SelectItem>
                                                    {filterOptions.languages.map(l => (
                                                      <SelectItem key={l} value={l}>{l}</SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>

                                        {/* Notifications & Visual */}
                                        <Card className="bg-zinc-900/80 border-zinc-800">
                                          <CardContent className="p-4 sm:p-6 space-y-3">
                                            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Notifications & Visual</h3>
                                            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                                              <Label className="text-white text-xs sm:text-sm">Show Watch Fatigue Alerts</Label>
                                              <Switch
                                                checked={user?.show_watch_fatigue_alerts !== false}
                                                onCheckedChange={(checked) => updateUserMutation.mutate({ show_watch_fatigue_alerts: checked })}
                                              />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                                              <Label className="text-white text-xs sm:text-sm">Show AI Recommendations</Label>
                                              <Switch
                                                checked={user?.show_ai_recommendations !== false}
                                                onCheckedChange={(checked) => updateUserMutation.mutate({ show_ai_recommendations: checked })}
                                              />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                                              <Label className="text-white text-xs sm:text-sm">Show Movie News & Facts</Label>
                                              <Switch
                                                checked={user?.show_movie_news !== false}
                                                onCheckedChange={(checked) => updateUserMutation.mutate({ show_movie_news: checked })}
                                              />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700">
                                              <Label className="text-white text-xs sm:text-sm">Enable Animations</Label>
                                              <Switch
                                                checked={user?.enable_animations !== false}
                                                onCheckedChange={(checked) => updateUserMutation.mutate({ enable_animations: checked })}
                                              />
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-700">
                                      <div className="text-center">
                                        <Film className="w-5 sm:w-6 h-5 sm:h-6 mx-auto text-purple-400 mb-1 sm:mb-2" />
                                        <div className="text-lg sm:text-2xl font-bold text-white">{completedSchedules.length}</div>
                                        <div className="text-[10px] sm:text-xs text-zinc-400">Total Watches</div>
                                      </div>
                                      <div className="text-center">
                                        <ClockIcon className="w-5 sm:w-6 h-5 sm:h-6 mx-auto text-emerald-400 mb-1 sm:mb-2" />
                                        <div className="text-lg sm:text-2xl font-bold text-white">{totalHours}h</div>
                                        <div className="text-[10px] sm:text-xs text-zinc-400">Watch Time</div>
                                      </div>
                                      <div className="text-center">
                                        <Star className="w-5 sm:w-6 h-5 sm:h-6 mx-auto text-amber-400 mb-1 sm:mb-2" />
                                        <div className="text-lg sm:text-2xl font-bold text-white">{avgRating}</div>
                                        <div className="text-[10px] sm:text-xs text-zinc-400">Avg Rating</div>
                                      </div>
                                      <div className="text-center">
                                        <Calendar className="w-5 sm:w-6 h-5 sm:h-6 mx-auto text-blue-400 mb-1 sm:mb-2" />
                                        <div className="text-lg sm:text-2xl font-bold text-white">{scheduledCount + inProgressCount}</div>
                                        <div className="text-[10px] sm:text-xs text-zinc-400">Scheduled</div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Account Info */}
                                <Card className="bg-zinc-900/80 border-zinc-800 hover-shadow w-full">
                                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Account Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                      <div>
                                        <p className="text-[10px] sm:text-xs text-zinc-400">Email</p>
                                        <p className="text-xs sm:text-sm text-white font-medium truncate">{user?.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] sm:text-xs text-zinc-400">Role</p>
                                        <p className="text-xs sm:text-sm text-purple-400 font-medium uppercase">{user?.role}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] sm:text-xs text-zinc-400">Member Since</p>
                                        <p className="text-xs sm:text-sm text-white font-medium">
                                          {user?.created_date ? format(new Date(user.created_date), 'PP') : 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] sm:text-xs text-zinc-400">Library Size</p>
                                        <p className="text-xs sm:text-sm text-white font-medium">{mediaList.length} titles</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Preferences Summary */}
                                <Card className="bg-zinc-900/80 border-zinc-800 hover-shadow w-full">
                                  <CardContent className="p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Your Preferences</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                      {topGenre && (
                                        <div>
                                          <p className="text-[10px] sm:text-xs text-zinc-400">Favorite Genre</p>
                                          <p className="text-xs sm:text-sm text-purple-400 font-medium">{topGenre[0]} ({topGenre[1]})</p>
                                        </div>
                                      )}
                                      {topPlatform && (
                                        <div>
                                          <p className="text-[10px] sm:text-xs text-zinc-400">Top Platform</p>
                                          <p className="text-xs sm:text-sm text-emerald-400 font-medium">{topPlatform[0]} ({topPlatform[1]})</p>
                                        </div>
                                      )}
                                      {user?.default_view && user.default_view !== 'home' && (
                                        <div>
                                          <p className="text-[10px] sm:text-xs text-zinc-400">Default View</p>
                                          <p className="text-xs sm:text-sm text-amber-400 font-medium capitalize">{user.default_view}</p>
                                        </div>
                                      )}
                                      {user?.layout_density && user.layout_density !== 'comfortable' && (
                                        <div>
                                          <p className="text-[10px] sm:text-xs text-zinc-400">Layout Density</p>
                                          <p className="text-xs sm:text-sm text-blue-400 font-medium capitalize">{user.layout_density}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Subscription Management */}
                                {user?.role !== 'admin' && userSubscription && (
                                  <Card className="bg-zinc-900/80 border-zinc-800 hover-shadow w-full">
                                    <CardContent className="p-4 sm:p-6">
                                      <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Subscription</h3>
                                      <div className="space-y-3">
                                        <div>
                                          <p className="text-[10px] sm:text-xs text-zinc-400">Current Plan</p>
                                          <p className="text-xs sm:text-sm text-white font-medium">{userPlan?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] sm:text-xs text-zinc-400">Status</p>
                                          <p className="text-xs sm:text-sm text-emerald-400 font-medium capitalize">{userSubscription.status}</p>
                                        </div>
                                        {userSubscription.end_date && (
                                          <div>
                                            <p className="text-[10px] sm:text-xs text-zinc-400">End Date</p>
                                            <p className="text-xs sm:text-sm text-white font-medium">
                                              {format(new Date(userSubscription.end_date), 'PP')}
                                            </p>
                                          </div>
                                        )}
                                        {userSubscription.status === 'active' && (
                                          <Button
                                            onClick={async () => {
                                              if (confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
                                                await executeAction('Cancelling Plan', async () => {
                                                  await base44.entities.Subscription.update(userSubscription.id, {
                                                    status: 'cancelled',
                                                    cancelled_at: new Date().toISOString()
                                                  });
                                                  await queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
                                                  await queryClient.invalidateQueries({ queryKey: ['cancelled-subscriptions'] });
                                                  await queryClient.refetchQueries({ queryKey: ['user-subscription'] });
                                                }, {
                                                  successTitle: 'Plan Cancelled Successfully',
                                                  successSubtitle: 'Your access will continue until the end of your billing period'
                                                });
                                              }
                                            }}
                                            className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                          >
                                            Cancel Plan
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Logout */}
                                <Card className="bg-zinc-900/80 border-red-500/30 hover-shadow w-full">
                                  <CardContent className="p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Danger Zone</h3>
                                    <p className="text-xs sm:text-sm text-zinc-400 mb-3 sm:mb-4">Logging out will end your current session</p>
                                    <Button
                                      onClick={() => base44.auth.logout()}
                                      className="bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 hover:from-red-500/30 hover:to-red-600/30 border-2 border-red-500/30 hover:shadow-xl w-full sm:w-auto text-xs sm:text-sm h-9"
                                    >
                                      <LogOut className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                                      Logout
                                    </Button>
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })()}
                        </motion.div> :

                        view === 'admin' ?
                          <motion.div
                            key="admin"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}>

                            <div className="flex items-center justify-between mb-6">
                              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-6 h-6 text-purple-400" />
                                Admin Dashboard
                              </h2>
                              <PageHelpButton
                                title="Admin Dashboard Guide"
                                content={
                                  <div className="space-y-3">
                                    <p>Comprehensive control panel for managing users, subscriptions, payments, and app configuration.</p>
                                    <div className="space-y-2">
                                      <p className="font-semibold text-white">Main Sections:</p>
                                      <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Dashboard: Overview stats and recent activity</li>
                                        <li>User Management: View and manage all users</li>
                                        <li>Subscription Manager: Handle plan assignments</li>
                                        <li>Payment Verification: Approve/reject manual payments</li>
                                        <li>Email Templates: Create and manage email templates</li>
                                        <li>Notifications: Send broadcasts and schedule emails</li>
                                        <li>App Config: Configure global settings</li>
                                        <li>Logo Manager: Upload and manage platform logos</li>
                                        <li>Options Manager: Configure dropdowns and options</li>
                                        <li>Plans Manager: Create and edit subscription plans</li>
                                      </ul>
                                    </div>
                                    <p className="text-sm text-amber-400">Tip: All admin actions are logged and can be tracked</p>
                                  </div>
                                }
                              />
                            </div>

                            <AdminSpace />
                          </motion.div> :

                          view === 'spending' ?
                            <motion.div
                              key="spending"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}>

                              <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                  <DollarSign className="w-6 h-6 text-emerald-400" />
                                  Spending Analysis
                                </h2>
                                <PageHelpButton
                                  title="How to use Spending"
                                  content={
                                    <div className="space-y-3">
                                      <p>Track and analyze your entertainment subscription spending.</p>
                                      <div className="space-y-2">
                                        <p className="font-semibold text-white">Features:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                          <li>See total monthly and yearly spending</li>
                                          <li>Break down costs by platform</li>
                                          <li>Track active subscriptions</li>
                                          <li>View spending trends over time</li>
                                          <li>Get recommendations to optimize costs</li>
                                        </ul>
                                      </div>
                                      <div className="space-y-2">
                                        <p className="font-semibold text-white">Subscription Manager:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                          <li>Add your platform subscriptions</li>
                                          <li>Set cost and billing cycle</li>
                                          <li>Track renewal dates</li>
                                          <li>Manage payment methods</li>
                                        </ul>
                                      </div>
                                      <p className="text-sm text-amber-400">Tip: Keep subscriptions updated to get accurate spending insights</p>
                                    </div>
                                  }
                                />
                              </div>

                              <Spending />
                            </motion.div> :



                            <motion.div
                              key="stats"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}>

                              <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                                  <BarChart3 className="w-5 h-5 text-amber-500" />
                                  Watching Statistics
                                </h2>
                                <PageHelpButton
                                  title="How to use Statistics"
                                  content={
                                    <div className="space-y-3">
                                      <p>Statistics provide insights into your watching habits and preferences.</p>
                                      <div className="space-y-2">
                                        <p className="font-semibold text-white">Available Charts:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                          <li>Watch time over months and years</li>
                                          <li>Content type distribution (movies vs series vs books)</li>
                                          <li>Genre preferences and trends</li>
                                          <li>Platform usage breakdown</li>
                                          <li>Rating patterns and averages</li>
                                          <li>Watch time by day of week</li>
                                        </ul>
                                      </div>
                                      <p className="text-sm text-amber-400">Tip: Stats update automatically as you complete more titles</p>
                                    </div>
                                  }
                                />
                              </div>
                              {completedSchedules.length === 0 ?
                                <div className="text-center py-20">
                                  <BarChart3 className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
                                  <h3 className="text-xl font-semibold text-zinc-300 mb-2">No stats available yet</h3>
                                  <p className="text-zinc-500">Start watching and completing titles to see your stats</p>
                                </div> :

                                <StatsView
                                  completedSchedules={completedSchedules}
                                  mediaMap={mediaMap}
                                  mediaList={mediaList}
                                  onRateChange={handleRateChange}
                                  onDelete={handleDeleteHistory} />

                              }
                            </motion.div>
          }
        </AnimatePresence>
      </main>

      {/* Modals */}
      <MediaForm
        open={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingMedia(null);
        }}
        onSubmit={handleAddMedia}
        initialData={editingMedia} />


      <ScheduleModal
        open={!!scheduleMedia}
        onClose={() => {
          setScheduleMedia(null);
          setEditingSchedule(null);
        }}
        media={scheduleMedia}
        onSchedule={handleSchedule}
        existingSchedule={editingSchedule}
        completedEpisodes={scheduleMedia ? getCompletedEpisodes(scheduleMedia.id) : []} />


      <AddHistoryModal
        open={!!addHistoryMedia}
        onClose={() => setAddHistoryMedia(null)}
        media={addHistoryMedia}
        onSubmit={handleAddToHistory} />


      <SelectTitleModal
        open={showSelectTitle}
        onClose={() => setShowSelectTitle(false)}
        mediaList={mediaList}
        onSelect={setAddHistoryMedia} />

      <AddSeasonsModal
        open={!!addSeasonsMedia}
        onClose={() => setAddSeasonsMedia(null)}
        media={addSeasonsMedia}
        onSubmit={(data) => handleAddSeasons(addSeasonsMedia, data)} />

      <RatingModal
        open={!!ratingModal}
        onClose={() => setRatingModal(null)}
        title={ratingModal?.media?.title}
        media={ratingModal?.media}
        schedule={ratingModal?.schedule}
        onSubmit={handleRatingSubmit} />

      {pagesReadModal && (
        <PagesReadModal
          open={!!pagesReadModal}
          onClose={() => setPagesReadModal(null)}
          media={pagesReadModal.media}
          schedule={pagesReadModal.schedule}
          onSubmit={handlePagesReadSubmit}
        />
      )}

      {jumpTimeModal && (
        <JumpTimeModal
          open={!!jumpTimeModal}
          onClose={() => setJumpTimeModal(null)}
          schedule={jumpTimeModal.schedule}
          media={jumpTimeModal.media}
          onJump={handleJumpSubmit} />
      )}

      {adjustProgressModal && (
        <AdjustBookProgressModal
          open={!!adjustProgressModal}
          onClose={() => setAdjustProgressModal(null)}
          media={adjustProgressModal}
          onSubmit={async (newPages) => {
            await updateMediaMutation.mutateAsync({
              id: adjustProgressModal.id,
              data: {
                pages_read: newPages,
                status: newPages >= adjustProgressModal.total_pages ? 'watched' : newPages > 0 ? 'watching' : 'unwatched'
              }
            });
            setAdjustProgressModal(null);
          }}
        />
      )}

      {/* PDF Viewer */}
      {pdfViewerData && (
        <IllustratedBookReader
          open={!!pdfViewerData}
          onClose={async (lastViewedPage) => {
            // Pause the session and end the timer
            const schedule = pdfViewerData.schedule;
            const media = pdfViewerData.media;
            setPlayingScheduleId(null);
            await updateScheduleMutation.mutateAsync({
              id: schedule.id,
              data: { status: 'paused' }
            });
            setPdfViewerData(null);

            // Prompt for pages read - use lastViewedPage as suggestion
            setPagesReadModal({
              schedule,
              media: { ...media, suggestedPage: lastViewedPage || media.pages_read || 1 }
            });
          }}
          pdfUrl={pdfViewerData.media.pdf_url}
          bookTitle={pdfViewerData.media.title}
          initialPage={pdfViewerData.initialPage}
          totalPages={pdfViewerData.media.total_pages}
          mediaId={pdfViewerData.media.id}
          media={pdfViewerData.media}
        />
      )}





      {deleteUserConfirm && (
        <Dialog open={!!deleteUserConfirm} onOpenChange={() => setDeleteUserConfirm(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-white">Delete User & All Data?</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm">This will permanently delete the user and ALL their data including subscriptions, payments, invoices, media, and schedules. This action cannot be undone.</p>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setDeleteUserConfirm(null)} className="flex-1 bg-white text-black hover:bg-zinc-100">
                Cancel
              </Button>
              <Button onClick={async () => {
                const userEmail = deleteUserConfirm;
                setDeleteUserConfirm(null);
                await executeAction('Deleting User', async () => {
                  await deleteUserMutation.mutateAsync(userEmail);
                }, {
                  successTitle: 'User Deleted',
                  successSubtitle: 'User and all associated data removed'
                });
              }} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                Delete User & Data
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Watch Party Coming Soon Modal */}
      <WatchPartyDashboard open={showWatchPartyModal} onClose={() => setShowWatchPartyModal(false)} />

      <Footer lastLibraryUpdate={lastLibraryUpdate} />
    </div >
  );
}