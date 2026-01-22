import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Sparkles, Calendar, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import EntityLogo from "../common/EntityLogo";

export default function RecommendationsPanel({ mediaMap, completedSchedules, schedules, onSchedule, userPermissions }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const CACHE_KEY = 'ai_recommendations_cache';
    const CACHE_DURATION = 24 * 60 * 60 * 1000;

    const fetchRecommendations = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setRecommendations(data);
            setLoading(false);
            return;
          }
        }

        if (!completedSchedules || completedSchedules.length < 5) {
          setLoading(false);
          return;
        }
        
        const watchedTitles = completedSchedules.slice(0, 20).map(s => {
          const media = mediaMap[s.media_id];
          return media ? `${media.title} (${media.genre?.join(', ')})` : '';
        }).filter(Boolean);
        
        const unwatchedTitles = Object.values(mediaMap)
          .filter(m => m.status !== 'watched')
          .map(m => `${m.title} (${m.genre?.join(', ')})`);
        
        if (unwatchedTitles.length === 0) {
          setLoading(false);
          return;
        }
        
        const prompt = `Based on these recently watched titles: ${watchedTitles.join(', ')}. Recommend 5 titles from this unwatched list: ${unwatchedTitles.join(', ')}. Return JSON with: title (exact match from unwatched list), reason (why recommended in 1 sentence)`;
        
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    reason: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        if (response?.recommendations) {
          setRecommendations(response.recommendations);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: response.recommendations,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('AI recommendations failed:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (completedSchedules && completedSchedules.length >= 5) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [completedSchedules, mediaMap]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-zinc-400 text-sm">Generating AI recommendations...</p>
      </div>
    );
  }

  if (!completedSchedules || completedSchedules.length < 5) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">Watch at least 5 titles to get AI recommendations</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">No recommendations available. Try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => {
        const media = Object.values(mediaMap).find(m => m.title === rec.title);
        if (!media) return null;
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-zinc-800/50 border-purple-500/30 hover:border-purple-500/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-white font-semibold text-sm flex-1">{rec.title}</p>
                  <Button
                    size="sm"
                    onClick={() => onSchedule(media)}
                    className="flex-shrink-0 text-xs bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule
                  </Button>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300">
                  <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>{rec.reason}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                    {media.type === 'series' ? 'Series' : media.type === 'book' ? 'Book' : 'Movie'}
                  </Badge>
                  {media.platform && (
                    <EntityLogo entityName={media.platform} category="platform" size="xs" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}