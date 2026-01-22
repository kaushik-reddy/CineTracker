import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function OptionManager() {
  const [options, setOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('language');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOption, setNewOption] = useState({
    label: '',
    value: '',
    icon: '',
    color: ''
  });

  const categories = [
    { value: 'language', label: 'Languages' },
    { value: 'genre', label: 'Genres' },
    { value: 'platform', label: 'Platforms' },
    { value: 'device', label: 'Devices' },
    { value: 'reading_device', label: 'Reading Devices' },
    { value: 'age_rating', label: 'Age Ratings' },
    { value: 'audio_format', label: 'Audio Formats' },
    { value: 'video_format', label: 'Video Formats' }
  ];

  const loadOptions = async () => {
    setLoading(true);
    try {
      const allOptions = await base44.entities.ConfigurableOption.filter({
        category: selectedCategory
      }, 'sort_order');
      setOptions(allOptions);
    } catch (error) {
      console.error('Failed to load options:', error);
      toast.error('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, [selectedCategory]);

  const handleAdd = async () => {
    if (!newOption.label || !newOption.value) {
      toast.error('Label and value are required');
      return;
    }

    try {
      await base44.entities.ConfigurableOption.create({
        category: selectedCategory,
        label: newOption.label,
        value: newOption.value,
        icon: newOption.icon || null,
        color: newOption.color || null,
        sort_order: options.length,
        is_active: true
      });
      
      // Invalidate cache
      const { invalidateOptionsCache } = await import('./ConfigLoader');
      invalidateOptionsCache(selectedCategory);
      
      toast.success('Option added - available immediately across app');
      setNewOption({ label: '', value: '', icon: '', color: '' });
      setShowAddForm(false);
      loadOptions();
    } catch (error) {
      console.error('Failed to add option:', error);
      toast.error('Failed to add option');
    }
  };

  const handleToggleActive = async (option) => {
    try {
      await base44.entities.ConfigurableOption.update(option.id, {
        is_active: !option.is_active
      });
      
      // Invalidate cache
      const { invalidateOptionsCache } = await import('./ConfigLoader');
      invalidateOptionsCache(selectedCategory);
      
      toast.success(`Option ${option.is_active ? 'deactivated' : 'activated'}`);
      loadOptions();
    } catch (error) {
      console.error('Failed to update option:', error);
      toast.error('Failed to update option');
    }
  };

  const handleDelete = async (option) => {
    if (!confirm(`Delete option "${option.label}"? This will remove it from all dropdowns immediately. Existing data will still work.`)) return;

    try {
      await base44.entities.ConfigurableOption.delete(option.id);

      // Invalidate cache to propagate immediately
      const { invalidateOptionsCache } = await import('./ConfigLoader');
      invalidateOptionsCache(selectedCategory);

      // Broadcast deletion event for immediate UI updates
      window.dispatchEvent(new CustomEvent('option-deleted', { 
        detail: { category: selectedCategory, value: option.value } 
      }));

      toast.success('Option deleted - removed from all dropdowns immediately');
      loadOptions();
    } catch (error) {
      console.error('Failed to delete option:', error);
      toast.error('Failed to delete option');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
                <Settings className="w-5 h-5 text-emerald-400" />
                Configurable Options
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-2">
                📌 Customize dropdown options for languages, genres, platforms, devices, formats, etc. Changes reflect immediately across the entire app.
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="text-zinc-300 mb-2 block">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-4"
            >
              <h4 className="text-white font-semibold text-sm">Add New Option</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">Label</Label>
                  <Input
                    value={newOption.label}
                    onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                    placeholder="Display name"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Value</Label>
                  <Input
                    value={newOption.value}
                    onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                    placeholder="Internal value"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Icon (optional)</Label>
                  <Input
                    value={newOption.icon}
                    onChange={(e) => setNewOption({ ...newOption, icon: e.target.value })}
                    placeholder="Icon name"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Color (optional)</Label>
                  <Input
                    value={newOption.color}
                    onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
                    placeholder="#hex or tailwind class"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="bg-emerald-500 hover:bg-emerald-600">
                  Save Option
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewOption({ label: '', value: '', icon: '', color: '' });
                  }}
                  className="bg-white text-black hover:bg-zinc-100"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {loading ? (
            <p className="text-center text-zinc-400 py-8">Loading options...</p>
          ) : options.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No options configured for this category</p>
          ) : (
            <div className="space-y-2">
              {options.map((option, idx) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    option.is_active 
                      ? 'bg-zinc-800/50 border-zinc-700' 
                      : 'bg-zinc-800/20 border-zinc-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="w-4 h-4 text-zinc-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{option.label}</span>
                        <Badge className="bg-zinc-700 text-zinc-300 border-0 text-xs">
                          {option.value}
                        </Badge>
                      </div>
                      {(option.icon || option.color) && (
                        <div className="flex items-center gap-2 mt-1">
                          {option.icon && (
                            <span className="text-xs text-zinc-400">Icon: {option.icon}</span>
                          )}
                          {option.color && (
                            <span className="text-xs text-zinc-400">Color: {option.color}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleActive(option)}
                      className="text-zinc-400 hover:text-white"
                    >
                      {option.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(option)}
                      className="text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> Deactivating or deleting options will hide them from new entries, but existing data referencing these options will continue to work normally.
        </p>
      </div>
    </div>
  );
}