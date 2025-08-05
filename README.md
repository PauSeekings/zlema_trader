# ZLEMA Trader

A modern React-based trading application with Python FastAPI backend, featuring real-time market data visualization and ZLEMA (Zero Lag Exponential Moving Average) technical indicators.

## Features

- **Real-time Trading Dashboard**: Live market data with interactive charts
- **Technical Indicators**: 
  - ZLEMA (Zero Lag Exponential Moving Average) with multiple timeframes
  - Heikin Ashi candlesticks
  - RSI (Relative Strength Index) with multiple window lengths
  - Market Efficiency indicators
  - Standard Deviation analysis
- **OANDA Integration**: Real-time forex data and trading capabilities
- **Practice Mode**: Simulate trades without real money
- **Responsive Design**: Modern dark theme UI with Material-UI components
- **Multi-subplot Charts**: Professional trading chart layout with proper scaling

## Tech Stack

### Backend
- **Python 3.8+**
- **FastAPI**: Modern, fast web framework
- **NumPy**: Numerical computations
- **OANDA API**: Market data and trading
- **Custom Indicators**: ZLEMA, Heikin Ashi, RSI implementations

### Frontend
- **React 18**
- **Material-UI (MUI)**: Component library
- **react-plotly.js**: Interactive charts
- **Axios**: HTTP client
- **React Router**: Navigation

## Project Structure

```
zlema_trader/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── libs/
│       ├── indicators.py    # Technical indicators
│       └── tradelib.py      # Trading functions
├── frontend/
│   ├── package.json         # Node.js dependencies
│   ├── public/
│   └── src/
│       ├── App.js           # Main React component
│       └── components/
│           ├── Navigation.js
│           ├── TradingDashboard.js
│           ├── TradingChart.js
│           ├── AccountStatus.js
│           └── NewsPanel.js
├── libs/                    # Original Python libraries
├── zlemaUI.py              # Original Streamlit application
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- OANDA API credentials

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up OANDA credentials**:
   - Get your OANDA API key from your OANDA account
   - The application will prompt for credentials on first run

4. **Start the backend server**:
   ```bash
   python main.py
   ```
   The server will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   The application will open on `http://localhost:3000`

## Usage

### Live Trading
1. Open the application in your browser
2. Select your trading pair (e.g., GBP_USD)
3. Choose timeframe and number of periods
4. Set your trade size in units
5. Use the Buy/Sell buttons to place trades
6. Monitor your open trades in the right sidebar

### Chart Features
- **Main Chart**: Candlestick data with ZLEMA overlays
- **Efficiency Subplot**: Market efficiency indicators
- **Standard Deviation**: Volatility analysis
- **RSI Subplot**: Multiple RSI lines with different window lengths

### Practice Mode
- Switch to practice mode to simulate trades without real money
- Perfect for testing strategies and learning the platform

## API Endpoints

- `GET /api/status`: Account status and connection info
- `GET /api/market-data`: Real-time market data with indicators
- `POST /api/trade`: Place buy/sell orders
- `GET /api/trades`: Get open trades and P&L
- `POST /api/close-trade/{trade_id}`: Close specific trades
- `POST /api/backtest`: Run backtesting (planned feature)

## Configuration

### Trading Parameters
- **Currency Pairs**: GBP_USD, EUR_USD, USD_JPY, etc.
- **Timeframes**: M1, M5, M15, M30, H1, H4, D1
- **Periods**: 24, 48, 96, 192, 384
- **ZLEMA Windows**: 3, 12, 24, 36, 48
- **Trade Units**: 100, 500, 1000, 2000, 5000, 10000

## Development

### Adding New Indicators
1. Implement the indicator in `backend/libs/indicators.py`
2. Add the calculation to the `get_market_data` endpoint in `backend/main.py`
3. Update the frontend chart component to display the new indicator

### Styling Changes
- Theme colors are defined in `frontend/src/App.js`
- Chart styling is in `frontend/src/components/TradingChart.js`
- Component-specific styles use Material-UI's `sx` prop

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use. Please ensure compliance with OANDA's terms of service and local trading regulations.

## Disclaimer

This software is for educational purposes only. Trading involves risk, and past performance does not guarantee future results. Always do your own research and consider consulting with a financial advisor before making trading decisions. 