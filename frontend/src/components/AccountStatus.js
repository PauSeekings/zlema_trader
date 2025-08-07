import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { AccountBalance, TrendingUp, TrendingDown, ShowChart } from '@mui/icons-material';
import Plot from 'react-plotly.js';

const AccountStatus = ({ status, trades = [] }) => {
  // Prepare data for profit history chart
  const profitHistory = status.profit_history || [];
  const tradingStats = status.trading_stats || {};

  // Calculate total unrealized P&L from all open trades
  const totalUnrealizedPL = trades.reduce((total, trade) => {
    return total + (trade.current_pl || 0);
  }, 0);

  // Calculate cumulative profit
  const cumulativeProfit = profitHistory.reduce((acc, profit, index) => {
    if (index === 0) return [profit];
    return [...acc, acc[index - 1] + profit];
  }, []);

  const chartData = [
    {
      x: Array.from({ length: cumulativeProfit.length }, (_, i) => i + 1),
      y: cumulativeProfit,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#4caf50', width: 2 },
      marker: { size: 4, color: '#4caf50' },
      name: 'Cumulative Profit'
    }
  ];

  const chartLayout = {
    xaxis: {
      title: 'Trade #',
      color: '#888888',
      gridcolor: '#333',
      zerolinecolor: '#333'
    },
    yaxis: {
      title: 'Cumulative Pips',
      color: '#888888',
      gridcolor: '#333',
      zerolinecolor: '#333'
    },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#1a1a1a',
    font: { color: '#888888' },
    margin: { l: 50, r: 20, t: 20, b: 50 },
    height: 250,
    showlegend: false
  };

  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', fontSize: '0.8rem', mb: 1 }}>
        <AccountBalance sx={{ mr: 0.5, fontSize: '1rem' }} />
        Account Status
      </Typography>

      <Divider sx={{ my: 1 }} />

      {/* Account Balance */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Balance:</Typography>
        <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.7rem' }}>
          {status.account_balance ? `$${status.account_balance.toFixed(2)}` : 'N/A'}
        </Typography>
      </Box>

      {/* Open Trades */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Open Trades:</Typography>
        <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.7rem' }}>
          {status.open_trades_count || 0}
        </Typography>
      </Box>

      {/* Total Unrealized P&L */}
      {trades.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Unrealized P&L:</Typography>
          <Typography
            variant="body2"
            color={totalUnrealizedPL >= 0 ? 'success.main' : 'error.main'}
            sx={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}
          >
            {totalUnrealizedPL >= 0 ? <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> : <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} />}
            {totalUnrealizedPL.toFixed(2)} pips
          </Typography>
        </Box>
      )}

      {/* Total Trades */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Total Trades:</Typography>
        <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.7rem' }}>
          {status.total_trades || 0}
        </Typography>
      </Box>

      {/* Total Profit */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Total Profit:</Typography>
        <Typography
          variant="body2"
          color={status.total_profit > 0 ? 'success.main' : 'error.main'}
          sx={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}
        >
          {status.total_profit > 0 ? <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> : <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} />}
          {status.total_profit?.toFixed(2) || '0.00'} pips
        </Typography>
      </Box>

      {/* Trading Stats */}
      {Object.keys(tradingStats).length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', fontSize: '0.7rem' }}>
            Trading Statistics
          </Typography>
          {Object.entries(tradingStats).map(([key, value]) => (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                {key.trim()}:
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.65rem' }}>
                {typeof value === 'number' ? value.toFixed(2) : value}
              </Typography>
            </Box>
          ))}
        </>
      )}

      {/* Profit History Chart */}
      {cumulativeProfit.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
              <ShowChart sx={{ mr: 0.5, fontSize: 14 }} />
              Cumulative Performance
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