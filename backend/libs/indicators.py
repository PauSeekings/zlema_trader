import numpy as np
from scipy import signal

OPEN_PRICE = 0
CLOSE_PRICE =1
HIGH_PRICE = 2
LOW_PRICE =3
VOLUME  = 4 
D_TIME = 5
D_TIME_MOD = 6
PIP = 10000

def ema(data, period):
    """Custom EMA implementation to replace talib.EMA"""
    alpha = 2 / (period + 1)
    ema_values = np.zeros_like(data)
    ema_values[0] = data[0]
    
    for i in range(1, len(data)):
        ema_values[i] = alpha * data[i] + (1 - alpha) * ema_values[i-1]
    
    return ema_values

def atr(high, low, close, period):
    """Custom ATR implementation to replace talib.ATR"""
    tr = np.zeros_like(high)
    tr[0] = high[0] - low[0]
    
    for i in range(1, len(high)):
        tr[i] = max(
            high[i] - low[i],
            abs(high[i] - close[i-1]),
            abs(low[i] - close[i-1])
        )
    
    return ema(tr, period)

def market_eff_win(price_win):
    barlen = price_win[CLOSE_PRICE] - price_win[OPEN_PRICE]
    price_change = price_win[CLOSE_PRICE,-1] - (price_win[OPEN_PRICE,0])
    eff =  (price_change / (np.sum(np.abs(barlen))) + 0.0001)  #* price_win[VOLUME, -1] 
    return  eff

def market_eff(prices, winlen):
    eff = np.zeros((prices.shape[1]))
    barlen = (prices[CLOSE_PRICE] - prices[OPEN_PRICE])
    for n in range(winlen, prices.shape[1]):
        price_change = prices[CLOSE_PRICE,n] - prices[OPEN_PRICE,n-winlen]
        eff[n] = (price_change) / (np.sum(np.abs(barlen[n-winlen : n])))
        #eff[n] = (price_change - np.sum(barlen[n-winlen : n]))  #* prices[VOLUME,n]  
    return np.clip(eff, -1, 1)

# def market_eff(prices, winlen):
#     eff = np.zeros((prices.shape[1], 1))
#     #voleff = np.zeros((prices.shape[1], ))
	
#     barlen = (prices[CLOSE_PRICE] - prices[OPEN_PRICE])
#     w = np.linspace(0,3, winlen)
#     for n in range(prices.shape[1]-winlen):
#         price_change = prices[CLOSE_PRICE,n:n+winlen] - prices[CLOSE_PRICE,n]
#         eff[n+winlen] = np.abs(price_change) / ( 0.00000000000001+np.sum(np.abs(barlen[n: n +winlen]   )))

# 		#eff[n] = (price_change - np.sum(barlen[n-winlen : n]))  #* prices[VOLUME,n]


def zlema_ochl(ochl: np.ndarray, period: int) -> np.ndarray:
    """
    Compute Zero Lag Exponential Moving Average (ZLEMA) for each row in OCHL data.
    
    Args:
        ochl (np.ndarray): Input OCHL data of shape (4, N).
        period (int): The period for the ZLEMA calculation.
    
    Returns:
        np.ndarray: The computed ZLEMA values for Open, Close, High, and Low (shape (4, N)).
    """
    if ochl.shape[0] != 4:
        raise ValueError("Input array must have shape (4, N) corresponding to Open, Close, High, Low")

    lag = (period - 1) // 2  # Lag correction factor
    alpha = 2 / (period + 1)  # EMA smoothing factor

    # Compute adjusted price: 2 * price[t] - price[t - lag]
    price_adjusted = np.copy(ochl)  # Copy to avoid modifying original
    price_adjusted[:, lag:] = 2 * ochl[:, lag:] - ochl[:, :-lag]

    # Exponential Moving Average (EMA) calculation
    ema = np.zeros_like(ochl)
    ema[:, 0] = ochl[:, 0]  # Initialize first column

    for i in range(1, ochl.shape[1]):
        ema[:, i] = alpha * price_adjusted[:, i] + (1 - alpha) * ema[:, i - 1]

    return ema

