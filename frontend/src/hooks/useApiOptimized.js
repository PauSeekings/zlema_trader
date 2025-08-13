import { useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

// Create axios instance with optimized defaults
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Simple in-memory cache with TTL
class SimpleCache {
    constructor(defaultTTL = 5000) {
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }

    set(key, data, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new SimpleCache();

// Optimized API hook
export const useApiOptimized = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Track in-flight requests per endpoint to avoid cross-cancel in Promise.all
    const abortControllersRef = useRef(new Map()); // key: endpointKey -> AbortController

    // Cancel previous request if still pending
    const cancelPreviousRequest = useCallback((endpointKey) => {
        if (!endpointKey) {
            // Cancel all if no key provided
            abortControllersRef.current.forEach((controller) => controller.abort());
            abortControllersRef.current.clear();
            return;
        }
        const existing = abortControllersRef.current.get(endpointKey);
        if (existing) {
            existing.abort();
            abortControllersRef.current.delete(endpointKey);
        }
    }, []);

    // Generic API call function with caching
    const apiCall = useCallback(async (endpoint, options = {}) => {
        const {
            method = 'GET',
            data = null,
            params = {},
            cache: useCache = true,
            cacheTTL = 5000,
            ...config
        } = options;

        // Generate cache key
        const cacheKey = `${method}:${endpoint}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
        // Generate endpoint key for cancellation scoping (allow parallel different endpoints)
        const endpointKey = `${method}:${endpoint}`;

        // Check cache first for GET requests
        if (method === 'GET' && useCache) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        // Cancel previous request for the same endpoint only
        cancelPreviousRequest(endpointKey);
        // Create new abort controller for this endpoint
        const controller = new AbortController();
        abortControllersRef.current.set(endpointKey, controller);

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient({
                method,
                url: endpoint,
                data,
                params,
                signal: controller.signal,
                ...config,
            });

            // Cache successful GET responses
            if (method === 'GET' && useCache) {
                cache.set(cacheKey, response.data, cacheTTL);
            }

            return response.data;
        } catch (err) {
            // Handle cancellations without surfacing as errors
            const isCanceled = err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || (axios.isCancel && axios.isCancel(err));
            if (isCanceled) {
                return null;
            }
            const errorMessage = err?.response?.data?.detail || err?.message || 'An error occurred';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
            // Clear controller for this endpoint
            abortControllersRef.current.delete(endpointKey);
        }
    }, [cancelPreviousRequest]);

    // Optimized market data fetch
    const getMarketData = useCallback(async (params) => {
        return apiCall('/api/market-data', {
            params,
            cache: true,
            cacheTTL: 2000, // 2 second cache for market data
        });
    }, [apiCall]);

    // Optimized key levels fetch
    const getKeyLevels = useCallback(async (params) => {
        return apiCall('/api/key-levels', {
            params,
            cache: true,
            cacheTTL: 10000, // 10 second cache for key levels
        });
    }, [apiCall]);

    // Account status (no cache - always fresh)
    const getAccountStatus = useCallback(async () => {
        return apiCall('/api/status', {
            cache: false,
        });
    }, [apiCall]);

    // Place trade (no cache)
    const placeTrade = useCallback(async (tradeData) => {
        return apiCall('/api/trade', {
            method: 'POST',
            data: tradeData,
            cache: false,
        });
    }, [apiCall]);

    // Get trades (short cache)
    const getTrades = useCallback(async () => {
        return apiCall('/api/trades', {
            cache: true,
            cacheTTL: 1000, // 1 second cache
        });
    }, [apiCall]);

    // Close trade (no cache)
    const closeTrade = useCallback(async (tradeId) => {
        return apiCall(`/api/trade/${tradeId}/close`, {
            method: 'POST',
            cache: false,
        });
    }, [apiCall]);

    // News feed (longer cache)
    const getNews = useCallback(async (params) => {
        return apiCall('/api/news', {
            params,
            cache: true,
            cacheTTL: 30000, // 30 second cache for news
        });
    }, [apiCall]);

    // Market status (medium cache)
    const getMarketStatus = useCallback(async () => {
        return apiCall('/api/market-status', {
            cache: true,
            cacheTTL: 60000, // 1 minute cache
        });
    }, [apiCall]);

    // Backtest (no cache - always fresh)
    const runBacktest = useCallback(async (params) => {
        return apiCall('/api/backtest', {
            method: 'POST',
            data: params,
            cache: false,
        });
    }, [apiCall]);

    // Clear cache manually
    const clearCache = useCallback(() => {
        cache.clear();
    }, []);

    // Memoized return object
    return useMemo(() => ({
        loading,
        error,
        getMarketData,
        getKeyLevels,
        getAccountStatus,
        placeTrade,
        getTrades,
        closeTrade,
        getNews,
        getMarketStatus,
        runBacktest,
        clearCache,
        cancelPreviousRequest,
    }), [
        loading,
        error,
        getMarketData,
        getKeyLevels,
        getAccountStatus,
        placeTrade,
        getTrades,
        closeTrade,
        getNews,
        getMarketStatus,
        runBacktest,
        clearCache,
        cancelPreviousRequest,
    ]);
};

export default useApiOptimized;
