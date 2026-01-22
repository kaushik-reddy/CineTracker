import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Cache object for options
const optionsCache = {
  data: {},
  timestamp: null,
  listeners: new Set()
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useConfigurableOptions(category) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Check cache
        const now = Date.now();
        if (optionsCache.data[category] && optionsCache.timestamp && (now - optionsCache.timestamp < CACHE_DURATION)) {
          setOptions(optionsCache.data[category]);
          setLoading(false);
          return;
        }

        // Fetch from server
        const data = await base44.entities.ConfigurableOption.filter({ 
          category,
          is_active: true 
        });
        
        const sortedOptions = data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        // Update cache
        optionsCache.data[category] = sortedOptions;
        optionsCache.timestamp = now;
        
        setOptions(sortedOptions);
        setLoading(false);
        
        // Notify listeners
        optionsCache.listeners.forEach(listener => listener(category, sortedOptions));
      } catch (error) {
        console.error(`Failed to load ${category} options:`, error);
        setOptions([]);
        setLoading(false);
      }
    };

    loadOptions();

    // Listen for updates
    const updateListener = (updatedCategory, updatedData) => {
      if (updatedCategory === category) {
        setOptions(updatedData);
      }
    };

    optionsCache.listeners.add(updateListener);

    return () => {
      optionsCache.listeners.delete(updateListener);
    };
  }, [category]);

  return { options, loading };
}

// Invalidate cache for a specific category or all
export function invalidateOptionsCache(category = null) {
  if (category) {
    delete optionsCache.data[category];
  } else {
    optionsCache.data = {};
  }
  optionsCache.timestamp = null;
}

// Preload all categories
export async function preloadAllOptions() {
  const categories = ['language', 'genre', 'platform', 'device', 'age_rating', 'audio_format', 'video_format'];
  
  try {
    const results = await Promise.all(
      categories.map(async (category) => {
        const data = await base44.entities.ConfigurableOption.filter({ 
          category,
          is_active: true 
        });
        return { category, data: data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) };
      })
    );
    
    results.forEach(({ category, data }) => {
      optionsCache.data[category] = data;
    });
    
    optionsCache.timestamp = Date.now();
    
    // Notify all listeners
    optionsCache.listeners.forEach(listener => {
      results.forEach(({ category, data }) => listener(category, data));
    });
    
    return true;
  } catch (error) {
    console.error('Failed to preload options:', error);
    return false;
  }
}

// Get app config value
export async function getAppConfig(key, defaultValue = null) {
  try {
    const configs = await base44.entities.AppConfig.filter({ 
      config_key: key,
      is_active: true 
    });
    
    if (configs.length > 0) {
      return configs[0].config_value;
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Failed to load app config for ${key}:`, error);
    return defaultValue;
  }
}

// Watch for permission changes
export function useUserPermissions(userEmail) {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        const perms = await base44.entities.UserPermissions.filter({ user_email: userEmail });
        setPermissions(perms[0] || null);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load user permissions:', error);
        setPermissions(null);
        setLoading(false);
      }
    };

    loadPermissions();

    // Poll for changes every 30 seconds
    const interval = setInterval(loadPermissions, 30000);

    return () => clearInterval(interval);
  }, [userEmail]);

  return { permissions, loading };
}