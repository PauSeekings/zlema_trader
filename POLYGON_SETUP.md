# Polygon.io Market Status Setup

## Getting Your Free API Key

1. **Sign up at Polygon.io**:
   - Visit: https://polygon.io/
   - Create a free account
   - Free tier includes: 5 API calls/minute, 100 calls/day

2. **Get Your API Key**:
   - Login to your Polygon dashboard
   - Navigate to "API Keys" section
   - Copy your API key

3. **Set Your API Key**:
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export POLYGON_API_KEY="your_actual_api_key_here"
   ```
   
   **Option B: Direct Code Edit**
   - Edit `backend/services/market_status_service.py`
   - Replace `YOUR_POLYGON_API_KEY_HERE` with your actual key

## What You'll Get

### Market Status Display:
- **Forex**: Shows current session (Sydney/Tokyo/London/New York)
- **US Stocks**: Open/Closed status with market hours
- **Crypto**: Always shows as open (24/7)

### Upcoming Events:
- Next market opens/closes
- Major forex session changes
- Holiday schedules

### Navigation Bar Features:
- ✅ Real-time clock
- 🟢🔴 Market status indicators
- 📅 Next market event countdown
- 🌐 Data source indicator

## Fallback Mode

Without an API key, the system uses:
- **Static schedules** for regular market hours
- **Basic timezone calculations** for forex sessions
- **Estimated events** based on typical schedules

## Testing

After setting your API key:

```bash
# Test market status
curl "http://localhost:8000/api/market-status"

# Test upcoming events  
curl "http://localhost:8000/api/market-events"
```

The navigation bar will automatically update every 30 seconds with live market data!
