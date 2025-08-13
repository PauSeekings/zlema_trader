import requests
from datetime import datetime, timezone
from typing import Dict, Any, List
import os
from config import Config

class MarketStatusService:
    def __init__(self):
        # Get API key from environment or config
        self.api_key = os.getenv('POLYGON_API_KEY', 'YOUR_POLYGON_API_KEY_HERE')
        self.base_url = "https://api.polygon.io"
        
    def get_market_status(self) -> Dict[str, Any]:
        """Get current market status from Polygon.io"""
        try:
            url = f"{self.base_url}/v1/marketstatus/now"
            params = {"apikey": self.api_key}
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") == "OK":
                return self._format_market_status(data.get("results", {}))
            else:
                return self._get_fallback_status()
                
        except Exception as e:
            print(f"Error fetching market status: {e}")
            return self._get_fallback_status()
    
    def get_upcoming_market_events(self) -> List[Dict[str, Any]]:
        """Get upcoming market opens/closes"""
        try:
            url = f"{self.base_url}/v1/marketstatus/upcoming"
            params = {"apikey": self.api_key}
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") == "OK":
                return self._format_upcoming_events(data.get("results", []))
            else:
                return self._get_fallback_upcoming()
                
        except Exception as e:
            print(f"Error fetching upcoming events: {e}")
            return self._get_fallback_upcoming()
    
    def _format_market_status(self, results: Dict) -> Dict[str, Any]:
        """Format Polygon market status response"""
        current_time = datetime.now(timezone.utc)
        
        current_session, next_session, seconds_to_next = self._get_forex_session_with_countdown(current_time)
        
        return {
            "current_session": current_session,
            "next_session": next_session,
            "seconds_to_next": seconds_to_next,
            "timestamp": current_time.isoformat(),
            "source": "polygon.io"
        }
    
    def _format_upcoming_events(self, results: List) -> List[Dict[str, Any]]:
        """Format upcoming market events"""
        events = []
        
        for event in results[:5]:  # Limit to next 5 events
            events.append({
                "market": event.get("market", "Unknown"),
                "event_type": "open" if event.get("status") == "open" else "close",
                "time": event.get("date", ""),
                "description": f"{event.get('market', 'Market')} {event.get('status', 'event')}"
            })
        
        return events
    
    def _get_forex_session_with_countdown(self, current_time: datetime) -> tuple:
        """Get current forex session and countdown to next session with DST adjustments"""
        from datetime import datetime, timezone
        import calendar
        
        # Get current UTC time info
        utc_now = current_time
        current_seconds = utc_now.hour * 3600 + utc_now.minute * 60 + utc_now.second
        
        # Helper function to check if date is in DST period
        def is_dst_active(dt, region):
            year = dt.year
            month = dt.month
            day = dt.day
            
            if region == "UK":
                # UK DST: Last Sunday in March to last Sunday in October
                march_last_sunday = self._get_last_sunday(year, 3)
                october_last_sunday = self._get_last_sunday(year, 10)
                
                if month < 3 or month > 10:
                    return False
                elif month > 3 and month < 10:
                    return True
                elif month == 3:
                    return day >= march_last_sunday
                elif month == 10:
                    return day < october_last_sunday
                    
            elif region == "US":
                # US DST: Second Sunday in March to first Sunday in November
                march_second_sunday = self._get_nth_sunday(year, 3, 2)
                november_first_sunday = self._get_nth_sunday(year, 11, 1)
                
                if month < 3 or month > 11:
                    return False
                elif month > 3 and month < 11:
                    return True
                elif month == 3:
                    return day >= march_second_sunday
                elif month == 11:
                    return day < november_first_sunday
                    
            elif region == "AU":
                # Australia DST: First Sunday in October to first Sunday in April (next year)
                october_first_sunday = self._get_nth_sunday(year, 10, 1)
                april_first_sunday = self._get_nth_sunday(year, 4, 1)
                
                if month > 10 or month < 4:
                    return True
                elif month > 4 and month < 10:
                    return False
                elif month == 10:
                    return day >= october_first_sunday
                elif month == 4:
                    return day < april_first_sunday
                    
            return False
        
        # Determine session times based on DST
        london_dst = is_dst_active(utc_now, "UK")
        us_dst = is_dst_active(utc_now, "US")
        au_dst = is_dst_active(utc_now, "AU")
        
        # Adjust session times for DST (all times in UTC)
        sessions = [
            {
                "name": "Sydney", 
                "start": (21 - (1 if au_dst else 0)) * 3600,  # AEDT: UTC+11, AEST: UTC+10
                "end": (6 - (1 if au_dst else 0)) * 3600 + 24 * 3600
            },
            {
                "name": "Tokyo", 
                "start": 0 * 3600,  # JST is always UTC+9, no DST
                "end": 9 * 3600
            },
            {
                "name": "London", 
                "start": (8 - (1 if london_dst else 0)) * 3600,  # BST: UTC+1, GMT: UTC+0
                "end": (17 - (1 if london_dst else 0)) * 3600
            },
            {
                "name": "New York", 
                "start": (13 - (1 if us_dst else 0)) * 3600,  # EDT: UTC-4, EST: UTC-5
                "end": (22 - (1 if us_dst else 0)) * 3600
            }
        ]
        
        # Find current session
        current_session = "Market Closed"
        for session in sessions:
            if session["name"] == "Sydney":
                # Sydney spans midnight, handle wrap-around
                start_hour = session["start"] // 3600
                if current_seconds >= session["start"] or current_seconds < (session["end"] - 24 * 3600):
                    current_session = "Sydney Session"
                    break
            else:
                if session["start"] <= current_seconds < session["end"]:
                    current_session = f"{session['name']} Session"
                    break
        
        # Find next session and calculate countdown
        next_session = ""
        seconds_to_next = 0
        
        # Create session starts list with DST adjustments
        session_starts = [
            {"name": "Tokyo", "start": 0 * 3600},
            {"name": "London", "start": (8 - (1 if london_dst else 0)) * 3600},
            {"name": "New York", "start": (13 - (1 if us_dst else 0)) * 3600},
            {"name": "Sydney", "start": (21 - (1 if au_dst else 0)) * 3600}
        ]
        
        for session_start in session_starts:
            if current_seconds < session_start["start"]:
                next_session = f"{session_start['name']} opening"
                seconds_to_next = session_start["start"] - current_seconds
                break
        
        # If no session found today, next is Tokyo tomorrow
        if not next_session:
            next_session = "Tokyo opening"
            seconds_to_next = (24 * 3600) - current_seconds
        
        return current_session, next_session, seconds_to_next
    
    def _get_last_sunday(self, year: int, month: int) -> int:
        """Get the date of the last Sunday in a given month/year"""
        import calendar
        # Get the last day of the month
        last_day = calendar.monthrange(year, month)[1]
        # Find the last Sunday
        for day in range(last_day, 0, -1):
            if calendar.weekday(year, month, day) == 6:  # Sunday = 6
                return day
        return last_day
    
    def _get_nth_sunday(self, year: int, month: int, n: int) -> int:
        """Get the date of the nth Sunday in a given month/year"""
        import calendar
        sunday_count = 0
        last_day = calendar.monthrange(year, month)[1]
        
        for day in range(1, last_day + 1):
            if calendar.weekday(year, month, day) == 6:  # Sunday = 6
                sunday_count += 1
                if sunday_count == n:
                    return day
        return last_day
    
    def _get_fallback_status(self) -> Dict[str, Any]:
        """Fallback market status when API is unavailable"""
        current_time = datetime.now(timezone.utc)
        
        current_session, next_session, seconds_to_next = self._get_forex_session_with_countdown(current_time)
        
        return {
            "current_session": current_session,
            "next_session": next_session,
            "seconds_to_next": seconds_to_next,
            "timestamp": current_time.isoformat(),
            "source": "fallback"
        }
    
    def _get_fallback_upcoming(self) -> List[Dict[str, Any]]:
        """Fallback upcoming events"""
        current_time = datetime.now(timezone.utc)
        
        # Simple upcoming events based on typical schedules
        events = []
        
        # Next US market open (9:30 EST = 14:30 UTC)
        if current_time.hour >= 21 or current_time.weekday() >= 5:
            events.append({
                "market": "US Stocks",
                "event_type": "open", 
                "time": "09:30 EST",
                "description": "US Market Open"
            })
        
        # Next forex session
        forex_session = self._get_next_forex_session(current_time)
        if forex_session:
            events.append(forex_session)
            
        return events
    
    def _get_next_forex_session(self, current_time: datetime) -> Dict[str, Any]:
        """Get next major forex session"""
        hour = current_time.hour
        
        if hour < 8:
            return {
                "market": "Forex",
                "event_type": "session_start",
                "time": "08:00 UTC", 
                "description": "London Session Opens"
            }
        elif hour < 13:
            return {
                "market": "Forex", 
                "event_type": "session_start",
                "time": "13:00 UTC",
                "description": "New York Session Opens"
            }
        elif hour < 21:
            return {
                "market": "Forex",
                "event_type": "session_start", 
                "time": "21:00 UTC",
                "description": "Sydney Session Opens"
            }
        else:
            return {
                "market": "Forex",
                "event_type": "session_start",
                "time": "00:00 UTC",
                "description": "Tokyo Session Opens"
            }
