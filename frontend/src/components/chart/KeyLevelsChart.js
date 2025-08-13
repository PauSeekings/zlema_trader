// Returns Plotly trace array for key levels
const KeyLevelsChart = ({ keyLevels, overlaySettings, xRange }) => {
    if (!keyLevels?.levels || !overlaySettings) return [];

    const keyLevelsData = [];
    const { support = true, resistance = true } = overlaySettings;

    keyLevels.levels.forEach((level, index) => {
        const isSupport = level.type === 'support';
        const isResistance = level.type === 'resistance';

        if ((isSupport && !support) || (isResistance && !resistance)) {
            return;
        }

        const color = isSupport ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)';
        const name = `${level.type.charAt(0).toUpperCase() + level.type.slice(1)} ${level.price.toFixed(4)}`;

        keyLevelsData.push({
            type: 'scatter',
            mode: 'lines',
            x: [xRange[0], xRange[1]],
            y: [level.price, level.price],
            line: {
                color: color,
                width: 1,
                dash: 'dash'
            },
            name: name,
            xaxis: 'x',
            yaxis: 'y',
            showlegend: false,
            hovertemplate: `${name}<br>Confidence: ${(level.confidence * 100).toFixed(0)}%<extra></extra>`
        });
    });

    return keyLevelsData;
};

export default KeyLevelsChart;
