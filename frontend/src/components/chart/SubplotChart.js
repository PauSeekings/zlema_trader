// Returns Plotly trace array for RSI and Efficiency subplots
const SubplotChart = ({ rsiData, effData, xAxis }) => {
    if (!rsiData || !effData) return [];

    const subplotData = [];

    // RSI subplot (second row)
    rsiData.forEach((rsi, index) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        subplotData.push({
            type: 'scatter',
            mode: 'lines',
            x: xAxis,
            y: rsi,
            line: { color: colors[index % colors.length], width: 1 },
            name: `RSI ${index + 1}`,
            xaxis: 'x',
            yaxis: 'y2',
            showlegend: false
        });
    });

    // RSI reference lines
    [30, 50, 70].forEach(level => {
        subplotData.push({
            type: 'scatter',
            mode: 'lines',
            x: [xAxis[0], xAxis[xAxis.length - 1]],
            y: [level, level],
            line: { color: 'rgba(128,128,128,0.3)', width: 1, dash: 'dot' },
            xaxis: 'x',
            yaxis: 'y2',
            showlegend: false,
            hoverinfo: 'skip'
        });
    });

    // Efficiency subplot (third row)
    effData.forEach((eff, index) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        subplotData.push({
            type: 'scatter',
            mode: 'lines',
            x: xAxis,
            y: eff,
            line: { color: colors[index % colors.length], width: 1 },
            name: `EFF ${index + 1}`,
            xaxis: 'x',
            yaxis: 'y3',
            showlegend: false
        });
    });

    // Efficiency reference lines
    [-1, 0, 1].forEach(level => {
        subplotData.push({
            type: 'scatter',
            mode: 'lines',
            x: [xAxis[0], xAxis[xAxis.length - 1]],
            y: [level, level],
            line: { color: 'rgba(128,128,128,0.3)', width: 1, dash: 'dot' },
            xaxis: 'x',
            yaxis: 'y3',
            showlegend: false,
            hoverinfo: 'skip'
        });
    });

    return subplotData;
};

export default SubplotChart;