def zlema_ochl_vectorized(ochl: np.ndarray, period: int) -> np.ndarray:
    """
    Vectorized Zero Lag Exponential Moving Average (ZLEMA) for each row in OCHL data.
    Much faster than the original implementation by avoiding loops.
    
    Args:
        ochl (np.ndarray): Input OCHL data of shape (4, N).
        period (int): The period for the ZLEMA calculation.
    
    Returns:
        np.ndarray: The computed ZLEMA values for Open, Close, High, and Low (shape (4, N)).
    """
    if ochl.shape[0] != 4:
        raise ValueError("Input array must have shape (4, N) corresponding to Open, Close, High, Low")

    lag = (period - 1) // 2  # Lag correction factor
    alpha = 2 / (period + 1)  # EMA smoothing factor

    # Compute adjusted price: 2 * price[t] - price[t - lag]
    price_adjusted = np.copy(ochl)  # Copy to avoid modifying original
    price_adjusted[:, lag:] = 2 * ochl[:, lag:] - ochl[:, :-lag]

    # Vectorized EMA calculation using lfilter
    # For EMA: y[n] = alpha * x[n] + (1-alpha) * y[n-1]
    # This is equivalent to: y[n] - (1-alpha) * y[n-1] = alpha * x[n]
    # In filter terms: b = [alpha], a = [1, -(1-alpha)]
    b = np.array([alpha])
    a = np.array([1, -(1 - alpha)])
    
    # Apply filter to each row
    ema = np.zeros_like(ochl)
    for i in range(4):  # Process each OCHL row
        # lfilter needs 1D input, so we process row by row
        ema[i, :] = signal.lfilter(b, a, price_adjusted[i, :])
    
    return ema

#         #eff[n+winlen,  1]=np.mean(prices[VOLUME,n: n + winlen]) 
#         #eff[n+winlen,  0]=prices[d_time,n] 
#     eff = eff[:,1:]
#     return eff, voleff




        
def zlema(price,gain, minperiod):
	#zp = price[0]
	#price -= zp
	zl = np.zeros((price.shape[0],))
	for n in range(1,price.shape[0]):
		error = gain*(price[n] - zl[n-1])
		period =  minperiod + np.abs(error)
		a = 2/(period +1)
		zl[n] = a * (price[n] + error)   + (1-a) * zl[n-1]
	#zl[:100] = np.nan
	return zl #+ zp

def zlema_v2(price,gain, minperiod):
	zp = price[0]
	price = (price - zp) * PIP
	zl = np.zeros((price.shape[0],))
	for n in range(1,price.shape[0]):
		#if n >2:
		error = gain*(price[n] - zl[n-1])
		period = np.max( [ 10, minperiod - (np.abs(price[n] - zl[n-1])**2 ) ])
		a = 2/(period + 1)
		zl[n] = a * (price[n] + error)  + (1-a) * zl[n-1]
	zl  = (zl/PIP) + zp
	return zl




def update_HA(HA, price):
	ha_open  =  (HA[OPEN_PRICE] + HA[CLOSE_PRICE])/2
	ha_close =(price[OPEN_PRICE] + price[CLOSE_PRICE] + price[HIGH_PRICE] + price[LOW_PRICE])/4
	elements = np.asarray([price[HIGH_PRICE],price[LOW_PRICE],ha_open, ha_close ])
	return np.asarray([ha_open, ha_close, np.amax(elements),  np.amin(elements), price[VOLUME]  ] )

def calc_HA(prices):
	HA = np.zeros((5, prices.shape[1]))
	HA[OPEN_PRICE,0] = prices[OPEN_PRICE,0]
	HA[CLOSE_PRICE,0] = prices[CLOSE_PRICE,0] 	
	HA[HIGH_PRICE,0] = prices[HIGH_PRICE,0]
	HA[LOW_PRICE,0] = prices[LOW_PRICE,0]
	for n in range(1, prices.shape[1]):
		HA[:,n] =  update_HA(HA[:,n-1], prices[:,n])
	return HA

def update_rsi(HA):	
	rs = HA[CLOSE_PRICE] - HA[OPEN_PRICE]
	rs = np.sum(rs[rs>0]) / (np.sum(np.abs(rs[rs<0]))+0.000000000000000000000001)
	return  100 - (100/(1+rs))

def calc_rsi(HA,win):
	rsi = np.ones((HA.shape[1])) 
	for n in range(win, HA.shape[1]):
		rsi[n] = update_rsi(HA[:,n-win:n] )
	return rsi

def vwap(price, vol):
    price = np.array(price)
    vol = np.array(vol)
    return np.cumsum(price * vol) / np.cumsum(vol) 

def crossover(a,b):
	#cross up
	if (a[0] < b[0]) and (a[1] > b[1]) :
		return 1
	# cross down
	if (a[0] > b[0]) and (a[1] < b[1]) :
		return -1

def vpt(price, volume, win):
    vpt = np.zeros((price.shape[1]))
    minmax = np.zeros((price.shape[1],2))
    
    for n in range(1,price.shape[1]):
        percent_change = ((price[CLOSE_PRICE,n] - price[CLOSE_PRICE,n-1]) )
        vpt[n] = vpt[n-1] + (volume[n] * percent_change)
        if n > win:
            minmax[n,0] = np.min(vpt[n-win:n])
            minmax[n,1] = np.max(vpt[n-win:n])
    return vpt, minmax


def vpt_2(price, volume):
    vpt = np.zeros((price.shape[1],))
    mn_vol = ema(volume, 5)
    for n in range(1,price.shape[1]):
        if volume[n] > mn_vol[n]:
            vpt[n] = (price[CLOSE_PRICE,n] - price[CLOSE_PRICE,n-1]) * PIP * volume[n]
        else:
            vpt[n] = vpt[n-1]





