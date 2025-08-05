import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import TradingDashboard from './components/TradingDashboard';
import BacktestPage from './components/BacktestPage';
import Navigation from './components/Navigation';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#888888',
    },
    secondary: {
      main: '#666666',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#888888',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [tradingParams, setTradingParams] = useState({
    pair: "GBP_USD",
    timeframe: "M5",
    periods: 48,
    units: 1000,
    window_lengths: [3, 12, 24, 36, 48]
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation tradingParams={tradingParams} setTradingParams={setTradingParams} />
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Routes>
              <Route path="/" element={<TradingDashboard tradingParams={tradingParams} setTradingParams={setTradingParams} />} />
              <Route path="/backtest" element={<BacktestPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 