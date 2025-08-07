import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const TradingChart = ({ marketData, keyLevels, polynomialPredictions, overlaySettings }) => {
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

  // Plot all candlesticks from all_candles (main plot)
  all_candles.forEach((candle, index) => {
    const opacity = index === 0 ? 0.5 : 0.1; // Main data more visible
    data.push({
      type: 'candlestick',
      x: xAxis,
      open: candle[0],
      high: candle[2],
      low: candle[3],
      close: candle[1],
      opacity: opacity,
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above' // Ensure candlesticks are above key levels
    });
  });

  // Add close price line with conditional coloring based on median
  if (medians && all_candles[0][1]) {
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
      layer: 'above' // Ensure this is above key levels
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
      layer: 'above' // Ensure this is above key levels
    });
  }

  // Add median line
  if (medians) {
    data.push({
      type: 'scatter',
      mode: 'lines',
      y: medians,
      line: { color: 'white', width: 2, dash: 'dash' },
      opacity: 0.2,
      xaxis: 'x',
      yaxis: 'y',
      layer: 'above' // Ensure this is above key levels
    });
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
      text: [`R²=${r_squared.toFixed(3)}`],
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

    levels.forEach((level, index) => {
      // Check if level has required properties
      if (!level || typeof level.type !== 'string' || typeof level.price !== 'number') {
        return;
      }

      // Check if this level type should be displayed
      if (!defaultOverlaySettings[level.type]) return;

      const color = getLevelColor(level.type);
      const dash = level.type === 'fibonacci' ? 'dot' : 'solid';

      // Ensure xAxis has valid length
      if (xAxis && xAxis.length > 0) {
        // Add to key levels data array (plotted first, behind everything)
        keyLevelsData.push({
          type: 'scatter',
          mode: 'lines',
          x: [0, xAxis.length - 1],
          y: [level.price, level.price],
          line: {
            color: color,
            width: 2,
            dash: dash
          },
          opacity: 0.5, // 50% opacity
          xaxis: 'x',
          yaxis: 'y',
          name: `${level.type} (${level.price.toFixed(4)})`,
          showlegend: false,
          layer: 'below' // Ensure this is plotted behind everything
        });
      }
    });
  }

  const layout = {
    plot_bgcolor: '#0a0a0a',
    paper_bgcolor: '#0a0a0a',
    font: { color: '#888888', family: 'Poppins, sans-serif' },
    height: window.innerHeight - 64,
    showlegend: false,
    margin: { l: 50, r: 20, t: 20, b: 30 },
    hovermode: false,
    dragmode: false,
    modebar: { remove: true },
    grid: {
      rows: 4,
      columns: 1,
      rowheight: [0.66, 0.11, 0.11, 0.12],
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
      range: [0, totalLength - 1]
    },
    yaxis: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 10 },
      title: { text: 'Price (Pips)', font: { color: '#888888', size: 12 } },
      fixedrange: true,
      domain: [0.34, 1]
    },
    xaxis2: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: false,
      fixedrange: true,
      domain: [0, 1],
      range: [0, totalLength - 1]
    },
    yaxis2: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'Efficiency', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0.23, 0.33],
      range: [-1.0, 1.0]
    },
    xaxis3: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: false,
      fixedrange: true,
      domain: [0, 1],
      range: [0, totalLength - 1]
    },
    yaxis3: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'RSI', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0.12, 0.22]
    },
    xaxis4: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'Time', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0, 1],
      range: [0, totalLength - 1]
    },
    yaxis4: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'Std Dev', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0, 0.11]
    }
  };

  // Add efficiency subplot (row 2)
  console.log('Efficiency data:', eff_data);
  if (eff_data && eff_data.length > 0) {
    // Plot individual efficiency lines in white with low opacity
    eff_data.forEach((eff_values, i) => {
      subplotData.push({
        type: 'scatter',
        mode: 'lines',
        x: xAxis,
        y: eff_values,
        line: { color: 'white', width: 1 },
        opacity: 0.2,
        xaxis: 'x2',
        yaxis: 'y2'
      });
    });

    // Calculate and plot average efficiency with conditional coloring
    const effLength = eff_data[0].length;
    const averageEff = [];

    for (let i = 0; i < effLength; i++) {
      const sum = eff_data.reduce((acc, eff_values) => acc + eff_values[i], 0);
      const avg = sum / eff_data.length;
      averageEff.push(avg);
    }

    // Split average efficiency into green and red segments
    const greenSegments = [];
    const redSegments = [];

    for (let i = 0; i < averageEff.length; i++) {
      if (averageEff[i] > 0) {
        greenSegments.push(averageEff[i]);
        redSegments.push(null);
      } else {
        greenSegments.push(null);
        redSegments.push(averageEff[i]);
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
      name: 'Average Efficiency (Positive)',
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
      name: 'Average Efficiency (Negative)',
      showlegend: false
    });
  }

  // Add RSI subplot (row 3)
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
        xaxis: 'x3',
        yaxis: 'y3'
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
      xaxis: 'x3',
      yaxis: 'y3',
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
      xaxis: 'x3',
      yaxis: 'y3',
      name: 'Average RSI (Bearish)',
      showlegend: false
    });
  }

  // Add standard deviation subplot (row 4)
  if (std_devs && std_devs.length > 0) {
    subplotData.push({
      type: 'bar',
      x: xAxis,
      y: std_devs,
      marker: {
        color: 'white',
        opacity: 0.2
      },
      xaxis: 'x4',
      yaxis: 'y4'
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