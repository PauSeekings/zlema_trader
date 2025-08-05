import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import { Assessment } from '@mui/icons-material';

const BacktestPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
        <Assessment sx={{ mr: 2, verticalAlign: 'middle' }} />
        Backtest Strategy
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Backtesting functionality will be implemented in the next iteration.
        </Alert>
        
        <Typography variant="body1" sx={{ mt: 2 }}>
          This page will include:
        </Typography>
        <ul>
          <li>Strategy parameter configuration</li>
          <li>Historical data selection</li>
          <li>Backtest results visualization</li>
          <li>Performance metrics and statistics</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default BacktestPage; 