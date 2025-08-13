import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Tuple
from libs.tradelib import get_price, get_hist_prices
from libs.indicators import calc_HA, zlema_ochl, calc_rsi, market_eff, key_levels_composite, zero_lag_trend_signals
from config import Config

class DataService:
    def __init__(self, exchange):
        self.exchange = exchange
    
    def get_market_data(self, pair: str, timeframe: str, periods: int, window_lengths: List[int], strategy: str = "classic", zl_length: int = 12) -> Dict[str, Any]:
        """Get comprehensive market data with indicators"""
        # Get price data and scale to pips
        n_candles = periods + 50
        data = get_price(pair, timeframe, n_candles, self.exchange)
        display_data = data[:, -periods:]
        
        # Keep raw price data (no scaling)
        
        # Calculate indicators
        ha = calc_HA(display_data)
        ha_zlema_list = [zlema_ochl(ha[:4], window) for window in window_lengths]
        zlema_list = [zlema_ochl(display_data[:4], window) for window in window_lengths]
        
        # Calculate RSI and efficiency for all candle data
        all_candles =  [ ha ]+ ha_zlema_list + zlema_list
        rsi_data = [calc_rsi(candle_data[:4], Config.RSI_WINDOW).tolist() for candle_data in all_candles]
        eff_data = [market_eff(candle_data[:4], Config.EFFICIENCY_WINDOW).tolist() for candle_data in all_candles]
        
        # Calculate statistics
        zlema_ohlc_data = np.concatenate([candle[:4] for candle in all_candles[1:]], axis=0)
        median_values = np.median(zlema_ohlc_data, axis=0)
        
        response = {
            "all_candles": [candle.tolist() for candle in all_candles],
            "eff_data": eff_data,
            "std_devs": np.std(zlema_ohlc_data, axis=0).tolist(),
            "medians": median_values.tolist(),
            "rsi_data": rsi_data,
            "pair": pair,
            "timeframe": timeframe,
            "periods": periods,
            "timestamp": datetime.now().isoformat()
        }

        # Optional Zero-Lag strategy overlay
        if strategy and strategy.lower() == "zero_lag":
            ochl = display_data[[0,1,2,3], :]  # [Open, Close, High, Low]
            zl = zero_lag_trend_signals(ochl, length=zl_length, mult=1.2)
            # Convert numpy to lists for JSON, handle special values
            response["zl"] = {}
            for k, v in zl.items():
                if isinstance(v, np.ndarray):
                    if v.dtype == bool:
                        response["zl"][k] = v.astype(int).tolist()  # Convert bool to int
                    else:
                        # Replace NaN/inf with None for JSON compatibility
                        v_clean = np.where(np.isfinite(v), v, None)
                        response["zl"][k] = v_clean.tolist()
                else:
                    response["zl"][k] = v

        return response
    
    def get_polynomial_predictions(self, pair: str, timeframe: str, periods: int, 
                                 lookback: int = 20, forecast_periods: int = 5, 
                                 degree: int = 2, median_values: np.ndarray = None) -> Dict[str, Any]:
        """Calculate polynomial predictions using median values from all ZLEMA candles"""
        # Use provided median values or calculate them
        if median_values is None:
            # Fallback: calculate median values if not provided
            n_candles = periods + 50
            data = get_price(pair, timeframe, n_candles, self.exchange)
            display_data = data[:, -periods:]
            
            # Scale data to pips
            display_data[:4] = (display_data[:4] - np.mean(display_data[:4])) * Config.PIP_MULTIPLIER
            
            # Calculate indicators (same as market data)
            ha = calc_HA(display_data)
            ha_zlema_list = [zlema_ochl(ha[:4], window) for window in [3,12,24,36,48]]
            zlema_list = [zlema_ochl(display_data[:4], window) for window in [3,12,24,36,48]]
            
            # Combine all candles (raw + HA ZLEMA + ZLEMA)
            all_candles = [display_data] + ha_zlema_list + zlema_list
            
            # Calculate median across all candles for each time point
            # Extract OHLC data from each candle and stack them
            ohlc_data = []
            for candle in all_candles:
                ohlc_data.append(candle[:4])  # Take OHLC (first 4 rows)
            
            # Stack all OHLC data and calculate median across all candles
            ohlc_array = np.array(ohlc_data)
            # Calculate median across all candles for each time point, then take median of OHLC
            median_values = np.median(ohlc_array, axis=0)  # Shape: (4, periods)
            median_values = np.median(median_values, axis=0)  # Shape: (periods,) - median of OHLC
        
        # Take last lookback median values
        recent_medians = median_values[-lookback:]
        
        # Create x-axis (time points)
        x = np.arange(lookback)
        
        # Fit polynomial
        coefficients = np.polyfit(x, recent_medians, degree)
        poly_func = np.poly1d(coefficients)
        
        # Generate predictions for future periods
        future_x = np.arange(lookback, lookback + forecast_periods)
        predictions = poly_func(future_x)
        
        # Ensure the first prediction connects smoothly with the last median
        # Replace the first prediction with the last median value for perfect connection
        predictions[0] = recent_medians[-1]
        
        # Calculate R-squared for fit quality
        y_fit = poly_func(x)
        ss_res = np.sum((recent_medians - y_fit) ** 2)
        ss_tot = np.sum((recent_medians - np.mean(recent_medians)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        return {
            "recent_medians": recent_medians.tolist(),
            "predictions": predictions.tolist(),
            "coefficients": coefficients.tolist(),
            "r_squared": float(r_squared),
            "degree": degree,
            "lookback": lookback,
            "forecast_periods": forecast_periods,
            "pair": pair,
            "timeframe": timeframe,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_key_levels(self, pair: str, timeframe: str, periods: int, window: int, threshold: float) -> Dict[str, Any]:
        """Get key levels for trading analysis"""
        # Use more data for better level detection
        n_candles = max(periods + 100, 200)  # Ensure we have enough data
        data = get_price(pair, timeframe, n_candles, self.exchange)
        display_data = data[:, -periods:] if periods < n_candles else data
        
        # Extract prices (no scaling)
        prices = display_data[:4]
        volume = display_data[4] if len(display_data) > 4 else np.ones(display_data.shape[1])
        
        # Calculate key levels with optimized parameters
        key_levels = key_levels_composite(prices, volume, max(5, min(window, periods//10)), threshold)
        
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
        # Keep raw price data (no scaling)
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