// Returns Plotly trace array for candlesticks
const CandlestickChart = ({ candles, xAxis }) => {
    if (!candles || candles.length === 0) return [];

    const [opens, closes, highs, lows] = candles;
    const candlestickData = [];

    // Plot wicks first (behind candle bodies)
    for (let i = 0; i < opens.length; i++) {
        candlestickData.push({
            type: 'scatter',
            mode: 'lines',
            x: [xAxis[i], xAxis[i]],
            y: [lows[i], highs[i]],
            line: { color: 'rgba(150,150,150,0.6)', width: 1 },
            xaxis: 'x',
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        });
    }

    // Plot hollow bodies
    for (let i = 0; i < opens.length; i++) {
        const isBullish = closes[i] >= opens[i];
        const bodyColor = isBullish ? 'rgba(100,255,100,0.5)' : 'rgba(255,100,100,0.5)';
        const bodyTop = Math.max(opens[i], closes[i]);
        const bodyBottom = Math.min(opens[i], closes[i]);

        const candleWidth = 0.4;
        candlestickData.push({
            type: 'scatter',
            mode: 'lines',
            x: [xAxis[i] - candleWidth, xAxis[i] + candleWidth, xAxis[i] + candleWidth, xAxis[i] - candleWidth, xAxis[i] - candleWidth],
            y: [bodyBottom, bodyBottom, bodyTop, bodyTop, bodyBottom],
            line: { color: bodyColor, width: 1 },
            xaxis: 'x',
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        });
    }

    return candlestickData;
};

export default CandlestickChart;
