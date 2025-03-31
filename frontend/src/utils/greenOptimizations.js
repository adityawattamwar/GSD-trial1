/**
 * Green Software Optimization Utilities
 * 
 * This file contains utilities and hooks designed to optimize the application
 * following green software engineering principles to reduce energy consumption
 * and carbon footprint.
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

/**
 * LRU (Least Recently Used) Cache Implementation
 * - Efficiently caches data with automatic eviction of oldest entries
 * - Prevents memory leaks with max size and TTL (Time To Live)
 * - Includes automatic garbage collection
 */
export class LRUCache {
  constructor(maxSize = 100, ttl = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live in ms (default: 5 minutes)
    this.gcInterval = null;
    
    // Start garbage collection interval
    this.startGC();
    
    // Metrics for monitoring
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }
  
  /**
   * Get an item from the cache, refreshing its position
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.metrics.misses++;
      return undefined;
    }
    
    const item = this.cache.get(key);
    
    // Check if the item has expired
    if (Date.now() > item.expiry) {
      this.delete(key);
      this.metrics.expirations++;
      return undefined;
    }
    
    // Move item to the end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    this.metrics.hits++;
    return item.value;
  }
  
  /**
   * Set an item in the cache with expiry time
   */
  set(key, value, customTTL) {
    // If we're at max size, remove the oldest item (first item in map)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
      this.metrics.evictions++;
    }
    
    const ttl = customTTL || this.ttl;
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, { value, expiry });
    return true;
  }
  
  /**
   * Delete an item from the cache
   */
  delete(key) {
    return this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
    return true;
  }
  
  /**
   * Start the garbage collection process
   */
  startGC() {
    // Run GC every minute
    this.gcInterval = setInterval(() => this.garbageCollect(), 60000);
  }
  
  /**
   * Stop the garbage collection process
   */
  stopGC() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }
  
  /**
   * Perform garbage collection to remove expired items
   */
  garbageCollect() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.metrics.expirations += expiredCount;
      console.log(`[Green Optimization] GC: Removed ${expiredCount} expired items from cache`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.metrics,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses || 1)
    };
  }
  
  /**
   * Cleanup when no longer needed
   */
  destroy() {
    this.stopGC();
    this.clear();
  }
}

/**
 * useIntersectionObserver hook for efficient lazy loading
 * Using IntersectionObserver is more battery-efficient than scroll listeners
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);
  
  const callback = useCallback((entries) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
    
    if (entry.isIntersecting && !hasIntersected) {
      setHasIntersected(true);
      
      // Optional: Once an element has been seen, stop observing it to save resources
      if (options.unobserveOnIntersect && targetRef.current && observerRef.current) {
        observerRef.current.unobserve(targetRef.current);
      }
    }
  }, [hasIntersected, options.unobserveOnIntersect]);
  
  const observerRef = useRef(null);
  
  useEffect(() => {
    // Save battery on low-end devices by reducing threshold
    const defaultThreshold = navigator.deviceMemory < 4 ? 0.25 : 0.1;
    
    // Create the observer instance with battery-aware options
    observerRef.current = new IntersectionObserver(callback, {
      root: options.root || null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || defaultThreshold,
    });
    
    const currentTarget = targetRef.current;
    if (currentTarget) {
      observerRef.current.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget && observerRef.current) {
        observerRef.current.unobserve(currentTarget);
      }
    };
  }, [callback, options.root, options.rootMargin, options.threshold]);
  
  return { targetRef, isIntersecting, hasIntersected };
}

/**
 * Debounce function to reduce function calls
 * Particularly useful for expensive operations like API calls, DOM updates
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  
  return function(...args) {
    const context = this;
    
    if (timer) {
      clearTimeout(timer);
    }
    
    timer = setTimeout(() => {
      fn.apply(context, args);
      timer = null;
    }, delay);
  };
}

/**
 * Throttle function to limit rate of function execution
 * Useful for scroll/resize events that can fire very frequently
 */
