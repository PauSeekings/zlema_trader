import React, { useState, useCallback } from 'react';
import { Slider } from '@mui/material';
import {
    Paper,
    Tabs,
    Tab,
    Box,
    FormControlLabel,
    Switch,
    Typography,
    Grid,
    FormControl,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import { commonStyles } from '../theme';
import { DEFAULT_WINDOW_LENGTHS } from '../App';

const ZL_LENGTH_OPTIONS = [10, 12, 15, 20, 24, 30, 36, 40, 48, 50, 60, 70, 80, 100, 120, 150, 200];
const POLYNOMIAL_DEGREES = [1, 2, 3, 4, 5];
const LOOKBACK_OPTIONS = [5, 10, 15, 20, 25, 30];
const FORECAST_OPTIONS = [3, 5, 7, 10, 15];

const StrategyTabs = ({
    tradingParams,
    setTradingParams,
    polynomialParams,
    setPolynomialParams,
    strategyToggles,
    setStrategyToggles,
    marketData
}) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleParamChange = (key, value) => {
        setTradingParams({ ...tradingParams, [key]: value });
    };

    const handlePolynomialParamChange = (key, value) => {
        setPolynomialParams({ ...polynomialParams, [key]: value });
    };

    const handleStrategyToggle = (strategy, checked) => {
        setStrategyToggles({ ...strategyToggles, [strategy]: checked });

        // For zero lag, also update the trading params strategy
        if (strategy === 'zero_lag') {
            handleParamChange('strategy', checked ? 'zero_lag' : 'classic');
        }
    };

    const handleWindowLengthChange = useCallback((index, value) => {
        const newWindowLengths = [...(tradingParams.window_lengths || DEFAULT_WINDOW_LENGTHS)];
        newWindowLengths[index] = value;
        handleParamChange('window_lengths', newWindowLengths);
    }, []);



    const handleVolatilityThresholdChange = useCallback((value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        // Clamp value to valid range
        const clampedValue = Math.max(0, Math.min(10, numValue));

        handleParamChange('volatility_threshold', clampedValue);
    }, []);



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

    const TabPanel = ({ children, value, index }) => (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
        </div>
    );

    return (
        <Paper sx={{ ...commonStyles.compactPadding, my: 0 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontSize: '0.8rem' }}>
                Strategy Controls
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    minHeight: 'auto',
                    '& .MuiTab-root': {
                        fontSize: '0.65rem',
                        minHeight: '32px',
                        padding: '4px 8px'
                    }
                }}
            >
                <Tab label="Zlema1" />
                <Tab label="Zero Lag" />
                <Tab label="Polynomial" />
            </Tabs>

            {/* Zlema1 Tab */}
            <TabPanel value={activeTab} index={0}>
                <Grid container spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={strategyToggles?.zlema1 || false}
                                    onChange={(e) => handleStrategyToggle('zlema1', e.target.checked)}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Show Zlema1</Typography>}
                            sx={{ m: 0 }}
                        />
                    </Grid>
                    {strategyToggles?.zlema1 && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1, fontWeight: 500 }}>
                                    Window Lengths (3-200):
                                </Typography>
                            </Grid>
                            {(tradingParams.window_lengths || DEFAULT_WINDOW_LENGTHS).map((length, index) => (
                                <Grid item xs={2.4} key={index}>
                                    <Box sx={{ px: 1 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#aaa', display: 'block', textAlign: 'center', mb: 0.5 }}>
                                            {length}
                                        </Typography>
                                        <Slider
                                            value={Number(length) || 20}
                                            onChange={(e, val) => {
                                                if (val && !isNaN(val)) {
                                                    handleWindowLengthChange(index, val);
                                                }
                                            }}
                                            min={3}
                                            max={200}
                                            step={1}
                                            size="small"
                                            componentsProps={{
                                                thumb: {
                                                    onMouseDown: (e) => e.stopPropagation()
                                                }
                                            }}
                                            sx={{
                                                color: '#4caf50',
                                                height: 4,
                                                '& .MuiSlider-thumb': {
                                                    width: 16,
                                                    height: 16,
                                                    backgroundColor: '#4caf50',
                                                    '&:hover': {
                                                        boxShadow: '0px 0px 0px 8px rgba(76, 175, 80, 0.16)',
                                                    },
                                                },
                                                '& .MuiSlider-track': {
                                                    backgroundColor: '#4caf50',
                                                },
                                                '& .MuiSlider-rail': {
                                                    backgroundColor: '#555',
                                                },
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 2, mb: 1, fontWeight: 500 }}>
                                    Min Volatility Threshold (pips):
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Box sx={{ px: 2 }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#aaa', display: 'block', textAlign: 'center', mb: 0.5 }}>
                                        {tradingParams.volatility_threshold || 0.5}
                                    </Typography>
                                    <Slider
                                        value={Number(tradingParams.volatility_threshold) || 0.5}
                                        onChange={(e, val) => {
                                            if (val !== null && !isNaN(val)) {
                                                handleParamChange('volatility_threshold', val);
                                            }
                                        }}
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        size="small"
                                        componentsProps={{
                                            thumb: {
                                                onMouseDown: (e) => e.stopPropagation()
                                            }
                                        }}
                                        sx={{
                                            color: '#ff9800',
                                            height: 4,
                                            '& .MuiSlider-thumb': {
                                                width: 16,
                                                height: 16,
                                                backgroundColor: '#ff9800',
                                                '&:hover': {
                                                    boxShadow: '0px 0px 0px 8px rgba(255, 152, 0, 0.16)',
                                                },
                                            },
                                            '& .MuiSlider-track': {
                                                backgroundColor: '#ff9800',
                                            },
                                            '& .MuiSlider-rail': {
                                                backgroundColor: '#555',
                                            },
                                        }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 2, mb: 1, fontWeight: 500 }}>
                                    Probability TP (pips):
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Box sx={{ px: 2 }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#aaa', display: 'block', textAlign: 'center', mb: 0.5 }}>
                                        {tradingParams.probability_tp || 5}
                                    </Typography>
                                    <Slider
                                        value={Number(tradingParams.probability_tp) || 5}
                                        onChange={(e, val) => {
                                            if (val !== null && !isNaN(val)) {
                                                handleParamChange('probability_tp', val);
                                            }
                                        }}
                                        min={1}
                                        max={100}
                                        step={1}
                                        size="small"
                                        componentsProps={{
                                            thumb: {
                                                onMouseDown: (e) => e.stopPropagation()
                                            }
                                        }}
                                        sx={{
                                            color: '#2196f3',
                                            height: 4,
                                            '& .MuiSlider-thumb': {
                                                width: 16,
                                                height: 16,
                                                backgroundColor: '#2196f3',
                                                '&:hover': {
                                                    boxShadow: '0px 0px 0px 8px rgba(33, 150, 243, 0.16)',
                                                },
                                            },
                                            '& .MuiSlider-track': {
                                                backgroundColor: '#2196f3',
                                            },
                                            '& .MuiSlider-rail': {
                                                backgroundColor: '#555',
                                            },
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </>
                    )}

                    {/* Win Rates Display */}
                    {marketData?.signal_probabilities && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 2, mb: 1, fontWeight: 500 }}>
                                    Win Rates (5pip TP):
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{
                                    backgroundColor: 'rgba(0,255,136,0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(0,255,136,0.3)'
                                }}>
                                    <Typography variant="caption" sx={{ color: '#00ff88', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                        Buy: {marketData.signal_probabilities.bull_entry_probability?.probability || 0}%
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{
                                    backgroundColor: 'rgba(255,68,68,0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,68,68,0.3)'
                                }}>
                                    <Typography variant="caption" sx={{ color: '#ff4444', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                        Sell: {marketData.signal_probabilities.bear_entry_probability?.probability || 0}%
                                    </Typography>
                                </Box>
                            </Grid>
                        </>
                    )}
                </Grid>
            </TabPanel>

            {/* Zero Lag Tab */}
            <TabPanel value={activeTab} index={1}>
                <Grid container spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Grid item xs={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={strategyToggles?.zero_lag || tradingParams.strategy === 'zero_lag'}
                                    onChange={(e) => handleStrategyToggle('zero_lag', e.target.checked)}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Zero Lag Signals</Typography>}
                            sx={{ m: 0 }}
                        />
                    </Grid>
                    {(strategyToggles?.zero_lag || tradingParams.strategy === 'zero_lag') && (
                        <>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.5 }}>Length:</Typography>
                                {renderSelect(
                                    tradingParams.zl_length || 70,
                                    (value) => handleParamChange('zl_length', value),
                                    ZL_LENGTH_OPTIONS,
                                    true
                                )}
                            </Grid>

                            {/* Win Rates Display for Zero Lag */}
                            {marketData?.signal_probabilities && (
                                <>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 2, mb: 1, fontWeight: 500 }}>
                                            Win Rates (5pip TP):
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{
                                            backgroundColor: 'rgba(0,255,187,0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(0,255,187,0.3)'
                                        }}>
                                            <Typography variant="caption" sx={{ color: '#00ffbb', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                Buy: {marketData.signal_probabilities.bull_entry_probability?.probability || 0}%
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{
                                            backgroundColor: 'rgba(255,17,0,0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255,17,0,0.3)'
                                        }}>
                                            <Typography variant="caption" sx={{ color: '#ff1100', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                Sell: {marketData.signal_probabilities.bear_entry_probability?.probability || 0}%
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </>
                            )}
                        </>
                    )}
                </Grid>
            </TabPanel>

            {/* Polynomial Tab */}
            <TabPanel value={activeTab} index={2}>
                <Grid container spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={strategyToggles?.polynomial || false}
                                    onChange={(e) => handleStrategyToggle('polynomial', e.target.checked)}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Show Polynomial</Typography>}
                            sx={{ m: 0 }}
                        />
                    </Grid>
                    {strategyToggles?.polynomial && (
                        <>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.5 }}>Degree:</Typography>
                                {renderSelect(
                                    polynomialParams?.degree || 2,
                                    (value) => handlePolynomialParamChange('degree', value),
                                    POLYNOMIAL_DEGREES,
                                    true
                                )}
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.5 }}>Lookback:</Typography>
                                {renderSelect(
                                    polynomialParams?.lookback || 20,
                                    (value) => handlePolynomialParamChange('lookback', value),
                                    LOOKBACK_OPTIONS,
                                    true
                                )}
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.5 }}>Forecast:</Typography>
                                {renderSelect(
                                    polynomialParams?.forecast_periods || 5,
                                    (value) => handlePolynomialParamChange('forecast_periods', value),
                                    FORECAST_OPTIONS,
                                    true
                                )}
                            </Grid>
                        </>
                    )}
                </Grid>
            </TabPanel>
        </Paper>
    );
};

export default StrategyTabs;
