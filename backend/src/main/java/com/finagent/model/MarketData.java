package com.finagent.model;

import java.time.LocalDateTime;

public class MarketData {
    private String symbol;
    private String name;
    private Double currentPrice;
    private Double changePercent;
    private Double changeAmount;
    private String market;
    private Long volume;
    private Double high;
    private Double low;
    private Double open;
    private LocalDateTime lastUpdated;

    public MarketData() {}

    public MarketData(String symbol, String name, Double currentPrice, Double changePercent, 
                     Double changeAmount, String market, Long volume, Double high, Double low, 
                     Double open, LocalDateTime lastUpdated) {
        this.symbol = symbol;
        this.name = name;
        this.currentPrice = currentPrice;
        this.changePercent = changePercent;
        this.changeAmount = changeAmount;
        this.market = market;
        this.volume = volume;
        this.high = high;
        this.low = low;
        this.open = open;
        this.lastUpdated = lastUpdated;
    }

    // Getters and Setters
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }

    public Double getChangePercent() { return changePercent; }
    public void setChangePercent(Double changePercent) { this.changePercent = changePercent; }

    public Double getChangeAmount() { return changeAmount; }
    public void setChangeAmount(Double changeAmount) { this.changeAmount = changeAmount; }

    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }

    public Long getVolume() { return volume; }
    public void setVolume(Long volume) { this.volume = volume; }

    public Double getHigh() { return high; }
    public void setHigh(Double high) { this.high = high; }

    public Double getLow() { return low; }
    public void setLow(Double low) { this.low = low; }

    public Double getOpen() { return open; }
    public void setOpen(Double open) { this.open = open; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
