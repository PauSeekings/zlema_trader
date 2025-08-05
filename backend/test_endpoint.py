from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from libs.tradelib import connect, get_price
from libs.indicators import calc_HA, zlema_ochl, market_eff_win, calc_rsi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Test API"}

@app.get("/test-market-data")
async def test_market_data():
    try:
        # Connect to OANDA
        exchange, accountID = connect('test')
        
        # Get simple price data
        data = get_price("GBP_USD", "M5", 10, exchange)
        print(f"Data shape: {data.shape}")
        
        # Return basic info
        return {
            "status": "success",
            "data_shape": data.shape,
            "sample_close": data[1, -5:].tolist(),  # Last 5 close prices
            "message": "OANDA connection and data fetching working!"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 