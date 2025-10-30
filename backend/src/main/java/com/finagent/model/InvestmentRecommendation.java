package com.finagent.model;

public class InvestmentRecommendation {
    private String type;
    private String name;
    private String description;
    private Double allocationPercentage;
    private String riskLevel;
    private String timeframe;
    private String expectedReturn;
    private String reason;

    public InvestmentRecommendation() {
    }

    public InvestmentRecommendation(String type, String name, String description, 
                                   Double allocationPercentage, String riskLevel, 
                                   String timeframe, String expectedReturn, String reason) {
        this.type = type;
        this.name = name;
        this.description = description;
        this.allocationPercentage = allocationPercentage;
        this.riskLevel = riskLevel;
        this.timeframe = timeframe;
        this.expectedReturn = expectedReturn;
        this.reason = reason;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getAllocationPercentage() {
        return allocationPercentage;
    }

    public void setAllocationPercentage(Double allocationPercentage) {
        this.allocationPercentage = allocationPercentage;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getTimeframe() {
        return timeframe;
    }

    public void setTimeframe(String timeframe) {
        this.timeframe = timeframe;
    }

    public String getExpectedReturn() {
        return expectedReturn;
    }

    public void setExpectedReturn(String expectedReturn) {
        this.expectedReturn = expectedReturn;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
