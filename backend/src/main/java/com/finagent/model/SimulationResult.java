package com.finagent.model;

import java.util.List;
import java.util.Map;

/**
 * Result model containing simulation projections and analysis
 */
public class SimulationResult {
    private Double finalValue;
    private Double totalContributions;
    private Double totalReturns;
    private Double realReturnAfterInflation;
    private Double averageAnnualReturn;
    private List<YearlyProjection> yearlyProjections;
    private Map<String, Double> finalAssetBreakdown;
    private SimulationStatistics statistics;
    private String simulationMode;

    // Nested class for yearly projections
    public static class YearlyProjection {
        private Integer year;
        private Double portfolioValue;
        private Double contributions;
        private Double returns;
        private Double realValue; // Adjusted for inflation
        private Map<String, Double> assetValues;

        public YearlyProjection() {}

        public YearlyProjection(Integer year, Double portfolioValue, Double contributions, 
                               Double returns, Double realValue, Map<String, Double> assetValues) {
            this.year = year;
            this.portfolioValue = portfolioValue;
            this.contributions = contributions;
            this.returns = returns;
            this.realValue = realValue;
            this.assetValues = assetValues;
        }

        // Getters and Setters
        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }
        
        public Double getPortfolioValue() { return portfolioValue; }
        public void setPortfolioValue(Double portfolioValue) { this.portfolioValue = portfolioValue; }
        
        public Double getContributions() { return contributions; }
        public void setContributions(Double contributions) { this.contributions = contributions; }
        
        public Double getReturns() { return returns; }
        public void setReturns(Double returns) { this.returns = returns; }
        
        public Double getRealValue() { return realValue; }
        public void setRealValue(Double realValue) { this.realValue = realValue; }
        
        public Map<String, Double> getAssetValues() { return assetValues; }
        public void setAssetValues(Map<String, Double> assetValues) { this.assetValues = assetValues; }
    }

    // Nested class for statistics
    public static class SimulationStatistics {
        private Double bestCaseValue;
        private Double worstCaseValue;
        private Double medianValue;
        private Double standardDeviation;
        private Double sharpeRatio;
        private Double maxDrawdown;
        private Double probabilityOfSuccess; // For Monte Carlo

        public SimulationStatistics() {}

        // Getters and Setters
        public Double getBestCaseValue() { return bestCaseValue; }
        public void setBestCaseValue(Double bestCaseValue) { this.bestCaseValue = bestCaseValue; }
        
        public Double getWorstCaseValue() { return worstCaseValue; }
        public void setWorstCaseValue(Double worstCaseValue) { this.worstCaseValue = worstCaseValue; }
        
        public Double getMedianValue() { return medianValue; }
        public void setMedianValue(Double medianValue) { this.medianValue = medianValue; }
        
        public Double getStandardDeviation() { return standardDeviation; }
        public void setStandardDeviation(Double standardDeviation) { this.standardDeviation = standardDeviation; }
        
        public Double getSharpeRatio() { return sharpeRatio; }
        public void setSharpeRatio(Double sharpeRatio) { this.sharpeRatio = sharpeRatio; }
        
        public Double getMaxDrawdown() { return maxDrawdown; }
        public void setMaxDrawdown(Double maxDrawdown) { this.maxDrawdown = maxDrawdown; }
        
        public Double getProbabilityOfSuccess() { return probabilityOfSuccess; }
        public void setProbabilityOfSuccess(Double probabilityOfSuccess) { this.probabilityOfSuccess = probabilityOfSuccess; }
    }

    // Main class Getters and Setters
    public Double getFinalValue() {
        return finalValue;
    }

    public void setFinalValue(Double finalValue) {
        this.finalValue = finalValue;
    }

    public Double getTotalContributions() {
        return totalContributions;
    }

    public void setTotalContributions(Double totalContributions) {
        this.totalContributions = totalContributions;
    }

    public Double getTotalReturns() {
        return totalReturns;
    }

    public void setTotalReturns(Double totalReturns) {
        this.totalReturns = totalReturns;
    }

    public Double getRealReturnAfterInflation() {
        return realReturnAfterInflation;
    }

    public void setRealReturnAfterInflation(Double realReturnAfterInflation) {
        this.realReturnAfterInflation = realReturnAfterInflation;
    }

    public Double getAverageAnnualReturn() {
        return averageAnnualReturn;
    }

    public void setAverageAnnualReturn(Double averageAnnualReturn) {
        this.averageAnnualReturn = averageAnnualReturn;
    }

    public List<YearlyProjection> getYearlyProjections() {
        return yearlyProjections;
    }

    public void setYearlyProjections(List<YearlyProjection> yearlyProjections) {
        this.yearlyProjections = yearlyProjections;
    }

    public Map<String, Double> getFinalAssetBreakdown() {
        return finalAssetBreakdown;
    }

    public void setFinalAssetBreakdown(Map<String, Double> finalAssetBreakdown) {
        this.finalAssetBreakdown = finalAssetBreakdown;
    }

    public SimulationStatistics getStatistics() {
        return statistics;
    }

    public void setStatistics(SimulationStatistics statistics) {
        this.statistics = statistics;
    }

    public String getSimulationMode() {
        return simulationMode;
    }

    public void setSimulationMode(String simulationMode) {
        this.simulationMode = simulationMode;
    }
}
