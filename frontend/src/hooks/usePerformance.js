/**
 * Custom React Hooks for Performance Optimization
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cacheManager, localCache, apiCache } from '../utils/performanceOptimizer';

// ==================== Cached API Hook ====================

export const useCachedAPI = (url, options = {}, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        setError(null);

        // Try cache first
        const cached = cacheManager.get(url);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Fetch with abort signal
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Cache the result
        cacheManager.set(url, result);
        setData(result);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          console.error('API Error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, ...dependencies]);

  const refetch = useCallback(() => {
    cacheManager.clear(url);
    setLoading(true);
  }, [url]);

  return { data, loading, error, refetch };
};

// ==================== Lazy Load Images ====================

export const useLazyLoad = (ref, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, hasLoaded, options]);

  return isVisible;
};

// ==================== Debounced Value ====================

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ==================== Throttled Function ====================

export const useThrottle = (callback, delay = 300) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
};

// ==================== Local Storage with Caching ====================

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localCache.get(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error('useLocalStorage get error:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localCache.set(key, valueToStore);
    } catch (error) {
      console.error('useLocalStorage set error:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// ==================== Intersection Observer ====================

export const useIntersectionObserver = (options = {}) => {
  const [ref, setRef] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: options.threshold || 0,
        rootMargin: options.rootMargin || '0px'
      }
    );

    observer.observe(ref);

    return () => {
      if (ref) {
        observer.unobserve(ref);
      }
    };
  }, [ref, options]);

  return [setRef, isIntersecting];
};

// ==================== Network Status ====================

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection type if available
    if (navigator.connection) {
      setConnectionType(navigator.connection.effectiveType);
      
      const handleConnectionChange = () => {
        setConnectionType(navigator.connection.effectiveType);
      };
      
      navigator.connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navigator.connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

// ==================== Prefetch on Hover ====================

export const usePrefetch = () => {
  const prefetch = useCallback((href) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }, []);

  return prefetch;
};

// ==================== Optimized Memo ====================

export const useDeepCompareMemo = (factory, deps) => {
  const ref = useRef(undefined);
  const signalRef = useRef(0);

  if (ref.current === undefined || !depsAreEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  return useMemo(factory, [signalRef.current]);
};

function depsAreEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
  }
  return true;
}

// ==================== Scroll Performance ====================

export const useScrollPerformance = (callback, delay = 100) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback();
      }, delay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
};

// ==================== Image Preloader ====================

export const useImagePreloader = (imageUrls) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let loaded = 0;
    const total = imageUrls.length;

    if (total === 0) {
      setImagesLoaded(true);
      return;
    }

    imageUrls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        loaded += 1;
        setProgress((loaded / total) * 100);
        if (loaded === total) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loaded += 1;
        setProgress((loaded / total) * 100);
        if (loaded === total) {
          setImagesLoaded(true);
        }
      };
      img.src = url;
    });
  }, [imageUrls]);

  return { imagesLoaded, progress };
};

// ==================== Component Mount Time ====================

export const useMountTime = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⚡ ${componentName} mounted in ${duration.toFixed(2)}ms`);
    };
  }, [componentName]);
};

// ==================== Resource Prefetching ====================

export const useResourcePrefetch = (resources) => {
  useEffect(() => {
    resources.forEach(({ href, as }) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = as || 'fetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }, [resources]);
};

// ==================== Export All ====================

export default {
  useCachedAPI,
  useLazyLoad,
  useDebounce,
  useThrottle,
  useLocalStorage,
  useIntersectionObserver,
  useNetworkStatus,
  usePrefetch,
  useDeepCompareMemo,
  useScrollPerformance,
  useImagePreloader,
  useMountTime,
  useResourcePrefetch
};
