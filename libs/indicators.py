import numpy as np
# import talib as ta  # Commented out since we don't use it in market data endpoint
from scipy import signal

OPEN_PRICE = 0
CLOSE_PRICE =1
HIGH_PRICE = 2
LOW_PRICE =3
VOLUME  = 4 
D_TIME = 5
D_TIME_MOD = 6
PIP = 10000

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
    return eff

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
    # mn_vol = ta.EMA(volume,5) # Commented out as TA-Lib is removed
    for n in range(1,price.shape[1]):
        # if volume[n] > mn_vol[n]: # Commented out as TA-Lib is removed
        vpt[n] = (price[CLOSE_PRICE,n] - price[CLOSE_PRICE,n-1]) * PIP * volume[n]
        # else: # Commented out as TA-Lib is removed
        #     vpt[n] = vpt[n-1]



def supertrend(price, atr_length, atr_multiplier ):
	atr_length = int(atr_length)
	# atr = ta.ATR(price[HIGH_PRICE], price[LOW_PRICE], price[CLOSE_PRICE], atr_length) * atr_multiplier # Commented out as TA-Lib is removed
	# Simplified ATR calculation without TA-Lib
	high_low = price[HIGH_PRICE] - price[LOW_PRICE]
	high_close = np.abs(price[HIGH_PRICE] - np.roll(price[CLOSE_PRICE], 1))
	low_close = np.abs(price[LOW_PRICE] - np.roll(price[CLOSE_PRICE], 1))
	tr = np.maximum(high_low, np.maximum(high_close, low_close))
	atr = np.convolve(tr, np.ones(atr_length)/atr_length, mode='same') * atr_multiplier
	
	barlen = (price[HIGH_PRICE] + price[LOW_PRICE]) /2 
	ub = barlen + atr
	lb = barlen - atr
	fub, flb, supertrend, trade = np.ones_like(ub) , np.ones_like(lb), np.ones_like(lb), np.ones((2, price.shape[1])) * np.nan


	for n in range(atr_length+1,price[0].shape[0]):
		if (ub[n]< fub[n-1]) or (price[CLOSE_PRICE, n-1] > fub[n-1] ):
			fub[n] = ub[n]
		else:
			fub[n] = fub[n-1] 
	
		if (lb[n] > flb[n-1]) or (price[CLOSE_PRICE, n-1] < flb[n-1] ):
			flb[n] = lb[n]
		else:
			flb[n] = flb[n-1] 

	for n in range(0,price[0].shape[0]):
		if ((supertrend[n-1]) == fub[n-1] and (price[CLOSE_PRICE, n] <= fub[n])) or ((supertrend[n-1]) == flb[n-1] and (price[CLOSE_PRICE, n] < flb[n])):
			supertrend[n] =  fub[n]
			trade[0,n] =  fub[n]
			
		elif ((supertrend[n-1]) == fub[n-1] and (price[CLOSE_PRICE, n] > fub[n])) or ( (supertrend[n-1]) == flb[n-1] and (price[CLOSE_PRICE, n] >= flb[n])):
			supertrend[n] = flb[n]
			trade[1,n] = flb[n]
			
	flb[:atr_length +1] = np.nan
	fub[:atr_length +1] = np.nan
	trade[:,:atr_length +1] = np.nan
	supertrend[:atr_length +1] = np.nan
	return supertrend ,flb, fub, trade

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



