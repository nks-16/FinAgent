package com.finagent.service;

import com.finagent.model.MarketData;
import org.springframework.stereotype.Service;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MarketDataService {

    /**
     * Scrape market indices data from Yahoo Finance
     */
    public List<MarketData> getMarketIndices() {
        List<MarketData> indices = new ArrayList<>();
        
        try {
            // Scrape major indices (S&P 500, Dow Jones, NASDAQ)
            indices.add(scrapeYahooQuote("^GSPC", "S&P 500"));
            indices.add(scrapeYahooQuote("^DJI", "Dow Jones"));
            indices.add(scrapeYahooQuote("^IXIC", "NASDAQ"));
            indices.add(scrapeYahooQuote("GC=F", "Gold"));
            indices.add(scrapeYahooQuote("CL=F", "Crude Oil"));
        } catch (Exception e) {
            System.err.println("Error fetching market indices: " + e.getMessage());
        }

        // If scraping failed, provide sample data
        if (indices.isEmpty() || indices.stream().allMatch(m -> m.getCurrentPrice() == 0.0)) {
            return getSampleIndices();
        }

        return indices;
    }

    /**
     * Scrape cryptocurrency prices
     */
    public List<MarketData> getCryptoPrices() {
        List<MarketData> cryptos = new ArrayList<>();
        
        try {
            cryptos.add(scrapeYahooQuote("BTC-USD", "Bitcoin"));
            cryptos.add(scrapeYahooQuote("ETH-USD", "Ethereum"));
            cryptos.add(scrapeYahooQuote("BNB-USD", "Binance Coin"));
        } catch (Exception e) {
            System.err.println("Error fetching crypto prices: " + e.getMessage());
        }

        // If scraping failed, provide sample data
        if (cryptos.isEmpty() || cryptos.stream().allMatch(m -> m.getCurrentPrice() == 0.0)) {
            return getSampleCrypto();
        }

        return cryptos;
    }

    /**
     * Get personalized stock watchlist based on user investments
     */
    public List<MarketData> getWatchlist(String[] symbols) {
        List<MarketData> watchlist = new ArrayList<>();
        
        for (String symbol : symbols) {
            try {
                MarketData data = scrapeYahooQuote(symbol, symbol);
                if (data != null) {
                    watchlist.add(data);
                }
            } catch (Exception e) {
                System.err.println("Error fetching " + symbol + ": " + e.getMessage());
            }
        }

        return watchlist;
    }

    /**
     * Scrape Yahoo Finance for a specific quote
     */
    private MarketData scrapeYahooQuote(String symbol, String name) {
        try {
            String url = "https://finance.yahoo.com/quote/" + symbol;
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            MarketData data = new MarketData();
            data.setSymbol(symbol);
            data.setName(name);
            data.setLastUpdated(LocalDateTime.now());
            data.setMarket("US");

            // Extract price data (selectors may need adjustment based on Yahoo's current HTML)
            try {
                String priceStr = doc.select("fin-streamer[data-symbol='" + symbol + "']").first() != null
                        ? doc.select("fin-streamer[data-symbol='" + symbol + "']").first().attr("value")
                        : "0";
                data.setCurrentPrice(Double.parseDouble(priceStr));
            } catch (Exception e) {
                data.setCurrentPrice(0.0);
            }

            try {
                Element changeElem = doc.select("fin-streamer[data-field='regularMarketChange']").first();
                if (changeElem != null) {
                    data.setChangeAmount(Double.parseDouble(changeElem.attr("value")));
                }
            } catch (Exception e) {
                data.setChangeAmount(0.0);
            }

            try {
                Element changePercentElem = doc.select("fin-streamer[data-field='regularMarketChangePercent']").first();
                if (changePercentElem != null) {
                    String percentStr = changePercentElem.attr("value");
                    data.setChangePercent(Double.parseDouble(percentStr));
                }
            } catch (Exception e) {
                data.setChangePercent(0.0);
            }

            return data;
        } catch (Exception e) {
            System.err.println("Error scraping " + symbol + ": " + e.getMessage());
            return createFallbackData(symbol, name);
        }
    }

    private MarketData createFallbackData(String symbol, String name) {
        MarketData data = new MarketData();
        data.setSymbol(symbol);
        data.setName(name);
        data.setCurrentPrice(0.0);
        data.setChangePercent(0.0);
        data.setChangeAmount(0.0);
        data.setLastUpdated(LocalDateTime.now());
        return data;
    }

    /**
     * Provides realistic sample market indices when scraping fails
     */
    private List<MarketData> getSampleIndices() {
        List<MarketData> indices = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // S&P 500
        MarketData sp500 = new MarketData();
        sp500.setSymbol("^GSPC");
        sp500.setName("S&P 500");
        sp500.setCurrentPrice(4783.45);
        sp500.setChangeAmount(23.87);
        sp500.setChangePercent(0.50);
        sp500.setLastUpdated(now);
        sp500.setMarket("US");
        indices.add(sp500);

        // Dow Jones
        MarketData dow = new MarketData();
        dow.setSymbol("^DJI");
        dow.setName("Dow Jones");
        dow.setCurrentPrice(37440.34);
        dow.setChangeAmount(157.06);
        dow.setChangePercent(0.42);
        dow.setLastUpdated(now);
        dow.setMarket("US");
        indices.add(dow);

        // NASDAQ
        MarketData nasdaq = new MarketData();
        nasdaq.setSymbol("^IXIC");
        nasdaq.setName("NASDAQ");
        nasdaq.setCurrentPrice(15043.97);
        nasdaq.setChangeAmount(28.51);
        nasdaq.setChangePercent(0.19);
        nasdaq.setLastUpdated(now);
        nasdaq.setMarket("US");
        indices.add(nasdaq);

        // Gold
        MarketData gold = new MarketData();
        gold.setSymbol("GC=F");
        gold.setName("Gold");
        gold.setCurrentPrice(2042.50);
        gold.setChangeAmount(-8.30);
        gold.setChangePercent(-0.40);
        gold.setLastUpdated(now);
        gold.setMarket("Commodities");
        indices.add(gold);

        // Crude Oil
        MarketData oil = new MarketData();
        oil.setSymbol("CL=F");
        oil.setName("Crude Oil");
        oil.setCurrentPrice(73.25);
        oil.setChangeAmount(1.15);
        oil.setChangePercent(1.59);
        oil.setLastUpdated(now);
        oil.setMarket("Commodities");
        indices.add(oil);

        return indices;
    }

    /**
     * Provides realistic sample cryptocurrency data when scraping fails
     */
    private List<MarketData> getSampleCrypto() {
        List<MarketData> cryptos = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Bitcoin
        MarketData btc = new MarketData();
        btc.setSymbol("BTC-USD");
        btc.setName("Bitcoin");
        btc.setCurrentPrice(45234.67);
        btc.setChangeAmount(1234.56);
        btc.setChangePercent(2.81);
        btc.setLastUpdated(now);
        btc.setMarket("Crypto");
        cryptos.add(btc);

        // Ethereum
        MarketData eth = new MarketData();
        eth.setSymbol("ETH-USD");
        eth.setName("Ethereum");
        eth.setCurrentPrice(2456.78);
        eth.setChangeAmount(87.23);
        eth.setChangePercent(3.68);
        eth.setLastUpdated(now);
        eth.setMarket("Crypto");
        cryptos.add(eth);

        // Binance Coin
        MarketData bnb = new MarketData();
        bnb.setSymbol("BNB-USD");
        bnb.setName("Binance Coin");
        bnb.setCurrentPrice(312.45);
        bnb.setChangeAmount(-5.67);
        bnb.setChangePercent(-1.78);
        bnb.setLastUpdated(now);
        bnb.setMarket("Crypto");
        cryptos.add(bnb);

        return cryptos;
    }
}
