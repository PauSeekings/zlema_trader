import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Configuration
    API_TITLE = "ZLEMA Trader API"
    API_VERSION = "1.0.0"
    HOST = "0.0.0.0"
    PORT = 8000
    
    # CORS Configuration
    CORS_ORIGINS = ["http://localhost:3000"]
    
    # Trading Configuration
    DEFAULT_PAIR = "GBP_USD"
    DEFAULT_TIMEFRAME = "M5"
    DEFAULT_PERIODS = 48
    DEFAULT_WINDOW_LENGTHS = [3, 12, 24, 36, 48]
    
    # Data Processing
    PIP_MULTIPLIER = 10000
    RSI_WINDOW = 4
    EFFICIENCY_WINDOW = 4
    
    # News Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    NEWS_FEEDS = {
        'CNBC': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
        'MarketWatch': 'https://feeds.marketwatch.com/marketwatch/topstories/'
    }
    MAX_NEWS_ITEMS = 4
    
    # Backtest Configuration
    DEFAULT_TARGET_PIPS = 5
    DEFAULT_STOP_LOSS_PIPS = 10
    DEFAULT_DAYS_BACK = 30
    MIN_BACKTEST_DATA_POINTS = 100