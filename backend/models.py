from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from config import Config

class TradingParams(BaseModel):
    pair: str = Config.DEFAULT_PAIR
    timeframe: str = Config.DEFAULT_TIMEFRAME
    periods: int = Config.DEFAULT_PERIODS
    window_lengths: List[int] = Config.DEFAULT_WINDOW_LENGTHS

class TradeRequest(BaseModel):
    pair: str
    size: int
    direction: str  # "BUY" or "SELL"

class BacktestParams(BaseModel):
    pair: str
    timeframe: str
    scheme: str = "scalp"
    target_pips: int = Config.DEFAULT_TARGET_PIPS
    stop_loss_pips: int = Config.DEFAULT_STOP_LOSS_PIPS
    days_back: int = Config.DEFAULT_DAYS_BACK

class TradeResponse(BaseModel):
    status: str
    trade_id: str
    price: float
    mode: str

class StatusResponse(BaseModel):
    account_mode: str
    account_balance: Optional[float]
    open_trades_count: int
    total_profit: float
    profit_history: List[float]
    total_trades: int
    trading_stats: Dict[str, Any]

class NewsAnalysis(BaseModel):
    impact: str
    reasoning: str
    confidence: str

class NewsItem(BaseModel):
    title: str
    description: str
    link: str
    published: str
    source: str
    analysis: Optional[NewsAnalysis]