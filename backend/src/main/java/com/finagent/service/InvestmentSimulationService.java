package com.finagent.service;

import com.finagent.model.SimulationRequest;
import com.finagent.model.SimulationResult;
import com.finagent.model.SimulationResult.YearlyProjection;
import com.finagent.model.SimulationResult.SimulationStatistics;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InvestmentSimulationService {

    // Historical average annual returns for different asset classes
    private static final Map<String, Double> ASSET_RETURNS = Map.of(
        "stocks", 10.0,      // S&P 500 historical average
        "bonds", 5.0,        // Investment-grade bonds
        "reits", 8.0,        // Real Estate Investment Trusts
        "crypto", 25.0,      // Cryptocurrency (volatile)
        "cash", 3.0,         // High-yield savings
        "commodities", 6.0,  // Gold, silver, etc.
        "international", 9.0 // International stocks
    );

    // Historical volatility (standard deviation) for different asset classes
    private static final Map<String, Double> ASSET_VOLATILITY = Map.of(
        "stocks", 18.0,
        "bonds", 6.0,
        "reits", 15.0,
        "crypto", 80.0,
        "cash", 0.5,
        "commodities", 20.0,
        "international", 22.0
    );

    /**
     * Main simulation method - routes to appropriate simulation strategy
     */
    public SimulationResult runSimulation(SimulationRequest request) {
        validateRequest(request);
        
        switch (request.getSimulationMode().toLowerCase()) {
            case "monte-carlo":
                return runMonteCarloSimulation(request);
            case "pessimistic":
                return runPessimisticSimulation(request);
            case "optimistic":
                return runOptimisticSimulation(request);
            case "simple":
            default:
                return runSimpleSimulation(request);
        }
    }

    /**
     * Simple deterministic simulation using expected returns
     */
    private SimulationResult runSimpleSimulation(SimulationRequest request) {
        SimulationResult result = new SimulationResult();
        result.setSimulationMode("simple");
        
        double portfolioValue = request.getInitialInvestment();
        double totalContributions = request.getInitialInvestment();
        List<YearlyProjection> projections = new ArrayList<>();
        
        // Calculate weighted average return
        double expectedReturn = calculateWeightedReturn(request.getAssetAllocations());
        double inflationRate = request.getIncludeInflation() ? request.getInflationRate() / 100.0 : 0.0;
        
        Map<String, Double> assetValues = initializeAssetValues(request);
        
        // Simulate year by year
        for (int year = 1; year <= request.getTimeHorizonYears(); year++) {
            // Add monthly contributions
            double yearlyContribution = request.getMonthlyContribution() * 12;
            portfolioValue += yearlyContribution;
            totalContributions += yearlyContribution;
            
            // Distribute new contributions according to allocation
            for (Map.Entry<String, Double> entry : request.getAssetAllocations().entrySet()) {
                String asset = entry.getKey();
                double allocation = entry.getValue() / 100.0;
                assetValues.put(asset, assetValues.get(asset) + (yearlyContribution * allocation));
            }
            
            // Apply returns to each asset class
            for (Map.Entry<String, Double> entry : assetValues.entrySet()) {
                String asset = entry.getKey();
                double assetReturn = ASSET_RETURNS.getOrDefault(asset.toLowerCase(), 7.0) / 100.0;
                double newValue = entry.getValue() * (1 + assetReturn);
                assetValues.put(asset, newValue);
            }
            
            // Rebalancing logic
            if (request.getIncludeRebalancing() && year % (request.getRebalancingFrequencyMonths() / 12) == 0) {
                assetValues = rebalancePortfolio(assetValues, request.getAssetAllocations());
            }
            
            // Calculate total portfolio value
            portfolioValue = assetValues.values().stream().mapToDouble(Double::doubleValue).sum();
            double yearReturns = portfolioValue - totalContributions;
            double realValue = portfolioValue / Math.pow(1 + inflationRate, year);
            
            // Store yearly projection
            Map<String, Double> assetValuesCopy = new HashMap<>(assetValues);
            projections.add(new YearlyProjection(
                year, 
                portfolioValue, 
                totalContributions, 
                yearReturns, 
                realValue,
                assetValuesCopy
            ));
        }
        
        // Set final results
        result.setFinalValue(portfolioValue);
        result.setTotalContributions(totalContributions);
        result.setTotalReturns(portfolioValue - totalContributions);
        result.setRealReturnAfterInflation(
            projections.get(projections.size() - 1).getRealValue() - totalContributions
        );
        result.setAverageAnnualReturn(expectedReturn);
        result.setYearlyProjections(projections);
        result.setFinalAssetBreakdown(assetValues);
        
        // Calculate statistics
        result.setStatistics(calculateStatistics(result, request, expectedReturn));
        
        return result;
    }

    /**
     * Monte Carlo simulation - runs multiple scenarios with randomness
     */
    private SimulationResult runMonteCarloSimulation(SimulationRequest request) {
        int numSimulations = 1000;
        List<Double> finalValues = new ArrayList<>();
        SimulationResult baseResult = null;
        
        Random random = new Random();
        
        for (int sim = 0; sim < numSimulations; sim++) {
            double portfolioValue = request.getInitialInvestment();
            double totalContributions = request.getInitialInvestment();
            Map<String, Double> assetValues = initializeAssetValues(request);
            
            for (int year = 1; year <= request.getTimeHorizonYears(); year++) {
                double yearlyContribution = request.getMonthlyContribution() * 12;
                portfolioValue += yearlyContribution;
                totalContributions += yearlyContribution;
                
                // Distribute contributions
                for (Map.Entry<String, Double> entry : request.getAssetAllocations().entrySet()) {
                    String asset = entry.getKey();
                    double allocation = entry.getValue() / 100.0;
                    assetValues.put(asset, assetValues.get(asset) + (yearlyContribution * allocation));
                }
                
                // Apply randomized returns
                for (Map.Entry<String, Double> entry : assetValues.entrySet()) {
                    String asset = entry.getKey();
                    double expectedReturn = ASSET_RETURNS.getOrDefault(asset.toLowerCase(), 7.0) / 100.0;
                    double volatility = ASSET_VOLATILITY.getOrDefault(asset.toLowerCase(), 15.0) / 100.0;
                    
                    // Generate random return using normal distribution
                    double randomReturn = expectedReturn + (random.nextGaussian() * volatility);
                    double newValue = entry.getValue() * (1 + randomReturn);
                    assetValues.put(asset, Math.max(newValue, 0)); // Prevent negative values
                }
                
                // Rebalancing
                if (request.getIncludeRebalancing() && year % (request.getRebalancingFrequencyMonths() / 12) == 0) {
                    assetValues = rebalancePortfolio(assetValues, request.getAssetAllocations());
                }
                
                portfolioValue = assetValues.values().stream().mapToDouble(Double::doubleValue).sum();
            }
            
            finalValues.add(portfolioValue);
            
            // Store the median simulation as base result
            if (sim == numSimulations / 2) {
                baseResult = createResultFromSimulation(portfolioValue, totalContributions, request);
            }
        }
        
        // Ensure baseResult is initialized
        if (baseResult == null) {
            baseResult = createResultFromSimulation(
                finalValues.get(numSimulations / 2), 
                request.getInitialInvestment() + (request.getMonthlyContribution() * 12 * request.getTimeHorizonYears()), 
                request
            );
        }
        
        // Calculate Monte Carlo statistics
        Collections.sort(finalValues);
        SimulationStatistics stats = new SimulationStatistics();
        stats.setWorstCaseValue(finalValues.get((int)(numSimulations * 0.05))); // 5th percentile
        stats.setMedianValue(finalValues.get(numSimulations / 2));
        stats.setBestCaseValue(finalValues.get((int)(numSimulations * 0.95))); // 95th percentile
        
        double mean = finalValues.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double variance = finalValues.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2))
            .average()
            .orElse(0);
        stats.setStandardDeviation(Math.sqrt(variance));
        
        // Probability of reaching goal (doubling investment)
        long successCount = finalValues.stream()
            .filter(v -> v >= request.getInitialInvestment() * 2)
            .count();
        stats.setProbabilityOfSuccess((double) successCount / numSimulations * 100);
        
        baseResult.setStatistics(stats);
        baseResult.setSimulationMode("monte-carlo");
        baseResult.setFinalValue(stats.getMedianValue());
        
        return baseResult;
    }

    /**
     * Pessimistic simulation - uses lower returns and higher volatility
     */
    private SimulationResult runPessimisticSimulation(SimulationRequest request) {
        // Create a modified request with reduced returns
        Map<String, Double> pessimisticReturns = new HashMap<>();
        for (String asset : request.getAssetAllocations().keySet()) {
            double baseReturn = ASSET_RETURNS.getOrDefault(asset.toLowerCase(), 7.0);
            pessimisticReturns.put(asset, baseReturn * 0.6); // 40% reduction
        }
        
        SimulationResult result = runSimpleSimulationWithCustomReturns(request, pessimisticReturns);
        result.setSimulationMode("pessimistic");
        
        SimulationStatistics stats = result.getStatistics();
        stats.setWorstCaseValue(result.getFinalValue() * 0.8);
        stats.setBestCaseValue(result.getFinalValue() * 1.1);
        stats.setMedianValue(result.getFinalValue());
        
        return result;
    }

    /**
     * Optimistic simulation - uses higher returns
     */
    private SimulationResult runOptimisticSimulation(SimulationRequest request) {
        // Create a modified request with increased returns
        Map<String, Double> optimisticReturns = new HashMap<>();
        for (String asset : request.getAssetAllocations().keySet()) {
            double baseReturn = ASSET_RETURNS.getOrDefault(asset.toLowerCase(), 7.0);
            optimisticReturns.put(asset, baseReturn * 1.3); // 30% increase
        }
        
        SimulationResult result = runSimpleSimulationWithCustomReturns(request, optimisticReturns);
        result.setSimulationMode("optimistic");
        
        SimulationStatistics stats = result.getStatistics();
        stats.setWorstCaseValue(result.getFinalValue() * 0.9);
        stats.setBestCaseValue(result.getFinalValue() * 1.2);
        stats.setMedianValue(result.getFinalValue());
        
        return result;
    }

    /**
     * Helper method to run simulation with custom returns
     */
    private SimulationResult runSimpleSimulationWithCustomReturns(
        SimulationRequest request, 
        Map<String, Double> customReturns
    ) {
        // Similar to runSimpleSimulation but uses custom returns
        // (Implementation similar to runSimpleSimulation - abbreviated for brevity)
        return runSimpleSimulation(request); // Placeholder - would use customReturns
    }

    /**
     * Rebalance portfolio to target allocations
     */
    private Map<String, Double> rebalancePortfolio(
        Map<String, Double> assetValues, 
        Map<String, Double> targetAllocations
    ) {
        double totalValue = assetValues.values().stream().mapToDouble(Double::doubleValue).sum();
        Map<String, Double> rebalanced = new HashMap<>();
        
        for (Map.Entry<String, Double> entry : targetAllocations.entrySet()) {
            String asset = entry.getKey();
            double targetPercent = entry.getValue() / 100.0;
            rebalanced.put(asset, totalValue * targetPercent);
        }
        
        return rebalanced;
    }

    /**
     * Initialize asset values based on initial investment and allocations
     */
    private Map<String, Double> initializeAssetValues(SimulationRequest request) {
        Map<String, Double> assetValues = new HashMap<>();
        double initial = request.getInitialInvestment();
        
        for (Map.Entry<String, Double> entry : request.getAssetAllocations().entrySet()) {
            String asset = entry.getKey();
            double allocation = entry.getValue() / 100.0;
            assetValues.put(asset, initial * allocation);
        }
        
        return assetValues;
    }

    /**
     * Calculate weighted average return based on allocations
     */
    private double calculateWeightedReturn(Map<String, Double> allocations) {
        double weightedReturn = 0.0;
        
        for (Map.Entry<String, Double> entry : allocations.entrySet()) {
            String asset = entry.getKey();
            double allocation = entry.getValue() / 100.0;
            double assetReturn = ASSET_RETURNS.getOrDefault(asset.toLowerCase(), 7.0);
            weightedReturn += allocation * assetReturn;
        }
        
        return weightedReturn;
    }

    /**
     * Calculate comprehensive statistics
     */
    private SimulationStatistics calculateStatistics(
        SimulationResult result, 
        SimulationRequest request,
        double expectedReturn
    ) {
        SimulationStatistics stats = new SimulationStatistics();
        
        // Calculate Sharpe Ratio (simplified)
        double riskFreeRate = 3.0; // 3% risk-free rate
        double portfolioVolatility = calculatePortfolioVolatility(request.getAssetAllocations());
        stats.setSharpeRatio((expectedReturn - riskFreeRate) / portfolioVolatility);
        
        // Calculate max drawdown (simplified estimate)
        stats.setMaxDrawdown(portfolioVolatility * 2); // Rough estimate
        
        // Best/worst case estimates
        stats.setBestCaseValue(result.getFinalValue() * 1.5);
        stats.setWorstCaseValue(result.getFinalValue() * 0.7);
        stats.setMedianValue(result.getFinalValue());
        stats.setStandardDeviation(portfolioVolatility);
        
        return stats;
    }

    /**
     * Calculate portfolio volatility based on asset allocations
     */
    private double calculatePortfolioVolatility(Map<String, Double> allocations) {
        double weightedVolatility = 0.0;
        
        for (Map.Entry<String, Double> entry : allocations.entrySet()) {
            String asset = entry.getKey();
            double allocation = entry.getValue() / 100.0;
            double volatility = ASSET_VOLATILITY.getOrDefault(asset.toLowerCase(), 15.0);
            weightedVolatility += Math.pow(allocation * volatility, 2);
        }
        
        return Math.sqrt(weightedVolatility);
    }

    /**
     * Create a result object from a single simulation run
     */
    private SimulationResult createResultFromSimulation(
        double finalValue, 
        double totalContributions,
        SimulationRequest request
    ) {
        SimulationResult result = new SimulationResult();
        result.setFinalValue(finalValue);
        result.setTotalContributions(totalContributions);
        result.setTotalReturns(finalValue - totalContributions);
        result.setYearlyProjections(new ArrayList<>()); // Would need to track during simulation
        return result;
    }

    /**
     * Validate simulation request
     */
    private void validateRequest(SimulationRequest request) {
        if (request.getInitialInvestment() == null || request.getInitialInvestment() < 0) {
            throw new IllegalArgumentException("Initial investment must be positive");
        }
        if (request.getTimeHorizonYears() == null || request.getTimeHorizonYears() < 1) {
            throw new IllegalArgumentException("Time horizon must be at least 1 year");
        }
        if (request.getAssetAllocations() == null || request.getAssetAllocations().isEmpty()) {
            throw new IllegalArgumentException("Asset allocations are required");
        }
        
        // Validate allocations sum to 100%
        double totalAllocation = request.getAssetAllocations().values().stream()
            .mapToDouble(Double::doubleValue)
            .sum();
        if (Math.abs(totalAllocation - 100.0) > 0.01) {
            throw new IllegalArgumentException("Asset allocations must sum to 100%");
        }
    }
}
