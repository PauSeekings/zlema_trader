// Returns Plotly trace array for ribbons
const RibbonChart = ({ candles, xAxis, opacity = 0.2 }) => {
    if (!candles || candles.length === 0) return [];

    const ribbonData = [];
    const [opens, closes] = candles;

    // Render ribbons between open and close prices
    for (let i = 0; i < opens.length - 1; i++) {
        const currentBullish = closes[i] >= opens[i];
        const color = currentBullish ?
            `rgba(0,255,0,${opacity})` :
            `rgba(255,0,0,${opacity})`;

        const segmentX = [xAxis[i], xAxis[i + 1]];
        const segmentOpen = [opens[i], opens[i + 1]];
        const segmentClose = [closes[i], closes[i + 1]];

        // Plot open prices (invisible baseline)
        ribbonData.push({
            type: 'scatter',
            mode: 'lines',
            x: segmentX,
            y: segmentOpen,
            line: { color: 'transparent' },
            xaxis: 'x',
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        });

        // Plot close prices with fill
        ribbonData.push({
            type: 'scatter',
            mode: 'lines',
            x: segmentX,
            y: segmentClose,
            fill: 'tonexty',
            fillcolor: color,
            line: { color: 'transparent' },
            xaxis: 'x',
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        });
    }

    return ribbonData;
};

export default RibbonChart;
