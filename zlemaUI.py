import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
from mplfinance.original_flavor import candlestick2_ohlc
from libs.tradelib import connect, get_price, OPEN_PRICE, CLOSE_PRICE, HIGH_PRICE, LOW_PRICE, PIP, put_order, close_trade, get_hist_prices
from libs.indicators import calc_HA, zlema_ochl,  market_eff_win, calc_rsi
import time
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from datetime import datetime, timedelta
import feedparser
import openai

plt.rcParams['axes.facecolor'] =  'black'
plt.rcParams['figure.facecolor'] = 'black'
plt.rcParams['text.color'] = 'orange'
plt.rcParams['toolbar'] = 'None' 
plt.rcParams[ 'ytick.color'] = 'orange'
plt.rcParams[ 'xtick.color'] = 'black'

st.set_page_config(
    page_title="Real-Time trading",
    page_icon="✅",
    layout="wide",
) 
#st.markdown( f'<style>{open( "assets/style.css" ).read()}</style>' , unsafe_allow_html= True)
# Add Poppins font and custom styling
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

* {
    font-family: 'Poppins', sans-serif;
}

.stApp {
    font-family: 'Poppins', sans-serif;
}
</style>
""", unsafe_allow_html=True)



def is_market_open():
    """Check if forex markets are likely open (simplified check)"""
    now = datetime.now()
    # Forex markets are closed on weekends
    if now.weekday() >= 5:  # Saturday = 5, Sunday = 6
        return False
    # Basic hours check (can be refined)
    return True

@st.cache_data
def calc_multiple_zlema(candles, window_lengths):
    """Calculate ZLEMA for multiple window lengths"""
    zlema_results = [zlema_ochl(candles[:4], window) for window in window_lengths]
    return zlema_results



# --- Indicator calculation ---
def calculate_indicators(data, window_lengths):
    # Create a copy to avoid modifying the original data
    data_copy = data.copy()
    data_copy[:4] = (data_copy[:4] - np.mean(data_copy[:4])) * PIP
    ha = calc_HA(data_copy)
    ha_zlema_list = calc_multiple_zlema(ha, window_lengths)
    zlema_list = calc_multiple_zlema(data_copy, window_lengths)
    return ha_zlema_list, zlema_list

# --- Main chart plotting ---
def plot_main_chart_plotly(data, ha_zlema_list, zlema_list):
    # Calculate market efficiencies and labels
    effs = []
    labels = []
    for i, (ha_z, z_z) in enumerate(zip(ha_zlema_list, zlema_list)):
        for data, prefix in [(ha_z, 'HA ZLEMA'), (z_z, 'ZLEMA')]:
            effs.append(market_eff_win(data[:, -12:]))
            labels.append(f'{prefix} {i+1}')
    
    # Calculate standard deviation and median across all candle types
    all_candles = [data] + ha_zlema_list + zlema_list
    
    # Stack all candles and calculate statistics
    all_candles_array = np.stack(all_candles, axis=0)  # Shape: (n_candles, 4, n_periods)
    all_values = all_candles_array.reshape(-1, all_candles_array.shape[-1])  # Flatten OHLC dimensions
    
    std_devs = np.std(all_values, axis=0)
    medians = np.median(all_values, axis=0)
    ubs = np.percentile(all_values, 95, axis=0)
    lbs = np.percentile(all_values, 5, axis=0)
    
    # Calculate RSI for all_candles variable
    rsi_period = 4
    rsi_data = []
    
    for candle_data in all_candles:
        rsi_data.append(calc_rsi(candle_data[:4], rsi_period))
    
    # Create subplots: 4 rows, shared x-axis, no titles
    fig = make_subplots(rows=4, cols=1, shared_xaxes=True, row_heights=[0.5, 0.15, 0.15, 0.2], vertical_spacing=0.02)
    
    fig.add_trace(go.Scatter(
        y=data[1], mode='lines', name='Close Price',
        line=dict(color='white', width=4),
        opacity=0.5
    ), row=1, col=1)


    # Add candlestick traces for all data types
    candlestick_data = [('Price', data, 0.5)] + [(f'HA ZLEMA {i+1}', ha_z, 0.1) for i, ha_z in enumerate(ha_zlema_list)] + [(f'ZLEMA {i+1}', z_z, 0.1) for i, z_z in enumerate(zlema_list)]
    
    for name, candle_data, opacity in candlestick_data:
        fig.add_trace(go.Candlestick(
            open=candle_data[0], high=candle_data[2], low=candle_data[3], close=candle_data[1],
            name=name, opacity=opacity
        ), row=1, col=1)
    # Overlay actual close price as a line

    
    # Add scatter plot lines for statistics
    scatter_data = [
        (medians, 'Median', 'yellow', 'dash'),
  
    ]
    
    for values, name, color, dash in scatter_data:
        fig.add_trace(go.Scatter(
            y=values, mode='lines', name=name,
            line=dict(color=color, width=2, dash=dash),
            opacity=0.7
        ), row=1, col=1)


    # Market efficiency bar chart in row 2 with average
    avg_eff = np.mean(effs)
    all_labels = labels + ['Average']
    all_effs = effs + [avg_eff]
    all_colors = ['green' if v > 0 else 'red' for v in all_effs]
    all_opacity = [min(1, max(0.2, abs(v))) for v in all_effs]
    
    fig.add_trace(go.Bar(
        x=all_labels, y=all_effs, name="Efficiency",
        marker_color=all_colors,
        marker_opacity=all_opacity
    ), row=2, col=1)
    
    # Standard deviation line in row 3
    fig.add_trace(go.Scatter(
        y=std_devs, mode='lines', name='Std Dev',
        line=dict(color='cyan', width=2),
        opacity=0.8
    ), row=3, col=1)
    
    # RSI lines in row 4
    colors = ['white', 'red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink']
    for i, rsi_values in enumerate(rsi_data):
        color = colors[i % len(colors)]
        fig.add_trace(go.Scatter(
            y=rsi_values, mode='lines', name=f'RSI {i+1}',
            line=dict(color=color, width=1),
            opacity=0.7
        ), row=4, col=1)
    
    # # Add RSI overbought/oversold lines
    # fig.add_hline(y=70, line_dash="dash", line_color="red", opacity=0.5, row=4, col=1)
    # fig.add_hline(y=30, line_dash="dash", line_color="green", opacity=0.5, row=4, col=1)
    
    fig.update_layout(
        xaxis_rangeslider_visible=False,
        plot_bgcolor='black',
        paper_bgcolor='black',
        font_color='orange',
        font_family='Poppins, sans-serif',
        height=1100,
        showlegend=False,
        margin=dict(l=10, r=10, t=10, b=10)
    )
    # fig.update_yaxes(title_text="Price", row=1, col=1)
    # fig.update_yaxes(title_text="Efficiency", row=2, col=1, range=[-1, 1])
    # fig.update_yaxes(title_text="Std Dev", row=3, col=1)
    # fig.update_yaxes(title_text="RSI", row=4, col=1, range=[0, 100])
    return fig

# --- Fragment for auto-refreshing plots ---
@st.fragment(run_every="10s")
def auto_refresh_section(pl_placeholder, chart_placeholder, profit_placeholder, selected_pair, selected_timeframe, selected_periods, exchange, window_lengths):
    try:
        # Check if markets are open before making API calls (only for live/test modes)
        if st.session_state.account_mode != "Practice" and not is_market_open():
            chart_placeholder.info("Markets are closed. Data will refresh when markets reopen.")
            return
            
        # Load data based on account mode
        if st.session_state.account_mode == "Practice":
            # Practice mode: Load historical data once, then simulate real-time feed
            current_time = time.time()
            
            # Load historical data if not already loaded or if parameters changed
            if (st.session_state.practice_data is None or 
                st.session_state.practice_data.get('pair') != selected_pair or
                st.session_state.practice_data.get('timeframe') != selected_timeframe or
                st.session_state.practice_data.get('periods') != selected_periods):
                
                st.session_state.practice_data = {
                    'pair': selected_pair,
                    'timeframe': selected_timeframe,
                    'periods': selected_periods,
                    'data': None
                }
                st.session_state.practice_index = 0
                st.session_state.practice_last_update = current_time
                
                # Load more historical data for simulation
                try:
                    temp_exchange, _ = connect('test')  # Temporary connection for historical data
                    n_candles = 4000  # Load 4000 candles for simulation
                    historical_data = get_price(selected_pair, selected_timeframe, n_candles, temp_exchange)
                    st.session_state.practice_data['data'] = historical_data
                    # Start showing the first 'selected_periods' candles
                    st.session_state.practice_index = selected_periods
                    

                except Exception as e:
                    chart_placeholder.error(f"Error loading historical data: {str(e)}")
                    return
            
            # Progressive indexing: advance based on simulation speed
            simulation_speed = getattr(st.session_state, 'simulation_speed', 10)
            current_time = time.time()
            
            if st.session_state.practice_data['data'] is not None:
                max_index = st.session_state.practice_data['data'].shape[1]
                
                # Check if enough time has passed since last update
                if current_time - st.session_state.practice_last_update >= simulation_speed:
                    if st.session_state.practice_index < max_index:
                        st.session_state.practice_index += 1
                    st.session_state.practice_last_update = current_time
            
            # Get current window of data
            if st.session_state.practice_data['data'] is not None:
                data = st.session_state.practice_data['data']
                total_candles = data.shape[1]
                
                # Ensure we don't exceed total candles
                current_index = min(st.session_state.practice_index, total_candles)
                
                # Use advancing index to show moving window
                end_idx = current_index
                start_idx = max(0, end_idx - selected_periods)
                display_data = data[:, start_idx:end_idx]
                
                # Show practice mode info with timeframe details
                timeframe_minutes = {
                    'M1': 1, 'M5': 5, 'M15': 15, 'H1': 60, 'H4': 240, 'D': 1440
                }
                minutes_per_candle = timeframe_minutes.get(selected_timeframe, 5)
                real_time_seconds = minutes_per_candle * 60
                
                chart_placeholder.info(
                    f"🧪 Practice Mode: {selected_pair} {selected_timeframe} | "
                    f"Position: {current_index}/{total_candles} | "
                    f"Window: {start_idx+1}-{end_idx} | "
                    f"Advancing every 10s"
                )
            else:
                chart_placeholder.error("No historical data available")
                return
        else:
            # Live/Test mode: Get real-time data
            n_candles = selected_periods + 50
            data = get_price(selected_pair, selected_timeframe, n_candles, exchange)
            display_data = data[:, -selected_periods:]

        # Transform the display data for plotting (same as calculate_indicators)
        display_data_transformed = display_data.copy()
        display_data_transformed[:4] = (display_data_transformed[:4] - np.mean(display_data_transformed[:4])) * PIP
        
        ha_zlema_list, zlema_list = calculate_indicators(display_data, window_lengths)
        fig = plot_main_chart_plotly(display_data_transformed, ha_zlema_list, zlema_list)
        chart_placeholder.plotly_chart(fig, use_container_width=True)
        
        # Profit history graph is always last
        if st.session_state.profit_history:
            profit_placeholder.line_chart(st.session_state.profit_history)
        else:
            profit_placeholder.empty()
    except Exception as e:
        # Handle market closed or connection issues gracefully
        if "market closed" in str(e).lower() or "connection" in str(e).lower():
            chart_placeholder.info("Market closed or connection issue. Data will refresh when available.")
        else:
            chart_placeholder.error(f"Error: {str(e)}")

@st.fragment(run_every="10s")
def accounting():
    try:
        # Check if markets are open before making API calls (only for live/test modes)
        if st.session_state.account_mode != "Practice" and not is_market_open():
            st.info("Markets are closed. Trade data will refresh when markets reopen.")
            return
            
        # In practice mode, handle simulated trades
        if st.session_state.account_mode == "Practice":
            st.info("🧪 Practice Mode: Simulated trading enabled")
            
            c1, c2, c3 = st.columns(3)
            for trade in st.session_state.open_trades:
                if trade.get('practice_mode', False):
                    # Calculate current P&L using practice data close price
                    if st.session_state.practice_data and st.session_state.practice_data['data'] is not None:
                        data = st.session_state.practice_data['data']
                        current_index = min(st.session_state.practice_index, data.shape[1])
                        # Use the last candle in the current display window
                        end_idx = current_index
                        start_idx = max(0, end_idx - st.session_state.selected_periods)
                        # Get the last candle's close price from the display window
                        last_candle_idx = end_idx - 1
                        current_price = data[CLOSE_PRICE, last_candle_idx] if last_candle_idx >= 0 else data[CLOSE_PRICE, 0]
                        # Calculate P&L based on units (positive = BUY, negative = SELL)
                        pl = round((current_price - trade['entry_price']) * PIP * np.sign(trade['size']), 2)
                        
                        c1.markdown(f"<p class='row'>{trade['pair']}</p>", unsafe_allow_html=True)
                        c2.markdown(f"<p class='row'>{trade['size']}</p>", unsafe_allow_html=True)
                        c3.pills('close', options=[str(pl)], selection_mode="single", 
                                on_change=close_trade_callback, args=(trade['trade_id'],), 
                                key=f'close_{trade["trade_id"]}', label_visibility="collapsed")
            
            if st.session_state.profit_history:
                st.line_chart(np.cumsum(st.session_state.profit_history))
            else:
                st.markdown('No closed trades in practice mode')
            return
            
        c1, c2, c3 = st.columns(3)
        for trade in st.session_state.open_trades:
            # Calculate current P&L
            current_price = get_price(trade['pair'], 'M5', 1, st.session_state.exchange)[1, -1]
            # Calculate P&L based on units (positive = BUY, negative = SELL)
            pl = round((current_price - trade['entry_price']) * PIP * np.sign(trade['size']), 2)
            
            c1.markdown(f"<p class='row'>{trade['pair']}</p>", unsafe_allow_html=True)
            c2.markdown(f"<p class='row'>{trade['size']}</p>", unsafe_allow_html=True)
            c3.pills('close', options=[str(pl)], selection_mode="single", 
                    on_change=close_trade_callback, args=(trade['trade_id'],), 
                    key=f'close_{trade["trade_id"]}', label_visibility="collapsed")

        if st.session_state.profit_history:
            st.line_chart(np.cumsum(st.session_state.profit_history))
        else:
            st.markdown('No Closed Trades')
    except Exception as e:
        # Handle market closed or connection issues gracefully
        if "market closed" in str(e).lower() or "connection" in str(e).lower():
            st.info("Market closed. Trade data will refresh when available.")
        else:
            st.error(f"Accounting error: {str(e)}")

def close_trade_callback(trade_id):
    """Callback function for closing trades via pills"""
    try:
        # Check if it's a practice mode trade
        trade = next((t for t in st.session_state.open_trades if t['trade_id'] == trade_id), None)
        
        if trade and trade.get('practice_mode', False):
            # Practice mode: Calculate profit using current close price
            if st.session_state.practice_data and st.session_state.practice_data['data'] is not None:
                data = st.session_state.practice_data['data']
                current_index = min(st.session_state.practice_index, data.shape[1])
                # Use the last candle in the current display window
                end_idx = current_index
                start_idx = max(0, end_idx - st.session_state.selected_periods)
                # Get the last candle's close price from the display window
                last_candle_idx = end_idx - 1
                current_price = data[CLOSE_PRICE, last_candle_idx] if last_candle_idx >= 0 else data[CLOSE_PRICE, 0]
                # Calculate profit based on units (positive = BUY, negative = SELL)
                profit = round((current_price - trade['entry_price']) * PIP * np.sign(trade['size']), 2)
                
                st.session_state.profit_history.append(profit)
                st.session_state.open_trades = [
                    t for t in st.session_state.open_trades if t['trade_id'] != trade_id
                ]
        else:
            # Live/Test mode: Real trading
            exchange = st.session_state.exchange
            accountID = st.session_state.accountID
            profit = close_trade(exchange, accountID, trade_id)
            if profit is not None:
                st.session_state.profit_history.append(profit)
            st.session_state.open_trades = [
                t for t in st.session_state.open_trades if t['trade_id'] != trade_id
            ]
    except Exception as e:
        st.error(f"Error closing trade: {e}")

def backtest_strategy(data, ha_zlema_list, zlema_list, window_lengths, scheme='scalp', target_pips=5, stop_loss_pips=10):
    """
    Enhanced backtest strategy with better entry/exit logic
    """
    trades = []
    current_position = None
    entry_price = None
    entry_time = None
    entry_direction = None
    
    # Calculate market efficiencies for each candle
    effs_history = []
    for i in range(len(data[0])):
        effs = []
        for ha_z, z_z in zip(ha_zlema_list, zlema_list):
            if i >= 12:  # Need at least 12 candles for market efficiency
                ha_eff = market_eff_win(ha_z[:, i-12:i+1])
                z_eff = market_eff_win(z_z[:, i-12:i+1])
                effs.extend([ha_eff, z_eff])
            else:
                effs.extend([0, 0])
        effs_history.append(effs)
    
    # Calculate trend strength using ZLEMA alignment
    trend_strength = []
    for i in range(len(data[0])):
        if i >= 24:  # Need enough data for trend calculation
            # Check if ZLEMAs are aligned (trending)
            zlema_aligned = 0
            for z_z in zlema_list:
                if z_z[1][i] > z_z[1][i-1]:  # Close price trending up
                    zlema_aligned += 1
                elif z_z[1][i] < z_z[1][i-1]:  # Close price trending down
                    zlema_aligned -= 1
            trend_strength.append(zlema_aligned / len(zlema_list))
        else:
            trend_strength.append(0)
    
    for i in range(50, len(data[0])):  # Start after warmup period
        current_price = data[CLOSE_PRICE, i]
        current_effs = effs_history[i]
        current_trend = trend_strength[i]
        
        # Enhanced trading conditions
        avg_eff = np.mean(current_effs)
        positive_effs = sum(1 for eff in current_effs if eff > 0)
        negative_effs = sum(1 for eff in current_effs if eff < 0)
        total_effs = len(current_effs)
        
        # Calculate standard deviation for current candle
        if i >= 12:  # Need enough data for std dev calculation
            # Calculate std dev across all OHLC components for current candle
            current_opens = [data[0][i], ha_zlema_list[0][0][i], ha_zlema_list[1][0][i], ha_zlema_list[2][0][i], ha_zlema_list[3][0][i], ha_zlema_list[4][0][i], zlema_list[0][0][i], zlema_list[1][0][i], zlema_list[2][0][i], zlema_list[3][0][i], zlema_list[4][0][i]]
            current_highs = [data[2][i], ha_zlema_list[0][2][i], ha_zlema_list[1][2][i], ha_zlema_list[2][2][i], ha_zlema_list[3][2][i], ha_zlema_list[4][2][i], zlema_list[0][2][i], zlema_list[1][2][i], zlema_list[2][2][i], zlema_list[3][2][i], zlema_list[4][2][i]]
            current_lows = [data[3][i], ha_zlema_list[0][3][i], ha_zlema_list[1][3][i], ha_zlema_list[2][3][i], ha_zlema_list[3][3][i], ha_zlema_list[4][3][i], zlema_list[0][3][i], zlema_list[1][3][i], zlema_list[2][3][i], zlema_list[3][3][i], zlema_list[4][3][i]]
            current_closes = [data[1][i], ha_zlema_list[0][1][i], ha_zlema_list[1][1][i], ha_zlema_list[2][1][i], ha_zlema_list[3][1][i], ha_zlema_list[4][1][i], zlema_list[0][1][i], zlema_list[1][1][i], zlema_list[2][1][i], zlema_list[3][1][i], zlema_list[4][1][i]]
            
            std_dev = np.std([current_opens, current_highs, current_lows, current_closes])
        else:
            std_dev = 0
        
        # Entry conditions for scalping with std dev and efficiency requirements
        if current_position is None:
            # BUY: Efficiency > 0.5, Std Dev >= 2 pips
            if avg_eff > 0.5 and std_dev >= 2:
                current_position = 'BUY'
                entry_price = current_price
                entry_time = i
                entry_direction = 'BUY'
            
            # SELL: Efficiency < -0.5, Std Dev >= 2 pips
            elif avg_eff < -0.5 and std_dev >= 2:
                current_position = 'SELL'
                entry_price = current_price
                entry_time = i
                entry_direction = 'SELL'
        
        # Enhanced exit conditions
        elif current_position is not None:
            exit_signal = False
            profit_pips = 0
            
            if entry_direction == 'BUY':
                profit_pips = (current_price - entry_price)
            else:  # SELL
                profit_pips = (entry_price - current_price)
            
            if scheme == 'scalp':
                # Scalp: Quick profit taking and stop loss
                if profit_pips >= target_pips:
                    exit_signal = True
                elif profit_pips <= -stop_loss_pips:
                    exit_signal = True
                # Time-based exit for scalping (max 10 candles)
                elif i - entry_time >= 10:
                    exit_signal = True
            else:  # swing
                # Swing: Hold until trend reversal or profit target
                if entry_direction == 'BUY':
                    if avg_eff < -0.1 or current_trend < -0.2:
                        exit_signal = True  # Trend reversal
                else:  # SELL
                    if avg_eff > 0.1 or current_trend > 0.2:
                        exit_signal = True  # Trend reversal
                
                # Profit/loss limits for swing trading
                if profit_pips >= 30 or profit_pips <= -20:
                    exit_signal = True
                
                # Time-based exit for swing (max 100 candles)
                if i - entry_time >= 100:
                    exit_signal = True
            
            if exit_signal:
                trades.append({
                    'entry_time': entry_time,
                    'exit_time': i,
                    'direction': entry_direction,
                    'entry_price': entry_price,
                    'exit_price': current_price,
                    'profit_pips': profit_pips,
                    'duration': i - entry_time,
                    'avg_efficiency': avg_eff,
                    'trend_strength': current_trend,
                    'std_dev': std_dev
                })
                current_position = None
                entry_price = None
                entry_time = None
                entry_direction = None
    
    return trades

def calculate_backtest_stats(trades):
    """Calculate comprehensive backtest statistics"""
    if not trades:
        return {
            'total_trades': 0,
            'win_rate': 0,
            'profit_ratio': 0,
            'average_profit': 0,
            'total_profit': 0,
            'max_drawdown': 0,
            'sharpe_ratio': 0,
            'avg_duration': 0,
            'best_trade': 0,
            'worst_trade': 0,
            'consecutive_wins': 0,
            'consecutive_losses': 0
        }
    
    profits = [trade['profit_pips'] for trade in trades]
    wins = [p for p in profits if p > 0]
    losses = [p for p in profits if p < 0]
    durations = [trade['duration'] for trade in trades]
    
    total_trades = len(trades)
    win_rate = len(wins) / total_trades if total_trades > 0 else 0
    profit_ratio = abs(sum(wins) / sum(losses)) if losses else float('inf')
    average_profit = np.mean(profits)
    total_profit = sum(profits)
    avg_duration = np.mean(durations) if durations else 0
    
    # Calculate max drawdown
    cumulative = np.cumsum(profits)
    running_max = np.maximum.accumulate(cumulative)
    drawdown = cumulative - running_max
    max_drawdown = abs(np.min(drawdown)) if len(drawdown) > 0 else 0
    
    # Calculate Sharpe ratio (simplified)
    returns = np.diff(cumulative)
    sharpe_ratio = np.mean(returns) / np.std(returns) if np.std(returns) > 0 else 0
    
    # Calculate consecutive wins/losses
    consecutive_wins = 0
    consecutive_losses = 0
    max_consecutive_wins = 0
    max_consecutive_losses = 0
    current_wins = 0
    current_losses = 0
    
    for profit in profits:
        if profit > 0:
            current_wins += 1
            current_losses = 0
            max_consecutive_wins = max(max_consecutive_wins, current_wins)
        else:
            current_losses += 1
            current_wins = 0
            max_consecutive_losses = max(max_consecutive_losses, current_losses)
    
    return {
        'total_trades': total_trades,
        'win_rate': win_rate,
        'profit_ratio': profit_ratio,
        'average_profit': average_profit,
        'total_profit': total_profit,
        'max_drawdown': max_drawdown,
        'sharpe_ratio': sharpe_ratio,
        'wins': len(wins),
        'losses': len(losses),
        'avg_win': np.mean(wins) if wins else 0,
        'avg_loss': np.mean(losses) if losses else 0,
        'avg_duration': avg_duration,
        'best_trade': max(profits) if profits else 0,
        'worst_trade': min(profits) if profits else 0,
        'consecutive_wins': max_consecutive_wins,
        'consecutive_losses': max_consecutive_losses
    }

def plot_backtest_results(trades, data, stats):
    """Create comprehensive backtest visualization"""
    if not trades:
        st.warning("No trades found in backtest")
        return
    
    # Create subplots
    fig = make_subplots(
        rows=3, cols=1,
        subplot_titles=('Price & Trades', 'Cumulative Profit', 'Trade Distribution'),
        row_heights=[0.5, 0.25, 0.25],
        vertical_spacing=0.1
    )
    
    # Price chart with trade markers
    fig.add_trace(go.Scatter(
        y=data[CLOSE_PRICE], mode='lines', name='Close Price',
        line=dict(color='white', width=1)
    ), row=1, col=1)
    
    # Add trade markers
    for trade in trades:
        color = 'green' if trade['profit_pips'] > 0 else 'red'
        # Entry marker
        fig.add_trace(go.Scatter(
            x=[trade['entry_time']], y=[trade['entry_price']],
            mode='markers', marker=dict(color=color, size=8, symbol='triangle-up' if trade['direction'] == 'BUY' else 'triangle-down'),
            showlegend=False
        ), row=1, col=1)
        # Exit marker
        fig.add_trace(go.Scatter(
            x=[trade['exit_time']], y=[trade['exit_price']],
            mode='markers', marker=dict(color=color, size=8, symbol='x'),
            showlegend=False
        ), row=1, col=1)
    
    # Cumulative profit
    profits = [trade['profit_pips'] for trade in trades]
    cumulative_profit = np.cumsum(profits)
    fig.add_trace(go.Scatter(
        y=cumulative_profit, mode='lines', name='Cumulative Profit',
        line=dict(color='cyan', width=2)
    ), row=2, col=1)
    
    # Trade distribution histogram
    fig.add_trace(go.Histogram(
        x=profits, nbinsx=20, name='Profit Distribution',
        marker_color='orange', opacity=0.7
    ), row=3, col=1)
    
    fig.update_layout(
        plot_bgcolor='black',
        paper_bgcolor='black',
        font_color='orange',
        height=800,
        showlegend=False,
        margin=dict(l=0, r=50, t=50, b=0)
    )
    
    return fig

def run_backtest():
    """Main backtest function"""
    st.header("Backtest Trading Strategy")
    
    # Backtest parameters
    col1, col2 = st.columns(2)
    
    with col1:
        selected_pair = st.selectbox("Currency Pair", ["GBP_USD", "EUR_USD", "USD_JPY", "AUD_USD", "USD_CAD"])
        selected_timeframe = st.selectbox("Timeframe", ["M1", "M5", "M15", "H1", "H4", "D"])
        scheme = st.selectbox("Trading Scheme", ["scalp", "swing"])
    
    with col2:
        target_pips = st.number_input("Target Pips (Scalp)", min_value=1, value=5, step=1)
        stop_loss_pips = st.number_input("Stop Loss Pips", min_value=1, value=10, step=1)
        days_back = st.number_input("Days to Backtest", min_value=1, value=30, step=1)
    
    if st.button("Run Backtest"):
        # Use exactly the same window lengths as live trading
        backtest_window_lengths = [3, 12, 24, 36, 48]
        with st.spinner("Loading historical data..."):
            # Get historical data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            try:
                exchange, _ = connect('test')
                data = get_hist_prices(selected_pair, selected_timeframe, exchange, 
                                     start=start_date.strftime('%Y-%m-%dT%H:%M:%SZ'), 
                                     end=end_date.strftime('%Y-%m-%dT%H:%M:%SZ'))
                
                if data.shape[1] < 100:
                    st.error("Insufficient historical data")
                    return
                
                st.success(f"Loaded {data.shape[1]} candles")
                st.info(f"Data shape: {data.shape}")
                
            except Exception as e:
                st.error(f"Error loading data: {e}")
                return
        
        with st.spinner("Running backtest..."):
            try:
                # Calculate indicators - exactly like live trading
                ha_zlema_list, zlema_list = calculate_indicators(data, backtest_window_lengths)
                
                # Run backtest
                trades = backtest_strategy(data, ha_zlema_list, zlema_list, backtest_window_lengths, scheme, target_pips, stop_loss_pips)
            except Exception as e:
                st.error(f"Error in backtest calculation: {str(e)}")
                st.error(f"Data shape: {data.shape}")
                st.error(f"Window lengths: {backtest_window_lengths}")
                return
            
            # Calculate statistics
            stats = calculate_backtest_stats(trades)
            
            # Display results
            st.subheader("Backtest Results")
            
            # Key metrics
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Trades", stats['total_trades'])
                st.metric("Win Rate", f"{stats['win_rate']:.1%}")
                st.metric("Avg Duration", f"{stats['avg_duration']:.1f} candles")
            with col2:
                st.metric("Total Profit", f"{stats['total_profit']:.1f} pips")
                st.metric("Avg Profit", f"{stats['average_profit']:.1f} pips")
                st.metric("Best Trade", f"{stats['best_trade']:.1f} pips")
            with col3:
                st.metric("Profit Ratio", f"{stats['profit_ratio']:.2f}")
                st.metric("Max Drawdown", f"{stats['max_drawdown']:.1f} pips")
                st.metric("Worst Trade", f"{stats['worst_trade']:.1f} pips")
            with col4:
                st.metric("Sharpe Ratio", f"{stats['sharpe_ratio']:.2f}")
                st.metric("Wins/Losses", f"{stats['wins']}/{stats['losses']}")
                st.metric("Max Consecutive", f"{stats['consecutive_wins']}/{stats['consecutive_losses']}")
            
            # Detailed statistics
            if trades:
                # Summary section
                st.subheader("Performance Summary")
                summary_col1, summary_col2 = st.columns(2)
                
                with summary_col1:
                    st.write(f"**Strategy**: {scheme.upper()}")
                    st.write(f"**Target Pips**: {target_pips}")
                    st.write(f"**Stop Loss**: {stop_loss_pips}")
                    st.write(f"**Time Period**: {days_back} days")
                
                with summary_col2:
                    st.write(f"**Currency Pair**: {selected_pair}")
                    st.write(f"**Timeframe**: {selected_timeframe}")
                    st.write(f"**ZLEMA Windows**: [3, 12, 24, 36, 48]")
                    st.write(f"**Data Points**: {data.shape[1]} candles")
                
                st.subheader("Trade Details")
                df = pd.DataFrame(trades)
                # Format the dataframe for better display
                df['entry_time'] = df['entry_time'].astype(int)
                df['exit_time'] = df['exit_time'].astype(int)
                df['profit_pips'] = df['profit_pips'].round(2)
                df['avg_efficiency'] = df['avg_efficiency'].round(3)
                df['trend_strength'] = df['trend_strength'].round(3)
                df['std_dev'] = df['std_dev'].round(2)
                st.dataframe(df, use_container_width=True)
                
                # Plot results
                fig = plot_backtest_results(trades, data, stats)
                st.plotly_chart(fig, use_container_width=True)
                
                # Save results
                if st.button("Save Results"):
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"backtest_{selected_pair}_{selected_timeframe}_{scheme}_{timestamp}.csv"
                    df.to_csv(f"settings/{filename}", index=False)
                    st.success(f"Results saved to {filename}")

def analyze_news_impact(headline, currency_pair):
    """Analyze how a news headline might affect a specific currency pair using OpenAI"""
    try:
        # Set up OpenAI client using Streamlit secrets
        api_key = st.secrets.get("openai_api_key")
        if not api_key:
            return {
                'impact': 'NEUTRAL',
                'reasoning': 'OpenAI API key not configured in secrets',
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

def fetch_rss_feed(url, max_items=5, currency_pair=None):
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

@st.fragment(run_every="1h")
def news_hourly_fragment(selected_pair, enable_ai_analysis=True):
    try:
        feeds = {
            'CNBC': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
            'MarketWatch': 'https://feeds.marketwatch.com/marketwatch/topstories/'
        }
        all_news_items = []
        for source, url in feeds.items():
            news_items = fetch_rss_feed(url, max_items=4, currency_pair=selected_pair if enable_ai_analysis else None)
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

        for item in all_news_items:
            # Create expander label with impact and confidence
            if enable_ai_analysis and item.get('analysis'):
                impact = item['analysis']['impact']
                if impact == 'BUY':
                    color = '#00ff00'
                    icon = '🟢'
                elif impact == 'SELL':
                    color = '#ff4444'
                    icon = '🔴'
                else:
                    color = '#ffaa00'
                    icon = '🟡'
                conf = item['analysis']['confidence']
                expander_label = f"{icon} {impact} ({conf}) - {item['title'][:50]}..."
            else:
                expander_label = f"📰 {item['title'][:50]}..."
            
            with st.expander(expander_label, expanded=False):
                st.markdown(f"<span style='font-weight: bold; font-size: 15px;'>{item['title']}</span>", unsafe_allow_html=True)
                st.markdown(f"<span style='color: #888; font-size: 12px;'>{item.get('published','')} | {item['source']}</span>", unsafe_allow_html=True)
                if enable_ai_analysis and item.get('analysis'):
                    impact = item['analysis']['impact']
                    if impact == 'BUY':
                        color = '#00ff00'
                        icon = '🟢'
                    elif impact == 'SELL':
                        color = '#ff4444'
                        icon = '🔴'
                    else:
                        color = '#ffaa00'
                        icon = '🟡'
                    conf = item['analysis']['confidence']
                    st.markdown(f"<span style='color: {color}; font-weight: bold;'>{icon} {impact}</span> <span style='color: {color}; font-size: 12px;'>({conf})</span>", unsafe_allow_html=True)
                    reasoning = item['analysis']['reasoning']
                    st.markdown(f"<span style='color: #ccc; font-size: 12px;'>{reasoning}</span>", unsafe_allow_html=True)
                if item['link']:
                    st.markdown(f"<a href='{item['link']}' target='_blank' style='color: #4CAF50; font-size: 12px;'>Read more →</a>", unsafe_allow_html=True)
    except Exception as e:
        st.info("News feed temporarily unavailable. Will refresh when available.")

def main():
    # Initialize session state for account mode
    if 'account_mode' not in st.session_state:
        st.session_state.account_mode = "Test"
        st.session_state.exchange, st.session_state.accountID = connect('test')
    
    # Initialize session state for multiple trades
    if 'open_trades' not in st.session_state:
        st.session_state.open_trades = []
    
    # Initialize profit history
    if 'profit_history' not in st.session_state:
        st.session_state.profit_history = []
    
    # Initialize practice mode data
    if 'practice_data' not in st.session_state:
        st.session_state.practice_data = None
    if 'practice_index' not in st.session_state:
        st.session_state.practice_index = 0
    if 'practice_last_update' not in st.session_state:
        st.session_state.practice_last_update = time.time()
    
    # Initialize session state
    if 'selected_pair' not in st.session_state:
        st.session_state.selected_pair = "GBP_USD"
    if 'selected_timeframe' not in st.session_state:
        st.session_state.selected_timeframe = "M5"
    if 'selected_periods' not in st.session_state:
        st.session_state.selected_periods = 12*4

    # Connect to Oanda once per interaction
    exchange = st.session_state.exchange
    accountID = st.session_state.accountID

    # Create tabs for live trading and backtesting
    tab1, tab2 = st.tabs(["Live Trading", "Backtest"])
    
    with tab1:
        # Show practice mode indicator
        if st.session_state.account_mode == "Practice":
            col1, col2 = st.columns([3, 1])
            with col1:
                st.info("🧪 **Practice Mode Active**: Using historical data for analysis. Trading is disabled.")
            with col2:
                if st.button("🔄 Reset Simulation", help="Restart the practice simulation from the beginning"):
                    st.session_state.practice_data = None
                    st.session_state.practice_index = 0
                    st.session_state.practice_last_update = time.time()
                    st.rerun()
        
        # Sidebar controls
        with st.sidebar:
            st.header("🎛️ Trading Controls")
            
            # Account mode at the top
            account_mode = st.pills("Account Mode", ["Test", "Live", "Practice"], 
                                   default=st.session_state.account_mode,
                                   key="account_mode_pills")
            
            # Update account mode if changed
            if st.session_state.account_mode != account_mode:
                st.session_state.account_mode = account_mode
                # Only reset trade-specific state, not everything
                st.session_state.current_trade_id = None
                st.session_state.current_trade_direction = None
                st.session_state.current_trade_price = None
                # Don't reset profit_history on mode change
                # st.session_state.profit_history = []
                if account_mode == "Practice":
                    # Practice mode doesn't need real connection
                    st.session_state.exchange = None
                    st.session_state.accountID = None
                else:
                    st.session_state.exchange, st.session_state.accountID = connect('test' if account_mode == 'Test' else 'live')
                # Use st.rerun() for account mode changes
                st.rerun()
            
            # Trading controls
            currency_pairs = ["GBP_USD", "EUR_USD", "USD_JPY", "AUD_USD", "USD_CAD"]
            selected_pair = st.pills("Currency Pair", currency_pairs, 
                                    default=st.session_state.selected_pair,
                                    key="pair_select")
            st.session_state.selected_pair = selected_pair
            
            timeframes = ["M1", "M5", "M15", 'H1', 'H4', 'D']
            selected_timeframe = st.pills("Timeframe", timeframes, 
                                         default=st.session_state.selected_timeframe,
                                         key="timeframe_select")
            st.session_state.selected_timeframe = selected_timeframe
            
            # Dynamic data period pills based on timeframe
            period_options = {
                "M1": [("15M", 15), ("1H", 60), ("4H", 240), ("12H", 720)],
                "M5": [("1H", 12), ("4H", 48), ("12H", 144), ("24H", 288)],
                "M15": [("4H", 16), ("12H", 4*12), ("24H", 24 *4 ), ("48H", 4*48)],
                "H1": [("12H", 12), ("24H", 24), ("48H", 48), ("96H", 96)],
                "H4": [("48H", 12), ("96H", 96//4), ("180H", 180//4), ("360H", 360//4)],
                "D": [("D5", 5), ("D25", 25), ("D200", 200), ("D400", 400)]
            }
            
            current_periods = period_options.get(selected_timeframe, [("30", 30), ("60", 60), ("120", 120), ("200", 200)])
            labels = [label for label, value in current_periods]
            values = [value for label, value in current_periods]
            
            # Find the default label
            try:
                default_idx = values.index(st.session_state.selected_periods)
            except ValueError:
                default_idx = 0
            
            selected_label = st.pills("Data Period", labels, default=labels[default_idx], key="period_pills")
            selected_value = dict(current_periods)[selected_label]
            st.session_state.selected_periods = selected_value
            
            window_lengths = [3, 12, 24, 36, 48]
            trade_size = st.number_input("Trade Size (units)", min_value=1000, value=50000, step=1000)
            
            # Buy/Sell buttons
            col_buy, col_sell = st.columns(2)
            with col_buy:
                buy_clicked = st.button("BUY", key="buy_btn", use_container_width=True)
                if buy_clicked:
                    if st.session_state.account_mode == "Practice":
                        # Practice mode: Simulate trade using current close price
                        if st.session_state.practice_data and st.session_state.practice_data['data'] is not None:
                            data = st.session_state.practice_data['data']
                            current_index = min(st.session_state.practice_index, data.shape[1])
                            # Use the last candle in the current display window
                            end_idx = current_index
                            start_idx = max(0, end_idx - st.session_state.selected_periods)
                            # Get the last candle's close price from the display window
                            last_candle_idx = end_idx - 1
                            current_price = data[CLOSE_PRICE, last_candle_idx] if last_candle_idx >= 0 else data[CLOSE_PRICE, 0]
                            trade_id = f"practice_buy_{int(time.time())}"
                            st.session_state.open_trades.append({
                                'trade_id': trade_id,
                                'direction': 'BUY',
                                'size': trade_size,
                                'entry_price': current_price,
                                'pair': selected_pair,
                                'practice_mode': True
                            })
                    else:
                        # Live/Test mode: Real trading
                        try:
                            price, trade_id = put_order(exchange, accountID, selected_pair, trade_size)
                            if trade_id:
                                st.session_state.open_trades.append({
                                    'trade_id': trade_id,
                                    'direction': 'BUY',
                                    'size': trade_size,
                                    'entry_price': price,
                                    'pair': selected_pair
                                })
                        except Exception:
                            pass
            with col_sell:
                sell_clicked = st.button("SELL", key="sell_btn", use_container_width=True)
                if sell_clicked:
                    if st.session_state.account_mode == "Practice":
                        # Practice mode: Simulate trade using current close price
                        if st.session_state.practice_data and st.session_state.practice_data['data'] is not None:
                            data = st.session_state.practice_data['data']
                            current_index = min(st.session_state.practice_index, data.shape[1])
                            # Use the last candle in the current display window
                            end_idx = current_index
                            start_idx = max(0, end_idx - st.session_state.selected_periods)
                            # Get the last candle's close price from the display window
                            last_candle_idx = end_idx - 1
                            current_price = data[CLOSE_PRICE, last_candle_idx] if last_candle_idx >= 0 else data[CLOSE_PRICE, 0]
                            trade_id = f"practice_sell_{int(time.time())}"
                            st.session_state.open_trades.append({
                                'trade_id': trade_id,
                                'direction': 'SELL',
                                'size': -trade_size,  # Negative units for SELL
                                'entry_price': current_price,
                                'pair': selected_pair,
                                'practice_mode': True
                            })
                    else:
                        # Live/Test mode: Real trading
                        try:
                            price, trade_id = put_order(exchange, accountID, selected_pair, -trade_size)
                            if trade_id:
                                st.session_state.open_trades.append({
                                    'trade_id': trade_id,
                                    'direction': 'SELL',
                                    'size': trade_size,
                                    'entry_price': price,
                                    'pair': selected_pair
                                })
                        except Exception:
                            pass
            
            # Practice mode controls
            if st.session_state.account_mode == "Practice":
                st.divider()
                st.subheader("🧪 Practice Mode")
                if st.button("🔄 Reset Simulation", help="Restart the practice simulation from the beginning"):
                    st.session_state.practice_data = None
                    st.session_state.practice_index = 0
                    st.session_state.practice_last_update = time.time()
                    st.rerun()
                
                # Add speed control for practice mode (adjusted for timeframe)
                timeframe_minutes = {
                    'M1': 1, 'M5': 5, 'M15': 15, 'H1': 60, 'H4': 240, 'D': 1440
                }
                minutes_per_candle = timeframe_minutes.get(st.session_state.selected_timeframe, 5)
                default_speed = max(1, min(60, minutes_per_candle * 2))  # 2x real-time for short timeframes
                
                simulation_speed = st.slider("Simulation Speed (seconds per candle)", 
                                           min_value=1, max_value=120, value=default_speed, step=1,
                                           help=f"How fast the practice simulation advances (real-time: {minutes_per_candle*60}s)")
                st.session_state.simulation_speed = simulation_speed
            
            # AI News Analysis
            st.divider()
            st.subheader("🤖 AI News Analysis")
            enable_ai = st.toggle("Enable AI News Analysis", value=True, help="Toggle AI sentiment analysis for news headlines")
            # Disable AI analysis in practice mode
            if st.session_state.account_mode == "Practice":
                enable_ai = False
                st.info("AI analysis disabled in Practice mode")
            
            # News feed
            news_hourly_fragment(st.session_state.selected_pair, enable_ai)
            
            # Accounting section
            st.divider()
            st.subheader("💰 Account")
            accounting()
        
        # Main chart area - full width
        chart_placeholder = st.empty()
        auto_refresh_section(
            st.empty(), chart_placeholder, st.empty(),
            selected_pair, selected_timeframe, st.session_state.selected_periods, exchange, window_lengths
        )
        
    with tab2:
        run_backtest()

if __name__ == "__main__":
    main() 