import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

import { darkTheme, commonStyles } from './theme';
import { useTrading } from './hooks/useApi';
import TradingDashboard from './components/TradingDashboard';
import BacktestPage from './components/BacktestPage';
import Navigation from './components/Navigation';

// Default trading parameters
const DEFAULT_TRADING_PARAMS = {
  pair: "GBP_USD",
  timeframe: "M5",
  periods: 48,
  units: 10000,
  window_lengths: [3, 12, 24, 36, 48]
};

// Default overlay settings
const DEFAULT_OVERLAY_SETTINGS = {
  support: true,
  resistance: true,
  volume: false,
  fibonacci: false,
  pivots: false
};

function App() {
  const [tradingParams, setTradingParams] = useState(DEFAULT_TRADING_PARAMS);
  const [overlaySettings, setOverlaySettings] = useState(DEFAULT_OVERLAY_SETTINGS);
  
  const { placeTrade } = useTrading();

  const handleTrade = async (direction, size) => {
    try {
      await placeTrade(
        { pair: tradingParams.pair, direction, size },
        { 
          onSuccess: () => {
            // Dispatch custom event to refresh trades and account status
            window.dispatchEvent(new CustomEvent('tradePlaced'));
          }
        }
      );
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ ...commonStyles.flexColumn, minHeight: '100vh' }}>
          <Navigation
            tradingParams={tradingParams}
            setTradingParams={setTradingParams}
            onTrade={handleTrade}
            overlaySettings={overlaySettings}
            setOverlaySettings={setOverlaySettings}
          />
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <TradingDashboard
                    tradingParams={tradingParams}
                    setTradingParams={setTradingParams}
                    overlaySettings={overlaySettings}
                    setOverlaySettings={setOverlaySettings}
                  />
                } 
              />
              <Route path="/backtest" element={<BacktestPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 