import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Film, Tv, Book, Sparkles, CheckCircle } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useConfigurableOptions } from '../admin/ConfigLoader';
import PlanLimitModal from '../common/PlanLimitModal';

// Base options - always available
const basePlatforms = [
  "Netflix", "Amazon Prime Video", "Disney+", "Disney+ Hotstar", "HBO Max", "Apple TV+", 
  "Hulu", "Paramount+", "Peacock", "SonyLIV", "Zee5", "Voot", "MX Player", "JioCinema", 
  "Aha", "Sun NXT", "Theater", "Kindle", "Audible", "Google Play Books", "Apple Books", 
  "Physical Book", "Library", "PDF", "Other"
];

const baseDevices = [
  "TV", "Laptop", "Phone", "Tablet", "Projector", "Big Screen", "Theater",
  "E-Reader", "Kindle", "Other"
];

const baseGenres = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", 
  "Family", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", 
  "Biography", "Musical", "Sport", "War", "Western"
];

const baseAgeRatings = [
  "U", "U/A 7+", "U/A 13+", "U/A 16+", "A",
  "G", "PG", "PG-13", "R", "NC-17",
  "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA",
  "Children", "Young Adult", "Adult", "Mature"
];

const baseLanguages = [
  "English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", 
  "Spanish", "French", "German", "Japanese", "Korean", "Chinese", "Other"
];

