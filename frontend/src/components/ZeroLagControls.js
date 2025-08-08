import React from 'react';
import { Paper, Grid, FormControl, Select, MenuItem, FormControlLabel, Switch, Typography } from '@mui/material';
import { commonStyles } from '../theme';

const ZL_LENGTH_OPTIONS = [12, 24, 36, 48, 70, 100];

const ZeroLagControls = ({ tradingParams, setTradingParams }) => {
  const handleParamChange = (key, value) => {
    setTradingParams({ ...tradingParams, [key]: value });
  };

  const handleStrategyToggle = (event) => {
    handleParamChange('strategy', event.target.checked ? 'zero_lag' : 'classic');
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

  const isZeroLagActive = tradingParams.strategy === 'zero_lag';

  return (
    <Paper sx={{ ...commonStyles.compactPadding, my: 0 }}>
      <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontSize: '0.8rem' }}>
        Zero Lag Strategy
      </Typography>
      
      {/* Zero Lag Toggle */}
      <Grid container spacing={0.25} sx={{ alignItems: 'center' }}>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={isZeroLagActive}
                onChange={handleStrategyToggle}
                name="zeroLagToggle"
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Zero Lag Signals</Typography>}
            labelPlacement="end"
            sx={{ m: 0 }}
          />
        </Grid>
        {isZeroLagActive && (
          <Grid item xs={6}>
            {renderSelect(
              tradingParams.zl_length || 70,
              (value) => handleParamChange('zl_length', value),
              ZL_LENGTH_OPTIONS,
              true
            )}
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ZeroLagControls;
