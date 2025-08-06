import { useState, useCallback } from 'react';
import axios from 'axios';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (config, options = {}) => {
    const { showLoading = true, onSuccess, onError } = options;
    
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const response = await axios(config);
      
      if (onSuccess) onSuccess(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) onError(errorMessage);
      throw err;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const get = useCallback((url, params = {}, options = {}) => {
    return apiCall({ method: 'GET', url, params }, options);
  }, [apiCall]);

  const post = useCallback((url, data = {}, options = {}) => {
    return apiCall({ method: 'POST', url, data }, options);
  }, [apiCall]);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, get, post, clearError };
};

export const useMarketData = () => {
  const { get, loading, error } = useApi();

  const fetchMarketData = useCallback((params, options = {}) => {
    return get('/api/market-data', {
      ...params,
      window_lengths: Array.isArray(params.window_lengths) 
        ? params.window_lengths.join(',') 
        : params.window_lengths
    }, options);
  }, [get]);

  const fetchKeyLevels = useCallback((params, options = {}) => {
    return get('/api/key-levels', params, options);
  }, [get]);

  return { fetchMarketData, fetchKeyLevels, loading, error };
};

export const useTrading = () => {
  const { get, post, loading, error } = useApi();

  const placeTrade = useCallback((tradeData, options = {}) => {
    return post('/api/trade', tradeData, options);
  }, [post]);

  const fetchTrades = useCallback((options = {}) => {
    return get('/api/trades', {}, options);
  }, [get]);

  const closeTrade = useCallback((tradeId, options = {}) => {
    return post(`/api/trade/${tradeId}/close`, {}, options);
  }, [post]);

  const closeAllTrades = useCallback((options = {}) => {
    return post('/api/trades/close-all', {}, options);
  }, [post]);

  const fetchAccountStatus = useCallback((options = {}) => {
    return get('/api/status', {}, options);
  }, [get]);

  const connectAccount = useCallback((mode, options = {}) => {
    return post('/api/connect', null, { ...options, params: { mode } });
  }, [post]);

  return {
    placeTrade,
    fetchTrades,
    closeTrade,
    closeAllTrades,
    fetchAccountStatus,
    connectAccount,
    loading,
    error
  };
};

export const useNews = () => {
  const { get, loading, error } = useApi();

  const fetchNews = useCallback((currencyPair = 'GBP_USD', enableAiAnalysis = true, options = {}) => {
    return get('/api/news', { currency_pair: currencyPair, enable_ai_analysis: enableAiAnalysis }, options);
  }, [get]);

  return { fetchNews, loading, error };
};