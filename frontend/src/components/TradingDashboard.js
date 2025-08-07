import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import axios from 'axios';
import TradingChart from './TradingChart';
import TradeControls from './TradeControls';
import AccountStatus from './AccountStatus';
import CollapsibleSidebar from './CollapsibleSidebar';

const TradingDashboard = ({ tradingParams, setTradingParams, overlaySettings, setOverlaySettings, polynomialParams, setPolynomialParams }) => {
  const [marketData, setMarketData] = useState(null);
  const [keyLevels, setKeyLevels] = useState(null);
  const [polynomialPredictions, setPolynomialPredictions] = useState(null);

  const [trades, setTrades] = useState([]);
  const [accountStatus, setAccountStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarketData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      const response = await axios.get('/api/market-data', {
        params: {
          ...tradingParams,
          window_lengths: '3,12,24,36,48'
        }
      });
      setMarketData(response.data);
      setError(null);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err) {
      setError('Failed to fetch market data');
      console.error(err);
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

  const fetchKeyLevels = async () => {
    try {
      const response = await axios.get('/api/key-levels', {
        params: {
          pair: tradingParams.pair,
          timeframe: tradingParams.timeframe,
          periods: tradingParams.periods,  // Use same periods as market data
          window: 20,
          threshold: 0.001
        }
      });
      setKeyLevels(response.data);
    } catch (err) {
      console.error('Failed to fetch key levels:', err);
    }
  };

  const fetchPolynomialPredictions = async () => {
    try {
      const response = await axios.get('/api/polynomial-predictions', {
        params: {
          pair: tradingParams.pair,
          timeframe: tradingParams.timeframe,
          periods: tradingParams.periods,
          lookback: polynomialParams.lookback,
          forecast_periods: polynomialParams.forecast_periods,
          degree: polynomialParams.degree
        }
      });
      setPolynomialPredictions(response.data);
    } catch (err) {
      console.error('Failed to fetch polynomial predictions:', err);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await axios.get('/api/trades');
      setTrades(response.data.open_trades);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    }
  };

  const fetchAccountStatus = async () => {
    try {
      const response = await axios.get('/api/status');
      setAccountStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch account status:', err);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchKeyLevels();
    fetchPolynomialPredictions();
    fetchTrades();
    fetchAccountStatus();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchMarketData(true);
      fetchPolynomialPredictions();
      fetchTrades();
      fetchAccountStatus();
    }, 5000);

    // Listen for trade events
    const handleTradePlaced = () => {
      fetchTrades();
      fetchAccountStatus();
    };
    window.addEventListener('tradePlaced', handleTradePlaced);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tradePlaced', handleTradePlaced);
    };
  }, [tradingParams]);

  // Refetch polynomial predictions when parameters change
  useEffect(() => {
    fetchPolynomialPredictions();
  }, [polynomialParams]);

  const handleTrade = async (direction, size) => {
    try {
      await axios.post('/api/trade', {
        pair: tradingParams.pair,
        direction: direction,
        size: size
      });
      // Dispatch custom event to refresh trades and account status
      window.dispatchEvent(new CustomEvent('tradePlaced'));
    } catch (err) {
      console.error('Trade failed:', err);
    }
  };

  const handleCloseTrade = async (tradeId) => {
    try {
      await axios.post(`/api/trade/${tradeId}/close`);
      fetchTrades();
      fetchAccountStatus();
    } catch (err) {
      console.error('Failed to close trade:', err);
    }
  };

  const handleCloseAllTrades = async () => {
    try {
      await axios.post('/api/trades/close-all');
      fetchTrades();
      fetchAccountStatus();
    } catch (err) {
      console.error('Failed to close all trades:', err);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: 'calc(100vh - 64px)', p: 0 }}>
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar pair={tradingParams.pair} />

      {error && (
        <Alert severity="error" sx={{ mb: 0.5, mx: 0.5 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={0.5}>
        {/* Main Chart */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 0, height: '100%' }}>
            {isInitialLoad && loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : marketData ? (
              <TradingChart
                marketData={marketData}
                keyLevels={keyLevels}
                polynomialPredictions={polynomialPredictions}
                overlaySettings={overlaySettings}
              />
            ) : (
              <Typography>No market data available</Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Trade Controls, Open Trades, Account Status */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', overflowY: 'auto' }}>
            {/* Trade Controls */}
            <Box sx={{ mt: 1 }}>
              <TradeControls
                tradingParams={tradingParams}
                setTradingParams={setTradingParams}
                onTrade={handleTrade}
              />
            </Box>

            {/* Open Trades */}
            <Paper sx={{ p: 1, backgroundColor: '#1a1a1a' }}>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontSize: '0.8rem' }}>
                Open Trades ({trades.length})
              </Typography>
              {trades.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  No open trades
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {trades.map((trade) => (
                    <Box key={trade.trade_id} sx={{ p: 0.5, border: '1px solid #333', borderRadius: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                          {trade.pair} {trade.direction}
                        </Typography>
                        <Typography variant="body2" color={trade.current_pl >= 0 ? 'success.main' : 'error.main'} sx={{ fontSize: '0.7rem' }}>
                          P&L: {trade.current_pl} pips
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCloseTrade(trade.trade_id)}
                          sx={{ fontSize: '0.6rem', padding: '2px 6px', minHeight: '24px' }}
                        >
                          Close
                        </Button>
                      </Box>
                    </Box>
                  ))}
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleCloseAllTrades}
                    sx={{ mt: 0.5, fontSize: '0.7rem', padding: '4px 8px', minHeight: '28px' }}
                    fullWidth
                  >
                    Close All
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Account Status */}
            <AccountStatus status={accountStatus} trades={trades} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingDashboard; 