# def supertrend(price, atr_length, atr_multiplier ):
# 	atr_length = int(atr_length)
# 	atr = ta.ATR(price[HIGH_PRICE], price[LOW_PRICE], price[CLOSE_PRICE], atr_length) * atr_multiplier 
# 	barlen = (price[HIGH_PRICE] + price[LOW_PRICE]) /2 
# 	ub, lb = barlen + atr,  barlen - atr
# 	fub, flb, supertrend, trade = np.ones_like(ub) , np.ones_like(lb), np.ones_like(lb), np.zeros((price.shape[1])) 

# 	for n in range(atr_length+1,price[0].shape[0]):
# 		if (ub[n]< fub[n-1]) or (price[CLOSE_PRICE, n-1] > fub[n-1] ):
# 			fub[n] = ub[n]
# 		else:
# 			fub[n] = fub[n-1] 
	
# 		if (lb[n] > flb[n-1]) or (price[CLOSE_PRICE, n-1] < flb[n-1] ):
# 			flb[n] = lb[n]
# 		else:
# 			flb[n] = flb[n-1] 

# 	for n in range(0,price[0].shape[0]):
# 		if ((supertrend[n-1]) == fub[n-1] and (price[CLOSE_PRICE, n] <= fub[n])) or ((supertrend[n-1]) == flb[n-1] and (price[CLOSE_PRICE, n] < flb[n])):
# 			supertrend[n] =  fub[n]
# 			trade[n] =  -1
		
# 		elif ((supertrend[n-1]) == fub[n-1] and (price[CLOSE_PRICE, n] > fub[n])) or ( (supertrend[n-1]) == flb[n-1] and (price[CLOSE_PRICE, n] >= flb[n])):
# 			supertrend[n] = flb[n]
# 			trade[n] = 1

			
# 	flb[:atr_length +1] = np.nan
# 	fub[:atr_length +1] = np.nan
# 	trade[:atr_length +1] = np.nan
# 	supertrend[:atr_length +1] = np.nan
# 	return supertrend ,atr, trade


# def chandelier(price, atr_length, atr_multiplier ):
# 	atr_length = int(atr_length)
# 	atr = ta.ATR(price[HIGH_PRICE], price[LOW_PRICE], price[CLOSE_PRICE], atr_length) * atr_multiplier 
# 	barlen = (price[HIGH_PRICE] + price[LOW_PRICE]) /2 
# 	ub = barlen + atr
# 	lb = barlen - atr

# 	fub, flb = np.ones_like(ub) , np.ones_like(lb) 


# 	for n in range(atr_length+1,price[0].shape[0]):
# 		if (ub[n]< fub[n-1]) or (price[CLOSE_PRICE, n-1] > fub[n-1] ):
# 			fub[n] = ub[n]
# 		else:
# 			fub[n] = fub[n-1] 
	
# 		if (lb[n] > flb[n-1]) or (price[CLOSE_PRICE, n-1] < flb[n-1] ):
# 			flb[n] = lb[n]
# 		else:
# 			flb[n] = flb[n-1] 

	
# 	flb[:atr_length +1] = np.nan
# 	fub[:atr_length +1] = np.nan
	
# 	return np.concatenate([np.expand_dims(flb,-1),np.expand_dims(fub,-1)], axis =1)




def zlema_optimized(price: np.ndarray, period: int) -> np.ndarray:
    """Optimized ZLEMA implementation using vectorized operations"""
    lag = (period - 1) // 2
    alpha = 2 / (period + 1)
    
    # Vectorized lag adjustment
    price_adjusted = 2 * price[lag:] - price[:-lag]
    
    # Pre-allocate output array
    zlema = np.zeros_like(price)
    zlema[:lag] = price[:lag]
    
    # Vectorized EMA calculation
    for i in range(lag, len(price)):
        zlema[i] = alpha * price_adjusted[i-lag] + (1 - alpha) * zlema[i-1]
    
    return zlema

def market_microstructure_features(prices: np.ndarray, volume: np.ndarray, window: int = 20) -> dict:
    """Calculate advanced market microstructure features"""
    features = {}
    
    # Volume-weighted price features
    vwap = np.cumsum(prices[CLOSE_PRICE] * volume) / np.cumsum(volume)
    features['vwap_distance'] = (prices[CLOSE_PRICE] - vwap) / vwap
    
    # Order flow imbalance
    buy_volume = volume * (prices[CLOSE_PRICE] > prices[OPEN_PRICE])
    sell_volume = volume * (prices[CLOSE_PRICE] <= prices[OPEN_PRICE])
    features['flow_imbalance'] = (buy_volume - sell_volume) / (buy_volume + sell_volume + 1e-10)
    
    # Price impact
    returns = np.diff(np.log(prices[CLOSE_PRICE]))
    features['price_impact'] = returns / (volume[1:] + 1e-10)
    
    # Volatility features
    log_returns = np.diff(np.log(prices[CLOSE_PRICE]))
    features['realized_vol'] = np.sqrt(np.sum(log_returns**2))
    features['parkinson_vol'] = np.sqrt(1/(4*np.log(2)) * np.log(prices[HIGH_PRICE]/prices[LOW_PRICE])**2)
    
    return features

