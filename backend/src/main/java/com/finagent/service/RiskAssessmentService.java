package com.finagent.service;

import com.finagent.model.RiskProfile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RiskAssessmentService {

    /**
     * Calculate risk score and profile based on user financial data
     * @param userProfile User's financial profile including age, income, goals, etc.
     * @return RiskProfile with score, category, and recommendations
     */
    public RiskProfile calculateRiskProfile(Map<String, Object> userProfile) {
        int riskScore = 0;
        
        // Age-based risk (younger = higher risk tolerance)
        Integer age = (Integer) userProfile.get("age");
        if (age != null) {
            if (age < 30) riskScore += 25;
            else if (age < 40) riskScore += 20;
            else if (age < 50) riskScore += 15;
            else if (age < 60) riskScore += 10;
            else riskScore += 5;
        } else {
            riskScore += 15; // Default moderate
        }
        
        // Income stability (higher income = more risk tolerance)
        Double monthlyIncome = (Double) userProfile.get("monthlyIncome");
        if (monthlyIncome != null) {
            if (monthlyIncome > 10000) riskScore += 25;
            else if (monthlyIncome > 7000) riskScore += 20;
            else if (monthlyIncome > 5000) riskScore += 15;
            else if (monthlyIncome > 3000) riskScore += 10;
            else riskScore += 5;
        } else {
            riskScore += 15;
        }
        
        // Investment experience
        String experience = (String) userProfile.get("investmentExperience");
        if (experience != null) {
            switch (experience.toLowerCase()) {
                case "expert":
                    riskScore += 25;
                    break;
                case "intermediate":
                    riskScore += 15;
                    break;
                case "beginner":
                    riskScore += 5;
                    break;
                default:
                    riskScore += 10;
            }
        } else {
            riskScore += 10;
        }
        
        // Time horizon for investments
        String timeHorizon = (String) userProfile.get("timeHorizon");
        if (timeHorizon != null) {
            switch (timeHorizon.toLowerCase()) {
                case "long":
                    riskScore += 25;
                    break;
                case "medium":
                    riskScore += 15;
                    break;
                case "short":
                    riskScore += 5;
                    break;
                default:
                    riskScore += 15;
            }
        } else {
            riskScore += 15;
        }
        
        // Ensure score is within 0-100
        riskScore = Math.min(100, Math.max(0, riskScore));
        
        // Determine category
        String category;
        if (riskScore <= 40) {
            category = "Conservative";
        } else if (riskScore <= 70) {
            category = "Moderate";
        } else {
            category = "Aggressive";
        }
        
        // Generate recommendations based on category
        List<RiskProfile.RiskRecommendation> recommendations = generateRecommendations(category, riskScore);
        
        return new RiskProfile(riskScore, category, recommendations);
    }
    
    private List<RiskProfile.RiskRecommendation> generateRecommendations(String category, int score) {
        List<RiskProfile.RiskRecommendation> recommendations = new ArrayList<>();
        
        switch (category) {
            case "Conservative":
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Focus on Bonds and Fixed Income",
                    "Allocate 60-70% to government bonds and high-grade corporate bonds for stable returns."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Emergency Fund Priority",
                    "Build 6-12 months of expenses in high-yield savings before investing aggressively."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Blue-Chip Stocks Only",
                    "If investing in stocks, focus on established dividend-paying companies with long track records."
                ));
                break;
                
            case "Moderate":
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Balanced Portfolio Approach",
                    "Maintain a 60/40 stock-to-bond ratio for growth with manageable risk."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Diversify Across Sectors",
                    "Spread investments across technology, healthcare, finance, and consumer goods."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Consider Index Funds",
                    "Low-cost index funds provide broad market exposure with minimal management fees."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Quarterly Rebalancing",
                    "Review and rebalance your portfolio every 3 months to maintain target allocations."
                ));
                break;
                
            case "Aggressive":
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Growth Stock Focus",
                    "Allocate 70-80% to growth stocks in emerging sectors like AI, renewable energy, and biotech."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Alternative Investments",
                    "Consider real estate, commodities, and cryptocurrency for portfolio diversification."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "International Exposure",
                    "Include 20-30% in international markets, especially emerging economies with high growth potential."
                ));
                recommendations.add(new RiskProfile.RiskRecommendation(
                    "Long-Term Holding Strategy",
                    "Ride out market volatility by maintaining positions for 5-10 years minimum."
                ));
                break;
        }
        
        return recommendations;
    }
}
