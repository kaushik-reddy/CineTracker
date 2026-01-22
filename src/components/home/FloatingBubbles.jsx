import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, X, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FloatingBubbles({ aiRecommendations, movieNews, mediaMap, onSchedule, canSchedule }) {
  const [expandedBubble, setExpandedBubble] = useState(null);

  const toggleBubble = (bubbleName) => {
    setExpandedBubble(expandedBubble === bubbleName ? null : bubbleName);
  };

  return (
    <>
      {/* Floating Bubbles */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <AnimatePresence>
          {/* AI Recommendations Bubble */}
          {aiRecommendations?.length > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              {expandedBubble === 'recommendations' ? (
                <Card className="w-80 sm:w-96 bg-zinc-900 border-purple-500/50 shadow-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        AI Recommendations
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedBubble(null)}
                        className="h-6 w-6 p-0 hover:bg-zinc-800"
                      >
                        <X className="w-4 h-4 text-zinc-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
                    {aiRecommendations.map((rec, idx) => {
                      const media = Object.values(mediaMap).find(m => m.title === rec.title);
                      if (!media) return null;
                      return (
                        <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-purple-500/30">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <p className="text-white font-semibold text-xs truncate flex-1">{rec.title}</p>
                            <Button
                              size="sm"
                              onClick={() => onSchedule(media)}
                              className="flex-shrink-0 text-xs h-7 bg-gradient-to-r from-purple-500 to-emerald-500 text-white hover:from-purple-600 hover:to-emerald-600"
                            >
                              Schedule
                            </Button>
                          </div>
                          <p className="text-xs text-zinc-300 break-words">{rec.reason}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : (
                <button
                  onClick={() => toggleBubble('recommendations')}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all flex items-center justify-center group"
                >
                  <Sparkles className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </button>
              )}
            </motion.div>
          )}

          {/* Facts & News Bubble */}
          {movieNews?.length > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            >
              {expandedBubble === 'news' ? (
                <Card className="w-80 sm:w-96 bg-zinc-900 border-amber-500/50 shadow-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        Facts & News
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedBubble(null)}
                        className="h-6 w-6 p-0 hover:bg-zinc-800"
                      >
                        <X className="w-4 h-4 text-zinc-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-zinc-700">
                    {movieNews.slice(0, 10).map((news, idx) => (
                      <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-white font-semibold text-xs flex-1 break-words">{news.title}</h4>
                          {news.type && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-[10px] border-0 flex-shrink-0">
                              {news.type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed break-words">{news.fact}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <button
                  onClick={() => toggleBubble('news')}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg hover:shadow-xl hover:shadow-amber-500/50 transition-all flex items-center justify-center group"
                >
                  <TrendingUp className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}