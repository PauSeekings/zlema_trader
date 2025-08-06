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
import NewsPanel from './NewsPanel';

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
      fetchTrades();
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

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', p: 0 }}>
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

        {/* Right Column - Trade Controls, Open Trades, Account Status & News */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100vh' }}>
            {/* Trade Controls */}
            <TradeControls
              tradingParams={tradingParams}
              setTradingParams={setTradingParams}
              onTrade={handleTrade}
            />

            {/* Open Trades - Expandable */}
            <Accordion sx={{ backgroundColor: '#1a1a1a' }}>
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#888888' }} />}
                sx={{
                  backgroundColor: '#1a1a1a',
                  '& .MuiAccordionSummary-content': { margin: '8px 0' }
                }}
              >
                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                  Open Trades ({trades.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: '#1a1a1a', p: 2 }}>
                {trades.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No open trades
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {trades.map((trade) => (
                      <Box key={trade.trade_id} sx={{ p: 1, border: '1px solid #333', borderRadius: 1 }}>
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
                          sx={{ mt: 1 }}
                        >
                          Close
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Account Status */}
            <AccountStatus status={accountStatus} />

            {/* News Panel */}
            <NewsPanel pair={tradingParams.pair} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingDashboard; 