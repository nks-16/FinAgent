"""
FastAPI endpoints for ML-powered financial advisory features.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

from app.ml_financial_advisor import get_ml_advisor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["ML Advisory"])


class MarketSentimentRequest(BaseModel):
    news_articles: List[str] = Field(..., description="List of news article texts to analyze")
    

class RiskPredictionRequest(BaseModel):
    portfolio: Dict[str, float] = Field(..., description="Asset allocation percentages")
    market_conditions: Dict[str, Any] = Field(default_factory=dict, description="Current market conditions")


class PersonalizedInsightsRequest(BaseModel):
    age: int = Field(..., ge=18, le=100, description="User age")
    risk_tolerance: str = Field("moderate", description="Risk tolerance: conservative, moderate, aggressive")
    investment_horizon_years: int = Field(..., ge=1, le=50, description="Investment time horizon")
    allocation: Dict[str, float] = Field(default_factory=dict, description="Current portfolio allocation")
    monthly_income: Optional[float] = Field(None, description="Monthly income")


class RebalancingRequest(BaseModel):
    current_portfolio: Dict[str, float] = Field(..., description="Current portfolio allocation")
    target_allocation: Dict[str, float] = Field(..., description="Target portfolio allocation")
    market_conditions: Dict[str, Any] = Field(default_factory=dict, description="Market conditions")


class PortfolioForecastRequest(BaseModel):
    portfolio: Dict[str, float] = Field(..., description="Portfolio allocation")
    time_horizon_years: int = Field(..., ge=1, le=50, description="Forecast time horizon")
    market_regime: str = Field("normal", description="Market regime: bull, normal, bear, recession")


@router.post("/sentiment-analysis")
async def analyze_market_sentiment(request: MarketSentimentRequest):
    """
    Analyze market sentiment from news articles using FinBERT.
    Uses ProsusAI/finbert - a pre-trained model specifically for financial sentiment.
    """
    try:
        advisor = get_ml_advisor()
        result = advisor.analyze_market_sentiment(request.news_articles)
        return {
            "success": True,
            "data": result,
            "model": "FinBERT (ProsusAI)",
            "description": "Financial sentiment analysis using BERT fine-tuned on financial data"
        }
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk-prediction")
async def predict_investment_risk(request: RiskPredictionRequest):
    """
    Predict investment risk using ML-based analysis.
    Combines portfolio allocation with market sentiment analysis.
    """
    try:
        advisor = get_ml_advisor()
        result = advisor.predict_investment_risk(request.portfolio, request.market_conditions)
        return {
            "success": True,
            "data": result,
            "description": "ML-powered risk assessment"
        }
    except Exception as e:
        logger.error(f"Risk prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/personalized-insights")
async def get_personalized_insights(request: PersonalizedInsightsRequest):
    """
    Generate AI-powered personalized financial insights.
    Analyzes user profile and market conditions to provide actionable recommendations.
    """
    try:
        advisor = get_ml_advisor()
        
        user_profile = {
            "age": request.age,
            "risk_tolerance": request.risk_tolerance,
            "investment_horizon_years": request.investment_horizon_years,
            "allocation": request.allocation,
            "monthly_income": request.monthly_income
        }
        
        # You could fetch real market data here
        market_data = {
            "sentiment": "neutral"  # Could be fetched from live data
        }
        
        result = advisor.generate_personalized_insights(user_profile, market_data)
        return {
            "success": True,
            "data": result,
            "description": "AI-generated personalized financial insights"
        }
    except Exception as e:
        logger.error(f"Personalized insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smart-rebalancing")
async def smart_rebalancing_recommendation(request: RebalancingRequest):
    """
    ML-powered smart portfolio rebalancing recommendations.
    Considers market conditions, tax implications, and optimal timing.
    """
    try:
        advisor = get_ml_advisor()
        result = advisor.smart_rebalancing_recommendation(
            request.current_portfolio,
            request.target_allocation,
            request.market_conditions
        )
        return {
            "success": True,
            "data": result,
            "description": "Smart rebalancing with market timing considerations"
        }
    except Exception as e:
        logger.error(f"Rebalancing recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio-forecast")
async def forecast_portfolio_returns(request: PortfolioForecastRequest):
    """
    ML-based portfolio return forecasting with different market scenarios.
    Uses historical data and market regime analysis.
    """
    try:
        advisor = get_ml_advisor()
        result = advisor.forecast_portfolio_returns(
            request.portfolio,
            request.time_horizon_years,
            request.market_regime
        )
        return {
            "success": True,
            "data": result,
            "description": "Portfolio return forecast with scenario analysis"
        }
    except Exception as e:
        logger.error(f"Portfolio forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def ml_health_check():
    """Check if ML models are loaded and available."""
    try:
        advisor = get_ml_advisor()
        return {
            "status": "UP",
            "service": "ML Financial Advisory",
            "models_loaded": {
                "sentiment_analyzer": advisor.sentiment_analyzer is not None,
                "embedder": advisor.embedder is not None
            },
            "available_features": [
                "sentiment_analysis",
                "risk_prediction",
                "personalized_insights",
                "smart_rebalancing",
                "portfolio_forecast"
            ]
        }
    except Exception as e:
        logger.error(f"ML health check error: {e}")
        return {
            "status": "DEGRADED",
            "error": str(e)
        }
