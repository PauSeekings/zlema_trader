import numpy as np
import time, requests
from oandapyV20 import API
from oandapyV20.endpoints.orders import OrderCreate
from oandapyV20.endpoints.trades import TradeClose, TradeDetails,TradeCRCDO, TradesList
from oandapyV20.endpoints.positions import PositionClose
from oandapyV20.endpoints.instruments import InstrumentsCandles as get_prices
from oandapyV20.endpoints.accounts import AccountInstruments, AccountSummary
from oandapyV20.contrib.factories import InstrumentsCandlesFactory
from datetime import datetime
import matplotlib.pyplot as plt
from oandapyV20.endpoints import orders, positions

# plt.rcParams['axes.facecolor'] =  'black'
# plt.rcParams['figure.facecolor'] = 'black'
# plt.rcParams['text.color'] = 'white'
# plt.rcParams['toolbar'] = 'None'
# plt.rcParams[ 'ytick.color'] = 'white'
# plt.rcParams[ 'xtick.color'] = 'white'

OPEN_PRICE = 0
CLOSE_PRICE = 1
HIGH_PRICE = 2
LOW_PRICE = 3
VOLUME  = 4
DTIME = 5
DAY = 6 

PIP = 10000
chat_id = 6058412367
telegram_token = '7095667034:AAEvcave5nbS-fp6qeh6EhYE5UM596SAAZw'

def post_msg(msg, body, output):
	msg += '\n'

	if isinstance(body, dict):
		for k,v in body.items():
			msg +=  str(k) +' : ' + str(v) +'\n' 
	else:
		msg += body
	
	
	match(output):
		case('phone'):
			url = f"https://api.telegram.org/bot{telegram_token}/sendMessage?chat_id={chat_id}&text={msg}"
			res =requests.get(url).json()
			print(msg)
			print('-'*10)
			
		case('console'):
			print(msg)
		case('st'):
			text(msg)
		case('suppress'):
			pass

def post_img(image_path, body):
#def send_photo(chat_id, image_path, image_caption=""):
    # data = {"chat_id": chat_id, "caption": image_caption}
    # url = f"https://api.telegram.org/bot{_TOKEN}/sendPhoto?chat_id={chat_id}"
    # with open(image_path, "rb") as image_file:
    #     ret = requests.post(url, data=data, files={"photo": image_file})
    # return ret.json()
	
	if isinstance(body, dict):
		msg =''
		for k,v in body.items():
			msg +=  str(k) +' : ' + str(v) +'\n' 
	else:
		msg = body

	url = f"https://api.telegram.org/bot{telegram_token}/sendPhoto?chat_id={chat_id}"
	with open(image_path, "rb") as image_file:
		res = requests.post(url, data= {"chat_id": chat_id, "caption": msg}, files={"photo": image_file})
   

import os

def connect(live_mode):
    if live_mode == 'test':
        api_key = os.getenv("OANDA_TEST_API_KEY")
        accountID = os.getenv("OANDA_TEST_ACCOUNT_ID")
        exchange = API(access_token=api_key)
    elif live_mode == 'live':
        api_key = os.getenv("OANDA_LIVE_API_KEY")
        accountID = os.getenv("OANDA_LIVE_ACCOUNT_ID")
        exchange = API(access_token=api_key, environment='live')
    else:
        # Default to test if mode is not recognized
        api_key = os.getenv("OANDA_TEST_API_KEY")
        accountID = os.getenv("OANDA_TEST_ACCOUNT_ID")
        exchange = API(access_token=api_key)
    return exchange, accountID

def parse_prices(candles):
	npdataset = np.zeros((7,len(candles)))
	for i in range(len(candles)):
		str_time = candles[i].get('time')[:19]
		dow = datetime.strptime(str_time[:10], '%Y-%M-%d').weekday()
		d_time = float(str_time[11:13]) + float(str_time[14:16])/100 +  float(str_time[17:19])/10000
		npdataset[:,i] = np.array([candles[i].get('mid')['o'], candles[i].get('mid')['c'], candles[i].get('mid')['h'], candles[i].get('mid')['l'], candles[i].get('volume'), d_time, dow]).T
	return npdataset

def get_price(instrument, frequency, last_n, exchange):
    return parse_prices( exchange.request(get_prices(instrument, {"granularity": frequency, 'count': str(last_n)})).get('candles'))

def get_hist_prices(sym, gran, exchange, start=None, end=None, count=4000):
    """Get historical prices with optional date range"""
    print('Loading historical....')
    candles = []
    
    params = {
        "granularity": gran,
        "count": count
    }
    
    if start:
        params["from"] = start
    if end:
        params["to"] = end
        
    for r in InstrumentsCandlesFactory(instrument=sym, params=params):
        candles.extend(exchange.request(r).get('candles'))
    return parse_prices(candles)

def get_units(exchange, ID,  scale=1):
	response = exchange.request(AccountSummary(ID))
	available_balance = float(response['account']['balance'])
	return int(available_balance * scale)