def adaptive_momentum(prices: np.ndarray, volume: np.ndarray, period: int = 14) -> np.ndarray:
    """Calculate adaptive momentum indicator weighted by volume and volatility"""
    returns = np.diff(prices[CLOSE_PRICE])
    vol = np.std(returns, ddof=1)
    
    # Volume-weighted momentum
    vol_ma = np.convolve(volume, np.ones(period)/period, mode='valid')
    mom = returns * (volume[1:] / vol_ma)
    
    # Volatility adjustment
    vol_adj = np.exp(-vol * np.abs(returns))
    
    return mom * vol_adj

def aggregate_ha_zlema(prices, pip_threshold, zlema_window):
    """
    Aggregate by price movement, convert to Heiken Ashi, and compute ZLEMA.
    Returns (agg, ha, zlema, closes)
    """
    def aggregate_by_price_movement(prices, pip_threshold):
        n_candles = len(prices[0])
        aggregated = []
        closes = []
        start_idx = 0
        start_price = prices[CLOSE_PRICE, 0]
        for i in range(1, n_candles):
            current_price = prices[CLOSE_PRICE, i]
            price_change = abs(current_price - start_price) * PIP
            if price_change >= pip_threshold:
                bar = np.zeros(7)
                bar[OPEN_PRICE] = prices[OPEN_PRICE, start_idx]
                bar[CLOSE_PRICE] = prices[CLOSE_PRICE, i]
                bar[HIGH_PRICE] = np.max(prices[HIGH_PRICE, start_idx:i+1])
                bar[LOW_PRICE] = np.min(prices[LOW_PRICE, start_idx:i+1])
                bar[VOLUME] = np.sum(prices[VOLUME, start_idx:i+1])
                bar[D_TIME] = prices[D_TIME, start_idx]
                bar[D_TIME_MOD] = prices[D_TIME_MOD, start_idx]
                aggregated.append(bar)
                closes.append(prices[CLOSE_PRICE, i])
                start_idx = i + 1
                start_price = prices[CLOSE_PRICE, i]
        agg = np.array(aggregated).T if aggregated else np.zeros((7, 0))
        closes = np.array(closes)
        return agg, closes
    agg, closes = aggregate_by_price_movement(prices, pip_threshold)
    ha = calc_HA(agg)
    zlema = zlema_ochl(ha[:4], zlema_window)
    return agg, ha, zlema, closes

def aggregate_ha_zlema_multi(prices, pip_thresholds, zlema_windows):
    """
    Aggregate by multiple price movement thresholds, convert to Heiken Ashi, and compute ZLEMA for each.
    Returns a dict keyed by (pip, window): {'agg', 'ha', 'zlema', 'closes'}
    """
    assert len(pip_thresholds) == len(zlema_windows)
    n_candles = len(prices[0])
    results = {}
    # For each threshold, track aggregation state
    states = []
    for pip in pip_thresholds:
        states.append({
            'start_idx': 0,
            'start_price': prices[CLOSE_PRICE, 0],
            'bars': [],
            'closes': []
        })
    for i in range(1, n_candles):
        for idx, pip in enumerate(pip_thresholds):
            state = states[idx]
            current_price = prices[CLOSE_PRICE, i]
            price_change = abs(current_price - state['start_price']) * PIP
            if price_change >= pip:
                bar = np.zeros(7)
                bar[OPEN_PRICE] = prices[OPEN_PRICE, state['start_idx']]
                bar[CLOSE_PRICE] = prices[CLOSE_PRICE, i]
                bar[HIGH_PRICE] = np.max(prices[HIGH_PRICE, state['start_idx']:i+1])
                bar[LOW_PRICE] = np.min(prices[LOW_PRICE, state['start_idx']:i+1])
                bar[VOLUME] = np.sum(prices[VOLUME, state['start_idx']:i+1])
                bar[D_TIME] = prices[D_TIME, state['start_idx']]
                bar[D_TIME_MOD] = prices[D_TIME_MOD, state['start_idx']]
                state['bars'].append(bar)
                state['closes'].append(prices[CLOSE_PRICE, i])
                state['start_idx'] = i + 1
                state['start_price'] = prices[CLOSE_PRICE, i]
    for idx, (pip, win) in enumerate(zip(pip_thresholds, zlema_windows)):
        bars = np.array(states[idx]['bars']).T if states[idx]['bars'] else np.zeros((7, 0))
        closes = np.array(states[idx]['closes'])
        ha = calc_HA(bars)
        zlema = zlema_ochl(ha[:4], win)
        results[(pip, win)] = {'agg': bars, 'ha': ha, 'zlema': zlema, 'closes': closes}
    return results