export function throttle(fn, limit = 100) {
  let inThrottle = false;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      fn.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Detects if the user's device is in battery saving mode or has low battery
 * Used to adjust application behavior to save energy
 */
export function useBatterySaver() {
  const [isBatterySaving, setIsBatterySaving] = useState(false);
  
  useEffect(() => {
    // Check if Battery API is supported
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        // Consider battery saving if level is below 20% or if user enables power saving mode
        const checkBatteryStatus = () => {
          const isLowBattery = battery.level < 0.2 && !battery.charging;
          setIsBatterySaving(isLowBattery);
        };
        
        // Check initially
        checkBatteryStatus();
        
        // Add event listeners for battery changes
        battery.addEventListener('levelchange', checkBatteryStatus);
        battery.addEventListener('chargingchange', checkBatteryStatus);
        
        return () => {
          battery.removeEventListener('levelchange', checkBatteryStatus);
          battery.removeEventListener('chargingchange', checkBatteryStatus);
        };
      });
    } 
    // Fallback to media query if available
    else if (window.matchMedia && window.matchMedia('(prefers-reduced-data)').matches) {
      setIsBatterySaving(true);
    }
  }, []);
  
  return isBatterySaving;
}

/**
 * Progressive image loading - blur up technique
 * Saves data by loading a tiny placeholder first, then the full image only when needed
 */
export function useBlurhash(src, placeholder, options = {}) {
  const [imgSrc, setImgSrc] = useState(placeholder || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);
  
  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px', // Start loading before it's visible
    unobserveOnIntersect: true,
    ...options
  });
  
  useEffect(() => {
    if (!isIntersecting && !isLoaded) return;
    
    // Only load image when in viewport
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };
    
    // If image fails to load, keep the placeholder
    img.onerror = () => {
      console.warn(`[Green Optimization] Failed to load image: ${src}`);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isIntersecting, isLoaded]);
  
  return { imgSrc, isLoaded, blurRef: targetRef, imgRef };
}

/**
 * Carbon Aware Loading
 * Adjusts loading behavior based on estimated grid carbon intensity
 * Uses rough time of day estimation as proxy for carbon intensity
 */
