import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Tuple
from libs.tradelib import get_price, get_hist_prices
from libs.indicators import calc_HA, zlema_ochl, calc_rsi, market_eff, key_levels_composite
from config import Config

class DataService:
    def __init__(self, exchange):
        self.exchange = exchange
    
    def get_market_data(self, pair: str, timeframe: str, periods: int, window_lengths: List[int]) -> Dict[str, Any]:
        """Get comprehensive market data with indicators"""
        # Get price data and scale to pips
        n_candles = periods + 50
        data = get_price(pair, timeframe, n_candles, self.exchange)
        display_data = data[:, -periods:]
        
        # Scale data to pips
        display_data[:4] = (display_data[:4] - np.mean(display_data[:4])) * Config.PIP_MULTIPLIER
        
        # Calculate indicators
        ha = calc_HA(display_data)
        ha_zlema_list = [zlema_ochl(ha[:4], window) for window in window_lengths]
        zlema_list = [zlema_ochl(display_data[:4], window) for window in window_lengths]
        
        # Calculate RSI and efficiency for all candle data
        all_candles = [display_data] + ha_zlema_list + zlema_list
        rsi_data = [calc_rsi(candle_data[:4], Config.RSI_WINDOW).tolist() for candle_data in all_candles]
        eff_data = [market_eff(candle_data[:4], Config.EFFICIENCY_WINDOW).tolist() for candle_data in all_candles]
        
        # Calculate statistics
        zlema_ohlc_data = np.concatenate([candle[:4] for candle in all_candles[1:]], axis=0)
        
        return {
            "all_candles": [candle.tolist() for candle in all_candles],
            "eff_data": eff_data,
            "std_devs": np.std(zlema_ohlc_data, axis=0).tolist(),
            "medians": np.median(zlema_ohlc_data, axis=0).tolist(),
            "rsi_data": rsi_data,
            "pair": pair,
            "timeframe": timeframe,
            "periods": periods,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_key_levels(self, pair: str, timeframe: str, periods: int, window: int, threshold: float) -> Dict[str, Any]:
        """Get key levels for trading analysis"""
        n_candles = periods + 50
        data = get_price(pair, timeframe, n_candles, self.exchange)
        display_data = data[:, -periods:]
        
        # Extract and scale prices
        prices = display_data[:4]
        volume = display_data[4] if len(display_data) > 4 else np.ones(periods)
        prices_scaled = (prices - np.mean(prices)) * Config.PIP_MULTIPLIER
        
        # Calculate key levels
        threshold_pips = threshold * Config.PIP_MULTIPLIER
        key_levels = key_levels_composite(prices_scaled, volume, window, threshold_pips)
        
        return {
            "key_levels": self._convert_numpy(key_levels),
            "pair": pair,
            "timeframe": timeframe,
            "periods": periods,
            "window": window,
            "threshold": threshold,
            "timestamp": datetime.now().isoformat()
        }
    
    def calculate_indicators_for_backtest(self, data: np.ndarray, window_lengths: List[int]) -> Tuple[List[np.ndarray], List[np.ndarray]]:
        """Calculate indicators for backtesting"""
        data_copy = data.copy()
        data_copy[:4] = (data_copy[:4] - np.mean(data_copy[:4])) * Config.PIP_MULTIPLIER
        ha = calc_HA(data_copy)
        ha_zlema_list = [zlema_ochl(ha, window) for window in window_lengths]
        zlema_list = [zlema_ochl(data_copy, window) for window in window_lengths]
        return ha_zlema_list, zlema_list
    
    @staticmethod
    def _convert_numpy(obj):
        """Convert numpy objects to JSON-serializable types"""
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: DataService._convert_numpy(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [DataService._convert_numpy(item) for item in obj]
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        return obj