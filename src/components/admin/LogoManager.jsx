import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Image, Search, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import LogoUploader from "./LogoUploader";
import { motion } from "framer-motion";
import { invalidateLogoCache } from "./LogoCache.jsx";

export default function LogoManager() {
  const [logos, setLogos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadLogos = async () => {
    setLoading(true);
    try {
      const allLogos = await base44.entities.Logo.list('-created_date');
      setLogos(allLogos);
    } catch (error) {
      console.error('Failed to load logos:', error);
      toast.error('Failed to load logos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogos();
  }, []);

  const handleToggleActive = async (logo) => {
    try {
      await base44.entities.Logo.update(logo.id, {
        is_active: !logo.is_active
      });
      toast.success(`Logo ${logo.is_active ? 'deactivated' : 'activated'}`);
      invalidateLogoCache();
      loadLogos();
    } catch (error) {
      console.error('Failed to update logo:', error);
      toast.error('Failed to update logo');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = async (logo) => {
    setDeleteConfirm(logo);
  };

  const confirmDelete = async () => {
    const logo = deleteConfirm;
    const hasBackup = logo.backup_url;
    
    try {
      if (hasBackup) {
        // Restore backup
        await base44.entities.Logo.update(logo.id, {
          original_url: logo.backup_url,
          processed_url: logo.backup_url,
          backup_url: null
        });
        toast.success('Logo deleted - previous version restored');
      } else {
        // Delete completely
        await base44.entities.Logo.delete(logo.id);
        toast.success('Logo deleted');
              }
      invalidateLogoCache();
      loadLogos();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete logo:', error);
      toast.error('Failed to delete logo');
      setDeleteConfirm(null);
    }
  };

  const filteredLogos = logos.filter(logo => {
    const matchesSearch = logo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         logo.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || logo.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <LogoUploader onUploadComplete={loadLogos} />

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Image className="w-5 h-5 text-blue-400" />
              Logo Library ({filteredLogos.length})
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-2">
              📌 Upload and manage brand logos for platforms, studios, devices, and formats. These logos appear throughout the app automatically.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logos or tags..."
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'platform', 'studio', 'device', 'format', 'other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    filterCategory === cat
                      ? 'bg-gradient-to-r from-purple-500 to-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-zinc-400 py-8">Loading logos...</p>
          ) : filteredLogos.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No logos found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLogos.map((logo, idx) => (
                <motion.div
                  key={logo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 bg-zinc-800/50 rounded-lg border ${
                    logo.is_active ? 'border-zinc-700' : 'border-zinc-800 opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm truncate">{logo.name}</h4>
                      <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs mt-1">
                        {logo.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(logo)}
                        className="w-7 h-7 text-zinc-400 hover:text-white"
                      >
                        {logo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(logo)}
                        className="w-7 h-7 text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-900/50 rounded p-3 flex items-center justify-center h-24">
                    <img 
                      src={logo.processed_url || logo.original_url} 
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  
                  {logo.tags && logo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {logo.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-zinc-700/50 text-zinc-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Logo?</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm">
              {deleteConfirm.backup_url 
                ? `Delete logo "${deleteConfirm.name}"? Previous version will be restored.`
                : `Delete logo "${deleteConfirm.name}"? This will remove it completely.`
              }
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}