export default function MediaForm({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'movie',
    runtime_minutes: '',
    total_pages: '',
    year: '',
    age_restriction: '',
    genre: [],
    language: '',
    seasons_count: '',
    episodes_per_season: [],
    description: '',
    actors: [],
    author: '',
    poster_url: '',
    platform: '',
    device: '',
    is_future_release: false,
    release_date: '',
    universe_id: ''
  });
  const [actorInput, setActorInput] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [episodeInputs, setEpisodeInputs] = useState([]);
  const [episodeRuntimes, setEpisodeRuntimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoFetching, setAutoFetching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [universes, setUniverses] = useState([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState(null);

  // Load dynamic options from Admin
  const { options: languageOptions } = useConfigurableOptions('language');
  const { options: genreOptions } = useConfigurableOptions('genre');
  const { options: platformOptions } = useConfigurableOptions('platform');
  const { options: ageRatingOptions } = useConfigurableOptions('age_rating');

  // Merge base options with admin options (append-only)
  const languages = useMemo(() => {
    const adminValues = languageOptions.map(o => o.value);
    const merged = [...baseLanguages];
    adminValues.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  }, [languageOptions]);

  const genres = useMemo(() => {
    const adminValues = genreOptions.map(o => o.value);
    const merged = [...baseGenres];
    adminValues.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  }, [genreOptions]);

  const allPlatforms = useMemo(() => {
    const adminValues = platformOptions.map(o => o.value);
    const merged = [...basePlatforms];
    adminValues.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  }, [platformOptions]);

  const bookKeywords = ['kindle', 'book', 'library', 'pdf', 'audible', 'kobo', 'scribd'];
  const movieSeriesPlatforms = allPlatforms.filter(p => !bookKeywords.some(kw => p.toLowerCase().includes(kw)));
  const bookPlatforms = allPlatforms.filter(p => bookKeywords.some(kw => p.toLowerCase().includes(kw)) || p === 'Other');

  const allAgeRatings = useMemo(() => {
    const adminValues = ageRatingOptions.map(o => o.value);
    const merged = [...baseAgeRatings];
    adminValues.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  }, [ageRatingOptions]);

  const bookAgeKeywords = ['children', 'young adult', 'adult', 'mature'];
  const movieSeriesAgeRatings = allAgeRatings.filter(r => !bookAgeKeywords.some(kw => r.toLowerCase() === kw.toLowerCase()));
  const bookAgeRatings = allAgeRatings.filter(r => bookAgeKeywords.some(kw => r.toLowerCase() === kw.toLowerCase()));

  useEffect(() => {
    // Load universes
    const loadUniverses = async () => {
      try {
        const data = await base44.entities.Universe.filter({ is_active: true });
        setUniverses(data);
      } catch (error) {
        console.error('Failed to load universes:', error);
      }
    };
    if (open) loadUniverses();
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        genre: initialData.genre || [],
        actors: initialData.actors || [],
        episodes_per_season: initialData.episodes_per_season || [],
        seasons_count: initialData.seasons_count || '',
        runtime_minutes: initialData.runtime_minutes || '',
        year: initialData.year || '',
        age_restriction: initialData.age_restriction || '',
        language: initialData.language || '',
        is_future_release: initialData.is_future_release || false,
        release_date: initialData.release_date || '',
        universe_id: initialData.universe_id || ''
      });
      if (initialData.episodes_per_season) {
        setEpisodeInputs(initialData.episodes_per_season);
      }
      // CRITICAL FIX: Load existing episode runtimes properly
      if (initialData.episode_runtimes && initialData.episode_runtimes.length > 0) {
        setEpisodeRuntimes(initialData.episode_runtimes.map(season => season.map(ep => ep.toString())));
      } else {
        setEpisodeRuntimes([]);
      }
    } else {
      setFormData({
        title: '',
        type: 'movie',
        runtime_minutes: '',
        year: '',
        age_restriction: '',
        genre: [],
        language: '',
        seasons_count: '',
        episodes_per_season: [],
        description: '',
        actors: [],
        poster_url: '',
        platform: '',
        device: '',
        is_future_release: false,
        release_date: '',
        universe_id: ''
      });
      setEpisodeInputs([]);
    }
  }, [initialData, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'seasons_count') {
      const count = parseInt(value) || 0;
      setEpisodeInputs(Array(count).fill(''));
      setEpisodeRuntimes(Array(count).fill([]));
    }
    
    // Auto-fetch title data when title is entered (debounced)
    if (field === 'title' && value && value.length > 3 && !initialData) {
      clearTimeout(window.titleFetchTimeout);
      window.titleFetchTimeout = setTimeout(() => {
        fetchTitleData(value);
      }, 1000);
    }
  };

  const fetchTitleData = async (title) => {
    setAutoFetching(true);
    try {
      const yearHint = formData.year ? ` (${formData.year})` : '';
      
      let prompt = '';
      let responseSchema = {};
      
      if (formData.type === 'movie') {
        prompt = `Search IMDb/OMDb API for movie "${title}"${yearHint}.

Use OMDb API endpoint: http://www.omdbapi.com/?t=${title.replace(/\s/g, '+')}&apikey=YOUR_KEY

Extract and return:
1. poster_url - Use the "Poster" field from OMDb response. This will be a direct IMDb CDN URL like "https://m.media-amazon.com/images/M/MV5B..."
2. runtime_minutes - Parse "Runtime" field, convert to minutes (number)
3. age_restriction - Use "Rated" field (PG, PG-13, R, etc.)
4. year - Parse "Year" field (number)
5. description - Use "Plot" field
6. actors - Split "Actors" field into array
7. genre - Split "Genre" field into array
8. language - Use "Language" field

CRITICAL: Return the exact poster URL from OMDb API's "Poster" field. Do NOT modify or use alternative sources.`;
        
        responseSchema = {
          type: "object",
          properties: {
            poster_url: { type: "string" },
            runtime_minutes: { type: "number" },
            age_restriction: { type: "string" },
            year: { type: "number" },
            description: { type: "string" },
            actors: { type: "array", items: { type: "string" } },
            genre: { type: "array", items: { type: "string" } },
            language: { type: "string" }
          }
        };
      } else if (formData.type === 'series') {
        prompt = `Search IMDb for series "${title}"${yearHint} and get COMPLETE per-episode data.

MANDATORY: Access IMDb's episode guide page for this series. For EACH episode of EACH season, extract the individual runtime shown on IMDb's episode page (e.g., "47m" for Stranger Things S1E1).

Return:
1. poster_url - Direct IMDb poster URL from OMDb API "Poster" field: "https://m.media-amazon.com/images/M/..."
2. seasons_count - Total number of seasons (number)
3. episodes_per_season - Episode count per season [10, 9, 8, ...]
4. episode_runtimes - CRITICAL: 2D array with ACTUAL runtime for EVERY episode from IMDb
   - Format: [[S1E1_min, S1E2_min, S1E3_min, ...], [S2E1_min, S2E2_min, ...], ...]
   - Example for Stranger Things: [[47, 56, 52, 50, 57, 53, 42, 55], [56, 56, 51, 48, 42, 50, 59, 46, 62], ...]
   - Get from IMDb episode pages - each episode shows its runtime (e.g., "47m", "56m")
   - If IMDb doesn't have it, use TVMaze API episode.runtime field
   - DO NOT use a single average - get ACTUAL per-episode data
5. year - Latest season year (number)
6. age_restriction - TV rating (TV-MA, TV-14, TV-PG, etc.)
7. description - Brief plot summary
8. actors - Main cast array (up to 8)
9. genre - Genres array
10. language - Original language

ABSOLUTE CRITICAL: episode_runtimes MUST contain the actual runtime for EVERY single episode as shown on IMDb. Do not estimate, do not average, get the real data.`;
        
        responseSchema = {
          type: "object",
          properties: {
            poster_url: { type: "string" },
            seasons_count: { type: "number" },
            episodes_per_season: { type: "array", items: { type: "number" } },
            episode_runtimes: { type: "array", items: { type: "array", items: { type: "number" } } },
            year: { type: "number" },
            age_restriction: { type: "string" },
            description: { type: "string" },
            actors: { type: "array", items: { type: "string" } },
            genre: { type: "array", items: { type: "string" } },
            language: { type: "string" }
          }
        };
      } else if (formData.type === 'book') {
        prompt = `Search Google Books API for book "${title}"${yearHint}.

Use Google Books endpoint: https://www.googleapis.com/books/v1/volumes?q=${title.replace(/\s/g, '+')}

Extract from first result:
1. poster_url - Construct from volumeId: "https://books.google.com/books/content?id=VOLUME_ID&printsec=frontcover&img=1&zoom=2&source=gbs_api"
   - Use volumeInfo.imageLinks.thumbnail or .smallThumbnail
   - Replace "zoom=1" with "zoom=2" for higher quality
2. total_pages - From volumeInfo.pageCount (number)
3. author - From volumeInfo.authors[0] (first author)
4. year - Parse volumeInfo.publishedDate, extract year (number)
5. age_restriction - From volumeInfo.maturityRating or categories (Children/Young Adult/Adult/Mature)
6. description - From volumeInfo.description
7. genre - From volumeInfo.categories array
8. language - From volumeInfo.language

CRITICAL: Use Google Books' official thumbnail URL structure with zoom=2 parameter for quality.`;
        
        responseSchema = {
          type: "object",
          properties: {
            poster_url: { type: "string" },
            total_pages: { type: "number" },
            author: { type: "string" },
            year: { type: "number" },
            age_restriction: { type: "string" },
            description: { type: "string" },
            genre: { type: "array", items: { type: "string" } },
            language: { type: "string" }
          }
        };
      }
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: responseSchema
      });

      if (response) {
        // Generate poster image using AI
        let posterUrl = formData.poster_url;
        try {
          const posterPrompt = formData.type === 'book' 
            ? `Book cover for "${title}" by ${response.author || 'unknown author'}. Professional book cover design with title text visible, ${response.genre?.join(', ') || 'fiction'} genre style, high quality, realistic`
            : `Movie poster for "${title}" (${response.year || ''}). ${response.description || ''}. ${response.genre?.join(', ') || 'drama'} genre. Cinematic, professional movie poster style, dramatic lighting`;
          
          const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: posterPrompt
          });
          
          if (imageResult?.url) {
            posterUrl = imageResult.url;
          }
        } catch (error) {
          console.error('Failed to generate poster:', error);
        }

        const baseData = {
          ...formData,
          title: title, // CRITICAL: Always populate title
          poster_url: posterUrl,
          year: response.year?.toString() || formData.year,
          age_restriction: response.age_restriction || formData.age_restriction,
          description: response.description || formData.description,
          genre: response.genre?.filter(Boolean) || formData.genre,
          language: response.language || formData.language
        };
        
        // Type-specific fields
        if (formData.type === 'movie') {
          setPreviewData({
            ...baseData,
            runtime_minutes: response.runtime_minutes?.toString() || formData.runtime_minutes,
            actors: response.actors?.filter(Boolean) || formData.actors,
            total_pages: undefined,
            author: undefined,
            seasons_count: undefined,
            episodes_per_season: undefined
          });
        } else if (formData.type === 'series') {
          // Calculate average runtime from episode_runtimes if available
          let avgRuntime = formData.runtime_minutes;
          if (response.episode_runtimes && response.episode_runtimes.length > 0) {
            const allRuntimes = response.episode_runtimes.flat().filter(r => r > 0);
            if (allRuntimes.length > 0) {
              avgRuntime = Math.round(allRuntimes.reduce((sum, r) => sum + r, 0) / allRuntimes.length);
            }
          } else if (response.runtime_minutes) {
            avgRuntime = response.runtime_minutes;
          }
          
          setPreviewData({
            ...baseData,
            runtime_minutes: avgRuntime?.toString() || formData.runtime_minutes,
            actors: response.actors?.filter(Boolean) || formData.actors,
            seasons_count: response.seasons_count?.toString() || formData.seasons_count,
            episodes_per_season: response.episodes_per_season || formData.episodes_per_season,
            episode_runtimes: response.episode_runtimes || formData.episode_runtimes,
            total_pages: undefined,
            author: undefined
          });
        } else if (formData.type === 'book') {
          setPreviewData({
            ...baseData,
            total_pages: response.total_pages?.toString() || formData.total_pages,
            author: response.author || formData.author,
            runtime_minutes: undefined,
            actors: undefined,
            seasons_count: undefined,
            episodes_per_season: undefined
          });
        }
        
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Auto-fetch failed:', error);
    } finally {
      setAutoFetching(false);
    }
  };

  const applyPreviewData = () => {
    if (previewData) {
      // Update episode inputs and runtimes for series
      if (previewData.type === 'series' && previewData.episodes_per_season) {
        setEpisodeInputs(previewData.episodes_per_season.map(e => e.toString()));
        
        // Set episode runtimes if available
        if (previewData.episode_runtimes && previewData.episode_runtimes.length > 0) {
          setEpisodeRuntimes(previewData.episode_runtimes.map(season => 
            season.map(ep => ep.toString())
          ));
        }
      }
      setFormData(previewData);
      setShowPreview(false);
      setPreviewData(null);
    }
  };

  const discardPreviewData = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  const addActor = () => {
    if (actorInput.trim() && !formData.actors.includes(actorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        actors: [...prev.actors, actorInput.trim()]
      }));
      setActorInput('');
    }
  };

  const removeActor = (actor) => {
    setFormData(prev => ({
      ...prev,
      actors: prev.actors.filter(a => a !== actor)
    }));
  };

  const addGenre = () => {
    if (genreInput && !formData.genre.includes(genreInput)) {
      setFormData(prev => ({
        ...prev,
        genre: [...prev.genre, genreInput]
      }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.filter(g => g !== genre)
    }));
  };

  const handleEpisodeChange = (index, value) => {
    const newInputs = [...episodeInputs];
    newInputs[index] = value;
    setEpisodeInputs(newInputs);
    
    // Initialize runtime array for this season
    const count = parseInt(value) || 0;
    const newRuntimes = [...episodeRuntimes];
    newRuntimes[index] = Array(count).fill('');
    setEpisodeRuntimes(newRuntimes);
  };

  const handleEpisodeRuntimeChange = (seasonIdx, episodeIdx, value) => {
    const newRuntimes = [...episodeRuntimes];
    if (!newRuntimes[seasonIdx]) newRuntimes[seasonIdx] = [];
    newRuntimes[seasonIdx][episodeIdx] = value;
    setEpisodeRuntimes(newRuntimes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Check plan limits when creating new title (not editing)
    if (!initialData) {
      try {
        const user = await base44.auth.me();
        const userSubs = await base44.entities.Subscription.filter({ 
          user_email: user.email,
          status: ['active', 'trial']
        });
        
        if (userSubs.length > 0) {
          const activeSub = userSubs[0];
          const plans = await base44.entities.Plan.filter({ id: activeSub.plan_id });
          
          if (plans.length > 0 && plans[0].max_library_items !== -1) {
            const currentMedia = await base44.entities.Media.filter({ created_by: user.email });
            
            if (currentMedia.length >= plans[0].max_library_items) {
              setLoading(false);
              onClose(); // Close the form first
              setTimeout(() => {
                setLimitModalData({
                  plan: plans[0],
                  usage: { library: currentMedia.length },
                  limitType: 'library'
                });
                setShowLimitModal(true);
              }, 100);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Failed to check plan limits:', error);
      }
    }
    
    const submitData = {
      ...formData,
      runtime_minutes: formData.type !== 'book' ? Number(formData.runtime_minutes) : undefined,
      total_pages: formData.type === 'book' ? Number(formData.total_pages) : undefined,
      year: formData.year ? Number(formData.year) : undefined,
      seasons_count: formData.type === 'series' && formData.seasons_count ? Number(formData.seasons_count) : undefined,
      episodes_per_season: formData.type === 'series' ? episodeInputs.map(e => Number(e) || 0) : undefined,
      episode_runtimes: formData.type === 'series' && episodeRuntimes.length > 0 ? 
        episodeRuntimes.map(season => season.map(ep => Number(ep) || Number(formData.runtime_minutes))) : undefined
    };
    await onSubmit(submitData);
    setLoading(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={onClose}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              {formData.type === 'movie' ? <Film className="w-5 h-5 text-amber-500" /> : formData.type === 'book' ? <Book className="w-5 h-5 text-amber-500" /> : <Tv className="w-5 h-5 text-amber-500" />}
              {initialData ? 'Edit Title' : 'Add New Title'}
              {autoFetching && <span className="text-xs text-emerald-400 animate-pulse">Fetching data...</span>}
            </DialogTitle>
          </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => handleChange('type', 'movie')}
              className={`flex-1 ${formData.type === 'movie' ? 'bg-amber-500 text-black hover:bg-amber-600' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              <Film className="w-4 h-4 mr-2" />
              Movie
            </Button>
            <Button
              type="button"
              onClick={() => handleChange('type', 'series')}
              className={`flex-1 ${formData.type === 'series' ? 'bg-amber-500 text-black hover:bg-amber-600' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              <Tv className="w-4 h-4 mr-2" />
              Series
            </Button>
            <Button
              type="button"
              onClick={() => handleChange('type', 'book')}
              className={`flex-1 ${formData.type === 'book' ? 'bg-amber-500 text-black hover:bg-amber-600' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              <Book className="w-4 h-4 mr-2" />
              Book
            </Button>
          </div>

          {/* Title & Year */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-zinc-300">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter title"
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Year</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                placeholder="2024"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Future Release Option */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <Label className="text-zinc-300">Future Release?</Label>
            <input
              type="checkbox"
              checked={formData.is_future_release}
              onChange={(e) => handleChange('is_future_release', e.target.checked)}
              className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-amber-500 focus:ring-amber-500"
            />
          </div>

          {formData.is_future_release && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Release Date *</Label>
              <Input
                type="date"
                value={formData.release_date}
                onChange={(e) => handleChange('release_date', e.target.value)}
                required={formData.is_future_release}
                className="bg-zinc-800 border-zinc-700 text-white focus:border-amber-500"
              />
            </div>
          )}

          {/* Runtime / Pages & Age Rating */}
          <div className="grid grid-cols-2 gap-4">
            {formData.type === 'movie' && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Runtime (minutes) *</Label>
                <Input
                  type="number"
                  value={formData.runtime_minutes}
                  onChange={(e) => handleChange('runtime_minutes', e.target.value)}
                  placeholder="120"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
                />
              </div>
            )}
            {formData.type === 'book' && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Total Pages *</Label>
                <Input
                  type="number"
                  value={formData.total_pages}
                  onChange={(e) => handleChange('total_pages', e.target.value)}
                  placeholder="300"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
                />
              </div>
            )}
            <div className={`space-y-2 ${formData.type === 'series' ? 'col-span-2' : ''}`}>
              <Label className="text-zinc-300">Age Rating</Label>
              <Select value={formData.age_restriction || undefined} onValueChange={(v) => handleChange('age_restriction', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {(formData.type === 'book' ? bookAgeRatings : movieSeriesAgeRatings).filter(r => r && r.trim()).map(r => (
                    <SelectItem key={r} value={r} className="text-white hover:bg-zinc-700">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Series Fields */}
          {formData.type === 'series' && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Number of Seasons</Label>
                <Input
                  type="number"
                  value={formData.seasons_count}
                  onChange={(e) => handleChange('seasons_count', e.target.value)}
                  placeholder="3"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
                />
              </div>

              {formData.seasons_count && parseInt(formData.seasons_count) > 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Episodes per Season</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {episodeInputs.map((val, idx) => (
                        <Input
                          key={idx}
                          type="number"
                          value={val}
                          onChange={(e) => handleEpisodeChange(idx, e.target.value)}
                          placeholder={`S${idx + 1} episodes`}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Episode Runtimes (optional) */}
                  {episodeInputs.some(e => e) && (
                    <div className="space-y-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                      <Label className="text-zinc-300">Episode Runtimes (Optional - leave blank to use default)</Label>
                      {episodeInputs.map((count, seasonIdx) => {
                        if (!count || parseInt(count) === 0) return null;
                        return (
                          <div key={seasonIdx} className="space-y-2">
                            <p className="text-xs text-zinc-400">Season {seasonIdx + 1} Episodes:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {Array.from({ length: parseInt(count) }, (_, episodeIdx) => (
                                <Input
                                  key={episodeIdx}
                                  type="number"
                                  value={episodeRuntimes[seasonIdx]?.[episodeIdx] || ''}
                                  onChange={(e) => handleEpisodeRuntimeChange(seasonIdx, episodeIdx, e.target.value)}
                                  placeholder={`E${episodeIdx + 1}`}
                                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500 text-xs"
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Language & Genre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Language</Label>
              <Select value={formData.language || undefined} onValueChange={(v) => handleChange('language', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {languages.filter(l => l && l.trim()).map(l => (
                    <SelectItem key={l} value={l} className="text-white hover:bg-zinc-700">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Genre</Label>
              <div className="flex gap-2">
                <Select value={genreInput || undefined} onValueChange={setGenreInput}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                    {genres.filter(g => g && g.trim()).map(g => (
                      <SelectItem key={g} value={g} className="text-white hover:bg-zinc-700">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addGenre} className="bg-zinc-700 hover:bg-zinc-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.genre.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.genre.map(genre => (
                    <Badge key={genre} className="bg-zinc-700 text-white pr-1 flex items-center gap-1">
                      {genre}
                      <button type="button" onClick={() => removeGenre(genre)} className="ml-1 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Poster URL */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Poster URL</Label>
            <Input
              value={formData.poster_url}
              onChange={(e) => handleChange('poster_url', e.target.value)}
              placeholder="https://..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
            />
            {formData.poster_url && (
              <div className="mt-2 w-20 aspect-[2/3] rounded-lg overflow-hidden border border-zinc-700">
                <img src={formData.poster_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Plot description..."
              rows={2}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500 resize-none"
            />
          </div>

          {/* Actors / Author */}
          {formData.type === 'book' ? (
            <div className="space-y-2">
              <Label className="text-zinc-300">Author</Label>
              <Input
                value={formData.author}
                onChange={(e) => handleChange('author', e.target.value)}
                placeholder="Author name"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-zinc-300">Actors</Label>
              <div className="flex gap-2">
                <Input
                  value={actorInput}
                  onChange={(e) => setActorInput(e.target.value)}
                  placeholder="Actor name"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addActor())}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500"
                />
                <Button type="button" onClick={addActor} className="bg-zinc-700 hover:bg-zinc-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.actors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.actors.map(actor => (
                    <Badge key={actor} className="bg-zinc-700 text-white pr-1 flex items-center gap-1">
                      {actor}
                      <button type="button" onClick={() => removeActor(actor)} className="ml-1 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Platform & Universe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Platform</Label>
              <Select value={formData.platform || undefined} onValueChange={(v) => handleChange('platform', v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white hover:shadow-xl transition-all">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {(formData.type === 'book' ? bookPlatforms : movieSeriesPlatforms).filter(p => p && p.trim()).map(p => (
                    <SelectItem key={p} value={p} className="text-white hover:bg-zinc-700 hover:shadow-xl transition-all">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Universe (Optional)</Label>
              <Select value={formData.universe_id || 'none'} onValueChange={(v) => handleChange('universe_id', v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  <SelectItem value="none" className="text-white hover:bg-zinc-700">None</SelectItem>
                  {universes.map(u => (
                    <SelectItem key={u.id} value={u.id} className="text-white hover:bg-zinc-700">{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PDF Upload for Books */}
          {formData.type === 'book' && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Upload PDF (Optional - auto-calculates pages)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      setLoading(true);
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      handleChange('pdf_url', file_url);
                      
                      // Calculate pages from PDF
                      const response = await fetch(file_url);
                      const blob = await response.blob();
                      const arrayBuffer = await blob.arrayBuffer();
                      const uint8Array = new Uint8Array(arrayBuffer);
                      const text = new TextDecoder().decode(uint8Array);
                      const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
                      const pageCount = pageMatches ? pageMatches.length : 0;
                      
                      if (pageCount > 0) {
                        handleChange('total_pages', pageCount.toString());
                      }
                      setLoading(false);
                    } catch (error) {
                      console.error('PDF upload/processing failed:', error);
                      setLoading(false);
                    }
                  }
                }}
                className="bg-zinc-800 border-zinc-700 text-white hover:shadow-xl transition-all"
              />
              {formData.pdf_url && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  PDF uploaded successfully
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} className="flex-1 bg-white text-black hover:bg-zinc-100">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-medium">
              {loading ? 'Saving...' : (initialData ? 'Update' : 'Add Title')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Preview Modal */}
    <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Auto-Fetched Title Data - Review & Confirm
          </DialogTitle>
          <p className="text-xs text-zinc-400 mt-2">Review the auto-filled data below. Edit any field or apply as-is.</p>
        </DialogHeader>

        {previewData && (
          <div className="space-y-4 mt-4">
            {/* Preview Card */}
            <div className="bg-zinc-800/50 rounded-lg p-3 sm:p-4 border border-emerald-500/30">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {previewData.poster_url && (
                  <img 
                    src={previewData.poster_url} 
                    alt={previewData.title}
                    className="w-24 sm:w-32 h-36 sm:h-48 object-cover rounded-lg border border-zinc-700 mx-auto sm:mx-0"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white">{previewData.title}</h3>
                  {previewData.year && <p className="text-xs sm:text-sm text-zinc-400">Year: {previewData.year}</p>}
                  {previewData.age_restriction && <p className="text-xs sm:text-sm text-zinc-400">Age Rating: {previewData.age_restriction}</p>}
                  {previewData.runtime_minutes && formData.type !== 'book' && <p className="text-xs sm:text-sm text-zinc-400">Runtime: {previewData.runtime_minutes} minutes</p>}
                  {previewData.total_pages && formData.type === 'book' && <p className="text-xs sm:text-sm text-zinc-400">Pages: {previewData.total_pages}</p>}
                  {previewData.seasons_count && formData.type === 'series' && <p className="text-xs sm:text-sm text-zinc-400">Seasons: {previewData.seasons_count}</p>}
                  {previewData.genre?.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {previewData.genre.map(g => (
                        <Badge key={g} className="bg-purple-500/20 text-purple-400 border-0 text-xs">{g}</Badge>
                      ))}
                    </div>
                  )}
                  {previewData.description && (
                    <p className="text-xs text-zinc-300 line-clamp-4 sm:line-clamp-3 mt-2">{previewData.description}</p>
                  )}
                  {previewData.actors?.length > 0 && formData.type !== 'book' && (
                    <div className="mt-2">
                      <p className="text-xs text-zinc-400 mb-1">Cast:</p>
                      <div className="flex flex-wrap gap-1">
                        {previewData.actors.slice(0, 5).map(actor => (
                          <span key={actor} className="text-xs text-white bg-zinc-700 px-2 py-0.5 rounded">{actor}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {previewData.author && formData.type === 'book' && (
                    <p className="text-xs text-zinc-300 mt-2">Author: {previewData.author}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-3 bg-zinc-800/30 p-3 sm:p-4 rounded-lg max-h-[40vh] overflow-y-auto">
              <p className="text-xs sm:text-sm text-zinc-400 mb-3">You can edit these fields before applying:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 text-xs">Year</Label>
                  <Input
                    type="number"
                    value={previewData.year || ''}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, year: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-zinc-300 text-xs">Age Rating</Label>
                  <Input
                    value={previewData.age_restriction || ''}
                    onChange={(e) => setPreviewData(prev => ({ ...prev, age_restriction: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
                    placeholder="PG-13, R, TV-MA, etc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.type !== 'book' && (
                  <div>
                    <Label className="text-zinc-300 text-xs">Runtime (min)</Label>
                    <Input
                      type="number"
                      value={previewData.runtime_minutes || ''}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, runtime_minutes: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
                    />
                  </div>
                )}
                
                {formData.type === 'book' && (
                  <div>
                    <Label className="text-zinc-300 text-xs">Total Pages</Label>
                    <Input
                      type="number"
                      value={previewData.total_pages || ''}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, total_pages: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
                    />
                  </div>
                )}
                
                {formData.type === 'series' && (
                  <div>
                    <Label className="text-zinc-300 text-xs">Seasons</Label>
                    <Input
                      type="number"
                      value={previewData.seasons_count || ''}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, seasons_count: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-zinc-300 text-xs">Poster URL</Label>
                <Input
                  value={previewData.poster_url || ''}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, poster_url: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-zinc-300 text-xs">Description</Label>
                <Textarea
                  value={previewData.description || ''}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                onClick={discardPreviewData}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Discard & Edit Manually
              </Button>
              <Button 
                onClick={applyPreviewData}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply This Data
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Plan Limit Modal */}
    {limitModalData && (
      <PlanLimitModal
        open={showLimitModal}
        onClose={() => {
          setShowLimitModal(false);
          setLimitModalData(null);
        }}
        currentPlan={limitModalData.plan}
        currentUsage={limitModalData.usage}
        limitType={limitModalData.limitType}
      />
    )}
    </>
  );
}