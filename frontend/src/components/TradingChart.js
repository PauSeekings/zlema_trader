import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const TradingChart = ({ marketData, keyLevels, polynomialPredictions, overlaySettings, currentPrice, strategyToggles }) => {
  if (!marketData || !marketData.all_candles) {
    return <Typography>Loading chart...</Typography>;
  }

  // Ensure overlaySettings has default values
  const defaultOverlaySettings = {
    support: true,
    resistance: true,
    volume: false,
    fibonacci: false,
    pivots: false,
    ...overlaySettings
  };

  console.log('Market data received:', marketData);
  console.log('Key levels received:', keyLevels);
  console.log('Overlay settings received:', overlaySettings);
  console.log('ZL data received:', marketData.zl);
  const { all_candles, std_devs, medians, rsi_data, eff_data } = marketData;

  // Create subplots: 4 rows, shared x-axis
  const subplotData = [];
  const data = []; // Main data array for candlesticks and key levels
  const keyLevelsData = []; // Separate array for key levels (plotted first)
  // Calculate total x-axis length including predictions
  const baseLength = all_candles[0][0].length;
  const predictionLength = polynomialPredictions && polynomialPredictions.predictions ? polynomialPredictions.predictions.length : 0;
  const totalLength = baseLength + predictionLength;
  const xAxis = Array.from({ length: baseLength }, (_, i) => i);

  // Plot candlesticks based on strategy toggles
  const isZeroLag = Boolean(marketData.zl) && (strategyToggles?.zero_lag === true);

  if (isZeroLag) {
    // Only plot the first candlestick set when Zero Lag is active
    const candle = all_candles[0];
    data.push({
      type: 'candlestick',
      x: xAxis,
      open: candle[0],
      high: candle[2],
      low: candle[3],
      close: candle[1],
      opacity: 0.3, // Slightly faded to let ZL overlay stand out
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above',
      showlegend: false
    });
  } else {
    // Always plot basic candlesticks (first dataset only)
    const candle = all_candles[0];
    data.push({
      type: 'candlestick',
      x: xAxis,
      open: candle[0],
      high: candle[2],
      low: candle[3],
      close: candle[1],
      opacity: 0.7,
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above',
      showlegend: false
    });

    // If Zlema1 is enabled, show additional ZLEMA candlesticks
    if (strategyToggles?.zlema1 === true) {
      all_candles.slice(1).forEach((candle, index) => {
        data.push({
          type: 'candlestick',
          x: xAxis,
          open: candle[0],
          high: candle[2],
          low: candle[3],
          close: candle[1],
          opacity: 0.1, // Additional ZLEMA candlesticks more transparent
          xaxis: 'x',
          yaxis: 'y',
          layer: 'above',
          showlegend: false
        });
      });
    }
  }

  // Add close price line with conditional coloring based on median (only for Zlema1)
  if (strategyToggles?.zlema1 === true && !isZeroLag && medians && all_candles[0][1]) {
    const closePrices = all_candles[0][1];
    const greenSegments = [];
    const redSegments = [];

    for (let i = 0; i < closePrices.length; i++) {
      if (closePrices[i] > medians[i]) {
        greenSegments.push(closePrices[i]);
        redSegments.push(null);
      } else {
        greenSegments.push(null);
        redSegments.push(closePrices[i]);
      }
    }

    // Add green segments (above median)
    data.push({
      type: 'scatter',
      mode: 'lines',
      y: greenSegments,
      line: { color: 'green', width: 4 },
      opacity: 0.5,
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above', // Ensure this is above key levels
      showlegend: false
    });

    // Add red segments (below median)
    data.push({
      type: 'scatter',
      mode: 'lines',
      y: redSegments,
      line: { color: 'red', width: 4 },
      opacity: 0.5,
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above', // Ensure this is above key levels
      showlegend: false
    });

    // Add arrows for ZLEMA color changes
    const arrowUpX = [], arrowUpY = [];
    const arrowDownX = [], arrowDownY = [];

    for (let i = 1; i < closePrices.length; i++) {
      const prevIsGreen = closePrices[i - 1] > medians[i - 1];
      const currIsGreen = closePrices[i] > medians[i];

      // Red to Green transition (bullish) - green up arrow at candle low (buy signal)
      if (!prevIsGreen && currIsGreen) {
        arrowUpX.push(i);
        arrowUpY.push(all_candles[0][3][i]); // Use candle low for buy
      }

      // Green to Red transition (bearish) - red down arrow at candle high (sell signal)
      if (prevIsGreen && !currIsGreen) {
        arrowDownX.push(i);
        arrowDownY.push(all_candles[0][2][i]); // Use candle high for sell
      }
    }

    // Add green up arrows (bullish signals)
    if (arrowUpX.length > 0) {
      data.push({
        type: 'scatter',
        mode: 'markers',
        x: arrowUpX,
        y: arrowUpY,
        marker: {
          symbol: 'triangle-up',
          size: 30,
          color: 'green'
        },
        xaxis: 'x',
        yaxis: 'y',
        layer: 'above',
        showlegend: false
      });
    }

    // Add red down arrows (bearish signals)
    if (arrowDownX.length > 0) {
      data.push({
        type: 'scatter',
        mode: 'markers',
        x: arrowDownX,
        y: arrowDownY,
        marker: {
          symbol: 'triangle-down',
          size: 30,
          color: 'red'
        },
        xaxis: 'x',
        yaxis: 'y',
        layer: 'above',
        showlegend: false
      });
    }
  }

  // Add median line (only for Zlema1)
  if (strategyToggles?.zlema1 === true && !isZeroLag && medians) {
    data.push({
      type: 'scatter',
      mode: 'lines',
      y: medians,
      line: { color: 'white', width: 2, dash: 'dash' },
      opacity: 0.2,
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above', // Ensure this is above key levels
      showlegend: false
    });
  }

  // Zero-Lag overlay (if provided by backend)
  if (marketData.zl) {
    const { zlema, upper_band, lower_band, trend, bull_entry_level, bear_entry_level, trend_up_level, trend_down_level } = marketData.zl;

    // Main ZLEMA line (always visible)
    data.push({
      type: 'scatter',
      mode: 'lines',
      x: xAxis,
      y: zlema,
      line: { color: 'rgba(255,255,255,0.8)', width: 2 },
      xaxis: 'x',
      yaxis: 'y',
      name: 'ZLEMA'
    });

    // Upper and lower bands (always show both)
    data.push({
      type: 'scatter',
      mode: 'lines',
      x: xAxis,
      y: upper_band,
      line: { color: 'rgba(255,17,0,0.5)', width: 1, dash: 'dot' },
      xaxis: 'x',
      yaxis: 'y',
      name: 'Upper Band'
    });
    data.push({
      type: 'scatter',
      mode: 'lines',
      x: xAxis,
      y: lower_band,
      line: { color: 'rgba(0,255,187,0.5)', width: 1, dash: 'dot' },
      xaxis: 'x',
      yaxis: 'y',
      name: 'Lower Band'
    });

    // Trend Change Markers (BIG arrows - size.small in Pine)
    const trendBullX = [], trendBullY = [];
    const trendBearX = [], trendBearY = [];
    for (let i = 0; i < zlema.length; i++) {
      if (trend_up_level[i] !== null && Number.isFinite(trend_up_level[i])) {
        trendBullX.push(i);
        trendBullY.push(trend_up_level[i]);
      }
      if (trend_down_level[i] !== null && Number.isFinite(trend_down_level[i])) {
        trendBearX.push(i);
        trendBearY.push(trend_down_level[i]);
      }
    }

    if (trendBullX.length > 0) {
      data.push({
        type: 'scatter',
        mode: 'markers',
        x: trendBullX,
        y: trendBullY,
        marker: { color: 'rgba(0,255,187,1.0)', size: 16, symbol: 'triangle-up' },
        xaxis: 'x',
        yaxis: 'y',
        name: 'Bullish Trend Change'
      });
    }

    if (trendBearX.length > 0) {
      data.push({
        type: 'scatter',
        mode: 'markers',
        x: trendBearX,
        y: trendBearY,
        marker: { color: 'rgba(255,17,0,1.0)', size: 16, symbol: 'triangle-down' },
        xaxis: 'x',
        yaxis: 'y',
        name: 'Bearish Trend Change'
      });
    }

    // Entry markers (small arrows - size.tiny in Pine)
    const bullX = [], bullY = [];
    const bearX = [], bearY = [];
    for (let i = 0; i < zlema.length; i++) {
      if (bull_entry_level[i] !== null && Number.isFinite(bull_entry_level[i])) {
        bullX.push(i);
        bullY.push(bull_entry_level[i]);
      }
      if (bear_entry_level[i] !== null && Number.isFinite(bear_entry_level[i])) {
        bearX.push(i);
        bearY.push(bear_entry_level[i]);
      }
    }

    if (bullX.length > 0) {
      data.push({
        type: 'scatter',
        mode: 'markers',
        x: bullX,
        y: bullY,
        marker: { color: 'rgba(0,255,187,0.8)', size: 8, symbol: 'triangle-up' },
        xaxis: 'x',
        yaxis: 'y',
        name: 'Bull Entry'
      });
    }

    if (bearX.length > 0) {
      data.push({
        type: 'scatter',
        mode: 'markers',
        x: bearX,
        y: bearY,
        marker: { color: 'rgba(255,17,0,0.8)', size: 8, symbol: 'triangle-down' },
        xaxis: 'x',
        yaxis: 'y',
        name: 'Bear Entry'
      });
    }
  }

  // Add polynomial predictions
  if (polynomialPredictions && polynomialPredictions.predictions) {
    const { predictions, recent_medians, r_squared } = polynomialPredictions;
    const currentLength = xAxis.length;

    // Create x-axis for predictions (starting from the last median point)
    // The median line uses default x-axis (0, 1, 2, ...), so we need to align with that
    const predictionX = Array.from({ length: predictions.length }, (_, i) => currentLength - 1 + i);

    // Plot polynomial predictions as white dashed line (same as median line)
    data.push({
      type: 'scatter',
      mode: 'lines',
      x: predictionX,
      y: predictions,
      line: { color: 'white', width: 2, dash: 'dash' },
      opacity: 0.2,
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above',
      showlegend: false
    });

    // Add R² text label at the last prediction point
    data.push({
      type: 'scatter',
      mode: 'text',
      x: [predictionX[predictionX.length - 1]],
      y: [predictions[predictions.length - 1]],
      text: [Math.round(r_squared * 100)],
      textposition: 'top right',
      textfont: { color: 'white', size: 10 },
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above',
      showlegend: false
    });
  }



  // Helper function to get color based on level type
  const getLevelColor = (type) => {
    switch (type) {
      case 'support': return '#00ff00'; // Green
      case 'resistance': return '#ff0000'; // Red
      case 'volume': return '#ffff00'; // Yellow
      case 'fibonacci': return '#00ffff'; // Cyan
      case 'pivots': return '#ff00ff'; // Magenta
      default: return '#ffffff'; // White
    }
  };

  // Add key levels as horizontal lines (behind main plot)
  if (keyLevels && keyLevels.key_levels && keyLevels.key_levels.levels && Array.isArray(keyLevels.key_levels.levels)) {
    const levels = keyLevels.key_levels.levels;
    console.log('Processing key levels:', levels);

    levels.forEach((level, index) => {
      // Check if level has required properties
      if (!level || typeof level.type !== 'string' || typeof level.price !== 'number') {
        console.log('Skipping invalid level:', level);
        return;
      }

      // Check if this level type should be displayed
      if (!defaultOverlaySettings[level.type]) {
        console.log('Skipping disabled level type:', level.type);
        return;
      }

      const color = getLevelColor(level.type);
      const dash = level.type === 'fibonacci' ? 'dot' : 'solid';

      // Ensure xAxis has valid length
      if (xAxis && xAxis.length > 0) {
        console.log(`Adding ${level.type} level at price ${level.price} with color ${color}`);

        // Add to key levels data array (plotted first, behind everything)
        keyLevelsData.push({
          type: 'scatter',
          mode: 'lines',
          x: [0, xAxis.length - 1],
          y: [level.price, level.price],
          line: {
            color: color,
            width: 3, // Increased width for better visibility
            dash: dash
          },
          opacity: 0.3, // Decreased opacity for subtle background appearance
          xaxis: 'x',
          yaxis: 'y',
          name: `${level.type} (${level.price.toFixed(4)})`,
          showlegend: false,
          layer: 'below', // Ensure this is plotted behind everything
          zorder: -10 // Explicit z-index to put behind other elements
        });
      }
    });
  } else {
    console.log('Key levels data missing or invalid:', keyLevels);
  }

  // Add additional levels from other sources (pivots, fibonacci, etc.)
  if (keyLevels && keyLevels.key_levels && xAxis && xAxis.length > 0) {
    const keyLevelsObj = keyLevels.key_levels;

    // Add pivot levels if enabled (Standard pivots)
    if (defaultOverlaySettings.pivots && keyLevelsObj.pivots) {
      const pivots = keyLevelsObj.pivots;
      const pivotKeys = ['pivot', 'r1', 'r2', 'r3', 's1', 's2', 's3'];

      pivotKeys.forEach(key => {
        if (pivots[key] && typeof pivots[key] === 'number') {
          console.log(`Adding standard pivot ${key} at price ${pivots[key]}`);
          keyLevelsData.push({
            type: 'scatter',
            mode: 'lines',
            x: [0, xAxis.length - 1],
            y: [pivots[key], pivots[key]],
            line: {
              color: '#ff00ff', // Magenta for standard pivots
              width: 2, // Increased width
              dash: 'dash'
            },
            opacity: 0.4, // Decreased opacity for background
            xaxis: 'x',
            yaxis: 'y',
            name: `${key.toUpperCase()} (${pivots[key].toFixed(4)})`,
            showlegend: false,
            layer: 'below',
            zorder: -5 // Behind main elements but in front of S/R
          });
        }
      });
    }

    // Add Fibonacci pivot levels if enabled
    if (defaultOverlaySettings.pivots && keyLevelsObj.pivots_fibonacci) {
      const fibPivots = keyLevelsObj.pivots_fibonacci;
      const fibPivotKeys = ['pivot', 'r1', 'r2', 'r3', 's1', 's2', 's3'];

      fibPivotKeys.forEach(key => {
        if (fibPivots[key] && typeof fibPivots[key] === 'number') {
          console.log(`Adding fibonacci pivot ${key} at price ${fibPivots[key]}`);
          keyLevelsData.push({
            type: 'scatter',
            mode: 'lines',
            x: [0, xAxis.length - 1],
            y: [fibPivots[key], fibPivots[key]],
            line: {
              color: '#ff8000', // Orange for fibonacci pivots
              width: 2, // Increased width
              dash: 'dot'
            },
            opacity: 0.3, // Decreased opacity for background
            xaxis: 'x',
            yaxis: 'y',
            name: `FIB-${key.toUpperCase()} (${fibPivots[key].toFixed(4)})`,
            showlegend: false,
            layer: 'below',
            zorder: -6 // Behind main elements
          });
        }
      });
    }

    // Add Camarilla pivot levels if enabled
    if (defaultOverlaySettings.pivots && keyLevelsObj.pivots_camarilla) {
      const camPivots = keyLevelsObj.pivots_camarilla;
      const camKeys = ['pivot', 'h1', 'h2', 'h3', 'h4', 'h5', 'l1', 'l2', 'l3', 'l4', 'l5'];

      camKeys.forEach(key => {
        if (camPivots[key] && typeof camPivots[key] === 'number') {
          console.log(`Adding camarilla pivot ${key} at price ${camPivots[key]}`);
          keyLevelsData.push({
            type: 'scatter',
            mode: 'lines',
            x: [0, xAxis.length - 1],
            y: [camPivots[key], camPivots[key]],
            line: {
              color: '#8000ff', // Purple for camarilla pivots
              width: 2, // Increased width
              dash: 'dashdot'
            },
            opacity: 0.25, // Decreased opacity for background
            xaxis: 'x',
            yaxis: 'y',
            name: `CAM-${key.toUpperCase()} (${camPivots[key].toFixed(4)})`,
            showlegend: false,
            layer: 'below',
            zorder: -7 // Behind main elements
          });
        }
      });
    }

    // Add fibonacci levels if enabled
    if (defaultOverlaySettings.fibonacci && keyLevelsObj.fibonacci) {
      const fib = keyLevelsObj.fibonacci;
      const fibKeys = ['fib_0.236', 'fib_0.382', 'fib_0.5', 'fib_0.618', 'fib_0.786'];

      fibKeys.forEach(key => {
        if (fib[key] && typeof fib[key] === 'number') {
          console.log(`Adding fibonacci ${key} at price ${fib[key]}`);
          keyLevelsData.push({
            type: 'scatter',
            mode: 'lines',
            x: [0, xAxis.length - 1],
            y: [fib[key], fib[key]],
            line: {
              color: '#00ffff', // Cyan for fibonacci
              width: 2, // Increased width
              dash: 'dot'
            },
            opacity: 0.3, // Decreased opacity for background
            xaxis: 'x',
            yaxis: 'y',
            name: `${key} (${fib[key].toFixed(4)})`,
            showlegend: false,
            layer: 'below',
            zorder: -8 // Behind main elements
          });
        }
      });
    }

    // Add volume profile levels if enabled
    if (defaultOverlaySettings.volume && keyLevelsObj.volume_profile && keyLevelsObj.volume_profile.high_volume_levels) {
      const volumeLevels = keyLevelsObj.volume_profile.high_volume_levels;

      volumeLevels.slice(0, 3).forEach((level, index) => { // Only show top 3
        if (typeof level === 'number') {
          console.log(`Adding volume level at price ${level}`);
          keyLevelsData.push({
            type: 'scatter',
            mode: 'lines',
            x: [0, xAxis.length - 1],
            y: [level, level],
            line: {
              color: '#ffff00', // Yellow for volume
              width: 2, // Increased width
              dash: 'solid'
            },
            opacity: 0.3, // Decreased opacity for background
            xaxis: 'x',
            yaxis: 'y',
            name: `Volume Level ${index + 1} (${level.toFixed(4)})`,
            showlegend: false,
            layer: 'below',
            zorder: -9 // Behind main elements
          });
        }
      });
    }
  }

  // Add current price horizontal line if there are open trades
  if (currentPrice && currentPrice.price && xAxis && xAxis.length > 0) {
    keyLevelsData.push({
      type: 'scatter',
      mode: 'lines',
      x: [0, xAxis.length - 1],
      y: [currentPrice.price, currentPrice.price],
      line: {
        color: 'white',
        width: 3, // Increased width
        dash: 'dash'
      },
      opacity: 0.5, // Moderate opacity for current price visibility
      xaxis: 'x',
      yaxis: 'y',
      name: 'Current Price',
      showlegend: false,
      layer: 'below', // Ensure this is plotted behind everything
      zorder: -3 // Higher priority than other levels but behind main chart
    });
  }

  const layout = {
    plot_bgcolor: '#0a0a0a',
    paper_bgcolor: '#0a0a0a',
    font: { color: '#888888', family: 'Poppins, sans-serif' },
    height: window.innerHeight - 64,
    showlegend: false,
    margin: { l: 60, r: 20, t: 20, b: 30 },
    hovermode: false,
    dragmode: false,
    modebar: { remove: true },
    grid: {
      rows: 3,
      columns: 1,
      rowheight: [0.78, 0.11, 0.11],
      pattern: 'independent'
    },
    xaxis: {
      rangeslider: { visible: false },
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: false,
      tickfont: { color: '#888888', size: 10 },
      fixedrange: true,
      range: [0, totalLength + 4]
    },
    yaxis: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#00ff88', size: 10 },
      title: { text: 'Pips', font: { color: '#00ff88', size: 12 } },
      fixedrange: true,
      domain: [0.22, 1],
      tickmode: 'array',
      tickvals: all_candles && all_candles[0] && all_candles[0][1] ?
        (() => {
          const closePrices = all_candles[0][1];
          const currentPrice = closePrices[closePrices.length - 1];
          const minPrice = Math.min(...closePrices);
          const maxPrice = Math.max(...closePrices);
          const numTicks = 8;
          const tickStep = (maxPrice - minPrice) / (numTicks - 1);
          return Array.from({ length: numTicks }, (_, i) => minPrice + (i * tickStep));
        })() : [],
      ticktext: all_candles && all_candles[0] && all_candles[0][1] ?
        (() => {
          const closePrices = all_candles[0][1];
          const currentPrice = closePrices[closePrices.length - 1];
          const minPrice = Math.min(...closePrices);
          const maxPrice = Math.max(...closePrices);
          const numTicks = 8;
          const tickStep = (maxPrice - minPrice) / (numTicks - 1);
          return Array.from({ length: numTicks }, (_, i) => {
            const price = minPrice + (i * tickStep);
            const pipValue = Math.round((price - currentPrice) * 10000);
            return `${pipValue > 0 ? '+' : ''}${pipValue}p`;
          });
        })() : []
    },
    xaxis2: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: false,
      fixedrange: true,
      domain: [0, 1],
      range: [0, totalLength + 4]
    },
    yaxis2: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'RSI', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0.11, 0.21]
    },
    xaxis3: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'Time', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0, 1],
      range: [0, totalLength + 4]
    },
    yaxis3: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'Std Dev', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0, 0.10]
    }
  };



  // Add RSI subplot (row 2)
  if (rsi_data && rsi_data.length > 0) {
    // Plot individual RSI lines in white with low opacity
    rsi_data.forEach((rsi_values, i) => {
      subplotData.push({
        type: 'scatter',
        mode: 'lines',
        x: xAxis,
        y: rsi_values,
        line: { color: 'white', width: 1 },
        opacity: 0.2,
        xaxis: 'x2',
        yaxis: 'y2'
      });
    });

    // Calculate and plot average RSI with conditional coloring
    const rsiLength = rsi_data[0].length;
    const averageRsi = [];

    for (let i = 0; i < rsiLength; i++) {
      const sum = rsi_data.reduce((acc, rsi_values) => acc + rsi_values[i], 0);
      const avg = sum / rsi_data.length;
      averageRsi.push(avg);
    }

    // Split average RSI into green and red segments
    const greenSegments = [];
    const redSegments = [];

    for (let i = 0; i < averageRsi.length; i++) {
      if (averageRsi[i] > 50) {
        greenSegments.push(averageRsi[i]);
        redSegments.push(null);
      } else {
        greenSegments.push(null);
        redSegments.push(averageRsi[i]);
      }
    }

    // Add green segments
    subplotData.push({
      type: 'scatter',
      mode: 'lines',
      x: xAxis,
      y: greenSegments,
      line: {
        color: 'green',
        width: 3
      },
      opacity: 0.8,
      xaxis: 'x2',
      yaxis: 'y2',
      name: 'Average RSI (Bullish)',
      showlegend: false
    });

    // Add red segments
    subplotData.push({
      type: 'scatter',
      mode: 'lines',
      x: xAxis,
      y: redSegments,
      line: {
        color: 'red',
        width: 3
      },
      opacity: 0.8,
      xaxis: 'x2',
      yaxis: 'y2',
      name: 'Average RSI (Bearish)',
      showlegend: false
    });
  }

  // Add standard deviation subplot (row 3) with conditional coloring
  if (std_devs && std_devs.length > 0) {
    // Create color array based on increase/decrease from previous bar
    const barColors = std_devs.map((value, index) => {
      if (index === 0) {
        return 'white'; // First bar is white (no comparison)
      }
      return value > std_devs[index - 1] ? 'green' : 'red';
    });

    subplotData.push({
      type: 'bar',
      x: xAxis,
      y: std_devs,
      marker: {
        color: barColors,
        opacity: 0.6 // Increased opacity to better see the colors
      },
      xaxis: 'x3',
      yaxis: 'y3',
      showlegend: false
    });
  }

  // Combine data with key levels first (behind everything), then candlesticks, then indicators
  const combinedData = [...keyLevelsData, ...data, ...subplotData];

  console.log('Main data:', data);
  console.log('Subplot data:', subplotData);
  console.log('Combined data:', combinedData);
  console.log('Layout:', layout);

  return (
    <Box>
      <Plot
        data={combinedData}
        layout={layout}
        config={{
          displayModeBar: false,
          responsive: true,
          staticPlot: false,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
          displaylogo: false
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        onError={(error) => console.error('Plotly error:', error)}
      />
    </Box>
  );
};

export default TradingChart; 