import React from 'react';
import { Paper, Grid, FormControl, Select, MenuItem, Typography, Slider, Box } from '@mui/material';
import { commonStyles } from '../theme';

const PolynomialControls = ({ polynomialParams, setPolynomialParams }) => {
    const handleParamChange = (key, value) => {
        setPolynomialParams({ ...polynomialParams, [key]: value });
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

    return (
        <Paper sx={{ ...commonStyles.compactPadding, my: 0, backgroundColor: '#1a1a1a' }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontSize: '0.8rem' }}>
                Polynomial Predictions
            </Typography>

            {/* Lookback Period */}
            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                    Lookback: {polynomialParams.lookback}
                </Typography>
                <Slider
                    value={polynomialParams.lookback}
                    onChange={(_, value) => handleParamChange('lookback', value)}
                    min={10}
                    max={50}
                    step={5}
                    size="small"
                    sx={{ color: 'primary.main' }}
                />
            </Box>

            {/* Forecast Periods */}
            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                    Forecast: {polynomialParams.forecast_periods}
                </Typography>
                <Slider
                    value={polynomialParams.forecast_periods}
                    onChange={(_, value) => handleParamChange('forecast_periods', value)}
                    min={3}
                    max={10}
                    step={1}
                    size="small"
                    sx={{ color: 'primary.main' }}
                />
            </Box>

            {/* Polynomial Degree */}
            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                    Degree: {polynomialParams.degree}
                </Typography>
                <Slider
                    value={polynomialParams.degree}
                    onChange={(_, value) => handleParamChange('degree', value)}
                    min={1}
                    max={4}
                    step={1}
                    size="small"
                    sx={{ color: 'primary.main' }}
                />
            </Box>
        </Paper>
    );
};

export default PolynomialControls;
