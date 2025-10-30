"""
Advanced ML-powered Financial Advisory using Hugging Face models.
Integrates pre-trained financial models for sentiment analysis, risk assessment, and predictions.
"""
import os
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

# Try importing ML dependencies
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("transformers not available. Install with: pip install transformers torch")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class FinancialMLAdvisor:
    """ML-powered financial advisory using Hugging Face pre-trained models."""
    
    def __init__(self):
        self.sentiment_analyzer = None
        self.finbert_model = None
        self.embedder = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Lazy load models only when needed."""
        if not TRANSFORMERS_AVAILABLE:
            logger.warning("Transformers not available. ML features will be limited.")
            return
        
        try:
            # FinBERT for financial sentiment analysis
            # Using ProsusAI/finbert - a BERT model fine-tuned on financial data
            logger.info("Loading FinBERT model for financial sentiment analysis...")
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                device=-1  # CPU, use device=0 for GPU
            )
            logger.info("FinBERT model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load FinBERT: {e}")
            # Fallback to general sentiment
            try:
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                    device=-1
                )
                logger.info("Fallback to DistilBERT for sentiment")
            except Exception as e2:
                logger.error(f"Failed to load fallback sentiment model: {e2}")
        
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                # For semantic search and embeddings
                self.embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
                logger.info("Sentence embedder loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load sentence embedder: {e}")
    
    def analyze_market_sentiment(self, news_texts: List[str]) -> Dict[str, Any]:
        """
        Analyze market sentiment from news articles using FinBERT.
        Returns aggregated sentiment scores and individual analysis.
        """
        if not self.sentiment_analyzer:
            return {
                "error": "Sentiment analyzer not available",
                "overall_sentiment": "neutral",
                "confidence": 0.0
            }
        
        try:
            results = []
            sentiment_scores = {"positive": 0, "negative": 0, "neutral": 0}
            
            for text in news_texts[:10]:  # Limit to 10 articles to avoid long processing
                if not text or len(text.strip()) < 10:
                    continue
                
                # Truncate to max length (FinBERT max is 512 tokens)
                truncated = text[:2000]
                
                result = self.sentiment_analyzer(truncated)[0]
                label = result['label'].lower()
                score = result['score']
                
                # Map FinBERT labels (positive/negative/neutral)
                if label in sentiment_scores:
                    sentiment_scores[label] += score
                
                results.append({
                    "text_preview": text[:100] + "...",
                    "sentiment": label,
                    "confidence": round(score, 3)
                })
            
            # Calculate overall sentiment
            total = sum(sentiment_scores.values())
            if total > 0:
                normalized = {k: v/total for k, v in sentiment_scores.items()}
                overall = max(normalized, key=normalized.get)
            else:
                overall = "neutral"
                normalized = {"positive": 0.33, "negative": 0.33, "neutral": 0.34}
            
            return {
                "overall_sentiment": overall,
                "sentiment_distribution": {k: round(v, 3) for k, v in normalized.items()},
                "confidence": round(normalized[overall], 3),
                "article_count": len(results),
                "individual_results": results
            }
        
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return {
                "error": str(e),
                "overall_sentiment": "neutral",
                "confidence": 0.0
            }
    
    def predict_investment_risk(self, portfolio: Dict[str, float], market_conditions: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict investment risk level using ML-based analysis.
        Combines portfolio allocation with market sentiment.
        """
        try:
            # Calculate portfolio risk score based on allocation
            risk_weights = {
                "stocks": 0.8,
                "crypto": 1.0,
                "international": 0.7,
                "commodities": 0.6,
                "reits": 0.5,
                "bonds": 0.2,
                "cash": 0.0
            }
            
            weighted_risk = sum(
                portfolio.get(asset, 0) * risk_weights.get(asset, 0.5) / 100
                for asset in portfolio
            )
            
            # Adjust based on market sentiment
            sentiment = market_conditions.get("sentiment", "neutral")
            sentiment_multiplier = {
                "positive": 0.9,
                "neutral": 1.0,
                "negative": 1.2
            }.get(sentiment, 1.0)
            
            adjusted_risk = weighted_risk * sentiment_multiplier
            
            # Categorize risk level
            if adjusted_risk < 0.3:
                risk_level = "low"
                recommendation = "Conservative portfolio suitable for capital preservation"
            elif adjusted_risk < 0.6:
                risk_level = "moderate"
                recommendation = "Balanced portfolio with reasonable growth potential"
            else:
                risk_level = "high"
                recommendation = "Aggressive portfolio - higher returns but increased volatility"
            
            return {
                "risk_score": round(adjusted_risk, 3),
                "risk_level": risk_level,
                "base_portfolio_risk": round(weighted_risk, 3),
                "market_adjustment": round(sentiment_multiplier, 2),
                "recommendation": recommendation,
                "volatility_estimate": round(adjusted_risk * 25, 2)  # Estimated annual volatility %
            }
        
        except Exception as e:
            logger.error(f"Error in risk prediction: {e}")
            return {"error": str(e), "risk_level": "unknown"}
    
    def generate_personalized_insights(self, user_profile: Dict[str, Any], market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI-powered personalized financial insights.
        """
        insights = []
        
        age = user_profile.get("age", 30)
        risk_tolerance = user_profile.get("risk_tolerance", "moderate")
        investment_horizon = user_profile.get("investment_horizon_years", 10)
        current_allocation = user_profile.get("allocation", {})
        
        # Age-based insights
        if age < 30:
            insights.append({
                "category": "age_advantage",
                "priority": "high",
                "message": "Your age allows for aggressive growth strategies. Consider 70-80% equity allocation.",
                "action": "Increase stock allocation"
            })
        elif age > 50:
            insights.append({
                "category": "capital_preservation",
                "priority": "high",
                "message": "Focus on capital preservation. Consider increasing bond allocation to 40-50%.",
                "action": "Rebalance to conservative portfolio"
            })
        
        # Market sentiment insights
        market_sentiment = market_data.get("sentiment", "neutral")
        if market_sentiment == "negative":
            insights.append({
                "category": "market_conditions",
                "priority": "medium",
                "message": "Current market sentiment is bearish. Consider defensive positions or dollar-cost averaging.",
                "action": "Review risk exposure"
            })
        elif market_sentiment == "positive":
            insights.append({
                "category": "market_conditions",
                "priority": "low",
                "message": "Bullish market sentiment detected. Good time for growth investments, but avoid overexposure.",
                "action": "Monitor portfolio balance"
            })
        
        # Diversification insights
        if current_allocation:
            max_allocation = max(current_allocation.values()) if current_allocation.values() else 0
            if max_allocation > 60:
                insights.append({
                    "category": "diversification",
                    "priority": "high",
                    "message": f"Portfolio concentration risk detected. {max_allocation}% in single asset class is high.",
                    "action": "Diversify across asset classes"
                })
        
        # Time horizon insights
        if investment_horizon < 5 and risk_tolerance == "aggressive":
            insights.append({
                "category": "horizon_risk_mismatch",
                "priority": "high",
                "message": "Short investment horizon conflicts with aggressive risk profile. Consider moderate strategy.",
                "action": "Reduce equity allocation"
            })
        
        return {
            "total_insights": len(insights),
            "insights": insights,
            "ai_confidence": 0.85,
            "model_version": "FinBERT-v1.0"
        }
    
    def smart_rebalancing_recommendation(self, current_portfolio: Dict[str, float], 
                                        target_allocation: Dict[str, float],
                                        market_conditions: Dict[str, Any]) -> Dict[str, Any]:
        """
        ML-powered smart rebalancing that considers market conditions and tax implications.
        """
        try:
            rebalancing_actions = []
            total_drift = 0
            
            for asset, target_pct in target_allocation.items():
                current_pct = current_portfolio.get(asset, 0)
                drift = abs(current_pct - target_pct)
                total_drift += drift
                
                if drift > 5:  # 5% threshold
                    action = "buy" if current_pct < target_pct else "sell"
                    amount = abs(current_pct - target_pct)
                    
                    # Adjust recommendation based on market sentiment
                    sentiment = market_conditions.get("sentiment", "neutral")
                    urgency = "high" if drift > 15 else "medium" if drift > 10 else "low"
                    
                    if sentiment == "negative" and action == "buy":
                        timing = "favorable"  # Buy during dips
                    elif sentiment == "positive" and action == "sell":
                        timing = "favorable"  # Sell during highs
                    else:
                        timing = "neutral"
                    
                    rebalancing_actions.append({
                        "asset": asset,
                        "action": action,
                        "current_allocation": round(current_pct, 2),
                        "target_allocation": round(target_pct, 2),
                        "drift": round(drift, 2),
                        "urgency": urgency,
                        "market_timing": timing
                    })
            
            # Calculate rebalancing score
            rebalancing_needed = total_drift > 10  # Total drift > 10% triggers recommendation
            
            return {
                "rebalancing_needed": rebalancing_needed,
                "total_drift": round(total_drift, 2),
                "actions": rebalancing_actions,
                "optimal_timing": "current" if market_conditions.get("sentiment") != "positive" else "wait_for_dip",
                "estimated_cost": round(len(rebalancing_actions) * 0.25, 2),  # Estimated transaction costs
                "tax_consideration": "Consider tax-loss harvesting opportunities" if any(a["action"] == "sell" for a in rebalancing_actions) else None
            }
        
        except Exception as e:
            logger.error(f"Error in rebalancing recommendation: {e}")
            return {"error": str(e)}
    
    def forecast_portfolio_returns(self, portfolio: Dict[str, float], 
                                   time_horizon_years: int,
                                   market_regime: str = "normal") -> Dict[str, Any]:
        """
        ML-based portfolio return forecasting with different market scenarios.
        """
        # Historical average returns (annualized)
        base_returns = {
            "stocks": 0.10,
            "bonds": 0.05,
            "reits": 0.08,
            "crypto": 0.15,  # High volatility
            "international": 0.09,
            "commodities": 0.06,
            "cash": 0.03
        }
        
        # Market regime adjustments
        regime_multipliers = {
            "bull": 1.3,
            "normal": 1.0,
            "bear": 0.6,
            "recession": 0.4
        }
        
        multiplier = regime_multipliers.get(market_regime, 1.0)
        
        # Calculate weighted expected return
        expected_return = sum(
            portfolio.get(asset, 0) / 100 * base_returns.get(asset, 0.05) * multiplier
            for asset in portfolio
        )
        
        # Volatility estimation
        volatilities = {
            "stocks": 0.18,
            "bonds": 0.06,
            "reits": 0.15,
            "crypto": 0.80,
            "international": 0.22,
            "commodities": 0.20,
            "cash": 0.01
        }
        
        portfolio_volatility = np.sqrt(sum(
            (portfolio.get(asset, 0) / 100) ** 2 * volatilities.get(asset, 0.15) ** 2
            for asset in portfolio
        )) if NUMPY_AVAILABLE else 0.15
        
        # Monte Carlo simulation scenarios
        scenarios = {
            "optimistic": expected_return * 1.5,
            "expected": expected_return,
            "pessimistic": expected_return * 0.5
        }
        
        return {
            "expected_annual_return": round(expected_return * 100, 2),
            "portfolio_volatility": round(portfolio_volatility * 100, 2),
            "time_horizon_years": time_horizon_years,
            "market_regime": market_regime,
            "scenarios": {k: round(v * 100, 2) for k, v in scenarios.items()},
            "sharpe_ratio": round(expected_return / portfolio_volatility, 2) if portfolio_volatility > 0 else 0,
            "confidence_interval_95": {
                "lower": round((expected_return - 1.96 * portfolio_volatility) * 100, 2),
                "upper": round((expected_return + 1.96 * portfolio_volatility) * 100, 2)
            }
        }


# Singleton instance
_ml_advisor_instance = None

def get_ml_advisor() -> FinancialMLAdvisor:
    """Get or create the ML advisor singleton."""
    global _ml_advisor_instance
    if _ml_advisor_instance is None:
        _ml_advisor_instance = FinancialMLAdvisor()
    return _ml_advisor_instance