export function useCarbonAwareLoading() {
  const [carbonIntensity, setCarbonIntensity] = useState('medium');
  
  useEffect(() => {
    // Get time of day as simple proxy for carbon intensity
    // Ideally this would use a real carbon intensity API
    const getEstimatedCarbonIntensity = () => {
      const hour = new Date().getHours();
      
      // Rough estimation:
      // - High intensity: peak hours (morning & evening)
      // - Medium intensity: working hours
      // - Low intensity: night (when renewables often dominate)
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        return 'high';
      } else if (hour >= 22 || hour <= 5) {
        return 'low';
      } else {
        return 'medium';
      }
    };
    
    setCarbonIntensity(getEstimatedCarbonIntensity());
    
    // Update every hour
    const interval = setInterval(() => {
      setCarbonIntensity(getEstimatedCarbonIntensity());
    }, 3600000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Adjust application behavior based on carbon intensity
  const loadingStrategy = {
    // During high carbon intensity periods:
    high: {
      prefetchDistance: '100px', // Reduce prefetch distance
      imageQuality: 'low',      // Use lower quality images
      concurrentLoads: 2,       // Limit concurrent requests
      cacheTTL: 3600000 * 12    // Cache longer (12 hours) 
    },
    // During medium carbon intensity periods:
    medium: {
      prefetchDistance: '200px', // Standard prefetch distance
      imageQuality: 'medium',    // Medium quality images
      concurrentLoads: 4,        // Normal concurrent requests
      cacheTTL: 3600000 * 6      // Normal cache (6 hours)
    },
    // During low carbon intensity periods:
    low: {
      prefetchDistance: '500px', // Prefetch more aggressively
      imageQuality: 'high',      // Use high quality images
      concurrentLoads: 8,        // Allow more concurrent requests
      cacheTTL: 3600000 * 3      // Shorter cache (3 hours)
    }
  };
  
  return {
    carbonIntensity,
    ...loadingStrategy[carbonIntensity]
  };
}

/**
 * Create a resource metric tracker to measure consumed resources
 */
export function createResourceTracker() {
  const metrics = {
    apiCalls: 0,
    dataTransferred: 0, // KB
    renderCount: 0,
    pageLoads: 0
  };
  
  const trackApiCall = (dataSize = 1) => {
    metrics.apiCalls++;
    metrics.dataTransferred += dataSize;
  };
  
  const trackRender = () => {
    metrics.renderCount++;
  };
  
  const trackPageLoad = () => {
    metrics.pageLoads++;
  };
  
  const getMetrics = () => {
    return { ...metrics };
  };
  
  const calculateCarbonFootprint = () => {
    // Very rough estimation based on:
    // - Data transferred (1KB ≈ 0.001g CO2 - simplified for estimation)
    // - CPU time (1000 renders ≈ 0.1g CO2 - simplified)
    // - Page loads (1 page load ≈ 0.2g CO2 - simplified)
    
    const dataFootprint = metrics.dataTransferred * 0.001;
    const renderFootprint = (metrics.renderCount / 1000) * 0.1;
    const pageLoadFootprint = metrics.pageLoads * 0.2;
    
    return {
      total: dataFootprint + renderFootprint + pageLoadFootprint,
      breakdown: {
        data: dataFootprint,
        renders: renderFootprint,
        pageLoads: pageLoadFootprint
      }
    };
  };
  
  return {
    trackApiCall,
    trackRender,
    trackPageLoad,
    getMetrics,
    calculateCarbonFootprint
  };
}

/**
 * useDebounce hook
 * React hook version of debounce function for use with state variables
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    // Set up debounce timer
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Cleanup on value or delay change
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * useThrottle hook
 * React hook version of throttle function for use with state variables
 */
export function useThrottle(value, limit = 300) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    
    // If enough time has passed since last update, update the throttled value
    if (now >= lastUpdated.current + limit) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      // Schedule an update if it hasn't been updated recently
      const timerId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, limit);
      
      return () => clearTimeout(timerId);
    }
  }, [value, limit]);
  
  return throttledValue;
}

/**
 * useLRUCache hook
 * Wraps the LRUCache class in a React hook for component use
 */
export function useLRUCache(maxSize = 100, ttl = 300000) {
  // Create a persistent cache instance
  const cacheRef = useRef(null);
  
  // Initialize cache if it doesn't exist
  if (!cacheRef.current) {
    cacheRef.current = new LRUCache(maxSize, ttl);
  }
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (cacheRef.current) {
        cacheRef.current.destroy();
      }
    };
  }, []);
  
  // Memoize cache operations to maintain reference stability
  const cacheOperations = useMemo(() => {
    return {
      get: (key) => cacheRef.current.get(key),
      set: (key, value, customTTL) => cacheRef.current.set(key, value, customTTL),
      delete: (key) => cacheRef.current.delete(key),
      clear: () => cacheRef.current.clear(),
      getStats: () => cacheRef.current.getStats()
    };
  }, []);
  
  return cacheOperations;
}

/**
 * useEnergyProfile hook
 * Provides energy usage patterns and optimization strategies
 */