def get_balance(exchange, ID):
	response = exchange.request(AccountSummary(ID))
	available_balance = float(response['account']['balance'])
	pl = float(response['account']['unrealizedPL'])
	margin = float(response['account']['balance'])
	return available_balance

def update_stats(prefix, profit_history, post_to_slack, hold_durations=None):
	profit_history_array = np.asarray(profit_history)
	postive = profit_history_array > 0
	negative = profit_history_array < 0
	winloss = np.mean(postive)
	profit_ratio = - np.sum(profit_history_array[postive]) / np.sum(profit_history_array[negative])
	average_profit = np.mean(profit_history_array)
	total_profit = np.sum(profit_history_array)
	
	# Base message
	msg = prefix + ' - Profit: ' + str(np.round(profit_history[-1],2)) +'\tMn: ' + str(np.round(average_profit))+ '\tW/L: ' + str(np.round(winloss,2)) + '\tPR: ' + str(np.round(profit_ratio,2))+ '\tTotal: ' + str(np.round(total_profit,2))
	
	# Add hold duration stats if provided
	if hold_durations is not None and len(hold_durations) > 0:
		duration_array = np.asarray(hold_durations)
		avg_hold = np.mean(duration_array)
		min_hold = np.min(duration_array)
		max_hold = np.max(duration_array)
		msg += f'\tHold: {avg_hold:.1f} ({min_hold}-{max_hold})'
	
	post_msg('',msg,post_to_slack)
	
def update_stats_dict(profit_history):
	res={}
	profit_history_array = np.asarray(profit_history)
	postive = profit_history_array > 0
	negative = profit_history_array < 0
	return {
		'Last Trade ' :  np.round(profit_history[-1]), 
		'Win Loss   '  :  np.round(100 * np.mean(postive)),
		'Profit Ratio' :  np.round(- np.sum(profit_history_array[postive]) / np.sum(profit_history_array[negative]),2),
		'Average     ' :  np.round(np.mean(profit_history_array)),
		'Total           ' : np.round(np.sum(profit_history_array)),
		}

	#msg = 'Profit: ' + str(np.round(profit_history[-1],2)) +'\tMn: ' + str(np.round(average_profit))+ '\tW/L: ' + str(np.round(winloss,2)) + '\tPR: ' + str(np.round(profit_ratio,2))+ '\tTotal: ' + str(np.round(total_profit,2))
	

def get_trades(exchange, accountID):
	return  exchange.request(TradesList(accountID))['trades']

def put_order(exchange,ID, symbol, units):
    response = {}
    tries = 6
    while 'orderFillTransaction' not in response.keys() and tries > 0: 
        response = exchange.request(OrderCreate(ID, {'order' : {'type': 'MARKET',
            "instrument": symbol,
            "units" : round(units),
            "timeInForce" : "FOK", 
            "positionFill" : "DEFAULT" }}))
        tries -= 1
        if 'orderFillTransaction' not in response.keys():
            time.sleep(1)
    
    if 'orderFillTransaction' in response.keys():
        return float(response['orderFillTransaction']['price']), response['orderFillTransaction']['id']
    else:
        print(response)
        return None, None

def put_order_sl(exchange,ID, symbol, units,sl):
	response ={}
	tries = 6
	#while 'orderFillTransaction' not in response.keys() and tries > 0: 
	response = exchange.request(OrderCreate(ID, {'order' : {'type': 'MARKET',
	"instrument": symbol,
	"units" : round(units),
	"timeInForce" : "FOK", 
	"positionFill" : "DEFAULT",
	 "stopLossOnFill" : {"timeInForce" : "GTC", 'distance': str(round(sl,5)) },
	  }}))
	tries -=1
	time.sleep(1)

	if 'orderFillTransaction' in response.keys() :
		return float(response['orderFillTransaction']['price']), response['orderFillTransaction']['id']
	else:
		print(response)
		return None, None



		
def put_order_with_tp(exchange,ID, symbol, units, tp):
	tp = np.round(tp,5)
	response = {}
	while 'orderFillTransaction' not in response.keys():
		response = exchange.request(OrderCreate(ID, {'order' : {'type': 'MARKET',
		"instrument": symbol,
		"units" : units,
		"timeInForce" : "FOK", 
		"positionFill" : "DEFAULT", 
		"takeProfitOnFill" : {"timeInForce" : "GTC", "distance": str(tp) }
		}}))
	return float(response['orderFillTransaction']['price']), response['orderFillTransaction']['id']


def put_order_with_tp_sl(exchange,ID, symbol, units, tp, sl, distance_price = 'distance'):
	tp, sl, units  = np.round(tp,5), np.round(sl,5), np.round(units)
	#for trys in range(5):
	response = exchange.request(OrderCreate(ID, {'order' : {'type': 'MARKET',
		"instrument": symbol,
		"units" : str(units),
		"timeInForce" : "FOK", 
		"positionFill" : "DEFAULT", 
		"stopLossOnFill" : {"timeInForce" : "GTC", distance_price: str(sl) },
		"takeProfitOnFill" : {"timeInForce" : "GTC", distance_price: str(tp) }
		}}))

	if 'orderFillTransaction' in response.keys():
		return float(response['orderFillTransaction']['price']), response['orderFillTransaction']['id']
	else:
		print(response['orderCancelTransaction']['reason'])
		return None, None
	
