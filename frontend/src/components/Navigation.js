import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  Menu,
  MenuItem,
  IconButton,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Divider
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import axios from 'axios';

const Navigation = ({ tradingParams, setTradingParams, onTrade, overlaySettings, setOverlaySettings, polynomialParams, setPolynomialParams }) => {
  const [accountMode, setAccountMode] = useState('test');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  useEffect(() => {
    // Fetch current account mode on component mount
    fetchAccountMode();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
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

  const handleSettingsClick = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const handleToggle = (type) => {
    setOverlaySettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a1a1a' }}>
      <Toolbar sx={{ gap: 0.5 }}>
        <Typography variant="h6" component="div" sx={{ color: '#888888', minWidth: '120px', fontSize: '0.8rem' }}>
          ZLEMA Trader
        </Typography>

        <div style={{ flexGrow: 1 }} />

        {/* Current Time - Centered */}
        <Typography variant="body2" sx={{
          color: '#888888',
          minWidth: '100px',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 'bold'
        }}>
          {formatTime(currentTime)}
        </Typography>

        <div style={{ flexGrow: 1 }} />

        {/* Settings Menu */}
        <IconButton
          onClick={handleSettingsClick}
          sx={{ color: '#888888', padding: '1px' }}
          size="small"
        >
          <Settings sx={{ fontSize: '0.9rem' }} />
        </IconButton>
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={handleSettingsClose}
          PaperProps={{
            sx: {
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              minWidth: '250px'
            }
          }}
        >
          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '2px 6px' }}>
            <Typography variant="h6" sx={{ color: '#888888', mb: 0.25, width: '100%', fontSize: '0.75rem' }}>
              Key Levels Overlay
            </Typography>
          </MenuItem>
          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '1px 6px' }}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overlaySettings.support}
                    onChange={() => handleToggle('support')}
                    sx={{
                      color: '#00ff00',
                      padding: '1px',
                      '&.Mui-checked': {
                        color: '#00ff00',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 2,
                        bgcolor: '#00ff00',
                        mr: 0.25
                      }}
                    />
                    <Typography sx={{ color: '#888888', fontSize: '0.65rem' }}>Support Levels</Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </FormGroup>
          </MenuItem>
          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '1px 6px' }}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overlaySettings.resistance}
                    onChange={() => handleToggle('resistance')}
                    sx={{
                      color: '#ff0000',
                      padding: '1px',
                      '&.Mui-checked': {
                        color: '#ff0000',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 2,
                        bgcolor: '#ff0000',
                        mr: 0.25
                      }}
                    />
                    <Typography sx={{ color: '#888888', fontSize: '0.65rem' }}>Resistance Levels</Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </FormGroup>
          </MenuItem>
          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '1px 6px' }}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overlaySettings.volume}
                    onChange={() => handleToggle('volume')}
                    sx={{
                      color: '#ffff00',
                      padding: '1px',
                      '&.Mui-checked': {
                        color: '#ffff00',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 2,
                        bgcolor: '#ffff00',
                        mr: 0.25
                      }}
                    />
                    <Typography sx={{ color: '#888888', fontSize: '0.65rem' }}>Volume Profile</Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </FormGroup>
          </MenuItem>
          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '1px 6px' }}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overlaySettings.fibonacci}
                    onChange={() => handleToggle('fibonacci')}
                    sx={{
                      color: '#00ffff',
                      padding: '1px',
                      '&.Mui-checked': {
                        color: '#00ffff',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 2,
                        bgcolor: '#00ffff',
                        mr: 0.25
                      }}
                    />
                    <Typography sx={{ color: '#888888', fontSize: '0.65rem' }}>Fibonacci Levels</Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </FormGroup>
          </MenuItem>
          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '1px 6px' }}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overlaySettings.pivots}
                    onChange={() => handleToggle('pivots')}
                    sx={{
                      color: '#ff00ff',
                      padding: '1px',
                      '&.Mui-checked': {
                        color: '#ff00ff',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 2,
                        bgcolor: '#ff00ff',
                        mr: 0.25
                      }}
                    />
                    <Typography sx={{ color: '#888888', fontSize: '0.65rem' }}>Pivot Points</Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </FormGroup>
          </MenuItem>

          <Divider sx={{ backgroundColor: '#333', margin: '4px 0' }} />

          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '2px 6px' }}>
            <Typography variant="h6" sx={{ color: '#888888', mb: 0.25, width: '100%', fontSize: '0.75rem' }}>
              Polynomial Predictions
            </Typography>
          </MenuItem>

          <MenuItem sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' }, padding: '1px 6px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <TextField
                label="Lookback"
                type="number"
                value={polynomialParams.lookback}
                onChange={(e) => setPolynomialParams(prev => ({ ...prev, lookback: parseInt(e.target.value) || 10 }))}
                inputProps={{ min: 5, max: 50 }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#333' },
                    '&:hover fieldset': { borderColor: '#555' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: '#888', fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { color: '#fff', fontSize: '0.65rem', padding: '4px 8px' }
                }}
              />

              <TextField
                label="Forecast"
                type="number"
                value={polynomialParams.forecast_periods}
                onChange={(e) => setPolynomialParams(prev => ({ ...prev, forecast_periods: parseInt(e.target.value) || 3 }))}
                inputProps={{ min: 1, max: 10 }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#333' },
                    '&:hover fieldset': { borderColor: '#555' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: '#888', fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { color: '#fff', fontSize: '0.65rem', padding: '4px 8px' }
                }}
              />

              <TextField
                label="Degree"
                type="number"
                value={polynomialParams.degree}
                onChange={(e) => setPolynomialParams(prev => ({ ...prev, degree: parseInt(e.target.value) || 2 }))}
                inputProps={{ min: 1, max: 4 }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#333' },
                    '&:hover fieldset': { borderColor: '#555' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: '#888', fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { color: '#fff', fontSize: '0.65rem', padding: '4px 8px' }
                }}
              />
            </Box>
          </MenuItem>
        </Menu>

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