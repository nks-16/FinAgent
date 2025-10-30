package com.finagent.service;

import com.finagent.model.InvestmentRecommendation;
import com.finagent.model.RiskProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class InvestmentRecommendationService {

    @Autowired
    private RiskAssessmentService riskAssessmentService;

    /**
     * Generate personalized investment recommendations based on user profile
     * @param userProfile User's financial data
     * @return List of investment recommendations
     */
    public List<InvestmentRecommendation> generateRecommendations(Map<String, Object> userProfile) {
        // Calculate risk profile first
        RiskProfile riskProfile = riskAssessmentService.calculateRiskProfile(userProfile);
        String riskCategory = riskProfile.getCategory();
        
        List<InvestmentRecommendation> recommendations = new ArrayList<>();
        
        // Generate recommendations based on risk category
        switch (riskCategory) {
            case "Conservative":
                recommendations.addAll(generateConservativePortfolio());
                break;
            case "Moderate":
                recommendations.addAll(generateModeratePortfolio());
                break;
            case "Aggressive":
                recommendations.addAll(generateAggressivePortfolio());
                break;
        }
        
        return recommendations;
    }
    
    private List<InvestmentRecommendation> generateConservativePortfolio() {
        List<InvestmentRecommendation> recommendations = new ArrayList<>();
        
        recommendations.add(new InvestmentRecommendation(
            "Bonds",
            "Government & Corporate Bonds",
            "High-grade bonds providing stable income with minimal risk",
            50.0,
            "Low",
            "Long-term (5-10 years)",
            "3-5% annually",
            "Your conservative risk profile prioritizes capital preservation. Bonds provide steady income with low volatility."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "ETFs",
            "Bond ETFs (AGG, BND)",
            "Diversified bond exposure through low-cost exchange-traded funds",
            20.0,
            "Low",
            "Medium-term (3-5 years)",
            "3-4% annually",
            "ETFs offer easy diversification across thousands of bonds with minimal fees."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Stocks",
            "Dividend Aristocrats",
            "Blue-chip companies with 25+ years of dividend growth",
            15.0,
            "Low-Medium",
            "Long-term (10+ years)",
            "6-8% annually",
            "Established companies like Johnson & Johnson, Coca-Cola provide reliable dividends and moderate growth."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Real Estate",
            "REITs (Real Estate Investment Trusts)",
            "Income-generating real estate without property management",
            10.0,
            "Medium",
            "Medium-term (5-7 years)",
            "5-7% annually",
            "REITs provide real estate exposure with high dividend yields and portfolio diversification."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Cash",
            "High-Yield Savings & Money Market",
            "Emergency fund and short-term cash reserves",
            5.0,
            "Very Low",
            "Short-term (0-1 year)",
            "4-5% annually",
            "Maintain liquidity for emergencies while earning competitive interest rates."
        ));
        
        return recommendations;
    }
    
    private List<InvestmentRecommendation> generateModeratePortfolio() {
        List<InvestmentRecommendation> recommendations = new ArrayList<>();
        
        recommendations.add(new InvestmentRecommendation(
            "Stocks",
            "S&P 500 Index Funds",
            "Broad market exposure to 500 largest US companies",
            35.0,
            "Medium",
            "Long-term (7-10 years)",
            "8-10% annually",
            "Your moderate risk profile benefits from diversified stock exposure with proven long-term growth."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Bonds",
            "Investment-Grade Corporate Bonds",
            "Quality corporate bonds balancing yield and safety",
            25.0,
            "Low-Medium",
            "Medium-term (3-7 years)",
            "4-6% annually",
            "Bonds provide stability during market volatility while generating income."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "ETFs",
            "Sector ETFs (Technology, Healthcare)",
            "Targeted exposure to high-growth sectors",
            20.0,
            "Medium-High",
            "Long-term (5-10 years)",
            "10-12% annually",
            "Sector funds capture growth in innovation-driven industries with managed risk."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Real Estate",
            "Real Estate Crowdfunding",
            "Direct real estate investments with lower capital requirements",
            10.0,
            "Medium",
            "Medium-term (5-7 years)",
            "8-10% annually",
            "Real estate provides inflation protection and portfolio diversification."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Mutual Funds",
            "Balanced Funds (60/40 Stock/Bond)",
            "Professional management with automatic rebalancing",
            8.0,
            "Medium",
            "Long-term (7-10 years)",
            "7-9% annually",
            "Balanced funds maintain optimal risk-return ratio through professional management."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Cryptocurrency",
            "Bitcoin & Ethereum (Small Allocation)",
            "Digital assets for long-term growth potential",
            2.0,
            "High",
            "Long-term (10+ years)",
            "15-25% annually (volatile)",
            "Small crypto allocation adds high-growth potential without excessive risk to overall portfolio."
        ));
        
        return recommendations;
    }
    
    private List<InvestmentRecommendation> generateAggressivePortfolio() {
        List<InvestmentRecommendation> recommendations = new ArrayList<>();
        
        recommendations.add(new InvestmentRecommendation(
            "Stocks",
            "Growth Stocks & Tech Companies",
            "High-growth companies in AI, cloud computing, and biotech",
            40.0,
            "High",
            "Long-term (10+ years)",
            "12-18% annually",
            "Your aggressive profile can withstand volatility for substantial long-term growth potential."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "ETFs",
            "Emerging Markets ETFs",
            "Exposure to high-growth developing economies",
            20.0,
            "High",
            "Long-term (7-15 years)",
            "10-15% annually",
            "Emerging markets offer higher growth rates than developed markets with acceptable volatility."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Cryptocurrency",
            "Diversified Crypto Portfolio",
            "Bitcoin, Ethereum, and select altcoins",
            15.0,
            "Very High",
            "Long-term (10+ years)",
            "20-30% annually (highly volatile)",
            "Crypto represents the future of finance with massive upside potential for long-term holders."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Real Estate",
            "Private Real Estate Syndications",
            "Direct ownership in commercial properties",
            10.0,
            "Medium-High",
            "Medium-term (5-7 years)",
            "12-15% annually",
            "Private real estate deals offer superior returns compared to public REITs."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Stocks",
            "Small-Cap Growth Stocks",
            "Smaller companies with explosive growth potential",
            10.0,
            "Very High",
            "Long-term (7-10 years)",
            "15-20% annually",
            "Small-cap stocks can deliver outsized returns as companies scale and mature."
        ));
        
        recommendations.add(new InvestmentRecommendation(
            "Bonds",
            "High-Yield Bonds",
            "Higher-risk corporate bonds with attractive yields",
            5.0,
            "Medium-High",
            "Medium-term (3-5 years)",
            "6-8% annually",
            "High-yield bonds balance your equity-heavy portfolio while maintaining growth focus."
        ));
        
        return recommendations;
    }
}
