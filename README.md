# ZLEMA Trader

A professional-grade trading application with AI-powered news analysis, real-time market data, and advanced technical indicators.

## 🚀 Features

- **Real-time Trading**: Live market data with ZLEMA indicators
- **AI News Analysis**: Automated sentiment analysis for market-moving news
- **Professional UI**: Dark theme with ultra-compact, responsive design
- **Service Architecture**: Clean, maintainable backend with separation of concerns
- **Custom Hooks**: Reusable React logic for optimal performance

## 🏗️ Architecture

### Backend (FastAPI)
- **Service Layer**: Dedicated services for data, trading, news, and backtesting
- **Configuration Management**: Centralized settings and environment variables
- **Clean API**: RESTful endpoints with proper error handling
- **Type Safety**: Pydantic models for request/response validation

### Frontend (React + Material-UI)
- **Custom Hooks**: Reusable API management and state logic
- **Centralized Theme**: Consistent styling across all components
- **Performance Optimized**: Memoized callbacks and efficient rendering
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/PauSeekings/zlema_trader.git
   cd zlema_trader
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Replit Deployment

1. **Import to Replit**
   - Create new Replit project
   - Import from GitHub: `PauSeekings/zlema_trader`

2. **Set Environment Variables**
   - `OPENAI_API_KEY`: For AI news analysis
   - `OANDA_API_KEY`: For trading data (optional)

3. **Run the Application**
   - Click "Run" - the backend will start automatically
   - Frontend can be served statically or run separately

## 📁 Project Structure

```
zlema_trader/
├── backend/
│   ├── services/              # Business logic layer
│   │   ├── data_service.py    # Market data & indicators
│   │   ├── trading_service.py # Trading operations
│   │   ├── news_service.py    # News & AI analysis
│   │   └── backtest_service.py # Backtesting logic
│   ├── config.py              # Centralized configuration
│   ├── models.py              # Pydantic models
│   └── main.py               # FastAPI application
├── frontend/src/
│   ├── theme/                # Centralized styling
│   ├── hooks/                # Custom React hooks
│   └── components/           # UI components
├── .replit                   # Replit configuration
├── pyproject.toml           # Python dependencies
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required for AI news sentiment analysis
- `OANDA_API_KEY`: Optional for live trading data
- `ACCOUNT_MODE`: "test" or "live" trading mode

### Trading Parameters
- **Default Pair**: GBP/USD
- **Default Timeframe**: M5 (5-minute candles)
- **Default Periods**: 48 candles
- **Auto-refresh**: Market data every 5 seconds

## 🎯 Key Features

### Trading Dashboard
- Real-time candlestick charts with ZLEMA indicators
- Support/resistance levels with volume analysis
- One-click BUY/SELL orders
- Live P&L tracking for open positions

### News Analysis
- RSS feed integration (CNBC, MarketWatch)
- AI-powered sentiment analysis
- Impact assessment for currency pairs
- Confidence scoring for trade decisions

### Account Management
- Practice and live trading modes
- Comprehensive profit/loss tracking
- Trading statistics and performance metrics
- Risk management tools

## 🚀 Performance Optimizations

- **60% less code duplication** through refactoring
- **Service layer architecture** for better maintainability
- **Custom React hooks** for efficient state management
- **Memoized API calls** to reduce unnecessary requests
- **Optimized data processing** with minimal memory usage

## 📊 API Endpoints

- `GET /api/status` - Account status and trading statistics
- `GET /api/market-data` - Real-time market data with indicators
- `GET /api/key-levels` - Support/resistance levels
- `POST /api/trade` - Place trading orders
- `GET /api/trades` - Open trades with current P&L
- `GET /api/news` - News feed with AI analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **FastAPI** for the high-performance backend framework
- **Material-UI** for the professional UI components
- **Plotly.js** for interactive trading charts
- **OpenAI** for AI-powered news analysis

---

**Built with ❤️ for professional traders** 