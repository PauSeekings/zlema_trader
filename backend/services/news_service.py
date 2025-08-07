import feedparser
import openai
from datetime import datetime
from typing import List, Dict, Any
from config import Config

class NewsService:
    def __init__(self):
        self.openai_client = None
        if Config.OPENAI_API_KEY:
            try:
                self.openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
            except Exception as e:
                print(f"Warning: Could not initialize OpenAI client: {e}")
                self.openai_client = None
    
    def get_news_feed(self, currency_pair: str = "GBP_USD", enable_ai_analysis: bool = True) -> Dict[str, Any]:
        """Get news feed with optional AI sentiment analysis"""
        all_news_items = []
        
        for source, url in Config.NEWS_FEEDS.items():
            news_items = self._fetch_rss_feed(url, Config.MAX_NEWS_ITEMS, currency_pair if enable_ai_analysis else None)
            for item in news_items:
                item['source'] = source
                all_news_items.append(item)
        
        # Sort news by relevance and impact
        all_news_items.sort(key=self._get_sort_key(enable_ai_analysis), reverse=True)
        
        return {
            "news_items": all_news_items,
            "currency_pair": currency_pair,
            "enable_ai_analysis": enable_ai_analysis,
            "timestamp": datetime.now().isoformat()
        }
    
    def _fetch_rss_feed(self, url: str, max_items: int, currency_pair: str = None) -> List[Dict[str, Any]]:
        """Fetch RSS feed and return formatted news items"""
        try:
            feed = feedparser.parse(url)
            news_items = []
            
            for entry in feed.entries[:max_items]:
                title = self._truncate_text(entry.get('title', ''), 100)
                description = self._truncate_text(entry.get('summary', ''), 150)
                published = self._format_date(entry.get('published', ''), entry.get('published_parsed'))
                
                # Analyze impact if currency pair is provided
                analysis = None
                if currency_pair:
                    analysis = self._analyze_news_impact(title, currency_pair)
                
                news_items.append({
                    'title': title,
                    'description': description,
                    'link': entry.get('link', ''),
                    'published': published,
                    'analysis': analysis
                })
            
            return news_items
        except Exception as e:
            return [{'title': f'Error loading feed: {str(e)}', 'description': '', 'link': '', 'published': '', 'analysis': None}]
    
    def _analyze_news_impact(self, headline: str, currency_pair: str) -> Dict[str, str]:
        """Analyze news impact using OpenAI or keyword-based fallback"""
        if not self.openai_client:
            return self._keyword_based_analysis(headline, currency_pair)
        
        try:
            prompt = f"""Analyze how this financial news headline might affect the {currency_pair} currency pair:

Headline: "{headline}"

Consider:
1. Which currency in the pair is most affected by this news
2. Whether this would likely cause {currency_pair} to strengthen or weaken
3. The potential magnitude of impact (high/medium/low)

Respond in this exact format:
IMPACT: [BUY/SELL/NEUTRAL]
REASONING: [Brief explanation]
CONFIDENCE: [HIGH/MEDIUM/LOW]"""
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            
            return self._parse_ai_response(response.choices[0].message.content.strip())
            
        except Exception as e:
            return self._keyword_based_analysis(headline, currency_pair)
    
    def _keyword_based_analysis(self, headline: str, currency_pair: str) -> Dict[str, str]:
        """Simple keyword-based sentiment analysis fallback"""
        headline_lower = headline.lower()
        
        # Bullish keywords
        bullish_keywords = ['rise', 'gain', 'up', 'higher', 'strong', 'positive', 'growth', 'surge', 'rally', 'boost']
        # Bearish keywords  
        bearish_keywords = ['fall', 'drop', 'down', 'lower', 'weak', 'negative', 'decline', 'crash', 'plunge', 'loss']
        
        # Count keyword matches
        bullish_count = sum(1 for word in bullish_keywords if word in headline_lower)
        bearish_count = sum(1 for word in bearish_keywords if word in headline_lower)
        
        # Determine impact
        if bullish_count > bearish_count:
            impact = 'BUY'
            reasoning = f'Headline contains {bullish_count} bullish keywords suggesting positive sentiment'
        elif bearish_count > bullish_count:
            impact = 'SELL'
            reasoning = f'Headline contains {bearish_count} bearish keywords suggesting negative sentiment'
        else:
            impact = 'NEUTRAL'
            reasoning = 'Mixed or neutral sentiment based on keyword analysis'
        
        # Determine confidence based on keyword strength
        total_keywords = bullish_count + bearish_count
        if total_keywords >= 3:
            confidence = 'HIGH'
        elif total_keywords >= 1:
            confidence = 'MEDIUM'
        else:
            confidence = 'LOW'
        
        return {'impact': impact, 'reasoning': reasoning, 'confidence': confidence}
    
    def _parse_ai_response(self, analysis: str) -> Dict[str, str]:
        """Parse AI response into structured format"""
        lines = analysis.split('\n')
        result = {'impact': 'NEUTRAL', 'reasoning': 'Analysis unavailable', 'confidence': 'LOW'}
        
        for line in lines:
            if line.startswith('IMPACT:'):
                result['impact'] = line.split(':', 1)[1].strip()
            elif line.startswith('REASONING:'):
                result['reasoning'] = line.split(':', 1)[1].strip()
            elif line.startswith('CONFIDENCE:'):
                result['confidence'] = line.split(':', 1)[1].strip()
        
        return result
    
    @staticmethod
    def _truncate_text(text: str, max_length: int) -> str:
        """Truncate text to specified length"""
        return text[:max_length] + '...' if len(text) > max_length else text
    
    @staticmethod
    def _format_date(published: str, published_parsed) -> str:
        """Format publication date"""
        if published:
            try:
                if published_parsed:
                    date_obj = datetime(*published_parsed[:6])
                    return date_obj.strftime('%H:%M')
                return published[:10]
            except:
                return published[:10]
        return 'N/A'
    
    @staticmethod
    def _get_sort_key(enable_ai_analysis: bool):
        """Get sorting key function for news items"""
        def sort_key(item):
            if enable_ai_analysis and item.get('analysis'):
                analysis = item['analysis']
                confidence_score = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}.get(analysis['confidence'], 0)
                impact_priority = {'BUY': 3, 'SELL': 3, 'NEUTRAL': 1}.get(analysis['impact'], 1)
                return (impact_priority, confidence_score, item.get('published', ''))
            return (1, 0, item.get('published', ''))
        return sort_key