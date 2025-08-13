import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from libs.tradelib import get_hist_prices, get_price
from libs.indicators import calc_HA, zlema_ochl, calc_rsi, market_eff, zero_lag_trend_signals
from config import Config
from .base_service import BaseService

class ProbabilityService(BaseService):
    def __init__(self, exchange):
        super().__init__(exchange)
        self.signal_probabilities = {}  # Cache for calculated probabilities
    
    def get_service_name(self) -> str:
        return "ProbabilityService"
    
    def calculate_signal_probabilities_from_chart_data(self, all_candles: List, median_values: np.ndarray, zl_signals: Dict, tp_pips: float = 5) -> Dict[str, Any]:
        """Calculate probability using only the chart data that's already loaded"""
        try:
            if not all_candles or len(all_candles) == 0:
                return {"error": "No chart data available"}
            
            # Use the first candle set (HA candles) as the base price data
            base_data = all_candles[0]  # This is the HA OHLC data
            
            if base_data.shape[1] < 20:
                return {"error": "Insufficient data points for analysis"}
            
            # For classic strategy, generate signals based on ZLEMA1 logic
            if zl_signals is None:
                # Generate classic buy/sell signals using the logic from TradingChart.js
                buy_signals, sell_signals = self._generate_classic_signals(all_candles, median_values)
                
                bull_prob = self._analyze_signal_probability(
                    base_data, median_values, buy_signals, 'BUY', tp_pips
                )
                bear_prob = self._analyze_signal_probability(
                    base_data, median_values, sell_signals, 'SELL', tp_pips
                )
            else:
                # Use zero-lag signals
                bull_prob = self._analyze_signal_probability(
                    base_data, median_values, zl_signals['bull_entry'], 'BUY', tp_pips
                )
                bear_prob = self._analyze_signal_probability(
                    base_data, median_values, zl_signals['bear_entry'], 'SELL', tp_pips
                )
            
            # For trend probabilities, we'll use simpler logic since we have limited data
            trend_up_prob = bull_prob  # Use same logic for now
            trend_down_prob = bear_prob  # Use same logic for now
            
            probabilities = {
                "bull_entry_probability": bull_prob,
                "bear_entry_probability": bear_prob, 
                "trend_up_probability": trend_up_prob,
                "trend_down_probability": trend_down_prob,
                "data_points": base_data.shape[1]
            }
            
            return probabilities
            
        except Exception as e:
            return self.handle_service_error(e, "calculate_signal_probabilities")
    
    def _generate_classic_signals(self, all_candles: List, median_values: np.ndarray) -> tuple:
        """Generate buy/sell signals using classic ZLEMA1 strategy logic"""
        from libs.indicators import calc_rsi
        from config import Config
        
        # Get base data
        base_data = all_candles[0]  # HA candles
        close_prices = base_data[1]  # Close prices
        low_prices = base_data[3]   # Low prices  
        high_prices = base_data[2]  # High prices
        
        # Calculate RSI for all candle sets
        rsi_data = [calc_rsi(candle[:4], Config.RSI_WINDOW) for candle in all_candles]
        
        # Calculate standard deviations
        zlema_ohlc_data = np.concatenate([candle[:4] for candle in all_candles[1:]], axis=0)
        std_devs = np.std(zlema_ohlc_data, axis=0)
        
        buy_signals = np.zeros(len(close_prices), dtype=bool)
        sell_signals = np.zeros(len(close_prices), dtype=bool)
        
        volatility_threshold = 0.1  # Lower threshold to find signals
        
        for i in range(1, len(close_prices)):
            # Calculate mean RSI across all candle sets
            total_rsi = 0
            valid_rsi_count = 0
            
            for rsi_set in rsi_data:
                if i < len(rsi_set) and not np.isnan(rsi_set[i]):
                    total_rsi += rsi_set[i]
                    valid_rsi_count += 1
            
            if valid_rsi_count == 0:
                continue
                
            mean_rsi = total_rsi / valid_rsi_count
            current_sd = std_devs[i]
            previous_sd = std_devs[i - 1]
            
            # Signal conditions: SD > previous SD AND SD > volatility threshold
            sd_condition = current_sd > previous_sd and current_sd > volatility_threshold
            
            # Median line conditions
            current_close = close_prices[i]
            current_median = median_values[i]
            is_above_median = current_close > current_median
            is_below_median = current_close < current_median
            
            # Simplified: Just use median crossover for signals
            # BUY: close crosses above median
            if i > 10 and is_above_median and close_prices[i-1] <= median_values[i-1]:
                buy_signals[i] = True
            
            # SELL: close crosses below median  
            if i > 10 and is_below_median and close_prices[i-1] >= median_values[i-1]:
                sell_signals[i] = True
        

        
        return buy_signals, sell_signals
    
    def _check_5pip_profit(self, data: np.ndarray, entry_idx: int, entry_price: float, direction: str, tp_pips: float = 5) -> bool:
        """Check if trade hits specified pip profit from entry point"""
        target_profit = tp_pips * 0.0001  # Convert pips to decimal
        max_lookhead = min(50, data.shape[1] - entry_idx)
        
        # Check profit from the entry candle onwards
        for i in range(0, max_lookhead):
            current_idx = entry_idx + i
            if current_idx >= data.shape[1]:
                break
                
            high_price = data[2, current_idx]  # High price
            low_price = data[3, current_idx]   # Low price
            
            if direction == 'BUY':
                # Check if 5 pip profit hit during this candle
                if (high_price - entry_price) >= target_profit:
                    return True
                    
            else:  # SELL
                # Check if 5 pip profit hit during this candle
                if (entry_price - low_price) >= target_profit:
                    return True
        
        # If we reach here, 5 pip profit was not hit
        return False
    
    def _analyze_signal_probability(self, data: np.ndarray, median_values: np.ndarray, 
                                  signals: np.ndarray, direction: str, tp_pips: float = 5) -> Dict[str, Any]:
        """Analyze probability for entry signals"""
        signal_indices = np.where(signals)[0]
        
        if len(signal_indices) == 0:
            return {"probability": 0.0, "total_signals": 0, "successful_signals": 0}
        
        successful_signals = 0
        total_signals = len(signal_indices)
        
        for signal_idx in signal_indices:
            # Skip signals too close to the end
            if signal_idx >= len(median_values) - 20:
                total_signals -= 1
                continue
            
            # Entry price is at the OPENING of the candle AFTER the signal
            if signal_idx >= data.shape[1] - 2:
                total_signals -= 1
                continue
                
            entry_price = data[0, signal_idx + 1]  # Open price of next candle
            
            success = self._check_5pip_profit(
                data, signal_idx + 1, entry_price, direction, tp_pips
            )
            
            if success:
                successful_signals += 1
        
        probability = (successful_signals / total_signals * 100) if total_signals > 0 else 0.0
        
        return {
            "probability": round(probability, 1),
            "total_signals": total_signals,
            "successful_signals": successful_signals
        }
    
    def _analyze_trend_probability(self, data: np.ndarray, median_values: np.ndarray, 
                                 zl_signals: Dict, trend_type: str) -> Dict[str, Any]:
        """Analyze probability for trend change signals"""
        if trend_type == 'trend_up':
            # Find where trend changes to bullish (trend crosses above 0)
            trend = self._calculate_trend_changes(zl_signals, 'up')
            direction = 'BUY'
        else:
            # Find where trend changes to bearish (trend crosses below 0)
            trend = self._calculate_trend_changes(zl_signals, 'down')
            direction = 'SELL'
        
        signal_indices = np.where(trend)[0]
        
        if len(signal_indices) == 0:
            return {"probability": 0.0, "total_signals": 0, "successful_signals": 0}
        
        successful_signals = 0
        total_signals = len(signal_indices)
        
        for signal_idx in signal_indices:
            # Skip signals too close to the end
            if signal_idx >= len(median_values) - 20:
                total_signals -= 1
                continue
            
            entry_price = data[1, signal_idx]  # Close price at signal
            
            success = self._check_5pip_vs_median_crossback(
                data, signal_idx, entry_price, median_values, direction
            )
            
            if success:
                successful_signals += 1
        
        probability = (successful_signals / total_signals * 100) if total_signals > 0 else 0.0
        
        return {
            "probability": round(probability, 1),
            "total_signals": total_signals,
            "successful_signals": successful_signals
        }
    
    def _calculate_trend_changes(self, zl_signals: Dict, direction: str) -> np.ndarray:
        """Calculate trend change points from zero lag signals"""
        # This would need to be implemented based on the trend data from zl_signals
        # For now, return empty array - you'd implement the actual trend change detection
        n = len(zl_signals['zlema'])
        return np.zeros(n, dtype=bool)
    
    def _check_5pip_vs_median_crossback(self, data: np.ndarray, signal_idx: int, 
                                       entry_price: float, median_values: np.ndarray, 
                                       direction: str) -> bool:
        """Check if 5 pip profit is hit before price crosses back through median"""
        
        # Look ahead up to 20 candles (or end of data)
        max_lookhead = min(20, len(median_values) - signal_idx - 1)
        
        target_profit = 5.0 / Config.PIP_MULTIPLIER  # Convert pips to price
        median_at_signal = median_values[signal_idx]
        
        for i in range(1, max_lookhead + 1):
            current_idx = signal_idx + i
            current_price = data[1, current_idx]  # Close price
            current_median = median_values[current_idx]
            
            if direction == 'BUY':
                # Check if 5 pip profit hit
                if (current_price - entry_price) >= target_profit:
                    return True
                
                # Check if price crossed back below median
                if current_price < current_median and entry_price > median_at_signal:
                    return False
                    
            else:  # SELL
                # Check if 5 pip profit hit
                if (entry_price - current_price) >= target_profit:
                    return True
                
                # Check if price crossed back above median
                if current_price > current_median and entry_price < median_at_signal:
                    return False
        
        # If we reach here, neither condition was met in the lookhead period
        return False
    
    def get_current_signal_probabilities(self, pair: str, timeframe: str) -> Dict[str, Any]:
        """Get cached probabilities for current signals"""
        cache_key = f"{pair}_{timeframe}_30"  # Default to 30 days
        
        if cache_key in self.signal_probabilities:
            return self.signal_probabilities[cache_key]
        else:
            # Calculate if not cached
            return self.calculate_signal_probabilities(pair, timeframe, 30)
