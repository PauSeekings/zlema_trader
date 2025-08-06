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
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.75rem',
    },
    body2: {
      fontSize: '0.7rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '4px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
          padding: '2px 6px',
          minHeight: '24px',
          color: 'white',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
        select: {
          padding: '2px 6px !important',
          minHeight: '20px !important',
          lineHeight: '1.2 !important',
          display: 'flex !important',
          alignItems: 'center !important',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
          padding: '1px 6px !important',
          minHeight: '20px !important',
          lineHeight: '1.2 !important',
          display: 'flex !important',
          alignItems: 'center !important',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
        h6: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '32px !important',
          padding: '2px 4px !important',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontSize: '0.65rem',
          padding: '1px 4px !important',
          minHeight: '20px !important',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
        input: {
          padding: '2px 6px !important',
          display: 'flex !important',
          alignItems: 'center !important',
        },
      },
    },
  },
});

function App() {
  const [tradingParams, setTradingParams] = useState({
    pair: "GBP_USD",
    timeframe: "M5",
    periods: 48,
    units: 10000,
    window_lengths: [3, 12, 24, 36, 48]
  });

  const [overlaySettings, setOverlaySettings] = useState({
    support: true,
    resistance: true,
    volume: false,
    fibonacci: false,
    pivots: false
  });

  const handleTrade = async (direction, size) => {
    try {
      await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pair: tradingParams.pair,
          direction: direction,
          size: size
        }),
      });
      // Dispatch custom event to refresh trades and account status
      window.dispatchEvent(new CustomEvent('tradePlaced'));
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation
            tradingParams={tradingParams}
            setTradingParams={setTradingParams}
            onTrade={handleTrade}
            overlaySettings={overlaySettings}
            setOverlaySettings={setOverlaySettings}
          />
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Routes>
              <Route path="/" element={
                <TradingDashboard
                  tradingParams={tradingParams}
                  setTradingParams={setTradingParams}
                  overlaySettings={overlaySettings}
                  setOverlaySettings={setOverlaySettings}
                />
              } />
              <Route path="/backtest" element={<BacktestPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 