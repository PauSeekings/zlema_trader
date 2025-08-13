import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Button
} from '@mui/material';
import TradingChart from './TradingChartOptimized';
import TradeControls from './TradeControls';
import StrategyTabs from './StrategyTabs';
import AccountStatus from './AccountStatus';
import CollapsibleSidebar from './CollapsibleSidebar';
import { useApiOptimized } from '../hooks/useApiOptimized';
import { useInterval } from '../hooks/useInterval';

const TradingDashboard = memo(({
    tradingParams,
    setTradingParams,
    overlaySettings,
    setOverlaySettings,
    polynomialParams,
    setPolynomialParams,
    strategyToggles,
    setStrategyToggles
}) => {
    // State management - optimized with fewer re-renders
    const [marketData, setMarketData] = useState(null);
    const [keyLevels, setKeyLevels] = useState(null);
    const [polynomialPredictions, setPolynomialPredictions] = useState(null);
    const [trades, setTrades] = useState([]);
    const [accountStatus, setAccountStatus] = useState({});
    const [currentPrice, setCurrentPrice] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

    // Use optimized API hook
    const {
        loading,
        error,
        getMarketData,
        getKeyLevels,
        getAccountStatus,
        getTrades,
        clearCache
    } = useApiOptimized();

    // Memoized fetch function to prevent unnecessary re-renders
    const fetchMarketData = useCallback(async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setIsInitialLoad(true);
            }

            // Fetch market data and key levels in parallel
            const [marketResponse, keyLevelsResponse, accountResponse] = await Promise.all([
                getMarketData({
                    pair: tradingParams.pair,
                    timeframe: tradingParams.timeframe,
                    periods: tradingParams.periods,
                    window_lengths: tradingParams.window_lengths.join(','),
                    strategy: strategyToggles?.zero_lag ? 'zero_lag' : 'classic',
                    zl_length: 70
                }),
                getKeyLevels({
                    pair: tradingParams.pair,
                    timeframe: tradingParams.timeframe,
                    periods: tradingParams.periods,
                    window: 20,
                    threshold: 0.001
                }),
                getAccountStatus()
            ]);

            // Update state efficiently; ignore canceled (null) responses
            if (marketResponse) {
                setMarketData(marketResponse);
                if (marketResponse?.all_candles?.[0]?.[1]) {
                    const closes = marketResponse.all_candles[0][1];
                    setCurrentPrice(closes[closes.length - 1]);
                }
            }
            if (keyLevelsResponse) setKeyLevels(keyLevelsResponse);
            if (accountResponse) setAccountStatus(accountResponse);

            setLastUpdateTime(Date.now());
            if (isInitialLoad && (marketResponse || keyLevelsResponse || accountResponse)) {
                setIsInitialLoad(false);
            }
        } catch (err) {
            console.error('Error fetching market data:', err);
            if (!isAutoRefresh && !marketData) {
                setIsInitialLoad(false);
            }
        }
    }, [
        tradingParams.pair,
        tradingParams.timeframe,
        tradingParams.periods,
        tradingParams.window_lengths,
        strategyToggles?.zero_lag,
        getMarketData,
        getKeyLevels,
        getAccountStatus
    ]);

    // Optimized trades fetch
    const fetchTrades = useCallback(async () => {
        try {
            const tradesResponse = await getTrades();
            setTrades(tradesResponse.open_trades || []);
        } catch (err) {
            console.error('Error fetching trades:', err);
        }
    }, [getTrades]);

    // Initial data load
    useEffect(() => {
        fetchMarketData();
        fetchTrades();
    }, [fetchMarketData, fetchTrades]);

    // Auto-refresh with optimized intervals
    useInterval(() => {
        if (!loading) {
            fetchMarketData(true);
            fetchTrades();
        }
    }, 5000); // 5 second refresh

    // Clear cache when trading params change significantly
    useEffect(() => {
        clearCache();
    }, [tradingParams.pair, tradingParams.timeframe, clearCache]);

    // Loading state
    if (isInitialLoad) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading trading data...
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error && !marketData) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                <Typography variant="h6">Failed to load trading data</Typography>
                <Typography variant="body2">{error}</Typography>
                <Button onClick={() => fetchMarketData()} sx={{ mt: 1 }}>
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, height: '100vh', overflow: 'hidden' }}>
            <Grid container spacing={1} sx={{ height: '100%' }}>
                {/* Sidebar */}
                <Grid item xs={12} md={3} sx={{ height: '100%' }}>
                    <CollapsibleSidebar>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                            {/* Account Status - Memoized */}
                            <Paper sx={{ p: 2, flexShrink: 0 }}>
                                <AccountStatus
                                    accountStatus={accountStatus}
                                    currentPrice={currentPrice}
                                    trades={trades}
                                />
                            </Paper>

                            {/* Trade Controls - Memoized */}
                            <Paper sx={{ p: 2, flexShrink: 0 }}>
                                <TradeControls
                                    tradingParams={tradingParams}
                                    onTrade={(tradeData) => {
                                        // Handle trade placement
                                        console.log('Trade placed:', tradeData);
                                        fetchTrades(); // Refresh trades after placing
                                    }}
                                />
                            </Paper>

                            {/* Strategy Tabs - Memoized */}
                            <Paper sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                                <StrategyTabs
                                    tradingParams={tradingParams}
                                    setTradingParams={setTradingParams}
                                    overlaySettings={overlaySettings}
                                    setOverlaySettings={setOverlaySettings}
                                    polynomialParams={polynomialParams}
                                    setPolynomialParams={setPolynomialParams}
                                    strategyToggles={strategyToggles}
                                    setStrategyToggles={setStrategyToggles}
                                />
                            </Paper>
                        </Box>
                    </CollapsibleSidebar>
                </Grid>

                {/* Main Chart Area */}
                <Grid item xs={12} md={9} sx={{ height: '100%' }}>
                    <Paper sx={{ height: '100%', position: 'relative' }}>
                        {/* Loading overlay */}
                        {loading && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    zIndex: 1000,
                                    p: 1
                                }}
                            >
                                <CircularProgress size={20} />
                            </Box>
                        )}

                        {/* Last update time */}
                        <Typography
                            variant="caption"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                zIndex: 1000,
                                color: 'text.secondary'
                            }}
                        >
                            Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                        </Typography>

                        {/* Trading Chart - Optimized */}
                        <TradingChart
                            marketData={marketData}
                            keyLevels={keyLevels}
                            polynomialPredictions={polynomialPredictions}
                            overlaySettings={overlaySettings}
                            currentPrice={currentPrice}
                            strategyToggles={strategyToggles}
                            tradingParams={tradingParams}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
});

TradingDashboard.displayName = 'TradingDashboard';

export default TradingDashboard;
