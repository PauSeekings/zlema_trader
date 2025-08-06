from datetime import datetime, timedelta
from typing import List, Dict, Any
from libs.tradelib import get_hist_prices
from services.data_service import DataService
from config import Config

class BacktestService:
    def __init__(self, exchange):
        self.exchange = exchange
        self.data_service = DataService(exchange)
    
    def run_backtest(self, pair: str, timeframe: str, days_back: int, scheme: str = "scalp", 
                    target_pips: int = None, stop_loss_pips: int = None) -> Dict[str, Any]:
        """Run a comprehensive backtest"""
        target_pips = target_pips or Config.DEFAULT_TARGET_PIPS
        stop_loss_pips = stop_loss_pips or Config.DEFAULT_STOP_LOSS_PIPS
        
        # Get historical data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        data = get_hist_prices(pair, timeframe, self.exchange, 
                             start=start_date.strftime('%Y-%m-%dT%H:%M:%SZ'), 
                             end=end_date.strftime('%Y-%m-%dT%H:%M:%SZ'))
        
        if data.shape[1] < Config.MIN_BACKTEST_DATA_POINTS:
            raise ValueError("Insufficient historical data for backtesting")
        
        # Calculate indicators
        ha_zlema_list, zlema_list = self.data_service.calculate_indicators_for_backtest(data, Config.DEFAULT_WINDOW_LENGTHS)
        
        # Run backtest strategy
        trades = self._execute_strategy(data, ha_zlema_list, zlema_list, Config.DEFAULT_WINDOW_LENGTHS, 
                                      scheme, target_pips, stop_loss_pips)
        
        # Calculate statistics
        stats = self._calculate_stats(trades)
        
        return {
            "trades": trades,
            "statistics": stats,
            "data_points": data.shape[1],
            "pair": pair,
            "timeframe": timeframe,
            "days_back": days_back,
            "scheme": scheme
        }
    
    def _execute_strategy(self, data, ha_zlema_list, zlema_list, window_lengths, scheme, target_pips, stop_loss_pips) -> List[Dict[str, Any]]:
        """Execute the trading strategy on historical data"""
        # Simplified strategy implementation
        # This is where you would implement your actual trading logic
        trades = []
        
        # Example: Simple momentum strategy (replace with actual logic)
        for i in range(50, data.shape[1] - 10):  # Leave buffer at start and end
            # Your trading logic here
            # For now, returning empty trades list
            pass
        
        return trades
    
    def _calculate_stats(self, trades: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate comprehensive backtest statistics"""
        if not trades:
            return {
                "total_trades": 0,
                "win_rate": 0.0,
                "total_profit": 0.0,
                "avg_profit_per_trade": 0.0,
                "max_drawdown": 0.0,
                "sharpe_ratio": 0.0,
                "profit_factor": 0.0
            }
        
        total_trades = len(trades)
        profits = [trade.get('profit', 0) for trade in trades]
        winning_trades = [p for p in profits if p > 0]
        losing_trades = [p for p in profits if p < 0]
        
        win_rate = (len(winning_trades) / total_trades) * 100
        total_profit = sum(profits)
        avg_profit_per_trade = total_profit / total_trades
        
        # Calculate drawdown
        cumulative_profits = []
        running_total = 0
        for profit in profits:
            running_total += profit
            cumulative_profits.append(running_total)
        
        max_drawdown = self._calculate_max_drawdown(cumulative_profits)
        
        # Calculate profit factor
        gross_profit = sum(winning_trades) if winning_trades else 0
        gross_loss = abs(sum(losing_trades)) if losing_trades else 1  # Avoid division by zero
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        # Simplified Sharpe ratio (would need risk-free rate for proper calculation)
        sharpe_ratio = self._calculate_sharpe_ratio(profits)
        
        return {
            "total_trades": total_trades,
            "win_rate": round(win_rate, 2),
            "total_profit": round(total_profit, 2),
            "avg_profit_per_trade": round(avg_profit_per_trade, 2),
            "max_drawdown": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "profit_factor": round(profit_factor, 2),
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades)
        }
    
    @staticmethod
    def _calculate_max_drawdown(cumulative_profits: List[float]) -> float:
        """Calculate maximum drawdown"""
        if not cumulative_profits:
            return 0.0
        
        peak = cumulative_profits[0]
        max_drawdown = 0.0
        
        for profit in cumulative_profits:
            if profit > peak:
                peak = profit
            drawdown = peak - profit
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        return max_drawdown
    
    @staticmethod
    def _calculate_sharpe_ratio(profits: List[float]) -> float:
        """Calculate simplified Sharpe ratio"""
        if not profits or len(profits) < 2:
            return 0.0
        
        import numpy as np
        mean_return = np.mean(profits)
        std_return = np.std(profits)
        
        return mean_return / std_return if std_return > 0 else 0.0