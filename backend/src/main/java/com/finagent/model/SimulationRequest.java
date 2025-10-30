package com.finagent.model;

import java.util.Map;

/**
 * Request model for investment simulation
 */
public class SimulationRequest {
    private Double initialInvestment;
    private Double monthlyContribution;
    private Integer timeHorizonYears;
    private Map<String, Double> assetAllocations; // e.g., {"stocks": 60.0, "bonds": 30.0, "cash": 10.0}
    private Boolean includeInflation;
    private Double inflationRate; // Default 3%
    private Boolean includeRebalancing;
    private Integer rebalancingFrequencyMonths; // Default 12
    private String simulationMode; // "simple", "monte-carlo", "pessimistic", "optimistic"

    // Default constructor
    public SimulationRequest() {
        this.includeInflation = true;
        this.inflationRate = 3.0;
        this.includeRebalancing = true;
        this.rebalancingFrequencyMonths = 12;
        this.simulationMode = "simple";
    }

    // Getters and Setters
    public Double getInitialInvestment() {
        return initialInvestment;
    }

    public void setInitialInvestment(Double initialInvestment) {
        this.initialInvestment = initialInvestment;
    }

    public Double getMonthlyContribution() {
        return monthlyContribution;
    }

    public void setMonthlyContribution(Double monthlyContribution) {
        this.monthlyContribution = monthlyContribution;
    }

    public Integer getTimeHorizonYears() {
        return timeHorizonYears;
    }

    public void setTimeHorizonYears(Integer timeHorizonYears) {
        this.timeHorizonYears = timeHorizonYears;
    }

    public Map<String, Double> getAssetAllocations() {
        return assetAllocations;
    }

    public void setAssetAllocations(Map<String, Double> assetAllocations) {
        this.assetAllocations = assetAllocations;
    }

    public Boolean getIncludeInflation() {
        return includeInflation;
    }

    public void setIncludeInflation(Boolean includeInflation) {
        this.includeInflation = includeInflation;
    }

    public Double getInflationRate() {
        return inflationRate;
    }

    public void setInflationRate(Double inflationRate) {
        this.inflationRate = inflationRate;
    }

    public Boolean getIncludeRebalancing() {
        return includeRebalancing;
    }

    public void setIncludeRebalancing(Boolean includeRebalancing) {
        this.includeRebalancing = includeRebalancing;
    }

    public Integer getRebalancingFrequencyMonths() {
        return rebalancingFrequencyMonths;
    }

    public void setRebalancingFrequencyMonths(Integer rebalancingFrequencyMonths) {
        this.rebalancingFrequencyMonths = rebalancingFrequencyMonths;
    }

    public String getSimulationMode() {
        return simulationMode;
    }

    public void setSimulationMode(String simulationMode) {
        this.simulationMode = simulationMode;
    }
}
