import React, { useState, useCallback } from 'react';
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
    setStrategyToggles
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

    const handleWindowLengthChange = (index, value) => {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        // Clamp value to valid range
        const clampedValue = Math.max(3, Math.min(200, numValue));

        const newWindowLengths = [...(tradingParams.window_lengths || DEFAULT_WINDOW_LENGTHS)];
        newWindowLengths[index] = clampedValue;

        handleParamChange('window_lengths', newWindowLengths);
    };



    const handleVolatilityThresholdChange = useCallback((value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        // Clamp value to valid range
        const clampedValue = Math.max(0, Math.min(10, numValue));

        handleParamChange('volatility_threshold', clampedValue);
    }, [handleParamChange, tradingParams.volatility_threshold]);



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
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={length}
                                        onChange={(e) => handleWindowLengthChange(index, e.target.value)}
                                        inputProps={{
                                            min: 3,
                                            max: 200,
                                            step: 1,
                                            style: { fontSize: '0.75rem', textAlign: 'center' }
                                        }}
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                height: '36px'
                                            }
                                        }}
                                    />
                                </Grid>
                            ))}
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 2, mb: 1, fontWeight: 500 }}>
                                    Min Volatility Threshold (pips):
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={tradingParams.volatility_threshold || 0.5}
                                    onChange={(e) => handleVolatilityThresholdChange(e.target.value)}
                                    inputProps={{
                                        min: 0,
                                        max: 10,
                                        step: 0.1,
                                        style: { fontSize: '0.75rem', textAlign: 'center' }
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            height: '36px'
                                        }
                                    }}
                                />
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
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.5 }}>Length:</Typography>
                            {renderSelect(
                                tradingParams.zl_length || 70,
                                (value) => handleParamChange('zl_length', value),
                                ZL_LENGTH_OPTIONS,
                                true
                            )}
                        </Grid>
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
