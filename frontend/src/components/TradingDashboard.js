import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import axios from 'axios';
import TradingChart from './TradingChart';
import TradeControls from './TradeControls';
import AccountStatus from './AccountStatus';
import CollapsibleSidebar from './CollapsibleSidebar';

const TradingDashboard = ({ tradingParams, setTradingParams }) => {
  const [marketData, setMarketData] = useState(null);
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
    fetchTrades();
    fetchAccountStatus();

    const interval = setInterval(() => {
      fetchMarketData(true); // Auto-refresh without loading spinner
      fetchTrades();
      fetchAccountStatus();
    }, 10000); // Refresh every 10 seconds

    // Listen for trade events from navigation
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

  const handleTrade = async (direction, size) => {
    try {
      await axios.post('/api/trade', {
        pair: tradingParams.pair,
        size: size,
        direction: direction
      });

      // Dispatch custom event for dashboard updates
      window.dispatchEvent(new CustomEvent('tradePlaced'));
    } catch (err) {
      setError('Failed to place trade');
      console.error(err);
    }
  };

  const handleCloseTrade = async (tradeId) => {
    try {
      await axios.post(`/api/close-trade/${tradeId}`);
      fetchTrades();
    } catch (err) {
      setError('Failed to close trade');
      console.error(err);
    }
  };

  const handleCloseAllTrades = async () => {
    try {
      for (const trade of trades) {
        await axios.post(`/api/close-trade/${trade.trade_id}`);
      }
      fetchTrades();
    } catch (err) {
      setError('Failed to close all trades');
      console.error(err);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', p: 0 }}>
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar pair={tradingParams.pair} />

      {error && (
        <Alert severity="error" sx={{ mb: 1, mx: 1 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={1}>
        {/* Main Chart */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 0, height: '100vh' }}>
            {isInitialLoad && loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : marketData ? (
              <TradingChart marketData={marketData} />
            ) : (
              <Typography>No market data available</Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Trade Controls, Open Trades, Account Status */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100vh' }}>
            {/* Trade Controls */}
            <TradeControls
              tradingParams={tradingParams}
              setTradingParams={setTradingParams}
              onTrade={handleTrade}
            />

            {/* Open Trades */}
            <Paper sx={{ p: 2, backgroundColor: '#1a1a1a' }}>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                Open Trades ({trades.length})
              </Typography>
              {trades.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No open trades
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {trades.map((trade) => (
                    <Box key={trade.trade_id} sx={{ p: 1, border: '1px solid #333', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          {trade.pair} {trade.direction}
                        </Typography>
                        <Typography variant="body2" color={trade.current_pl >= 0 ? 'success.main' : 'error.main'}>
                          P&L: {trade.current_pl} pips
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCloseTrade(trade.trade_id)}
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
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    Close All
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Account Status */}
            <AccountStatus status={accountStatus} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingDashboard; 