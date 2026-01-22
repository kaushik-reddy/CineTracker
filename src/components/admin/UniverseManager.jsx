import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function UniverseManager() {
  const [universes, setUniverses] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState(null);
  const [managingTitlesFor, setManagingTitlesFor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'franchise',
    cover_image: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [universesData, media] = await Promise.all([
        base44.entities.Universe.list('-created_date'),
        base44.entities.Media.list()
      ]);
      setUniverses(universesData);
      setMediaList(media);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Universe name is required');
      return;
    }

    try {
      if (editingUniverse) {
        await base44.entities.Universe.update(editingUniverse.id, formData);
        toast.success('Universe updated');
      } else {
        await base44.entities.Universe.create({ ...formData, is_active: true });
        toast.success('Universe created');
      }
      
      setShowAddForm(false);
      setEditingUniverse(null);
      setFormData({ name: '', description: '', type: 'franchise', cover_image: '' });
      loadData();
    } catch (error) {
      console.error('Failed to save universe:', error);
      toast.error('Failed to save universe');
    }
  };

  const handleEdit = (universe) => {
    setEditingUniverse(universe);
    setFormData({
      name: universe.name,
      description: universe.description || '',
      type: universe.type || 'franchise',
      cover_image: universe.cover_image || ''
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (universe) => {
    try {
      await base44.entities.Universe.update(universe.id, {
        is_active: !universe.is_active
      });
      toast.success(`Universe ${universe.is_active ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (error) {
      console.error('Failed to update universe:', error);
      toast.error('Failed to update universe');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = (universe) => {
    setDeleteConfirm(universe);
  };

  const confirmDelete = async () => {
    try {
      await base44.entities.Universe.delete(deleteConfirm.id);
      toast.success('Universe deleted');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete universe:', error);
      toast.error('Failed to delete universe');
      setDeleteConfirm(null);
    }
  };

  const getTitleCount = (universeId) => {
    return mediaList.filter(m => m.universe_id === universeId).length;
  };

  const handleAddTitle = async (universeId, mediaId) => {
    try {
      await base44.entities.Media.update(mediaId, { universe_id: universeId });
      toast.success('Title added to universe');
      loadData();
    } catch (error) {
      console.error('Failed to add title:', error);
      toast.error('Failed to add title');
    }
  };

  const handleRemoveTitle = async (mediaId) => {
    try {
      await base44.entities.Media.update(mediaId, { universe_id: null });
      toast.success('Title removed from universe');
      loadData();
    } catch (error) {
      console.error('Failed to remove title:', error);
      toast.error('Failed to remove title');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
                <Globe className="w-5 h-5 text-purple-400" />
                Connected Universes ({universes.length})
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-2">
                📌 Create and manage interconnected content universes (franchises, shared worlds). Group related titles together for better organization.
              </p>
            </div>
            <Button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingUniverse(null);
                setFormData({ name: '', description: '', type: 'franchise', cover_image: '' });
              }}
              className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Universe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-4"
            >
              <h4 className="text-white font-semibold text-sm">
                {editingUniverse ? 'Edit Universe' : 'Add New Universe'}
              </h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-300">Universe Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Marvel Cinematic Universe"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="franchise" className="text-white">Franchise</SelectItem>
                      <SelectItem value="shared_world" className="text-white">Shared World</SelectItem>
                      <SelectItem value="prequel_sequel" className="text-white">Prequel/Sequel</SelectItem>
                      <SelectItem value="spin_off" className="text-white">Spin-off</SelectItem>
                      <SelectItem value="anthology" className="text-white">Anthology</SelectItem>
                      <SelectItem value="other" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-300">Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the shared world"
                    className="bg-zinc-900 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Cover Image URL (optional)</Label>
                  <Input
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">
                  {editingUniverse ? 'Update' : 'Create'} Universe
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingUniverse(null);
                    setFormData({ name: '', description: '', type: 'franchise', cover_image: '' });
                  }}
                  className="bg-white text-black hover:bg-zinc-100"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {loading ? (
            <p className="text-center text-zinc-400 py-8">Loading universes...</p>
          ) : universes.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No universes configured yet</p>
          ) : (
            <div className="space-y-3">
              {universes.map((universe, idx) => {
                const titleCount = getTitleCount(universe.id);
                return (
                  <motion.div
                    key={universe.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      universe.is_active 
                        ? 'bg-zinc-800/50 border-zinc-700' 
                        : 'bg-zinc-800/20 border-zinc-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium text-sm">{universe.name}</h4>
                          <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                            {universe.type.replace('_', ' ')}
                          </Badge>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                            {titleCount} titles
                          </Badge>
                        </div>
                        {universe.description && (
                          <p className="text-sm text-zinc-400 mb-2">{universe.description}</p>
                        )}
                        
                        {/* Manage Titles Button */}
                        <Button
                          onClick={() => setManagingTitlesFor(universe.id)}
                          className="mt-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-xs h-7"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Manage Titles ({titleCount})
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(universe)}
                          className="text-zinc-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleActive(universe)}
                          className="text-zinc-400 hover:text-white"
                        >
                          {universe.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(universe)}
                          className="text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <p className="text-sm text-purple-300">
          <strong>How to use:</strong> Create universes to group related titles. Use "Manage Titles" to add/remove titles from universes. You can also assign universes when adding or editing individual titles.
        </p>
      </div>

      {/* Manage Titles Modal */}
      {managingTitlesFor && (() => {
        const universe = universes.find(u => u.id === managingTitlesFor);
        const connectedTitles = mediaList.filter(m => m.universe_id === managingTitlesFor);
        const availableTitles = mediaList.filter(m => !m.universe_id || m.universe_id === managingTitlesFor);
        
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-base">
                  Manage Titles for "{universe?.name}"
                </h3>
                <Button
                  onClick={() => setManagingTitlesFor(null)}
                  className="bg-white text-black hover:bg-zinc-100"
                >
                  Done
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Connected Titles */}
                <div>
                  <h4 className="text-zinc-300 font-semibold mb-3 text-sm">Connected Titles ({connectedTitles.length})</h4>
                  {connectedTitles.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-4">No titles connected yet</p>
                  ) : (
                    <div className="space-y-2">
                      {connectedTitles.map(media => (
                        <div key={media.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {media.poster_url && (
                              <img src={media.poster_url} alt={media.title} className="w-10 h-14 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{media.title}</p>
                              <p className="text-xs text-zinc-400">{media.year} • {media.type}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleRemoveTitle(media.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Titles */}
                <div>
                  <h4 className="text-zinc-300 font-semibold mb-3 text-sm">Available Titles</h4>
                  {availableTitles.filter(m => !m.universe_id).length === 0 ? (
                    <p className="text-sm text-zinc-500 py-4">All titles are already assigned to universes</p>
                  ) : (
                    <div className="space-y-2">
                      {availableTitles.filter(m => !m.universe_id).map(media => (
                        <div key={media.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {media.poster_url && (
                              <img src={media.poster_url} alt={media.title} className="w-10 h-14 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{media.title}</p>
                              <p className="text-xs text-zinc-400">{media.year} • {media.type}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddTitle(managingTitlesFor, media.id)}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Universe?</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm">
              Delete universe "{deleteConfirm.name}"? This will not delete the titles, but will remove the connection.
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