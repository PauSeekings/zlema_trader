from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
from datetime import datetime, timedelta
import time

# Import your existing libraries
from libs.tradelib import connect, get_price, put_order, close_trade, get_hist_prices
from libs.indicators import calc_HA, zlema_ochl, market_eff_win, calc_rsi

app = FastAPI(title="ZLEMA Trader API", version="1.0.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TradingParams(BaseModel):
    pair: str = "GBP_USD"
    timeframe: str = "M5"
    periods: int = 48
    window_lengths: List[int] = [3, 12, 24, 36, 48]

class TradeRequest(BaseModel):
    pair: str
    size: int
    direction: str  # "BUY" or "SELL"

class BacktestParams(BaseModel):
    pair: str
    timeframe: str
    scheme: str = "scalp"
    target_pips: int = 5
    stop_loss_pips: int = 10
    days_back: int = 30

# Global state (in production, use Redis/database)
account_mode = "test"
exchange = None
accountID = None
open_trades = []
profit_history = []

@app.on_event("startup")
async def startup_event():
    global exchange, accountID
    exchange, accountID = connect('test')

@app.get("/")
async def root():
    return {"message": "ZLEMA Trader API"}

@app.get("/api/status")
async def get_status():
    return {
        "account_mode": account_mode,
        "open_trades_count": len(open_trades),
        "total_profit": sum(profit_history) if profit_history else 0
    }

@app.post("/api/connect")
async def connect_account(mode: str):
    global exchange, accountID, account_mode
    try:
        exchange, accountID = connect(mode)
        account_mode = mode
        return {"status": "connected", "mode": mode}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market-data")
async def get_market_data(
    pair: str = "GBP_USD",
    timeframe: str = "M5", 
    periods: int = 48,
    window_lengths: str = "3,12,24,36,48"
):
    try:
        # Parse window lengths
        windows = [int(x) for x in window_lengths.split(",")]
        
        # Get price data and scale to pips
        n_candles = periods + 50
        data = get_price(pair, timeframe, n_candles, exchange)
        display_data = data[:, -periods:]
        
        # Scale data to pips (multiply by 10000)
        display_data[:4] = (display_data[:4] - np.mean(display_data[:4])) * 10000
        
        # Calculate indicators
        ha = calc_HA(display_data)
        ha_zlema_list = [zlema_ochl(ha[:4], window) for window in windows]
        zlema_list = [zlema_ochl(display_data[:4], window) for window in windows]
        
        # Calculate market efficiencies
        effs = []
        labels = []
        for i, (ha_z, z_z) in enumerate(zip(ha_zlema_list, zlema_list)):
            for data, prefix in [(ha_z, 'HA ZLEMA'), (z_z, 'ZLEMA')]:
                effs.append(market_eff_win(data[:, -12:]))
                labels.append(f'{prefix} {i+1}')
        
        # Calculate statistics
        std_devs = np.std(display_data[:4], axis=0).tolist()
        medians = np.median(display_data[:4], axis=0).tolist()
        
        # Calculate RSI for all candle data with fixed window of 4
        all_candles = [display_data] + ha_zlema_list + zlema_list
        rsi_data = [calc_rsi(candle_data[:4], 4).tolist() for candle_data in all_candles]
        
        return {
            "all_candles": [candle.tolist() for candle in all_candles],
            "efficiencies": effs,
            "labels": labels,
            "std_devs": std_devs,
            "medians": medians,
            "rsi_data": rsi_data,
            "pair": pair,
            "timeframe": timeframe,
            "periods": periods,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error in market data endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trade")
async def place_trade(trade: TradeRequest):
    try:
        if account_mode == "practice":
            # Simulate trade
            trade_id = f"practice_{trade.direction.lower()}_{int(time.time())}"
            # Get current price for simulation
            data = get_price(trade.pair, "M5", 1, exchange)
            current_price = data[1, -1]
            
            open_trades.append({
                'trade_id': trade_id,
                'direction': trade.direction,
                'size': trade.size if trade.direction == "BUY" else -trade.size,
                'entry_price': current_price,
                'pair': trade.pair,
                'practice_mode': True
            })
            
            return {
                "status": "success",
                "trade_id": trade_id,
                "price": current_price,
                "mode": "practice"
            }
        else:
            # Real trading
            units = trade.size if trade.direction == "BUY" else -trade.size
            price, trade_id = put_order(exchange, accountID, trade.pair, units)
            
            if trade_id:
                open_trades.append({
                    'trade_id': trade_id,
                    'direction': trade.direction,
                    'size': trade.size,
                    'entry_price': price,
                    'pair': trade.pair
                })
            
            return {
                "status": "success",
                "trade_id": trade_id,
                "price": price,
                "mode": account_mode
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trades")
async def get_trades():
    try:
        # Calculate current P&L for each trade
        trades_with_pl = []
        for trade in open_trades:
            if trade.get('practice_mode', False):
                # Practice mode P&L calculation
                pl = 0  # Simplified for now
            else:
                # Real trading P&L
                current_price = get_price(trade['pair'], 'M5', 1, exchange)[1, -1]
                pl = round((current_price - trade['entry_price']) * 10000 * np.sign(trade['size']), 2)
            
            trades_with_pl.append({
                **trade,
                "current_pl": pl
            })
        
        return {
            "open_trades": trades_with_pl,
            "profit_history": profit_history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/close-trade/{trade_id}")
async def close_trade_endpoint(trade_id: str):
    try:
        trade = next((t for t in open_trades if t['trade_id'] == trade_id), None)
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        
        if trade.get('practice_mode', False):
            # Practice mode: simulate close
            profit = 0  # Simplified for now
            open_trades.remove(trade)
            profit_history.append(profit)
        else:
            # Real trading
            profit = close_trade(exchange, accountID, trade_id)
            if profit is not None:
                profit_history.append(profit)
            open_trades.remove(trade)
        
        return {"status": "success", "profit": profit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/backtest")
async def run_backtest(params: BacktestParams):
    try:
        # Get historical data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=params.days_back)
        
        data = get_hist_prices(params.pair, params.timeframe, exchange, 
                             start=start_date.strftime('%Y-%m-%dT%H:%M:%SZ'), 
                             end=end_date.strftime('%Y-%m-%dT%H:%M:%SZ'))
        
        if data.shape[1] < 100:
            raise HTTPException(status_code=400, detail="Insufficient historical data")
        
        # Calculate indicators
        window_lengths = [3, 12, 24, 36, 48]
        ha_zlema_list, zlema_list = calculate_indicators(data, window_lengths)
        
        # Run backtest (simplified version)
        trades = backtest_strategy(data, ha_zlema_list, zlema_list, window_lengths, 
                                 params.scheme, params.target_pips, params.stop_loss_pips)
        
        # Calculate statistics
        stats = calculate_backtest_stats(trades)
        
        return {
            "trades": trades,
            "statistics": stats,
            "data_points": data.shape[1]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions (simplified versions of your existing functions)
def calculate_indicators(data, window_lengths):
    data_copy = data.copy()
    data_copy[:4] = (data_copy[:4] - np.mean(data_copy[:4])) * 10000
    ha = calc_HA(data_copy)
    ha_zlema_list = [zlema_ochl(ha, window) for window in window_lengths]
    zlema_list = [zlema_ochl(data_copy, window) for window in window_lengths]
    return ha_zlema_list, zlema_list

def backtest_strategy(data, ha_zlema_list, zlema_list, window_lengths, scheme='scalp', target_pips=5, stop_loss_pips=10):
    # Simplified backtest implementation
    trades = []
    # ... implement your backtest logic here
    return trades

def calculate_backtest_stats(trades):
    # Simplified stats calculation
    if not trades:
        return {"total_trades": 0, "win_rate": 0, "total_profit": 0}
    
    profits = [trade['profit_pips'] for trade in trades]
    wins = [p for p in profits if p > 0]
    
    return {
        "total_trades": len(trades),
        "win_rate": len(wins) / len(trades),
        "total_profit": sum(profits),
        "average_profit": np.mean(profits)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 