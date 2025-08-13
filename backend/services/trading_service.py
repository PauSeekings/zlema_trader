import time
from typing import List, Dict, Any, Optional
from libs.tradelib import get_price, put_order, close_trade, get_balance, update_stats_dict
from config import Config
from .base_service import BaseService

class TradingService(BaseService):
    def __init__(self, exchange, account_id):
        super().__init__(exchange)
        self.account_id = account_id
        self.open_trades = []
        self.profit_history = []
        self.account_mode = "test"
    
    def get_service_name(self) -> str:
        return "TradingService"
    
    def get_account_status(self) -> Dict[str, Any]:
        """Get comprehensive account status"""
        account_balance = None
        trading_stats = {}
        
        # Get account balance for real trading
        if self.account_mode != "practice" and self.exchange and self.account_id:
            try:
                account_balance = get_balance(self.exchange, self.account_id)
            except Exception:
                account_balance = 0
        
        # Calculate trading stats
        if self.profit_history:
            try:
                trading_stats = update_stats_dict(self.profit_history)
            except Exception:
                trading_stats = {}
        
        return {
            "account_mode": self.account_mode,
            "account_balance": account_balance,
            "open_trades_count": len(self.open_trades),
            "total_profit": sum(self.profit_history) if self.profit_history else 0,
            "profit_history": self.profit_history[-50:] if self.profit_history else [],
            "total_trades": len(self.profit_history) if self.profit_history else 0,
            "trading_stats": trading_stats
        }
    
    def place_trade(self, pair: str, size: int, direction: str) -> Dict[str, Any]:
        """Place a trade order"""
        if self.account_mode == "practice":
            return self._place_practice_trade(pair, size, direction)
        else:
            return self._place_real_trade(pair, size, direction)
    
    def _place_practice_trade(self, pair: str, size: int, direction: str) -> Dict[str, Any]:
        """Place a simulated practice trade"""
        trade_id = f"practice_{direction.lower()}_{int(time.time())}"
        current_price = get_price(pair, "M5", 1, self.exchange)[1, -1]
        
        self.open_trades.append({
            'trade_id': trade_id,
            'direction': direction,
            'size': size if direction == "BUY" else -size,
            'entry_price': current_price,
            'pair': pair,
            'practice_mode': True,
            'take_profit': 10,  # Default TP value
            'stop_loss': 15     # Default SL value
        })
        
        return {
            "status": "success",
            "trade_id": trade_id,
            "price": current_price,
            "mode": "practice"
        }
    
    def _place_real_trade(self, pair: str, size: int, direction: str) -> Dict[str, Any]:
        """Place a real trade order"""
        units = size if direction == "BUY" else -size
        price, trade_id = put_order(self.exchange, self.account_id, pair, units)
        
        if trade_id:
            self.open_trades.append({
                'trade_id': trade_id,
                'direction': direction,
                'size': size,
                'entry_price': price,
                'pair': pair,
                'take_profit': 10,  # Default TP value
                'stop_loss': 15     # Default SL value
            })
        
        return {
            "status": "success",
            "trade_id": trade_id,
            "price": price,
            "mode": self.account_mode
        }
    
    def get_trades_with_pl(self) -> List[Dict[str, Any]]:
        """Get all open trades with current P&L and check for TP/SL triggers"""
        trades_with_pl = []
        trades_to_close = []
        
        for trade in self.open_trades:
            pl = self._calculate_trade_pl(trade) if not trade.get('practice_mode', False) else 0
            trades_with_pl.append({**trade, "current_pl": pl})
            
            # Check if TP should trigger (profit >= take_profit)
            if pl >= trade.get('take_profit', 10):
                trades_to_close.append((trade['trade_id'], 'TP'))
            
            # Check if SL should trigger (loss >= stop_loss, i.e., P&L <= -stop_loss)
            elif pl <= -trade.get('stop_loss', 15):
                trades_to_close.append((trade['trade_id'], 'SL'))
        
        # Auto-close trades that hit TP or SL
        for trade_id, reason in trades_to_close:
            try:
                self.close_trade(trade_id)
                print(f"Auto-closed trade {trade_id} - {reason} reached")
            except Exception as e:
                print(f"Error auto-closing trade {trade_id}: {e}")
        
        return trades_with_pl
    
    def _calculate_trade_pl(self, trade: Dict[str, Any]) -> float:
        """Calculate current P&L for a trade"""
        current_price = get_price(trade['pair'], 'M5', 1, self.exchange)[1, -1]
        if trade['direction'] == 'BUY':
            return round((current_price - trade['entry_price']) * Config.PIP_MULTIPLIER, 2)
        else:  # SELL
            return round((trade['entry_price'] - current_price) * Config.PIP_MULTIPLIER, 2)
    
    def close_trade(self, trade_id: str) -> Dict[str, Any]:
        """Close a specific trade"""
        trade = next((t for t in self.open_trades if t['trade_id'] == trade_id), None)
        if not trade:
            raise ValueError("Trade not found")
        
        if trade.get('practice_mode', False):
            profit = 0  # Simplified for practice mode
        else:
            profit = close_trade(self.exchange, self.account_id, trade_id)
            if profit is not None:
                self.profit_history.append(profit)
        
        self.open_trades.remove(trade)
        return {"status": "success", "profit": profit}
    
    def close_all_trades(self) -> Dict[str, Any]:
        """Close all open trades"""
        closed_trades = 0
        total_profit = 0
        
        for trade in self.open_trades.copy():
            try:
                result = self.close_trade(trade['trade_id'])
                closed_trades += 1
                total_profit += result.get('profit', 0)
            except Exception as e:
                print(f"Error closing trade {trade['trade_id']}: {e}")
        
        return {
            "status": "success",
            "closed_trades": closed_trades,
            "total_profit": total_profit
        }
    
    def set_account_mode(self, mode: str):
        """Set the account mode"""
        self.account_mode = mode
    
    def update_trade_tp(self, trade_id: str, take_profit: float) -> Dict[str, Any]:
        """Update take profit for a specific trade"""
        trade = next((t for t in self.open_trades if t['trade_id'] == trade_id), None)
        if not trade:
            raise ValueError("Trade not found")
        
        # Validate TP range
        if not (3 <= take_profit <= 20):
            raise ValueError("Take profit must be between 3 and 20 pips")
        
        trade['take_profit'] = take_profit
        return {"status": "success", "trade_id": trade_id, "take_profit": take_profit}
    
    def update_trade_sl(self, trade_id: str, stop_loss: float) -> Dict[str, Any]:
        """Update stop loss for a specific trade"""
        trade = next((t for t in self.open_trades if t['trade_id'] == trade_id), None)
        if not trade:
            raise ValueError("Trade not found")
        
        # Validate SL range
        if not (5 <= stop_loss <= 50):
            raise ValueError("Stop loss must be between 5 and 50 pips")
        
        trade['stop_loss'] = stop_loss
        return {"status": "success", "trade_id": trade_id, "stop_loss": stop_loss}