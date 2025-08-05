import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { AccountBalance, TrendingUp, TrendingDown } from '@mui/icons-material';

const AccountStatus = ({ status }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
        Account Status
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Chip
          icon={<AccountBalance />}
          label={status.account_mode?.toUpperCase() || 'TEST'}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Open Trades:</Typography>
        <Typography variant="body2" color="primary">
          {status.open_trades_count || 0}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Total Profit:</Typography>
        <Typography 
          variant="body2" 
          color={status.total_profit > 0 ? 'success.main' : 'error.main'}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {status.total_profit > 0 ? <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} /> : <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />}
          {status.total_profit?.toFixed(2) || '0.00'} pips
        </Typography>
      </Box>
    </Paper>
  );
};

export default AccountStatus; 