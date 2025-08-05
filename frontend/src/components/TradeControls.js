import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import { Close, TrendingUp, TrendingDown } from '@mui/icons-material';

const TradeControls = ({ tradingParams, setTradingParams, onTrade, onCloseTrade, trades }) => {
  const [tradeSize, setTradeSize] = useState(50000);

  const handleParamChange = (param, value) => {
    setTradingParams(prev => ({ ...prev, [param]: value }));
  };

  const handleBuy = () => onTrade('BUY', tradeSize);
  const handleSell = () => onTrade('SELL', tradeSize);

  return (
    <Paper sx={{ p: 2, height: 'fit-content' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
        Trading Controls
      </Typography>

      {/* Account Mode */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Account Mode</InputLabel>
        <Select
          value="test"
          label="Account Mode"
          disabled
        >
          <MenuItem value="test">Test</MenuItem>
          <MenuItem value="live">Live</MenuItem>
          <MenuItem value="practice">Practice</MenuItem>
        </Select>
      </FormControl>

      {/* Trading Parameters */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Currency Pair</InputLabel>
        <Select
          value={tradingParams.pair}
          label="Currency Pair"
          onChange={(e) => handleParamChange('pair', e.target.value)}
        >
          <MenuItem value="GBP_USD">GBP/USD</MenuItem>
          <MenuItem value="EUR_USD">EUR/USD</MenuItem>
          <MenuItem value="USD_JPY">USD/JPY</MenuItem>
          <MenuItem value="AUD_USD">AUD/USD</MenuItem>
          <MenuItem value="USD_CAD">USD/CAD</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Timeframe</InputLabel>
        <Select
          value={tradingParams.timeframe}
          label="Timeframe"
          onChange={(e) => handleParamChange('timeframe', e.target.value)}
        >
          <MenuItem value="M1">M1</MenuItem>
          <MenuItem value="M5">M5</MenuItem>
          <MenuItem value="M15">M15</MenuItem>
          <MenuItem value="H1">H1</MenuItem>
          <MenuItem value="H4">H4</MenuItem>
          <MenuItem value="D">D</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Periods</InputLabel>
        <Select
          value={tradingParams.periods}
          label="Periods"
          onChange={(e) => handleParamChange('periods', e.target.value)}
        >
          <MenuItem value={48}>1H (48)</MenuItem>
          <MenuItem value={96}>2H (96)</MenuItem>
          <MenuItem value={288}>12H (288)</MenuItem>
          <MenuItem value={576}>24H (576)</MenuItem>
        </Select>
      </FormControl>

      {/* Trade Size */}
      <TextField
        fullWidth
        label="Trade Size (units)"
        type="number"
        value={tradeSize}
        onChange={(e) => setTradeSize(parseInt(e.target.value))}
        sx={{ mb: 2 }}
      />

      {/* Buy/Sell Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={handleBuy}
          startIcon={<TrendingUp />}
        >
          BUY
        </Button>
        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={handleSell}
          startIcon={<TrendingDown />}
        >
          SELL
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Open Trades */}
      <Typography variant="h6" gutterBottom>
        Open Trades ({trades.length})
      </Typography>
      
      <List dense>
        {trades.map((trade) => (
          <ListItem key={trade.trade_id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
            <ListItemText
              primary={trade.pair}
              secondary={`${trade.direction} ${Math.abs(trade.size)} units`}
            />
            <ListItemSecondaryAction>
              <Chip
                label={`${trade.current_pl?.toFixed(2) || 0} pips`}
                color={trade.current_pl > 0 ? 'success' : 'error'}
                size="small"
                sx={{ mr: 1 }}
              />
              <IconButton
                edge="end"
                onClick={() => onCloseTrade(trade.trade_id)}
                color="error"
                size="small"
              >
                <Close />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TradeControls; 