export function useEnergyProfile() {
  const [energyProfile, setEnergyProfile] = useState({
    isHighDemand: false,
    isLowPower: false,
    carbonIntensity: 'medium',
    batteryStatus: null
  });
  
  // Check if device is in battery saving mode
  const isBatterySaving = useBatterySaver();
  
  // Get carbon-aware loading strategies
  const carbonAwareInfo = useCarbonAwareLoading();
  
  useEffect(() => {
    // Update energy profile based on various factors
    const hour = new Date().getHours();
    const isHighDemand = (hour >= 9 && hour <= 17); // Business hours
    
    setEnergyProfile({
      isHighDemand,
      isLowPower: isBatterySaving,
      carbonIntensity: carbonAwareInfo.carbonIntensity,
      batteryStatus: navigator.getBattery ? { charging: true, level: 1.0 } : null
    });
    
    // Try to get actual battery info if available
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setEnergyProfile(prev => ({
          ...prev,
          batteryStatus: {
            charging: battery.charging,
            level: battery.level
          }
        }));
      });
    }
    
    // Update hourly
    const interval = setInterval(() => {
      const currentHour = new Date().getHours();
      const isCurrentHighDemand = (currentHour >= 9 && currentHour <= 17);
      
      setEnergyProfile(prev => ({
        ...prev,
        isHighDemand: isCurrentHighDemand
      }));
    }, 3600000);
    
    return () => clearInterval(interval);
  }, [isBatterySaving, carbonAwareInfo.carbonIntensity]);
  
  // Strategy recommendations based on energy profile
  const strategies = useMemo(() => {
    const strategies = {
      // Default strategy
      cacheTTL: 300000, // 5 minutes
      prefetchDistance: '200px',
      concurrentRequests: 4,
      imageQuality: 'auto',
      refreshInterval: 60000, // 1 minute
      batchUpdates: true,
      renderStrategy: 'efficient'
    };
    
    // Adjust strategies based on energy profile
    if (energyProfile.isHighDemand || energyProfile.carbonIntensity === 'high') {
      // During high energy demand or high carbon intensity
      strategies.cacheTTL = 1800000; // 30 minutes
      strategies.prefetchDistance = '100px'; // Reduce prefetching
      strategies.concurrentRequests = 2; // Limit concurrent requests
      strategies.imageQuality = 'low'; // Lower quality images
      strategies.refreshInterval = 300000; // 5 minutes
      strategies.renderStrategy = 'minimal';
    } else if (energyProfile.isLowPower) {
      // During low battery
      strategies.cacheTTL = 3600000; // 1 hour
      strategies.prefetchDistance = '0px'; // No prefetching
      strategies.concurrentRequests = 1; // Minimal concurrent requests
      strategies.imageQuality = 'minimal'; // Minimal quality
      strategies.refreshInterval = 600000; // 10 minutes
      strategies.renderStrategy = 'barebones';
    } else if (energyProfile.carbonIntensity === 'low') {
      // During low carbon intensity
      strategies.cacheTTL = 120000; // 2 minutes
      strategies.prefetchDistance = '500px'; // More aggressive prefetching
      strategies.concurrentRequests = 8; // More concurrent requests
      strategies.imageQuality = 'high'; // Higher quality
      strategies.refreshInterval = 30000; // 30 seconds
      strategies.renderStrategy = 'enhanced';
    }
    
    return strategies;
  }, [energyProfile]);
  
  return {
    profile: energyProfile,
    strategies
  };
}

/**
 * useBatchUpdate hook
 * Batches multiple state updates to reduce renders
 * Returns { state, batchUpdate } interface for efficient state management
 */
export function useBatchUpdate(initialState = {}, batchDelay = 100) {
  // Maintain the component state
  const [state, setState] = useState(initialState);
  
  // Track pending updates
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const updateTimerRef = useRef(null);
  
  // Process batched updates
  const processBatchedUpdates = useCallback(() => {
    if (pendingUpdates.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);
    
    // Apply all pending updates in one go
    setState(currentState => {
      // Reduce all pending updates into a single state update
      const nextState = pendingUpdates.reduce((result, update) => {
        // Apply each update to the accumulated result
        return { ...result, ...update };
      }, currentState);
      
      return nextState;
    });
    
    // Clear pending updates after processing
    setPendingUpdates([]);
    setIsProcessing(false);
    
  }, [pendingUpdates]);
  
  // Function to queue state updates
  const batchUpdate = useCallback((update) => {
    // Add the update to the queue
    setPendingUpdates(currentUpdates => [...currentUpdates, update]);
    
    // Clear any existing timeout
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    // Schedule processing (debounced)
    updateTimerRef.current = setTimeout(() => {
      processBatchedUpdates();
    }, batchDelay);
  }, [processBatchedUpdates, batchDelay]);
  
  // Process immediately on unmount to avoid losing updates
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        
        // Apply any pending updates before unmounting
        if (pendingUpdates.length > 0) {
          processBatchedUpdates();
        }
      }
    };
  }, [pendingUpdates, processBatchedUpdates]);
  
  // Return state and update function
  return {
    state,
    batchUpdate,
    isProcessing,
    pendingUpdatesCount: pendingUpdates.length
  };
}

