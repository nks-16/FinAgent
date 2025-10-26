"""
Recommendation engines for personal finance decision support.
Uses heuristic rules and lightweight calculations (SOLID principles: SRP, OCP).
"""
from typing import Dict, Any, List


def budget_allocation(monthly_income: float, current_needs: float = 0, current_wants: float = 0, current_savings: float = 0) -> Dict[str, Any]:
    """50/30/20 budget allocation rule with personalized suggestions."""
    needs_target = monthly_income * 0.50
    wants_target = monthly_income * 0.30
    savings_target = monthly_income * 0.20
    
    needs_delta = needs_target - current_needs
    wants_delta = wants_target - current_wants
    savings_delta = savings_target - current_savings
    
    suggestions = []
    if needs_delta < -monthly_income * 0.05:
        suggestions.append("Consider reducing essential expenses or increasing income.")
    if wants_delta < -monthly_income * 0.05:
        suggestions.append("Discretionary spending is high; redirect 5-10% to savings.")
    if savings_delta < 0:
        suggestions.append("Great! You're saving above the 20% benchmark.")
    elif savings_delta > monthly_income * 0.10:
        suggestions.append("Boost savings by cutting wants or negotiating needs.")
    
    return {
        "rule": "50/30/20",
        "targets": {"needs": needs_target, "wants": wants_target, "savings": savings_target},
        "current": {"needs": current_needs, "wants": current_wants, "savings": current_savings},
        "delta": {"needs": needs_delta, "wants": wants_delta, "savings": savings_delta},
        "suggestions": suggestions,
    }


def debt_payoff_strategy(debts: List[Dict[str, float]]) -> Dict[str, Any]:
    """Avalanche (highest interest first) vs Snowball (smallest balance first) comparison."""
    if not debts:
        return {"strategy": "none", "message": "No debts to prioritize."}
    
    # Sort for avalanche (highest rate) and snowball (smallest balance)
    avalanche = sorted(debts, key=lambda d: d.get("rate", 0), reverse=True)
    snowball = sorted(debts, key=lambda d: d.get("balance", 0))
    
    total_balance = sum(d.get("balance", 0) for d in debts)
    weighted_rate = sum(d.get("balance", 0) * d.get("rate", 0) for d in debts) / total_balance if total_balance else 0
    
    return {
        "total_balance": round(total_balance, 2),
        "weighted_avg_rate": round(weighted_rate, 2),
        "avalanche_order": [{"name": d.get("name", ""), "balance": d.get("balance", 0), "rate": d.get("rate", 0)} for d in avalanche],
        "snowball_order": [{"name": d.get("name", ""), "balance": d.get("balance", 0)} for d in snowball],
        "recommendation": "avalanche" if weighted_rate > 5.0 else "snowball",
        "reason": "Minimize interest cost" if weighted_rate > 5.0 else "Quick wins for motivation",
    }


def emergency_fund_target(monthly_expenses: float, risk_profile: str = "moderate") -> Dict[str, Any]:
    """Calculate emergency fund target based on risk tolerance."""
    multipliers = {"conservative": 6, "moderate": 4, "aggressive": 3}
    months = multipliers.get(risk_profile.lower(), 4)
    target = monthly_expenses * months
    
    return {
        "risk_profile": risk_profile,
        "months_coverage": months,
        "target_amount": round(target, 2),
        "suggestion": f"Aim for {months} months of expenses in a high-yield savings account.",
    }


def risk_profile_score(age: int, income: float, savings: float, debt: float, investment_horizon_years: int) -> Dict[str, Any]:
    """Basic risk profiling heuristic (questionnaire alternative)."""
    score = 0
    
    # Age factor: younger → more aggressive
    if age < 30:
        score += 3
    elif age < 45:
        score += 2
    else:
        score += 1
    
    # Savings cushion
    if savings > income * 0.5:
        score += 2
    elif savings > income * 0.25:
        score += 1
    
    # Debt burden
    if debt < income * 0.1:
        score += 2
    elif debt < income * 0.3:
        score += 1
    
    # Horizon
    if investment_horizon_years > 10:
        score += 2
    elif investment_horizon_years > 5:
        score += 1
    
    # Map score to profile
    if score >= 7:
        profile = "aggressive"
        allocation = {"stocks": 80, "bonds": 15, "cash": 5}
    elif score >= 4:
        profile = "moderate"
        allocation = {"stocks": 60, "bonds": 30, "cash": 10}
    else:
        profile = "conservative"
        allocation = {"stocks": 40, "bonds": 50, "cash": 10}
    
    return {
        "score": score,
        "profile": profile,
        "allocation": allocation,
        "explanation": f"Score {score}/10 suggests {profile} risk tolerance.",
    }


def generate_recommendations(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Orchestrator for all recommendation modules."""
    recs = {}
    
    # Budget
    if "monthly_income" in user_data:
        recs["budget"] = budget_allocation(
            user_data["monthly_income"],
            user_data.get("current_needs", 0),
            user_data.get("current_wants", 0),
            user_data.get("current_savings", 0),
        )
    
    # Debt
    if "debts" in user_data:
        recs["debt"] = debt_payoff_strategy(user_data["debts"])
    
    # Emergency fund
    if "monthly_expenses" in user_data:
        recs["emergency_fund"] = emergency_fund_target(
            user_data["monthly_expenses"],
            user_data.get("risk_profile", "moderate"),
        )
    
    # Risk profile
    if all(k in user_data for k in ["age", "income", "savings", "debt", "investment_horizon_years"]):
        recs["risk"] = risk_profile_score(
            user_data["age"],
            user_data["income"],
            user_data["savings"],
            user_data["debt"],
            user_data["investment_horizon_years"],
        )
    
    return recs