def zero_lag_trend_signals(ochl: np.ndarray, length: int = 70, mult: float = 1.2) -> dict:
    """Zero Lag Trend Signals (single timeframe)
    Mirrors the Pine Script logic without MTF: computes ZLEMA, deviation bands, trend regime, and entry signals.

    Args:
        ochl: array shaped (4, N) in order [Open, Close, High, Low]
        length: ZLEMA/ATR length
        mult: band multiplier

    Returns:
        dict with keys: 'zlema', 'upper_band', 'lower_band', 'trend',
        'bull_entry', 'bear_entry', 'bull_entry_level', 'bear_entry_level',
        'trend_up_level', 'trend_down_level'
    """
    if ochl.shape[0] != 4:
        raise ValueError("ochl must have shape (4, N) -> [Open, Close, High, Low]")

    open_p = ochl[OPEN_PRICE]
    close_p = ochl[CLOSE_PRICE]
    high_p = ochl[HIGH_PRICE]
    low_p = ochl[LOW_PRICE]
    n = close_p.size

    # Effective lengths based on available bars
    n = close_p.size
    eff_len = max(2, min(length, max(2, n // 3)))
    # ZLEMA: EMA of adjusted price (2*price - price[lag])
    lag = (eff_len - 1) // 2
    price_adj = close_p.copy()
    if lag > 0 and n > lag:
        price_adj[lag:] = 2 * close_p[lag:] - close_p[:-lag]
    z = ema(price_adj, eff_len)

    # Volatility: highest(ATR(length), length*3) * mult
    atr_vals = atr(high_p, low_p, close_p, eff_len)
    win = max(1, min(int(length * 3), n))
    vol = np.full(n, np.nan)
    for i in range(0, n):
        start = 0 if i + 1 < win else i - win + 1
        vol[i] = np.max(atr_vals[start:i + 1])
    vol *= mult

    upper = z + vol
    lower = z - vol

    # Trend regime: Pine Script logic
    # if ta.crossover(close, zlema+volatility) -> trend := 1
    # if ta.crossunder(close, zlema-volatility) -> trend := -1
    trend = np.zeros(n, dtype=int)
    for i in range(1, n):
        # Crossover: close crosses above upper band (zlema + volatility)
        if (not np.isnan(vol[i]) and close_p[i - 1] <= (z[i - 1] + vol[i - 1]) and 
            close_p[i] > (z[i] + vol[i])):
            trend[i] = 1
        # Crossunder: close crosses below lower band (zlema - volatility)  
        elif (not np.isnan(vol[i]) and close_p[i - 1] >= (z[i - 1] - vol[i - 1]) and 
              close_p[i] < (z[i] - vol[i])):
            trend[i] = -1
        else:
            # Persist previous trend (var trend behavior from Pine)
            trend[i] = trend[i - 1]

    # Entry signals: close cross ZLEMA while trend persists
    bull_entry = np.zeros(n, dtype=bool)
    bear_entry = np.zeros(n, dtype=bool)
    for i in range(1, n):
        co_up = close_p[i - 1] <= z[i - 1] and close_p[i] > z[i]
        co_dn = close_p[i - 1] >= z[i - 1] and close_p[i] < z[i]
        bull_entry[i] = co_up and (trend[i] == 1) and (trend[i - 1] == 1)
        bear_entry[i] = co_dn and (trend[i] == -1) and (trend[i - 1] == -1)

    bull_entry_level = np.full(n, np.nan)
    bear_entry_level = np.full(n, np.nan)
    mask_bull = bull_entry & ~np.isnan(vol)
    mask_bear = bear_entry & ~np.isnan(vol)
    bull_entry_level[mask_bull] = z[mask_bull] - 1.5 * vol[mask_bull]
    bear_entry_level[mask_bear] = z[mask_bear] + 1.5 * vol[mask_bear]

    # Trend change signals: Pine Script plotshape logic
    # plotshape(ta.crossover(trend, 0) ? zlema-volatility : na, "Bullish Trend", ...)
    # plotshape(ta.crossunder(trend, 0) ? zlema+volatility : na, "Bearish Trend", ...)
    trend_up_signal = np.zeros(n, dtype=bool)
    trend_down_signal = np.zeros(n, dtype=bool)
    trend_up_level = np.full(n, np.nan)
    trend_down_level = np.full(n, np.nan)
    
    for i in range(1, n):
        # Crossover: trend crosses above 0 (trend changes to bullish)
        if trend[i] == 1 and trend[i - 1] <= 0:
            trend_up_signal[i] = True
            if not np.isnan(vol[i]):
                trend_up_level[i] = z[i] - vol[i]
        # Crossunder: trend crosses below 0 (trend changes to bearish)
        if trend[i] == -1 and trend[i - 1] >= 0:
            trend_down_signal[i] = True
            if not np.isnan(vol[i]):
                trend_down_level[i] = z[i] + vol[i]

    return {
        'zlema': z,
        'upper_band': upper,
        'lower_band': lower,
        'trend': trend,
        'bull_entry': bull_entry,
        'bear_entry': bear_entry,
        'bull_entry_level': bull_entry_level,
        'bear_entry_level': bear_entry_level,
        'trend_up_signal': trend_up_signal,
        'trend_down_signal': trend_down_signal,
        'trend_up_level': trend_up_level,
        'trend_down_level': trend_down_level,
    }
def detect_support_resistance(prices, window=20, threshold=0.001, max_levels=10):
    """
    Detect support and resistance levels using multiple methods.
    
    Args:
        prices: OCHL data array (4, N)
        window: Lookback window for level detection
        threshold: Minimum price distance for level significance
        max_levels: Maximum number of levels to return for each type
    
    Returns:
        dict: {'support': levels, 'resistance': levels, 'strength': scores}
    """
    highs = prices[HIGH_PRICE]
    lows = prices[LOW_PRICE]
    closes = prices[CLOSE_PRICE]
    n_periods = len(highs)
    
    # Method 1: Local extrema with different window sizes
    resistance_levels = []
    support_levels = []
    
    # Use multiple window sizes to catch different timeframe levels
    windows = [window//3, window//2, window, window*2] if window >= 6 else [window]
    
    for w in windows:
        w = max(3, min(w, n_periods//4))  # Ensure valid window size
        
        for i in range(w, n_periods - w):
            # Resistance (local maxima) - more lenient condition
            if (highs[i] >= max(highs[i-w:i]) and 
                highs[i] >= max(highs[i+1:i+w+1])):
                resistance_levels.append((i, highs[i], w))
            
            # Support (local minima) - more lenient condition
            if (lows[i] <= min(lows[i-w:i]) and 
                lows[i] <= min(lows[i+1:i+w+1])):
                support_levels.append((i, lows[i], w))
    
    # Method 2: Horizontal levels (price levels that were touched multiple times)
    # Find price levels that were tested multiple times
    price_bins = 50
    high_range = np.max(highs) - np.min(highs)
    
    # Test resistance levels (more percentiles for more levels)
    for percentile in [95, 90, 85, 80, 75, 70, 65, 60, 55, 50]:
        level = np.percentile(highs, percentile)
        touches = sum(1 for h in highs if abs(h - level) <= high_range * 0.015)
        if touches >= 1:  # More lenient - level touched at least once
            resistance_levels.append((0, level, touches + percentile/100))  # Add percentile weight
    
    # Test support levels (more percentiles for more levels)
    for percentile in [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]:
        level = np.percentile(lows, percentile)
        touches = sum(1 for l in lows if abs(l - level) <= high_range * 0.015)
        if touches >= 1:  # More lenient - level touched at least once
            support_levels.append((0, level, touches + (100-percentile)/100))  # Add percentile weight
    
    # Method 3: Round number levels (psychological levels)
    current_price = closes[-1]
    price_range = high_range
    
    # Generate round number levels around current price (more aggressive)
    if current_price > 1:
        # For forex pairs - use smaller increments for more levels
        increment = 0.0005 if price_range < 0.1 else 0.001
        base = round(current_price, 4)
        
        # Generate more round number levels
        for i in range(-50, 51):
            level = base + (i * increment)
            if np.min(lows) <= level <= np.max(highs):
                # Add psychological strength based on round number significance
                strength = 3 if i % 10 == 0 else 2 if i % 5 == 0 else 1
                if level > current_price:
                    resistance_levels.append((0, level, strength))
                else:
                    support_levels.append((0, level, strength))
    
    # Remove duplicates and sort by strength/importance
    def deduplicate_and_rank(levels, is_resistance=True):
        if not levels:
            return []
            
        # Remove very close levels
        unique_levels = []
        sorted_levels = sorted(levels, key=lambda x: x[1])
        
        for idx, price, strength in sorted_levels:
            too_close = False
            for existing in unique_levels:
                if abs(price - existing[1]) < threshold:
                    # Keep the stronger level
                    if strength > existing[2]:
                        unique_levels.remove(existing)
                        unique_levels.append((idx, price, strength))
                    too_close = True
                    break
            if not too_close:
                unique_levels.append((idx, price, strength))
        
        # Sort by strength (higher is better) and take top levels
        unique_levels.sort(key=lambda x: x[2], reverse=True)
        return unique_levels[:max_levels]
    
    resistance_final = deduplicate_and_rank(resistance_levels, True)
    support_final = deduplicate_and_rank(support_levels, False)
    
    # Extract just the price levels
    resistance_prices = [level[1] for level in resistance_final]
    support_prices = [level[1] for level in support_final]
    
    return {
        'resistance': resistance_prices,
        'support': support_prices,
        'resistance_points': [(level[0], level[1]) for level in resistance_final],
        'support_points': [(level[0], level[1]) for level in support_final]
    }

def cluster_levels(levels, threshold):
    """Cluster nearby price levels"""
    if not levels:
        return []
    
    clusters = []
    sorted_levels = sorted(levels)
    
    current_cluster = [sorted_levels[0]]
    
    for level in sorted_levels[1:]:
        if abs(level - current_cluster[-1]) <= threshold:
            current_cluster.append(level)
        else:
            clusters.append(np.mean(current_cluster))
            current_cluster = [level]
    
    clusters.append(np.mean(current_cluster))
    return clusters

def fibonacci_levels(high, low, levels=[0.236, 0.382, 0.5, 0.618, 0.786]):
    """
    Calculate Fibonacci retracement levels.
    
    Args:
        high: Highest price in range
        low: Lowest price in range
        levels: List of Fibonacci ratios
    
    Returns:
        dict: Fibonacci levels
    """
    diff = high - low
    fib_levels = {}
    
    for ratio in levels:
        fib_levels[f'fib_{ratio}'] = high - (diff * ratio)
    
    return fib_levels

def pivot_points(prices, method='standard'):
    """
    Calculate pivot points and support/resistance levels.
    
    Args:
        prices: OCHL data array (4, N)
        method: 'standard', 'fibonacci', or 'camarilla'
    
    Returns:
        dict: Pivot levels
    """
    high = prices[HIGH_PRICE, -1]
    low = prices[LOW_PRICE, -1] 
    close = prices[CLOSE_PRICE, -1]
    
    if method == 'standard':
        pivot = (high + low + close) / 3
        r1 = 2 * pivot - low
        s1 = 2 * pivot - high
        r2 = pivot + (high - low)
        s2 = pivot - (high - low)
        r3 = high + 2 * (pivot - low)
        s3 = low - 2 * (high - pivot)
        
        return {
            'pivot': pivot,
            'r1': r1, 'r2': r2, 'r3': r3,
            's1': s1, 's2': s2, 's3': s3
        }
    
    elif method == 'fibonacci':
        pivot = (high + low + close) / 3
        diff = high - low
        
        return {
            'pivot': pivot,
            'r1': pivot + 0.382 * diff,
            'r2': pivot + 0.618 * diff,
            'r3': pivot + 1.000 * diff,
            's1': pivot - 0.382 * diff,
            's2': pivot - 0.618 * diff,
            's3': pivot - 1.000 * diff
        }
    
    elif method == 'camarilla':
        pivot = (high + low + close) / 3
        diff = high - low
        
        return {
            'pivot': pivot,
            'h5': close + 1.618 * diff,
            'h4': close + 1.1/12 * diff,
            'h3': close + 1.1/6 * diff,
            'h2': close + 1.1/4 * diff,
            'h1': close + 1.1/12 * diff,
            'l1': close - 1.1/12 * diff,
            'l2': close - 1.1/4 * diff,
            'l3': close - 1.1/6 * diff,
            'l4': close - 1.1/12 * diff,
            'l5': close - 1.618 * diff
        }

def volume_profile_levels(prices, volume, bins=50):
    """
    Calculate volume profile to identify high-volume price levels.
    
    Args:
        prices: Close prices
        volume: Volume data
        bins: Number of price bins
    
    Returns:
        dict: Volume profile data
    """
    price_range = np.linspace(prices.min(), prices.max(), bins)
    volume_profile = np.zeros(bins-1)
    
    for i in range(len(prices)):
        bin_idx = np.digitize(prices[i], price_range) - 1
        if 0 <= bin_idx < len(volume_profile):
            volume_profile[bin_idx] += volume[i]
    
    # Find high-volume nodes
    threshold = np.percentile(volume_profile, 80)
    high_volume_levels = price_range[:-1][volume_profile > threshold]
    
    return {
        'price_levels': price_range[:-1],
        'volume_profile': volume_profile,
        'high_volume_levels': high_volume_levels,
        'poc': price_range[:-1][np.argmax(volume_profile)]  # Point of Control
    }

def key_levels_composite(prices, volume, window=20, threshold=0.001):
    """
    Composite key level detection combining multiple methods.
    
    Returns:
        dict: All detected key levels with confidence scores
    """
    # Support/Resistance detection (get 10 of each)
    sr_levels = detect_support_resistance(prices, window, threshold, max_levels=10)
    
    # Pivot points (multiple methods)
    pivots_standard = pivot_points(prices, 'standard')
    pivots_fibonacci = pivot_points(prices, 'fibonacci') 
    pivots_camarilla = pivot_points(prices, 'camarilla')
    
    # Volume profile
    vol_profile = volume_profile_levels(prices[CLOSE_PRICE], volume)
    
    # Fibonacci levels - use entire data period for more meaningful levels
    high = np.max(prices[HIGH_PRICE, :])  # Use all data
    low = np.min(prices[LOW_PRICE, :])    # Use all data
    fib_levels = fibonacci_levels(high, low)
    
    # Combine and score levels
    all_levels = []
    
    # Add ALL support/resistance levels with high confidence (prioritize these)
    for i, level in enumerate(sr_levels['support']):
        # Give higher confidence to first few levels (they're ranked by strength)
        confidence = 0.9 - (i * 0.01) if i < 10 else 0.8
        all_levels.append({'price': float(level), 'type': 'support', 'confidence': confidence})
    for i, level in enumerate(sr_levels['resistance']):
        # Give higher confidence to first few levels (they're ranked by strength)  
        confidence = 0.9 - (i * 0.01) if i < 10 else 0.8
        all_levels.append({'price': float(level), 'type': 'resistance', 'confidence': confidence})
    
    # Add ALL pivot points from different methods
    # Standard pivots
    pivot_keys = ['pivot', 'r1', 'r2', 'r3', 's1', 's2', 's3']
    for key in pivot_keys:
        if key in pivots_standard:
            confidence = 0.7 if key in ['pivot', 'r1', 's1'] else 0.6
            all_levels.append({'price': float(pivots_standard[key]), 'type': 'pivots', 'confidence': confidence})
    
    # Fibonacci pivots
    fib_pivot_keys = ['pivot', 'r1', 'r2', 'r3', 's1', 's2', 's3']
    for key in fib_pivot_keys:
        if key in pivots_fibonacci:
            confidence = 0.65 if key in ['pivot', 'r1', 's1'] else 0.55
            all_levels.append({'price': float(pivots_fibonacci[key]), 'type': 'pivots', 'confidence': confidence})
    
    # Camarilla pivots (these use different naming)
    cam_keys = ['pivot', 'h1', 'h2', 'h3', 'h4', 'h5', 'l1', 'l2', 'l3', 'l4', 'l5']
    for key in cam_keys:
        if key in pivots_camarilla:
            confidence = 0.6 if key == 'pivot' else 0.5
            all_levels.append({'price': float(pivots_camarilla[key]), 'type': 'pivots', 'confidence': confidence})
    
    # Add top 5 volume profile levels (more comprehensive)
    vol_levels = sorted(vol_profile['high_volume_levels'], key=lambda x: abs(x - vol_profile['poc']))[:5]
    for i, level in enumerate(vol_levels):
        confidence = 0.8 if i == 0 else 0.7 - (i * 0.1)  # Decreasing confidence
        all_levels.append({'price': float(level), 'type': 'volume', 'confidence': max(confidence, 0.4)})
    
    # Add Point of Control (POC) as a high-confidence volume level
    all_levels.append({'price': float(vol_profile['poc']), 'type': 'volume', 'confidence': 0.9})
    
    # Add ALL Fibonacci levels (they're all important)
    fib_keys = ['fib_0.236', 'fib_0.382', 'fib_0.5', 'fib_0.618', 'fib_0.786']
    for key in fib_keys:
        if key in fib_levels:
            # Higher confidence for key levels
            confidence = 0.7 if key in ['fib_0.382', 'fib_0.618'] else 0.6
            all_levels.append({'price': float(fib_levels[key]), 'type': 'fibonacci', 'confidence': confidence})
    
    # Minimal clustering - preserve almost all support/resistance levels
    clustered_levels = []
    
    # First, add all support and resistance levels with minimal clustering
    sr_levels_only = [l for l in all_levels if l['type'] in ['support', 'resistance']]
    other_levels = [l for l in all_levels if l['type'] not in ['support', 'resistance']]
    
    # For S/R levels, only cluster if they're extremely close (less than 0.1 pip)
    for level in sr_levels_only:
        too_close = False
        for existing in clustered_levels:
            if (existing['type'] == level['type'] and 
                abs(level['price'] - existing['price']) * 10000 < 0.1):  # 0.1 pip threshold
                # Keep the one with higher confidence
                if level['confidence'] > existing['confidence']:
                    clustered_levels.remove(existing)
                    clustered_levels.append(level)
                too_close = True
                break
        if not too_close:
            clustered_levels.append(level)
    
    # For other levels, use normal clustering
    for level in other_levels:
        too_close = False
        for existing in clustered_levels:
            if level['type'] in ['fibonacci', 'volume']:
                distance_threshold = 0.5  # 0.5 pips
            else:  # pivots
                distance_threshold = 1.0  # 1 pip
                
            if abs(level['price'] - existing['price']) * 10000 < distance_threshold:
                if level['confidence'] > existing['confidence']:
                    clustered_levels.remove(existing)
                    clustered_levels.append(level)
                too_close = True
                break
        if not too_close:
            clustered_levels.append(level)
    
    return {
        'levels': clustered_levels,
        'support_resistance': sr_levels,
        'pivots': pivots_standard,
        'pivots_fibonacci': pivots_fibonacci,
        'pivots_camarilla': pivots_camarilla,
        'volume_profile': vol_profile,
        'fibonacci': fib_levels
    }



