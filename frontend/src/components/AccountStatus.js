import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { AccountBalance, TrendingUp, TrendingDown, ShowChart } from '@mui/icons-material';
import Plot from 'react-plotly.js';

const AccountStatus = ({ status }) => {
  // Prepare data for profit history chart
  const profitHistory = status.profit_history || [];
  const tradingStats = status.trading_stats || {};

  const chartData = [
    {
      x: Array.from({ length: profitHistory.length }, (_, i) => i + 1),
      y: profitHistory,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#4caf50', width: 2 },
      marker: { size: 4, color: '#4caf50' },
      name: 'Profit/Loss'
    }
  ];

  const chartLayout = {
    title: {
      text: 'Profit History',
      font: { color: '#888888', size: 14 }
    },
    xaxis: {
      title: 'Trade #',
      color: '#888888',
      gridcolor: '#333',
      zerolinecolor: '#333'
    },
    yaxis: {
      title: 'Pips',
      color: '#888888',
      gridcolor: '#333',
      zerolinecolor: '#333'
    },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#1a1a1a',
    font: { color: '#888888' },
    margin: { l: 50, r: 20, t: 40, b: 50 },
    height: 200,
    showlegend: false
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
        <AccountBalance sx={{ mr: 1 }} />
        Account Status
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Account Balance */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Balance:</Typography>
        <Typography variant="body2" color="primary">
          {status.account_balance ? `$${status.account_balance.toFixed(2)}` : 'N/A'}
        </Typography>
      </Box>

      {/* Open Trades */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Open Trades:</Typography>
        <Typography variant="body2" color="primary">
          {status.open_trades_count || 0}
        </Typography>
      </Box>

      {/* Total Trades */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Total Trades:</Typography>
        <Typography variant="body2" color="primary">
          {status.total_trades || 0}
        </Typography>
      </Box>

      {/* Total Profit */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
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

      {/* Trading Stats */}
      {Object.keys(tradingStats).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Trading Statistics
          </Typography>
          {Object.entries(tradingStats).map(([key, value]) => (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {key.trim()}:
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontSize: '0.75rem' }}>
                {typeof value === 'number' ? value.toFixed(2) : value}
              </Typography>
            </Box>
          ))}
        </>
      )}

      {/* Profit History Chart */}
      {profitHistory.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <ShowChart sx={{ mr: 0.5, fontSize: 16 }} />
              Recent Performance
            </Typography>
            <Plot
              data={chartData}
              layout={chartLayout}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AccountStatus; 