import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Film, Tv, Book } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function UniverseExplorer({ onNavigateToMedia }) {
  const [universes, setUniverses] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [universesData, media, logosData] = await Promise.all([
          base44.entities.Universe.filter({ is_active: true }),
          base44.entities.Media.list(),
          base44.entities.Logo.filter({ is_active: true })
        ]);
        setUniverses(universesData);
        setMediaList(media);
        setLogos(logosData);
      } catch (error) {
        console.error('Failed to load universe data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getUniverseTitles = (universeId) => {
    return mediaList
      .filter(m => m.universe_id === universeId)
      .sort((a, b) => (a.year || 0) - (b.year || 0));
  };

  const getUniverseLogo = (universeName) => {
    const logo = logos.find(l => l.name === universeName && l.category === 'studio');
    return logo?.processed_url || logo?.original_url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (universes.length === 0) {
    return (
      <div className="text-center py-20">
        <Sparkles className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
        <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Universes Yet</h3>
        <p className="text-zinc-500">Create universes in Admin to group related titles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {universes.map((universe, idx) => {
        const titles = getUniverseTitles(universe.id);
        const logoUrl = getUniverseLogo(universe.name);

        return (
          <motion.div
            key={universe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-zinc-900/80 border-zinc-800 hover:border-purple-500/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {logoUrl ? (
                      <div className="w-12 h-12 bg-black rounded-lg p-2 flex-shrink-0">
                        <img 
                          src={logoUrl} 
                          alt={universe.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <Sparkles className="w-8 h-8 text-purple-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-white text-lg font-bold truncate">
                        {universe.name}
                      </CardTitle>
                      {universe.description && (
                        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{universe.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 flex-shrink-0">
                    {titles.length} {titles.length === 1 ? 'Title' : 'Titles'}
                  </Badge>
                </div>
              </CardHeader>

              {titles.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {titles.map((media) => {
                      const Icon = media.type === 'movie' ? Film : media.type === 'series' ? Tv : Book;
                      return (
                        <div
                          key={media.id}
                          onClick={() => onNavigateToMedia?.(media.id)}
                          className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg cursor-pointer transition-all group"
                        >
                          {media.poster_url ? (
                            <img 
                              src={media.poster_url} 
                              alt={media.title}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center flex-shrink-0">
                              <Icon className="w-6 h-6 text-zinc-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
                              {media.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {media.year && (
                                <span className="text-xs text-zinc-500">{media.year}</span>
                              )}
                              <Badge className="bg-amber-500/20 text-amber-400 text-xs border-0">
                                {media.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}