import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StatDetailModal({ 
  open, 
  onClose, 
  title, 
  subtitle, 
  data = [], 
  icon: Icon, 
  value, 
  color,
  trendData = [],
  insight
}) {
  // Calculate trend direction if trendData is available
  const trend = useMemo(() => {
    if (trendData.length < 2) return null;
    const first = trendData[0]?.value || 0;
    const last = trendData[trendData.length - 1]?.value || 0;
    const change = ((last - first) / first) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1)
    };
  }, [trendData]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-hidden w-[95vw] sm:w-full p-0">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-6 py-5 border-b border-zinc-700">
          
          <div className="flex items-start gap-4">
            {Icon && (
              <div className={`p-3 rounded-xl bg-gradient-to-br ${color || 'from-purple-500 to-purple-600'} bg-opacity-20`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white mb-1">{title}</DialogTitle>
              <p className="text-sm text-zinc-400 leading-relaxed">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-6 space-y-6">
          {/* Current Stat Value Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-2">Current Value</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-bold text-white">{value || data.length}</p>
                  {trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      trend.direction === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trend.direction === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-semibold">{trend.percentage}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Total Entries</p>
                <p className="text-2xl font-bold text-amber-400">{data.length}</p>
              </div>
            </div>
          </motion.div>

          {/* Trend Graph Section */}
          {trendData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Trend Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="statGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#71717a" 
                    style={{ fontSize: '11px' }} 
                  />
                  <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#18181b', 
                      border: '1px solid #3f3f46', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#statGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Insight Block */}
          {insight && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 rounded-xl p-5 border border-purple-500/30"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Insight</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Contributing Titles Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Contributing Titles</h3>
              <Badge className="bg-amber-500/20 text-amber-400 border-0">
                {data.length} {data.length === 1 ? 'title' : 'titles'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {data.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.02) }}
                  className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-amber-500/30 hover:bg-zinc-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {/* Poster Thumbnail */}
                    {item.poster ? (
                      <img 
                        src={item.poster} 
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded border border-zinc-600 group-hover:border-amber-500/50 transition-colors flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-zinc-700 rounded border border-zinc-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl text-zinc-500">{item.title?.[0]}</span>
                      </div>
                    )}
                    
                    {/* Title Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-zinc-400">{item.subtitle}</p>
                        {item.status && (
                          <Badge className={`text-[9px] px-1.5 py-0 ${
                            item.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                            item.status === 'Playing' ? 'bg-blue-500/20 text-blue-400' :
                            item.status === 'Paused' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-zinc-700 text-zinc-400'
                          }`}>
                            {item.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Contribution Value */}
                    {item.value && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-0 ml-2 flex-shrink-0">
                        {item.value}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {data.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500">No contributing titles available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}