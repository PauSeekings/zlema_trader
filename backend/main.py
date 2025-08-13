from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
from dotenv import load_dotenv

# Load environment variables from .env file
import os
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))

from config import Config
from models import TradingParams, TradeRequest, BacktestParams, TradeResponse, StatusResponse
from services.data_service import DataService
from services.trading_service import TradingService
from services.news_service import NewsService
from services.backtest_service import BacktestService
from services.market_status_service import MarketStatusService
from libs.tradelib import connect, get_price

# Initialize FastAPI app
app = FastAPI(title=Config.API_TITLE, version=Config.API_VERSION)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services (in production, use dependency injection)
exchange = None
account_id = None
data_service = None
trading_service = None
news_service = NewsService()
backtest_service = None
market_status_service = MarketStatusService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global exchange, account_id, data_service, trading_service, backtest_service
    exchange, account_id = connect('test')
    data_service = DataService(exchange)
    trading_service = TradingService(exchange, account_id)
    backtest_service = BacktestService(exchange)

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Routes
@app.get("/")
async def root():
    return {"message": "ZLEMA Trader API", "version": Config.API_VERSION}

@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    """Get account status and trading statistics"""
    try:
        return trading_service.get_account_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/connect")
async def connect_account(mode: str):
    """Connect to trading account"""
    global exchange, account_id
    try:
        exchange, account_id = connect(mode)
        trading_service.exchange = exchange
        trading_service.account_id = account_id
        trading_service.set_account_mode(mode)
        return {"status": "connected", "mode": mode}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market-data")
async def get_market_data(
    pair: str = Config.DEFAULT_PAIR,
    timeframe: str = Config.DEFAULT_TIMEFRAME,
    periods: int = Config.DEFAULT_PERIODS,
    window_lengths: str = "3,12,24,36,48",
    strategy: str = "classic",
    zl_length: int = 70
):
    """Get market data with technical indicators"""
    try:
        windows = [int(x) for x in window_lengths.split(",")]
        return data_service.get_market_data(pair, timeframe, periods, windows, strategy, zl_length)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/key-levels")
async def get_key_levels(
    pair: str = Config.DEFAULT_PAIR,
    timeframe: str = Config.DEFAULT_TIMEFRAME,
    periods: int = Config.DEFAULT_PERIODS,
    window: int = 20,
    threshold: float = 0.001
):
    """Get key support and resistance levels"""
    try:
        return data_service.get_key_levels(pair, timeframe, periods, window, threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/polynomial-predictions")
async def get_polynomial_predictions(
    pair: str = Config.DEFAULT_PAIR,
    timeframe: str = Config.DEFAULT_TIMEFRAME,
    periods: int = Config.DEFAULT_PERIODS,
    lookback: int = 20,
    forecast_periods: int = 5,
    degree: int = 2
):
    """Get polynomial predictions for future price movements"""
    try:
        # Get market data first to reuse median values
        market_data = data_service.get_market_data(pair, timeframe, periods, [3,12,24,36,48])
        median_values = np.array(market_data.get('medians', []))
        
        return data_service.get_polynomial_predictions(
            pair, timeframe, periods, lookback, forecast_periods, degree, median_values
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/current-price")
async def get_current_price(
    pair: str = Config.DEFAULT_PAIR,
    timeframe: str = Config.DEFAULT_TIMEFRAME,
    periods: int = Config.DEFAULT_PERIODS
):
    """Get current market price for a currency pair"""
    try:
        current_price = get_price(pair, timeframe, 1, exchange)[1, -1]  # Get latest close price
        
        # Get the mean price used for scaling (same as in market data)
        # Use the same parameters as the chart data
        data = get_price(pair, timeframe, periods + 50, exchange)  # Get same data as market data
        display_data = data[:, -periods:]  # Same as market data
        mean_price = np.mean(display_data[:4])  # Mean of OHLC data (same as market data)
        
        return {
            "current_price": current_price,
            "mean_price": mean_price
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trade", response_model=TradeResponse)
async def place_trade(trade: TradeRequest):
    """Place a new trade"""
    try:
        return trading_service.place_trade(trade.pair, trade.size, trade.direction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trades")
async def get_trades():
    """Get all open trades with current P&L"""
    try:
        return {
            "open_trades": trading_service.get_trades_with_pl(),
            "profit_history": trading_service.profit_history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trade/{trade_id}/close")
async def close_trade_endpoint(trade_id: str):
    """Close a specific trade"""
    try:
        return trading_service.close_trade(trade_id)
    except Exception as e:
        if "Trade not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trades/close-all")
async def close_all_trades():
    """Close all open trades"""
    try:
        return trading_service.close_all_trades()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trade/{trade_id}/update-tp")
async def update_trade_tp(trade_id: str, take_profit: float):
    """Update take profit for a specific trade"""
    try:
        return trading_service.update_trade_tp(trade_id, take_profit)
    except Exception as e:
        if "Trade not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/trade/{trade_id}/update-sl")
async def update_trade_sl(trade_id: str, stop_loss: float):
    """Update stop loss for a specific trade"""
    try:
        return trading_service.update_trade_sl(trade_id, stop_loss)
    except Exception as e:
        if "Trade not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/backtest")
async def run_backtest(params: BacktestParams):
    """Run a backtest with specified parameters"""
    try:
        return backtest_service.run_backtest(
            params.pair,
            params.timeframe,
            params.days_back,
            params.scheme,
            params.target_pips,
            params.stop_loss_pips
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news")
async def get_news_feed(currency_pair: str = Config.DEFAULT_PAIR, enable_ai_analysis: bool = True):
    """Get news feed with optional AI sentiment analysis"""
    try:
        return news_service.get_news_feed(currency_pair, enable_ai_analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")

@app.get("/api/market-status")
async def get_market_status():
    """Get current market status from Polygon.io"""
    try:
        return market_status_service.get_market_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market status: {str(e)}")

@app.get("/api/market-events")
async def get_market_events():
    """Get upcoming market opens/closes"""
    try:
        return {
            "events": market_status_service.get_upcoming_market_events(),
            "timestamp": market_status_service.get_market_status()["timestamp"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market events: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host=Config.HOST, port=Config.PORT)