import os
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import feedparser
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import your existing libraries
from libs.tradelib import connect, get_price, put_order, close_trade, get_hist_prices, get_balance
from libs.indicators import calc_HA, zlema_ochl, market_eff_win, calc_rsi, market_eff

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
    try:
        # Get account balance for real trading
        account_balance = None
        if account_mode != "practice" and exchange and accountID:
            try:
                from libs.tradelib import get_balance
                account_balance = get_balance(exchange, accountID)
            except Exception as e:
                account_balance = 0
        
        # Calculate trading stats
        trading_stats = {}
        if profit_history:
            from libs.tradelib import update_stats_dict
            trading_stats = update_stats_dict(profit_history)
        
        return {
            "account_mode": account_mode,
            "account_balance": account_balance,
            "open_trades_count": len(open_trades),
            "total_profit": sum(profit_history) if profit_history else 0,
            "profit_history": profit_history[-50:] if profit_history else [],  # Last 50 trades
            "total_trades": len(profit_history) if profit_history else 0,
            "trading_stats": trading_stats
        }
    except Exception as e:
        return {
            "account_mode": account_mode,
            "account_balance": 0,
            "open_trades_count": len(open_trades),
            "total_profit": sum(profit_history) if profit_history else 0,
            "profit_history": profit_history[-50:] if profit_history else [],
            "total_trades": len(profit_history) if profit_history else 0,
            "trading_stats": {}
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
        
        # Calculate RSI for all candle data with fixed window of 4
        all_candles = [display_data] + ha_zlema_list + zlema_list
        rsi_data = [calc_rsi(candle_data[:4], 4).tolist() for candle_data in all_candles]
        
        # Calculate market efficiency for all candle data with fixed window of 12
        eff_data = [market_eff(candle_data[:4], 12).tolist() for candle_data in all_candles]
        print(f"Efficiency data shape: {len(eff_data)} arrays, first array length: {len(eff_data[0]) if eff_data else 0}")
        
        # Calculate statistics across all candle data
        all_ohlc_data = np.concatenate([candle[:4] for candle in all_candles], axis=0)
        std_devs = np.std(all_ohlc_data, axis=0).tolist()
        medians = np.median(all_ohlc_data, axis=0).tolist()
        
        return {
            "all_candles": [candle.tolist() for candle in all_candles],
            "eff_data": eff_data,
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
                if trade['direction'] == 'BUY':
                    pl = round((current_price - trade['entry_price']) * 10000, 2)
                else:  # SELL
                    pl = round((trade['entry_price'] - current_price) * 10000, 2)
            
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
    
    total_trades = len(trades)
    winning_trades = len([t for t in trades if t['profit'] > 0])
    win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
    total_profit = sum(t['profit'] for t in trades)
    
    return {
        "total_trades": total_trades,
        "win_rate": round(win_rate, 2),
        "total_profit": round(total_profit, 2)
    }

# News Feed and Sentiment Analysis Functions
def analyze_news_impact(headline: str, currency_pair: str) -> Dict[str, str]:
    """Analyze how a news headline might affect a specific currency pair using OpenAI"""
    try:
        # Get OpenAI API key from environment variable
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {
                'impact': 'NEUTRAL',
                'reasoning': 'OpenAI API key not configured',
                'confidence': 'LOW'
            }
        
        client = openai.OpenAI(api_key=api_key)
        
        prompt = f"""Analyze how this financial news headline might affect the {currency_pair} currency pair:

Headline: "{headline}"

Consider:
1. Which currency in the pair is most affected by this news
2. Whether this would likely cause {currency_pair} to strengthen or weaken
3. The potential magnitude of impact (high/medium/low)

Respond in this exact format:
IMPACT: [BUY/SELL/NEUTRAL]
REASONING: [Brief explanation]
CONFIDENCE: [HIGH/MEDIUM/LOW]
"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3
        )
        
        analysis = response.choices[0].message.content.strip()
        
        # Parse the response
        lines = analysis.split('\n')
        impact = "NEUTRAL"
        reasoning = "Analysis unavailable"
        confidence = "LOW"
        
        for line in lines:
            if line.startswith('IMPACT:'):
                impact = line.split(':', 1)[1].strip()
            elif line.startswith('REASONING:'):
                reasoning = line.split(':', 1)[1].strip()
            elif line.startswith('CONFIDENCE:'):
                confidence = line.split(':', 1)[1].strip()
        
        return {
            'impact': impact,
            'reasoning': reasoning,
            'confidence': confidence
        }
        
    except Exception as e:
        return {
            'impact': 'NEUTRAL',
            'reasoning': f'Analysis failed: {str(e)}',
            'confidence': 'LOW'
        }

def fetch_rss_feed(url: str, max_items: int = 5, currency_pair: str = None) -> List[Dict[str, Any]]:
    """Fetch RSS feed and return formatted news items with AI analysis"""
    try:
        feed = feedparser.parse(url)
        news_items = []
        for entry in feed.entries[:max_items]:
            # Clean up the title and description
            title = entry.get('title', '')[:100] + '...' if len(entry.get('title', '')) > 100 else entry.get('title', '')
            description = entry.get('summary', '')[:150] + '...' if len(entry.get('summary', '')) > 150 else entry.get('summary', '')
            
            # Extract date
            published = entry.get('published', '')
            if published:
                try:
                    date_obj = datetime(*entry.published_parsed[:6])
                    date_str = date_obj.strftime('%H:%M')
                except:
                    date_str = published[:10]
            else:
                date_str = 'N/A'
            
            # Analyze impact if currency pair is provided
            analysis = None
            if currency_pair:
                analysis = analyze_news_impact(title, currency_pair)
            
            news_items.append({
                'title': title,
                'description': description,
                'link': entry.get('link', ''),
                'published': date_str,
                'analysis': analysis
            })
        return news_items
    except Exception as e:
        return [{'title': f'Error loading feed: {str(e)}', 'description': '', 'link': '', 'published': '', 'analysis': None}]

@app.get("/api/news")
async def get_news_feed(currency_pair: str = "GBP_USD", enable_ai_analysis: bool = True):
    """Get news feed with sentiment analysis"""
    try:
        feeds = {
            'CNBC': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
            'MarketWatch': 'https://feeds.marketwatch.com/marketwatch/topstories/'
        }
        
        all_news_items = []
        for source, url in feeds.items():
            news_items = fetch_rss_feed(url, max_items=4, currency_pair=currency_pair if enable_ai_analysis else None)
            for item in news_items:
                item['source'] = source
                all_news_items.append(item)
        
        def sort_key(item):
            if enable_ai_analysis and item.get('analysis'):
                impact = item['analysis']['impact']
                confidence = item['analysis']['confidence']
                confidence_score = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}.get(confidence, 0)
                
                # Priority: BUY/SELL first, then NEUTRAL
                impact_priority = {'BUY': 3, 'SELL': 3, 'NEUTRAL': 1}.get(impact, 1)
                
                # Sort by: impact priority (high first), then confidence (high first), then time (newest first)
                return (impact_priority, confidence_score, item.get('published', ''))
            else:
                return (1, 0, item.get('published', ''))  # No analysis = low priority
        
        all_news_items.sort(key=sort_key, reverse=True)
        
        return {
            "news_items": all_news_items,
            "currency_pair": currency_pair,
            "enable_ai_analysis": enable_ai_analysis,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 