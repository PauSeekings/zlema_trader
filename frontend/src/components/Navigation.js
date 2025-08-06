import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, ToggleButton, ToggleButtonGroup, FormControl } from '@mui/material';
import axios from 'axios';

const Navigation = ({ tradingParams, setTradingParams, onTrade }) => {
  const [accountMode, setAccountMode] = useState('test');

  useEffect(() => {
    // Fetch current account mode on component mount
    fetchAccountMode();
  }, []);

  const fetchAccountMode = async () => {
    try {
      const response = await axios.get('/api/status');
      setAccountMode(response.data.account_mode);
    } catch (err) {
      console.error('Failed to fetch account mode:', err);
    }
  };

  const handleAccountModeChange = async (event, newMode) => {
    if (newMode !== null) {
      try {
        await axios.post('/api/connect', null, {
          params: { mode: newMode }
        });
        setAccountMode(newMode);
      } catch (err) {
        console.error('Failed to change account mode:', err);
      }
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a1a1a' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ color: '#888888', minWidth: '120px' }}>
          ZLEMA Trader
        </Typography>

        <div style={{ flexGrow: 1 }} />

        {/* TEST/LIVE Toggle */}
        <FormControl size="small" sx={{ minWidth: '120px' }}>
          <ToggleButtonGroup
            value={accountMode}
            exclusive
            onChange={handleAccountModeChange}
            size="small"
            sx={{
              backgroundColor: '#1a1a1a',
              '& .MuiToggleButton-root': {
                color: '#888888',
                borderColor: '#888888',
                fontSize: '0.875rem',
                padding: '8px 16px',
                flex: 1,
                '&.Mui-selected': {
                  backgroundColor: '#4caf50',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#45a049',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(136, 136, 136, 0.1)',
                }
              }
            }}
          >
            <ToggleButton value="test">TEST</ToggleButton>
            <ToggleButton value="live">LIVE</ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 