def modify_tp_sl(exchange,ID, tradeID, tp, sl):
	tp, sl  = np.round(tp,5), np.round(sl,5)
	response = exchange.request(TradeCRCDO(ID, tradeID = tradeID, data = 
	{"takeProfit" : {
	"distance" : str(tp),
	"timeInForce" : "GTC"},  
	"stopLoss" :{"distance" : str(sl),
	"timeInForce" : "GTC"}})) 
	return response



def close_trade(exchange,ID, tradeID, options ={'units':'ALL'} ):
	try : 
		result = exchange.request(TradeClose(ID,tradeID, options)) 
		if 'tradesClosed' in result['orderFillTransaction'].keys():
			return  float(result['orderFillTransaction']['tradesClosed'][0]['realizedPL'])
		else:
			return float(result['orderFillTransaction']['tradeReduced']['realizedPL'])
	except:
		print("something happened ")
		return None

def check_trade(exchange, ID, tradeID):
	response = exchange.request(TradeDetails(ID, tradeID = tradeID)) 
	if  response['trade']['state'] == 'OPEN':
		return False,  float(response['trade']['unrealizedPL'] )
	else:
		return True,  float(response['trade']['realizedPL'] )
	

def close_long_positions(exchange,ID, symbol):
	try:
		result = exchange.request(PositionClose(ID,symbol, {'longUnits'  : 'ALL'}))
		return float(result['longOrderFillTransaction']['pl'])
	except:
		return None
	
def close_short_positions(exchange,ID, symbol):
	try:
		result = exchange.request(PositionClose(ID,symbol, {'shortUnits'  : 'ALL'}))
		return float(result['shortOrderFillTransaction']['pl'])	
	except:
		return None
	
def update_stats_2(profit_history, sym):
	profit_history_array = np.asarray(profit_history)
	postive = profit_history_array > 0
	negative = profit_history_array < 0
	winloss = np.mean(postive) 
	profit_ratio = np.sum(profit_history_array[postive]) /    np.abs((np.sum(profit_history_array[negative])) + 0.0001 )
	average_profit = np.mean(profit_history_array)
	total_profit = np.sum(profit_history_array)

	row ={}
	row['Symbol']  =  str(sym)
	row['Trades']  =  (len(profit_history))
	row['Average' ] =  (np.round(average_profit,2))
	row['Winloss'] = (np.round(winloss * 100,1))
	row['Profit Ratio']   = (np.round(profit_ratio,2))
	row['Profit'] =  (np.round(total_profit))
	return row

def find_all_pairs(exchange, ID, type, pricelimit):
	response = exchange.request(AccountInstruments(ID))
	pairs = list()
	for pair in response['instruments']:
		if pair['type'] == type and pair['pipLocation'] == -4:
			price = exchange.request(get_prices(pair['name'], {"granularity": 'D', 'count': str(1)}))
			price = float(price['candles'][0]['mid']['o'])
			if price < pricelimit:
				pairs.append(pair['name'])
	return pairs



def pause(gran):
    time_now  = datetime.now()
    seconds = time_now.second
    minutes = time_now.minute *60 + seconds
    hours  = time_now.hour * 60  * 60 + minutes + seconds
    offset = 1 
    if gran == 'S5':
        sec = (seconds) % 5
    if gran == 'S10':
        sec = (seconds) % 10

    if gran == 'M1':
        sec = (60 - seconds) % 60
    
    if gran == 'M5':
        sec = (5 * 60 - minutes) % (5 * 60)

    if gran == 'M15':
        sec = (15 * 60 -  minutes) % (15 * 60)
    
    if gran == 'H1':
        sec = (60 * 60 -  minutes) % (60 * 60)

    if gran == 'H4':
        sec = (4 * 60 * 60 -  hours) % (4 * 60 * 60)
        offset =  60 

    #print('pausing for ' + str(sec))
    time.sleep(sec + offset)
    #print(datetime.now())

def place_market_order(exchange, accountID, symbol, units, direction):
    """Place a market order and return the order response"""
    data = {
        "order": {
            "units": str(units) if direction == 'buy' else str(-units),
            "instrument": symbol,
            "timeInForce": "FOK",
            "type": "MARKET",
            "positionFill": "DEFAULT"
        }
    }
    r = orders.OrderCreate(accountID, data=data)
    response = exchange.request(r)
    return response

def close_position(exchange, accountID, symbol, trade_id):
    """Close a specific position using its trade ID"""
    data = {
        "longUnits": "ALL"
    }
    r = positions.PositionClose(accountID, symbol, data=data)
    exchange.request(r)
    return r.response