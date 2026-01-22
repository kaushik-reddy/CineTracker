import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Sparkles, Award, Users, Star, TrendingUp, Film, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function NewsPanel({ mediaMap }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const CACHE_KEY = 'movie_news_cache';
    const CACHE_DURATION = 24 * 60 * 60 * 1000;

    const fetchNews = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setNews(data);
            setLoading(false);
            return;
          }
        }

        const allTitles = Object.values(mediaMap).map(m => m.title);
        if (allTitles.length === 0) {
          setLoading(false);
          return;
        }

        const selectedTitles = allTitles.sort(() => 0.5 - Math.random()).slice(0, 15);

        const prompt = `Give me 10-15 interesting and recent facts, box office numbers, awards, ratings, cast news, or trivia about these titles from my watch library: ${selectedTitles.join(', ')}. Focus on recent updates, behind-the-scenes info, critical reception, and interesting details. Return as JSON with array of: title (exact movie/series name from list), fact (the interesting detail), type (e.g., "Box Office", "Award", "Trivia", "Cast", "Rating", "Behind the Scenes").`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              stories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    fact: { type: "string" },
                    type: { type: "string" }
                  }
                }
              }
            }
          }
        });

        if (response?.stories) {
          const newsData = response.stories.slice(0, 15);
          setNews(newsData);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: newsData,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [mediaMap]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-zinc-400 text-sm">Fetching latest news & facts...</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">Add titles to your library to see news & facts</p>
      </div>
    );
  }

  const typeIcons = {
    "Box Office": TrendingUp,
    "Award": Award,
    "Cast": Users,
    "Rating": Star,
    "Trivia": Sparkles,
    "Behind the Scenes": Film
  };

  return (
    <div className="space-y-3">
      {news.map((item, idx) => {
        const Icon = typeIcons[item.type] || Sparkles;
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-white font-semibold text-sm flex-1">{item.title}</h4>
                  {item.type && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs border-0 flex items-center gap-1 flex-shrink-0">
                      <Icon className="w-3 h-3" />
                      {item.type}
                    </Badge>
                  )}
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300">
                  <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{item.fact}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}