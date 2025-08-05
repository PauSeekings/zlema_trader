import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { TrendingUp, Assessment } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = ({ tradingParams, setTradingParams }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currencyPairs = [
    'GBP_USD', 'EUR_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD', 'NZD_USD'
  ];

  const timeframes = [
    'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'
  ];

  const periods = [24, 48, 96, 192, 384];

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a1a1a' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ color: '#888888', minWidth: '120px' }}>
          ZLEMA Trader
        </Typography>

        {/* Trading Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#888888' }}>Pair</InputLabel>
            <Select
              value={tradingParams.pair}
              onChange={(e) => setTradingParams({ ...tradingParams, pair: e.target.value })}
              sx={{
                color: '#888888',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {currencyPairs.map(pair => (
                <MenuItem key={pair} value={pair}>{pair.replace('_', '/')}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel sx={{ color: '#888888' }}>TF</InputLabel>
            <Select
              value={tradingParams.timeframe}
              onChange={(e) => setTradingParams({ ...tradingParams, timeframe: e.target.value })}
              sx={{
                color: '#888888',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {timeframes.map(tf => (
                <MenuItem key={tf} value={tf}>{tf}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel sx={{ color: '#888888' }}>Periods</InputLabel>
            <Select
              value={tradingParams.periods}
              onChange={(e) => setTradingParams({ ...tradingParams, periods: e.target.value })}
              sx={{
                color: '#888888',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {periods.map(period => (
                <MenuItem key={period} value={period}>{period}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ color: '#888888' }}>Units</InputLabel>
            <Select
              value={tradingParams.units || 1000}
              onChange={(e) => setTradingParams({ ...tradingParams, units: e.target.value })}
              sx={{
                color: '#888888',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {[100, 500, 1000, 2000, 5000, 10000].map(unit => (
                <MenuItem key={unit} value={unit}>{unit}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            startIcon={<TrendingUp />}
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: location.pathname === '/' ? 'rgba(136, 136, 136, 0.2)' : 'transparent'
            }}
          >
            Live Trading
          </Button>
          <Button
            color="inherit"
            startIcon={<Assessment />}
            onClick={() => navigate('/backtest')}
            sx={{
              backgroundColor: location.pathname === '/backtest' ? 'rgba(136, 136, 136, 0.2)' : 'transparent'
            }}
          >
            Backtest
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 