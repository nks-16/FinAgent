package com.finagent.controller;

import com.finagent.model.NewsArticle;
import com.finagent.model.MarketData;
import com.finagent.service.NewsService;
import com.finagent.service.MarketDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/financial-insights")
@CrossOrigin(origins = "*")
public class FinancialInsightsController {

    @Autowired
    private NewsService newsService;

    @Autowired
    private MarketDataService marketDataService;

    /**
     * Get personalized financial news based on user's categories
     */
    @PostMapping("/news/personalized")
    public ResponseEntity<Map<String, Object>> getPersonalizedNews(@RequestBody Map<String, Object> request) {
        try {
            String[] categories;
            if (request.containsKey("categories")) {
                Object categoriesObj = request.get("categories");
                if (categoriesObj instanceof List<?>) {
                    List<?> categoriesList = (List<?>) categoriesObj;
                    categories = categoriesList.stream()
                            .filter(item -> item instanceof String)
                            .map(item -> (String) item)
                            .toArray(String[]::new);
                } else {
                    categories = new String[]{"personal-finance"};
                }
            } else {
                categories = new String[]{"personal-finance"};
            }
            
            int limit = request.containsKey("limit") 
                    ? (Integer) request.get("limit") 
                    : 10;

            List<NewsArticle> news = newsService.getNewsByCategories(categories, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", news.size());
            response.put("news", news);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get general financial news
     */
    @GetMapping("/news")
    public ResponseEntity<Map<String, Object>> getNews(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<NewsArticle> news = newsService.getPersonalizedNews(
                    new String[]{"finance", "markets", "investing"}, 
                    limit
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", news.size());
            response.put("news", news);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get market indices data (S&P 500, Dow Jones, NASDAQ, etc.)
     */
    @GetMapping("/markets/indices")
    public ResponseEntity<Map<String, Object>> getMarketIndices() {
        try {
            List<MarketData> indices = marketDataService.getMarketIndices();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", indices.size());
            response.put("indices", indices);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get cryptocurrency prices
     */
    @GetMapping("/markets/crypto")
    public ResponseEntity<Map<String, Object>> getCryptoPrices() {
        try {
            List<MarketData> cryptos = marketDataService.getCryptoPrices();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", cryptos.size());
            response.put("cryptos", cryptos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get watchlist data for specific symbols
     */
    @PostMapping("/markets/watchlist")
    public ResponseEntity<Map<String, Object>> getWatchlist(@RequestBody Map<String, Object> request) {
        try {
            String[] symbols;
            if (request.containsKey("symbols")) {
                Object symbolsObj = request.get("symbols");
                if (symbolsObj instanceof List<?>) {
                    List<?> symbolsList = (List<?>) symbolsObj;
                    symbols = symbolsList.stream()
                            .filter(item -> item instanceof String)
                            .map(item -> (String) item)
                            .toArray(String[]::new);
                } else {
                    symbols = new String[]{};
                }
            } else {
                symbols = new String[]{};
            }

            List<MarketData> watchlist = marketDataService.getWatchlist(symbols);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", watchlist.size());
            response.put("watchlist", watchlist);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Health check for financial insights service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Financial Insights API");
        return ResponseEntity.ok(response);
    }
}
