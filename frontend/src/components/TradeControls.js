import React from 'react';
import { Paper, Grid, FormControl, Select, MenuItem, Button } from '@mui/material';
import { commonStyles } from '../theme';

// Trading options configuration
const TRADING_OPTIONS = {
  pairs: [
    { value: "GBP_USD", label: "GBP/USD" },
    { value: "EUR_USD", label: "EUR/USD" },
    { value: "USD_JPY", label: "USD/JPY" },
    { value: "AUD_USD", label: "AUD/USD" },
    { value: "USD_CAD", label: "USD/CAD" }
  ],
  timeframes: [
    { value: "M1", label: "M1" },
    { value: "M5", label: "M5" },
    { value: "M15", label: "M15" },
    { value: "M30", label: "M30" },
    { value: "H1", label: "H1" },
    { value: "H4", label: "H4" },
    { value: "D1", label: "D1" }
  ],
  periods: [48, 96, 192, 384],
  units: [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000]
};

const TradeControls = ({ tradingParams, setTradingParams, onTrade }) => {
  const handleParamChange = (key, value) => {
    setTradingParams({ ...tradingParams, [key]: value });
  };

  const renderSelect = (value, onChange, options, isNumeric = false) => (
    <FormControl size="small" fullWidth>
      <Select value={value} onChange={(e) => onChange(e.target.value)} displayEmpty>
        {options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : (isNumeric ? option.toLocaleString() : option);
          
          return (
            <MenuItem key={optionValue} value={optionValue}>
              {optionLabel}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );

  const handleTrade = (direction) => {
    if (onTrade) {
      onTrade(direction, tradingParams.units || TRADING_OPTIONS.units[0]);
    }
  };

  return (
    <Paper sx={{ ...commonStyles.compactPadding, my: 0 }}>
      {/* First row: Currency Pair, Timeframe, Periods */}
      <Grid container spacing={0.25} sx={{ mb: 0.5 }}>
        <Grid item xs={4}>
          {renderSelect(
            tradingParams.pair,
            (value) => handleParamChange('pair', value),
            TRADING_OPTIONS.pairs
          )}
        </Grid>
        <Grid item xs={4}>
          {renderSelect(
            tradingParams.timeframe,
            (value) => handleParamChange('timeframe', value),
            TRADING_OPTIONS.timeframes
          )}
        </Grid>
        <Grid item xs={4}>
          {renderSelect(
            tradingParams.periods,
            (value) => handleParamChange('periods', value),
            TRADING_OPTIONS.periods,
            true
          )}
        </Grid>
      </Grid>

      {/* Second row: Units and Buy/Sell Buttons */}
      <Grid container spacing={0.25}>
        <Grid item xs={4}>
          {renderSelect(
            tradingParams.units || TRADING_OPTIONS.units[0],
            (value) => handleParamChange('units', value),
            TRADING_OPTIONS.units,
            true
          )}
        </Grid>
        <Grid item xs={4}>
          <Button sx={commonStyles.buyButton} onClick={() => handleTrade('BUY')} fullWidth>
            BUY
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button sx={commonStyles.sellButton} onClick={() => handleTrade('SELL')} fullWidth>
            SELL
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TradeControls; 