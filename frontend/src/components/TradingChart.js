import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const TradingChart = ({ marketData }) => {
  if (!marketData || !marketData.all_candles) {
    return <Typography>Loading chart...</Typography>;
  }

  console.log('Market data received:', marketData);
  const { all_candles, std_devs, medians, rsi_data, eff_data } = marketData;

  // Create subplots: 4 rows, shared x-axis
  const subplotData = [];
  const xAxis = Array.from({ length: all_candles[0][0].length }, (_, i) => i);

  // Plot all candlesticks from all_candles
  all_candles.forEach((candle, index) => {
    const opacity = index === 0 ? 0.5 : 0.1; // Main data more visible
    subplotData.push({
      type: 'candlestick',
      x: xAxis,
      open: candle[0],
      high: candle[2],
      low: candle[3],
      close: candle[1],
      opacity: opacity,
      xaxis: 'x',
      yaxis: 'y'
    });
  });

  // Add close price line
  subplotData.push({
    type: 'scatter',
    mode: 'lines',
    y: all_candles[0][1],
    line: { color: 'white', width: 4 },
    opacity: 0.5,
    xaxis: 'x',
    yaxis: 'y'
  });

  // Add median line
  if (medians) {
    subplotData.push({
      type: 'scatter',
      mode: 'lines',
      y: medians,
      line: { color: 'yellow', width: 2, dash: 'dash' },
      opacity: 0.7,
      xaxis: 'x',
      yaxis: 'y'
    });
  }

  const layout = {
    plot_bgcolor: '#0a0a0a',
    paper_bgcolor: '#0a0a0a',
    font: { color: '#888888', family: 'Poppins, sans-serif' },
    height: window.innerHeight - 100,
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
      title: { text: 'Time', font: { color: '#888888', size: 12 } },
      fixedrange: true
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
      domain: [0, 1]
    },
    yaxis2: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'Efficiency', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0.23, 0.33]
    },
    xaxis3: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: false,
      fixedrange: true,
      domain: [0, 1]
    },
    yaxis3: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'Std Dev', font: { color: '#888888', size: 10 } },
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
      domain: [0, 1]
    },
    yaxis4: {
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#888888', size: 8 },
      title: { text: 'RSI', font: { color: '#888888', size: 10 } },
      fixedrange: true,
      domain: [0, 0.11]
    }
  };

  // Add efficiency subplot (row 2)
  if (eff_data && eff_data.length > 0) {
    // Plot individual efficiency lines in white with low opacity
    eff_data.forEach((eff_values, i) => {
      subplotData.push({
        type: 'scatter',
        mode: 'lines',
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

  // Add standard deviation subplot (row 3)
  if (std_devs && std_devs.length > 0) {
    subplotData.push({
      type: 'bar',
      y: std_devs,
      marker: {
        color: 'white',
        opacity: 0.2
      },
      xaxis: 'x3',
      yaxis: 'y3'
    });
  }

  // Add RSI subplot (row 4)
  if (rsi_data && rsi_data.length > 0) {
    // Plot individual RSI lines in white with low opacity
    rsi_data.forEach((rsi_values, i) => {
      subplotData.push({
        type: 'scatter',
        mode: 'lines',
        y: rsi_values,
        line: { color: 'white', width: 1 },
        opacity: 0.2,
        xaxis: 'x4',
        yaxis: 'y4'
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
      y: greenSegments,
      line: {
        color: 'green',
        width: 3
      },
      opacity: 0.8,
      xaxis: 'x4',
      yaxis: 'y4',
      name: 'Average RSI (Bullish)',
      showlegend: false
    });

    // Add red segments
    subplotData.push({
      type: 'scatter',
      mode: 'lines',
      y: redSegments,
      line: {
        color: 'red',
        width: 3
      },
      opacity: 0.8,
      xaxis: 'x4',
      yaxis: 'y4',
      name: 'Average RSI (Bearish)',
      showlegend: false
    });
  }

  console.log('Subplot data:', subplotData);
  console.log('Layout:', layout);

  return (
    <Box>
      <Plot
        data={subplotData}
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