/**
 * VirtualizedList component
 * Efficiently renders large lists by only rendering visible items
 */
export const VirtualizedList = memo(({ 
  items = [], 
  renderItem, 
  itemHeight = 50,
  overscan = 5,
  bufferSize = 3,
  className = '',
  style = {}
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: overscan * 2 });
  const containerRef = useRef(null);
  const totalHeight = items.length * itemHeight;
  const isMounted = useRef(false);
  
  // Use energy profile to adjust virtualization strategy
  const { profile } = useEnergyProfile();
  
  // Adjust overscan based on energy profile
  const effectiveOverscan = useMemo(() => {
    if (profile.isLowPower) return 2; // Minimal overscan when battery is low
    if (profile.carbonIntensity === 'high') return 3; // Reduced overscan during high energy
    if (profile.carbonIntensity === 'low') return 10; // More items during low energy periods
    return overscan; // Default
  }, [overscan, profile]);
  
  // Cache rendered items to prevent unnecessary recalculations
  const itemCache = useRef(new Map());
  
  // Calculate visible range based on scroll position
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current || !isMounted.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - effectiveOverscan);
    const endIndex = Math.min(
      items.length - 1, 
      Math.ceil((scrollTop + clientHeight) / itemHeight) + effectiveOverscan
    );
    
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [itemHeight, items.length, effectiveOverscan]);
  
  // Update on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = throttle(() => updateVisibleRange(), 50);
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [updateVisibleRange]);
  
  // Update when container mounts or items/height changes
  useEffect(() => {
    isMounted.current = true;
    updateVisibleRange();
    
    // Clear cache when items change significantly
    if (items.length > 0 && Math.abs(items.length - itemCache.current.size) > bufferSize) {
      itemCache.current.clear();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [items, itemHeight, updateVisibleRange, bufferSize]);
  
  // Render only the visible items
  const visibleItems = useMemo(() => {
    const { start, end } = visibleRange;
    return items.slice(start, end + 1).map((item, index) => {
      const actualIndex = start + index;
      const key = item.id || actualIndex;
      
      // Use cached item if available
      if (itemCache.current.has(key) && item === itemCache.current.get(key).item) {
        return itemCache.current.get(key).element;
      }
      
      // Render and cache new item
      const element = (
        <div 
          key={key} 
          style={{ 
            position: 'absolute',
            top: actualIndex * itemHeight, 
            left: 0,
            right: 0,
            height: itemHeight
          }}
        >
          {renderItem(item, actualIndex)}
        </div>
      );
      
      // Cache the element
      itemCache.current.set(key, { item, element });
      
      return element;
    });
  }, [visibleRange, items, renderItem, itemHeight]);
  
  // Clean up old cache entries
  useEffect(() => {
    if (itemCache.current.size > items.length + bufferSize) {
      const keysToKeep = new Set();
      for (let i = visibleRange.start; i <= visibleRange.end; i++) {
        const item = items[i];
        if (item) {
          keysToKeep.add(item.id || i);
        }
      }
      
      // Remove entries not in visible range
      itemCache.current.forEach((_, key) => {
        if (!keysToKeep.has(key)) {
          itemCache.current.delete(key);
        }
      });
    }
  }, [visibleRange, items, bufferSize]);
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={{
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        ...style
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';