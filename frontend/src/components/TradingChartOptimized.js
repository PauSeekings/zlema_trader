import React, { memo, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';
import CandlestickChart from './chart/CandlestickChart';
import RibbonChart from './chart/RibbonChart';
import KeyLevelsChart from './chart/KeyLevelsChart';
import SubplotChart from './chart/SubplotChart';

const TradingChart = memo(({
    marketData,
    keyLevels,
    polynomialPredictions,
    overlaySettings,
    currentPrice,
    strategyToggles,
    tradingParams
}) => {
    // Memoize processed data to avoid recalculation on every render
    const processedData = useMemo(() => {
        if (!marketData || !marketData.all_candles) {
            return null;
        }

        const { all_candles, std_devs, medians, rsi_data, eff_data } = marketData;
        const baseLength = all_candles[0][0].length;
        const xAxis = Array.from({ length: baseLength }, (_, i) => i);

        // Ensure overlaySettings has defaults
        const defaultOverlaySettings = {
            support: true,
            resistance: true,
            volume: false,
            fibonacci: false,
            pivots: false,
            ...overlaySettings
        };

        return {
            all_candles,
            std_devs,
            medians,
            rsi_data,
            eff_data,
            xAxis,
            overlaySettings: defaultOverlaySettings,
            baseLength
        };
    }, [marketData, overlaySettings]);

    // Memoize layout to prevent unnecessary recalculations
    const layout = useMemo(() => ({
        title: {
            text: `${tradingParams?.pair || 'GBP_USD'} - ${tradingParams?.timeframe || 'M5'}`,
            font: { color: '#E0E0E0', size: 16 }
        },
        paper_bgcolor: '#1E1E1E',
        plot_bgcolor: '#1E1E1E',
        font: { color: '#E0E0E0' },
        margin: { l: 60, r: 20, t: 50, b: 40 },

        // Main price chart
        xaxis: {
            domain: [0, 1],
            showgrid: true,
            gridcolor: '#333',
            zeroline: false,
            color: '#E0E0E0'
        },
        yaxis: {
            domain: [0.55, 1],
            showgrid: true,
            gridcolor: '#333',
            zeroline: false,
            color: '#E0E0E0',
            title: { text: 'Price (pips)', font: { color: '#E0E0E0' } }
        },

        // RSI subplot
        yaxis2: {
            domain: [0.35, 0.5],
            showgrid: true,
            gridcolor: '#333',
            zeroline: false,
            color: '#E0E0E0',
            title: { text: 'RSI', font: { color: '#E0E0E0' } },
            range: [0, 100]
        },

        // Efficiency subplot
        yaxis3: {
            domain: [0.05, 0.3],
            showgrid: true,
            gridcolor: '#333',
            zeroline: false,
            color: '#E0E0E0',
            title: { text: 'Efficiency', font: { color: '#E0E0E0' } },
            range: [-1.2, 1.2]
        },

        hovermode: 'x unified',
        showlegend: false
    }), [tradingParams]);

    // Memoize chart data components
    const chartComponents = useMemo(() => {
        if (!processedData) return [];

        const { all_candles, rsi_data, eff_data, xAxis, overlaySettings } = processedData;
        const isZeroLag = Boolean(marketData.zl) && (strategyToggles?.zero_lag === true);

        let data = [];

        // Add key levels first (background)
        if (keyLevels) {
            data.push(...KeyLevelsChart({
                keyLevels,
                overlaySettings,
                xRange: [0, xAxis.length - 1]
            }));
        }

        // Add ribbons for ZLEMA timeframes (if not zero lag mode)
        if (!isZeroLag && all_candles.length > 1) {
            all_candles.slice(1).forEach(candle => {
                data.push(...RibbonChart({ candles: candle, xAxis }));
            });
        }

        // Add subplots (RSI and Efficiency)
        data.push(...SubplotChart({ rsiData: rsi_data, effData: eff_data, xAxis }));

        // Add main candlesticks last (foreground)
        if (all_candles.length > 0) {
            data.push(...CandlestickChart({ candles: all_candles[0], xAxis }));
        }

        return data;
    }, [processedData, keyLevels, marketData.zl, strategyToggles]);

    // Memoize plot config
    const plotConfig = useMemo(() => ({
        displayModeBar: false,
        responsive: true,
        staticPlot: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
        displaylogo: false
    }), []);

    // Early return for loading state
    if (!processedData) {
        return <Typography>Loading chart...</Typography>;
    }

    return (
        <Box>
            <Plot
                data={chartComponents}
                layout={layout}
                config={plotConfig}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
                onError={(error) => console.error('Plotly error:', error)}
            />
        </Box>
    );
});

TradingChart.displayName = 'TradingChart';

export default TradingChart;
