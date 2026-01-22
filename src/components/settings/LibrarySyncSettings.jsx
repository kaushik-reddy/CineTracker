import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, RefreshCw, Loader2, AlertCircle, CheckCircle2, Crown, Search, Film, Tv, Book } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LibrarySyncSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [availableTitles, setAvailableTitles] = useState([]);
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');

  useEffect(() => {
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

  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      if (prefs.length > 0) return prefs[0];
      
      // Create default preferences if none exist
      const newPrefs = await base44.entities.UserPreferences.create({
        user_email: user.email,
        include_global_library: true,
        global_library_sync_frequency: 'weekly'
      });
      return newPrefs;
    },
    enabled: !!user?.email
  });

  const { data: globalLibraryCount = 0 } = useQuery({
    queryKey: ['global-library-count'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      const adminEmails = allUsers.filter(u => u.role === 'admin').map(u => u.email);
      const allMedia = await base44.entities.Media.list();
      return allMedia.filter(m => adminEmails.includes(m.created_by)).length;
    },
    enabled: !!user
  });

  // Get user's subscription and plan
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

  // Get user's current library count
  const { data: userMediaCount = 0 } = useQuery({
    queryKey: ['user-media-count', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const userMedia = await base44.entities.Media.filter({ created_by: user.email });
      return userMedia.length;
    },
    enabled: !!user
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return base44.entities.UserPreferences.update(preferences.id, data);
      } else {
        return base44.entities.UserPreferences.create({
          user_email: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('Settings updated');
    }
  });

  const handleToggleGlobalLibrary = async (enabled) => {
    await updatePreferencesMutation.mutateAsync({
      include_global_library: enabled
    });

    window.dispatchEvent(new CustomEvent('global-library-toggled', { 
      detail: { enabled } 
    }));
  };

  const handleSyncFrequencyChange = async (frequency) => {
    await updatePreferencesMutation.mutateAsync({
      global_library_sync_frequency: frequency
    });
  };

  const handleOpenSyncDialog = async () => {
    try {
      setSyncing(true);
      toast.info('Loading admin library...');

      // Get all users
      const allUsers = await base44.entities.User.list();
      const adminUser = allUsers.find(u => u.role === 'admin');
      
      if (!adminUser) {
        toast.error('No admin account found');
        setSyncing(false);
        return;
      }

      // Get admin's media
      const adminMedia = await base44.entities.Media.filter({ created_by: adminUser.email });
      
      if (!adminMedia || adminMedia.length === 0) {
        toast.error('Admin library is empty');
        setSyncing(false);
        return;
      }

      // Get user's media
      const myMedia = await base44.entities.Media.filter({ created_by: user.email });
      const myTitles = new Set(myMedia.map(m => `${m.title}_${m.type}`));
      
      // Filter out titles user already has
      const availableToSync = adminMedia.filter(m => !myTitles.has(`${m.title}_${m.type}`));

      if (availableToSync.length === 0) {
        toast.info('You already have all admin titles!');
        setSyncing(false);
        return;
      }

      // Show dialog with available titles
      setAvailableTitles(availableToSync);
      setSelectedTitles([]);
      setShowSelectionDialog(true);
      toast.success(`Found ${availableToSync.length} titles to sync`);
      setSyncing(false);
      
    } catch (error) {
      toast.error('Error: ' + error.message);
      setSyncing(false);
    }
  };

  const handleSyncSelected = async () => {
    if (selectedTitles.length === 0) {
      toast.error('Please select at least one title');
      return;
    }

    setSyncing(true);
    try {
      let syncedCount = 0;
      for (const mediaId of selectedTitles) {
        const media = availableTitles.find(m => m.id === mediaId);
        if (!media) continue;

        try {
          const { id, created_date, updated_date, created_by, ...mediaData } = media;
          await base44.entities.Media.create(mediaData);
          syncedCount++;
        } catch (err) {
          console.error('Failed to copy media:', media.title, err);
        }
      }
      
      await updatePreferencesMutation.mutateAsync({
        last_global_sync: new Date().toISOString()
      });
      
      // Force complete refresh
      await queryClient.invalidateQueries({ queryKey: ['media', user.email] });
      await queryClient.invalidateQueries({ queryKey: ['user-media-count'] });
      await queryClient.refetchQueries({ queryKey: ['media', user.email] });
      
      toast.success(`Added ${syncedCount} titles to your library!`);
      setShowSelectionDialog(false);
      setSelectedTitles([]);
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const toggleTitleSelection = (mediaId) => {
    setSelectedTitles(prev => {
      if (prev.includes(mediaId)) {
        return prev.filter(id => id !== mediaId);
      } else {
        // Check if user has reached their limit
        const maxLibraryItems = userPlan?.max_library_items ?? -1;
        const availableSlots = maxLibraryItems === -1 ? Infinity : maxLibraryItems - userMediaCount;
        
        if (prev.length >= availableSlots) {
          toast.error(`You can only select ${availableSlots} more titles. Upgrade your plan for more.`);
          return prev;
        }
        
        return [...prev, mediaId];
      }
    });
  };

  // Get unique filter options
  const filterOptions = React.useMemo(() => {
    const genres = new Set();
    const years = new Set();
    const languages = new Set();
    const platforms = new Set();

    availableTitles.forEach(media => {
      if (media.genre) media.genre.forEach(g => genres.add(g));
      if (media.year) years.add(media.year);
      if (media.language) languages.add(media.language);
      if (media.platform) platforms.add(media.platform);
    });

    return {
      genres: Array.from(genres).sort(),
      years: Array.from(years).sort((a, b) => b - a),
      languages: Array.from(languages).sort(),
      platforms: Array.from(platforms).sort()
    };
  }, [availableTitles]);

  const filteredAvailableTitles = availableTitles.filter(media => {
    const matchesSearch = media.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || media.type === filterType;
    const matchesGenre = filterGenre === 'all' || media.genre?.includes(filterGenre);
    const matchesYear = filterYear === 'all' || media.year?.toString() === filterYear;
    const matchesLanguage = filterLanguage === 'all' || media.language === filterLanguage;
    const matchesPlatform = filterPlatform === 'all' || media.platform === filterPlatform;
    return matchesSearch && matchesType && matchesGenre && matchesYear && matchesLanguage && matchesPlatform;
  });

  if (!user || !preferences) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const maxLibraryItems = userPlan?.max_library_items ?? -1;
  const availableSlots = maxLibraryItems === -1 ? Infinity : Math.max(0, maxLibraryItems - userMediaCount);
  const isAtLimit = availableSlots === 0;

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
          <Database className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          Global Library Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium text-sm sm:text-base">Include Global Library</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Merge {globalLibraryCount} admin-curated titles into your library
              </p>
            </div>
            <Switch
              checked={preferences.include_global_library ?? true}
              onCheckedChange={handleToggleGlobalLibrary}
              disabled={updatePreferencesMutation.isPending}
            />
          </div>

          {preferences.include_global_library && (
            <div className="border-t border-zinc-700 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm text-zinc-400 mb-2 block">Sync Frequency</label>
                <Select 
                  value={preferences.global_library_sync_frequency || 'weekly'} 
                  onValueChange={handleSyncFrequencyChange}
                  disabled={updatePreferencesMutation.isPending}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="manual" className="text-white">Manual Only</SelectItem>
                    <SelectItem value="daily" className="text-white">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {/* Library Limits Display */}
                <div className="bg-zinc-900/50 p-3 rounded border border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400">Library Usage</span>
                    <span className="text-sm font-medium text-white">
                      {userMediaCount} / {maxLibraryItems === -1 ? '∞' : maxLibraryItems}
                    </span>
                  </div>
                  {maxLibraryItems !== -1 && (
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (userMediaCount / maxLibraryItems) * 100)}%` }}
                      />
                    </div>
                  )}
                  {isAtLimit && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Library limit reached
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleOpenSyncDialog()}
                  disabled={syncing || isAtLimit}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 h-9 sm:h-10"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      <span className="text-sm sm:text-base">Loading...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="text-sm sm:text-base">Browse & Sync Titles</span>
                    </>
                  )}
                </Button>

                {isAtLimit && (
                  <Link to={createPageUrl('Pricing')}>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 h-9 sm:h-10">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="text-sm sm:text-base">Upgrade Plan</span>
                    </Button>
                  </Link>
                )}

                {preferences.last_global_sync && (
                  <p className="text-[10px] sm:text-xs text-zinc-500 text-center">
                    Last synced: {new Date(preferences.last_global_sync).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs sm:text-sm text-zinc-300">
              <p className="font-medium text-white text-sm sm:text-base">How Global Library Works:</p>
              <ul className="space-y-1 text-[10px] sm:text-xs">
                <li>• Global library contains admin-curated media titles</li>
                <li>• When enabled, global titles are merged with your personal titles</li>
                <li>• Your watch history, ratings, and schedules are always preserved</li>
                <li>• Disabling hides global titles unless you've interacted with them</li>
                <li>• Sync frequency controls how often new global titles appear</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-white text-xs sm:text-sm">Data Safety Guarantee</p>
              <p className="text-[10px] sm:text-xs text-zinc-400">
                Your personal library, watch history, ratings, and progress are never affected by global library actions. 
                All operations are safe and reversible.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Title Selection Dialog */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Select Titles to Sync</span>
              <div className="text-sm font-normal text-zinc-400">
                {selectedTitles.length} / {availableSlots === Infinity ? '∞' : availableSlots} selected
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles..."
                    className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="all" className="text-white">All Types</SelectItem>
                    <SelectItem value="movie" className="text-white">Movies</SelectItem>
                    <SelectItem value="series" className="text-white">Series</SelectItem>
                    <SelectItem value="book" className="text-white">Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select value={filterGenre} onValueChange={setFilterGenre}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white max-h-60">
                    <SelectItem value="all" className="text-white">All Genres</SelectItem>
                    {filterOptions.genres.map(g => (
                      <SelectItem key={g} value={g} className="text-white">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white max-h-60">
                    <SelectItem value="all" className="text-white">All Years</SelectItem>
                    {filterOptions.years.map(y => (
                      <SelectItem key={y} value={y.toString()} className="text-white">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white max-h-60">
                    <SelectItem value="all" className="text-white">All Languages</SelectItem>
                    {filterOptions.languages.map(l => (
                      <SelectItem key={l} value={l} className="text-white">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-xs">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white max-h-60">
                    <SelectItem value="all" className="text-white">All Platforms</SelectItem>
                    {filterOptions.platforms.map(p => (
                      <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Summary */}
              {(filterGenre !== 'all' || filterYear !== 'all' || filterLanguage !== 'all' || filterPlatform !== 'all') && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Filters active:</span>
                  {filterGenre !== 'all' && <Badge variant="outline" className="text-xs">{filterGenre}</Badge>}
                  {filterYear !== 'all' && <Badge variant="outline" className="text-xs">{filterYear}</Badge>}
                  {filterLanguage !== 'all' && <Badge variant="outline" className="text-xs">{filterLanguage}</Badge>}
                  {filterPlatform !== 'all' && <Badge variant="outline" className="text-xs">{filterPlatform}</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-xs text-purple-400 hover:text-purple-300"
                    onClick={() => {
                      setFilterGenre('all');
                      setFilterYear('all');
                      setFilterLanguage('all');
                      setFilterPlatform('all');
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Available Titles List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredAvailableTitles.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No titles found</p>
                </div>
              ) : (
                filteredAvailableTitles.map((media) => {
                  const isSelected = selectedTitles.includes(media.id);
                  const TypeIcon = media.type === 'movie' ? Film : media.type === 'series' ? Tv : Book;
                  
                  return (
                    <div
                      key={media.id}
                      onClick={() => toggleTitleSelection(media.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-purple-500/20 border-purple-500/50' 
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTitleSelection(media.id)}
                        className="mt-1"
                      />
                      {media.poster_url && (
                        <img 
                          src={media.poster_url} 
                          alt={media.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <TypeIcon className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm truncate">{media.title}</h4>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-zinc-400">
                              {media.year && <span>{media.year}</span>}
                              {media.language && <span>• {media.language}</span>}
                              {media.platform && <span>• {media.platform}</span>}
                            </div>
                            {media.genre && media.genre.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {media.genre.slice(0, 3).map((g, idx) => (
                                  <span key={idx} className="text-[10px] px-2 py-0.5 bg-zinc-700 rounded text-zinc-300">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-zinc-800">
              <Button
                onClick={() => setShowSelectionDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={syncing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSyncSelected}
                disabled={syncing || selectedTitles.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>Sync {selectedTitles.length} Title{selectedTitles.length !== 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}