import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import { TrendingUp, TrendingDown, Schedule } from '@mui/icons-material';
import axios from 'axios';

const MarketStatus = () => {
    const [marketStatus, setMarketStatus] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [countdown, setCountdown] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarketStatus();

        // Update market status every 30 seconds
        const statusInterval = setInterval(() => {
            fetchMarketStatus();
        }, 30000);

        // Update time and countdown every second
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
            if (marketStatus?.seconds_to_next) {
                setCountdown(prev => Math.max(0, prev - 1));
            }
        }, 1000);

        return () => {
            clearInterval(statusInterval);
            clearInterval(timeInterval);
        };
    }, [marketStatus?.seconds_to_next]);

    const fetchMarketStatus = async () => {
        try {
            const response = await axios.get('/api/market-status');
            setMarketStatus(response.data);
            setCountdown(response.data.seconds_to_next || 0);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch market status:', error);
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCountdown = (seconds) => {
        if (seconds <= 0) return "00:00:00";

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Loading market status...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Current Time & Date - Single Line */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#00ff88' }}>
                    {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {formatDate(currentTime)}
                </Typography>
            </Box>

            {/* Forex Session with Countdown - Single Line */}
            {marketStatus && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '320px', // Slightly wider for single line
                    minWidth: '320px',
                    px: 2,
                    py: 0.5 // Reduced padding for compact height
                }}>
                    <Typography sx={{
                        color: '#00ff88',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                    }}>
                        {marketStatus.current_session} • {marketStatus.next_session} in {formatCountdown(countdown)}
                    </Typography>
                </Box>
            )}


        </Box>
    );
};

export default MarketStatus;
