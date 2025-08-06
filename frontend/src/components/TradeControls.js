import React from 'react';
import { Paper, Box, Button, FormControl, Select, MenuItem, Grid } from '@mui/material';

const TradeControls = ({ tradingParams, setTradingParams, onTrade }) => {
  return (
    <Paper sx={{ p: 2 }}>
      {/* First row: Currency Pair, Timeframe, Periods */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.pair}
              onChange={(e) => setTradingParams({ ...tradingParams, pair: e.target.value })}
              displayEmpty
              sx={{
                color: '#888888',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {['GBP_USD', 'EUR_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD', 'NZD_USD'].map(pair => (
                <MenuItem key={pair} value={pair} sx={{ fontSize: '0.875rem' }}>{pair.replace('_', '/')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.timeframe}
              onChange={(e) => setTradingParams({ ...tradingParams, timeframe: e.target.value })}
              displayEmpty
              sx={{
                color: '#888888',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => (
                <MenuItem key={tf} value={tf} sx={{ fontSize: '0.875rem' }}>{tf}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.periods}
              onChange={(e) => setTradingParams({ ...tradingParams, periods: e.target.value })}
              displayEmpty
              sx={{
                color: '#888888',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {[24, 48, 96, 192, 384].map(period => (
                <MenuItem key={period} value={period} sx={{ fontSize: '0.875rem' }}>{period}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Second row: Units and Buy/Sell Buttons */}
      <Grid container spacing={1}>
        <Grid item xs={4}>
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.units || 1000}
              onChange={(e) => setTradingParams({ ...tradingParams, units: e.target.value })}
              displayEmpty
              sx={{
                color: '#888888',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888888' },
                '& .MuiSvgIcon-root': { color: '#888888' }
              }}
            >
              {[100, 500, 1000, 2000, 5000, 10000].map(unit => (
                <MenuItem key={unit} value={unit} sx={{ fontSize: '0.875rem' }}>{unit}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={8}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={() => onTrade && onTrade('BUY', tradingParams.units || 1000)}
              sx={{ backgroundColor: '#4caf50' }}
            >
              BUY
            </Button>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => onTrade && onTrade('SELL', tradingParams.units || 1000)}
              sx={{ backgroundColor: '#f44336' }}
            >
              SELL
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TradeControls; 