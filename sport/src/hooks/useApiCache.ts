import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface UseApiCacheOptions {
  cacheTime?: number; // 缓存时间（毫秒），默认5分钟
  staleTime?: number; // 数据过期时间（毫秒），默认1分钟
  retry?: boolean; // 失败时是否重试
  retryDelay?: number; // 重试延迟时间
}

const cache = new Map<string, CacheItem<any>>();

function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseApiCacheOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5分钟
    staleTime = 1 * 60 * 1000,  // 1分钟
    retry = true,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // 检查缓存是否有效
  const isCacheValid = useCallback((cacheItem: CacheItem<T>) => {
    return Date.now() - cacheItem.timestamp < cacheItem.expiry;
  }, []);

  // 从缓存获取数据
  const getCachedData = useCallback(() => {
    const cacheItem = cache.get(key);
    if (cacheItem && isCacheValid(cacheItem)) {
      return cacheItem.data;
    }
    return null;
  }, [key, isCacheValid]);

  // 设置缓存
  const setCachedData = useCallback((newData: T) => {
    cache.set(key, {
      data: newData,
      timestamp: Date.now(),
      expiry: cacheTime
    });
  }, [key, cacheTime]);

  // 执行数据获取
  const fetchData = useCallback(async (force = false) => {
    // 如果不强制刷新，先检查缓存
    if (!force) {
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setError(null);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Fetching data for key: ${key}`);
      const result = await fetcher();
      
      setData(result);
      setCachedData(result);
      retryCountRef.current = 0; // 重置重试计数
      
      console.log(`✅ Data fetched successfully for key: ${key}`);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`❌ Error fetching data for key: ${key}`, error);
      
      setError(error);
      
      // 重试逻辑
      if (retry && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        console.log(`🔄 Retrying (${retryCountRef.current}/${maxRetries}) in ${retryDelay}ms...`);
        
        setTimeout(() => {
          fetchData(force);
        }, retryDelay * retryCountRef.current);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, getCachedData, setCachedData, retry, retryDelay]);

  // 手动刷新数据
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // 使数据无效
  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
    setError(null);
  }, [key]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 定期检查数据是否过期
  useEffect(() => {
    const interval = setInterval(() => {
      const cacheItem = cache.get(key);
      if (cacheItem && !isCacheValid(cacheItem)) {
        // 数据过期但还在staleTime内，静默刷新
        const timeSinceCache = Date.now() - cacheItem.timestamp;
        if (timeSinceCache > staleTime) {
          fetchData();
        }
      }
    }, staleTime);

    return () => clearInterval(interval);
  }, [key, staleTime, isCacheValid, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    isStale: (() => {
      const cacheItem = cache.get(key);
      if (!cacheItem) return false;
      return Date.now() - cacheItem.timestamp > staleTime;
    })()
  };
}

// 清理所有缓存的工具函数
export const clearAllCache = () => {
  cache.clear();
  console.log('🗑️ All cache cleared');
};

// 获取缓存统计信息
export const getCacheStats = () => {
  const stats = {
    size: cache.size,
    keys: Array.from(cache.keys()),
    totalMemory: 0
  };
  
  cache.forEach((value, key) => {
    stats.totalMemory += JSON.stringify(value).length;
  });
  
  return stats;
};

export default useApiCache; 