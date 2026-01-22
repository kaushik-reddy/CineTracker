import { base44 } from "@/api/base44Client";

// Global logo cache with 5-minute expiration
const logoCache = {
  data: {},
  timestamp: 0,
  listeners: new Set(),
  expirationTime: 5 * 60 * 1000 // 5 minutes
};

// Notify all listeners when cache updates
const notifyListeners = () => {
  logoCache.listeners.forEach(callback => callback(logoCache.data));
};

// Add listener
export const subscribeToLogos = (callback) => {
  logoCache.listeners.add(callback);
  // Immediately call with current data
  if (Object.keys(logoCache.data).length > 0) {
    callback(logoCache.data);
  }
  return () => logoCache.listeners.delete(callback);
};

// Check if cache is valid
const isCacheValid = () => {
  return Date.now() - logoCache.timestamp < logoCache.expirationTime;
};

// Preload all logos into cache (optimized)
export const preloadAllLogos = async () => {
  // Return immediately if cache is still valid
  if (isCacheValid() && Object.keys(logoCache.data).length > 0) {
    return logoCache.data;
  }

  try {
    const allLogos = await base44.entities.Logo.filter({ is_active: true });
    
    const newCache = {};
    allLogos.forEach(logo => {
      const key = `${logo.category}:${logo.name}`;
      newCache[key] = logo.processed_url || logo.original_url;
    });
    
    logoCache.data = newCache;
    logoCache.timestamp = Date.now();
    notifyListeners();
    
    return newCache;
  } catch (error) {
    console.error('Failed to preload logos:', error);
    return logoCache.data;
  }
};

// Get logo from cache or fetch
export const getLogo = async (name, category) => {
  const key = `${category}:${name}`;
  
  // Return from cache if valid
  if (isCacheValid() && logoCache.data[key]) {
    return logoCache.data[key];
  }
  
  // If cache is invalid, refresh it
  if (!isCacheValid()) {
    await preloadAllLogos();
    return logoCache.data[key] || null;
  }
  
  return null;
};

// Invalidate cache (call this after logo upload/delete)
export const invalidateLogoCache = () => {
  logoCache.timestamp = 0;
  preloadAllLogos();
};