import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const TradingChart = ({ marketData }) => {
  if (!marketData || !marketData.candles) {
    return <Typography>Loading chart...</Typography>;
  }

  console.log('Market data received:', marketData);
  const { candles, candles_transformed, ha_zlema_list, zlema_list, std_devs, medians, rsi_data, efficiencies, labels } = marketData;

  // Create subplots: 4 rows, shared x-axis
  const subplotData = [];
  const xAxis = Array.from({ length: candles[0].length }, (_, i) => i);

  // Main candlestick chart (transformed data to match ZLEMA scale)
  subplotData.push({
    type: 'candlestick',
    x: xAxis,
    open: candles_transformed[0],
    high: candles_transformed[2],
    low: candles_transformed[3],
    close: candles_transformed[1],
    opacity: 0.5,
    xaxis: 'x',
    yaxis: 'y'
  });

  // Add HA ZLEMA candlesticks
  ha_zlema_list.forEach((ha_zlema, i) => {
    subplotData.push({
      type: 'candlestick',
      x: xAxis,
      open: ha_zlema[0],
      high: ha_zlema[2],
      low: ha_zlema[3],
      close: ha_zlema[1],
      opacity: 0.1,
      xaxis: 'x',
      yaxis: 'y'
    });
  });

  // Add ZLEMA candlesticks
  zlema_list.forEach((zlema, i) => {
    subplotData.push({
      type: 'candlestick',
      x: xAxis,
      open: zlema[0],
      high: zlema[2],
      low: zlema[3],
      close: zlema[1],
      opacity: 0.1,
      xaxis: 'x',
      yaxis: 'y'
    });
  });

  // Add close price line (using transformed data to match ZLEMA scale)
  subplotData.push({
    type: 'scatter',
    mode: 'lines',
    y: candles_transformed[1],
    line: { color: 'white', width: 4 },
    opacity: 0.5,
    xaxis: 'x',
    yaxis: 'y'
  });

  // Add median line (using transformed data to match ZLEMA scale)
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
      showticklabels: true,
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
  if (efficiencies && efficiencies.length > 0) {
    const avgEff = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
    const allEffs = [...efficiencies, avgEff];
    const allLabels = [...labels, 'Average'];
    const allColors = allEffs.map(v => v > 0 ? 'green' : 'red');
    const allOpacity = allEffs.map(v => Math.min(1, Math.max(0.2, Math.abs(v))));

    subplotData.push({
      type: 'bar',
      x: allLabels,
      y: allEffs,
      marker: {
        color: allColors,
        opacity: allOpacity
      },
      xaxis: 'x2',
      yaxis: 'y2'
    });
  }

  // Add standard deviation subplot (row 3)
  if (std_devs && std_devs.length > 0) {
    subplotData.push({
      type: 'scatter',
      mode: 'lines',
      y: std_devs,
      line: { color: 'cyan', width: 2 },
      opacity: 0.8,
      xaxis: 'x3',
      yaxis: 'y3'
    });
  }

  // Add RSI subplot (row 4)
  if (rsi_data && rsi_data.length > 0) {
    const colors = ['white', 'red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink'];
    rsi_data.forEach((rsi_values, i) => {
      const color = colors[i % colors.length];
      subplotData.push({
        type: 'scatter',
        mode: 'lines',
        y: rsi_values,
        line: { color: color, width: 1 },
        opacity: 0.7,
        xaxis: 'x4',
        yaxis: 'y4'
      });
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