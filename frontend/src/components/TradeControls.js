import React from 'react';
import {
  Paper,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Button,
  Box
} from '@mui/material';

const TradeControls = ({ tradingParams, setTradingParams, onTrade }) => {
  return (
    <Paper sx={{ p: 0.5, my: 0 }}>
      {/* First row: Currency Pair, Timeframe, Periods */}
      <Grid container spacing={0.25} sx={{ mb: 0.5 }}>
        <Grid item xs={4}>
          {/* Pair Dropdown */}
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.pair}
              onChange={(e) => setTradingParams({ ...tradingParams, pair: e.target.value })}
              displayEmpty
            >
              <MenuItem value="GBP_USD">GBP/USD</MenuItem>
              <MenuItem value="EUR_USD">EUR/USD</MenuItem>
              <MenuItem value="USD_JPY">USD/JPY</MenuItem>
              <MenuItem value="AUD_USD">AUD/USD</MenuItem>
              <MenuItem value="USD_CAD">USD/CAD</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          {/* Timeframe Dropdown */}
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.timeframe}
              onChange={(e) => setTradingParams({ ...tradingParams, timeframe: e.target.value })}
              displayEmpty
            >
              <MenuItem value="M1">M1</MenuItem>
              <MenuItem value="M5">M5</MenuItem>
              <MenuItem value="M15">M15</MenuItem>
              <MenuItem value="M30">M30</MenuItem>
              <MenuItem value="H1">H1</MenuItem>
              <MenuItem value="H4">H4</MenuItem>
              <MenuItem value="D1">D1</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          {/* Periods Dropdown */}
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.periods}
              onChange={(e) => setTradingParams({ ...tradingParams, periods: e.target.value })}
              displayEmpty
            >
              <MenuItem value={48}>48</MenuItem>
              <MenuItem value={96}>96</MenuItem>
              <MenuItem value={192}>192</MenuItem>
              <MenuItem value={384}>384</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {/* Second row: Units and Buy/Sell Buttons */}
      <Grid container spacing={0.25}>
        <Grid item xs={4}>
          {/* Units Dropdown */}
          <FormControl size="small" fullWidth>
            <Select
              value={tradingParams.units || 10000}
              onChange={(e) => setTradingParams({ ...tradingParams, units: e.target.value })}
              displayEmpty
            >
              {[10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000].map(unit => (
                <MenuItem key={unit} value={unit}>
                  {unit.toLocaleString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={8}>
          {/* Buy/Sell Buttons */}
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <Button
              onClick={() => onTrade && onTrade('BUY', tradingParams.units || 10000)}
              sx={{
                backgroundColor: '#4caf50',
                minHeight: '20px',
                flex: 1,
                color: 'white',
                '&:hover': {
                  backgroundColor: '#45a049',
                }
              }}
            >
              BUY
            </Button>
            <Button
              onClick={() => onTrade && onTrade('SELL', tradingParams.units || 10000)}
              sx={{
                backgroundColor: '#f44336',
                minHeight: '20px',
                flex: 1,
                color: 'white',
                '&:hover': {
                  backgroundColor: '#d32f2f',
                }
              }}
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