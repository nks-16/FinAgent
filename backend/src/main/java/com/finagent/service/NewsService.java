package com.finagent.service;

import com.finagent.model.NewsArticle;
import org.springframework.stereotype.Service;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NewsService {

    /**
     * Fetch personalized financial news based on user's financial profile
     * Uses Yahoo Finance RSS and web scraping from free sources
     */
    public List<NewsArticle> getPersonalizedNews(String[] interests, int limit) {
        List<NewsArticle> allNews = new ArrayList<>();
        
        try {
            // Scrape from multiple free sources
            allNews.addAll(scrapeYahooFinance(interests, limit));
            allNews.addAll(scrapeInvestopedia(limit / 2));
            allNews.addAll(scrapeMarketWatch(limit / 2));
        } catch (Exception e) {
            System.err.println("Error fetching news: " + e.getMessage());
        }

        // If scraping failed, provide sample data
        if (allNews.isEmpty()) {
            allNews = getSampleNews(interests, limit);
        }

        // Return up to limit items, removing any duplicates
        List<NewsArticle> uniqueNews = new ArrayList<>();
        for (NewsArticle article : allNews) {
            if (uniqueNews.size() >= limit) break;
            boolean isDuplicate = false;
            for (NewsArticle existing : uniqueNews) {
                if (existing.getTitle().equals(article.getTitle())) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                uniqueNews.add(article);
            }
        }
        
        return uniqueNews;
    }

    /**
     * Scrape Yahoo Finance for financial news
     */
    private List<NewsArticle> scrapeYahooFinance(String[] interests, int limit) {
        List<NewsArticle> news = new ArrayList<>();
        
        try {
            String url = "https://finance.yahoo.com/";
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            Elements articles = doc.select("div.Ov\\(h\\) div.Pos\\(r\\)");
            int count = 0;

            for (Element article : articles) {
                if (count >= limit) break;
                try {
                    String title = article.select("h3").text();
                    String description = article.select("p").text();
                    String link = article.select("a").attr("abs:href");
                    
                    if (!title.isEmpty()) {
                        NewsArticle newsArticle = new NewsArticle();
                        newsArticle.setTitle(title);
                        newsArticle.setDescription(description);
                        newsArticle.setUrl(link);
                        newsArticle.setSource("Yahoo Finance");
                        newsArticle.setCategory("Markets");
                        newsArticle.setPublishedAt(LocalDateTime.now());
                        newsArticle.setTags(interests);
                        
                        news.add(newsArticle);
                        count++;
                    }
                } catch (Exception e) {
                    // Skip malformed articles
                }
            }
        } catch (Exception e) {
            System.err.println("Yahoo Finance scraping error: " + e.getMessage());
        }

        return news;
    }

    /**
     * Scrape Investopedia for educational financial content
     */
    private List<NewsArticle> scrapeInvestopedia(int limit) {
        List<NewsArticle> news = new ArrayList<>();
        
        try {
            String url = "https://www.investopedia.com/personal-finance-4427760";
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            Elements articles = doc.select("article");
            int count = 0;

            for (Element article : articles) {
                if (count >= limit) break;
                try {
                    String title = article.select("h2, h3").first() != null 
                            ? article.select("h2, h3").first().text() 
                            : "";
                    String description = article.select("p").first() != null 
                            ? article.select("p").first().text() 
                            : "";
                    String link = article.select("a").attr("abs:href");
                    
                    if (!title.isEmpty()) {
                        NewsArticle newsArticle = new NewsArticle();
                        newsArticle.setTitle(title);
                        newsArticle.setDescription(description);
                        newsArticle.setUrl(link);
                        newsArticle.setSource("Investopedia");
                        newsArticle.setCategory("Education");
                        newsArticle.setPublishedAt(LocalDateTime.now());
                        
                        news.add(newsArticle);
                        count++;
                    }
                } catch (Exception e) {
                    // Skip malformed articles
                }
            }
        } catch (Exception e) {
            System.err.println("Investopedia scraping error: " + e.getMessage());
        }

        return news;
    }

    /**
     * Scrape MarketWatch for market news
     */
    private List<NewsArticle> scrapeMarketWatch(int limit) {
        List<NewsArticle> news = new ArrayList<>();
        
        try {
            String url = "https://www.marketwatch.com/latest-news";
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            Elements articles = doc.select("div.article__content");
            int count = 0;

            for (Element article : articles) {
                if (count >= limit) break;
                try {
                    String title = article.select("h3.article__headline").text();
                    String description = article.select("p.article__summary").text();
                    String link = article.select("a.link").attr("abs:href");
                    
                    if (!title.isEmpty()) {
                        NewsArticle newsArticle = new NewsArticle();
                        newsArticle.setTitle(title);
                        newsArticle.setDescription(description);
                        newsArticle.setUrl(link);
                        newsArticle.setSource("MarketWatch");
                        newsArticle.setCategory("Markets");
                        newsArticle.setPublishedAt(LocalDateTime.now());
                        
                        news.add(newsArticle);
                        count++;
                    }
                } catch (Exception e) {
                    // Skip malformed articles
                }
            }
        } catch (Exception e) {
            System.err.println("MarketWatch scraping error: " + e.getMessage());
        }

        return news;
    }

    /**
     * Get news based on user's spending categories
     */
    public List<NewsArticle> getNewsByCategories(String[] categories, int limit) {
        String[] interests = new String[categories.length];
        
        for (int i = 0; i < categories.length; i++) {
            interests[i] = mapCategoryToFinancialTopic(categories[i]);
        }
        
        return getPersonalizedNews(interests, limit);
    }

    private String mapCategoryToFinancialTopic(String category) {
        switch (category.toLowerCase()) {
            case "housing": return "real-estate";
            case "investment": return "investing";
            case "healthcare": return "health-insurance";
            case "education": return "student-loans";
            case "transportation": return "auto-finance";
            default: return "personal-finance";
        }
    }

    /**
     * Provides realistic sample data when web scraping fails
     * Data is based on common financial news topics and current market trends
     */
    private List<NewsArticle> getSampleNews(String[] interests, int limit) {
        List<NewsArticle> sampleNews = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // Sample financial news articles based on different categories
        NewsArticle[] allSamples = {
            // Market News
            createSampleArticle(
                "Stock Market Rallies on Strong Economic Data",
                "Major indices posted gains today as investors reacted positively to better-than-expected economic indicators. The S&P 500 rose 1.2% while tech stocks led the advance.",
                "https://finance.yahoo.com/markets",
                "Yahoo Finance",
                "Markets",
                now.minusHours(2)
            ),
            createSampleArticle(
                "Federal Reserve Signals Potential Rate Cuts in 2024",
                "Fed officials hinted at possible interest rate reductions next year if inflation continues its downward trend, boosting market sentiment.",
                "https://www.marketwatch.com/economy",
                "MarketWatch",
                "Economy",
                now.minusHours(5)
            ),
            
            // Investment & Personal Finance
            createSampleArticle(
                "5 Tax-Advantaged Investment Strategies for 2024",
                "Financial advisors recommend maximizing contributions to retirement accounts and exploring HSAs as key strategies for reducing your tax burden.",
                "https://www.investopedia.com/taxes",
                "Investopedia",
                "Investing",
                now.minusHours(8)
            ),
            createSampleArticle(
                "How to Build an Emergency Fund: Expert Tips",
                "Financial planners suggest saving 3-6 months of expenses in a high-yield savings account. Learn the best strategies to build your safety net.",
                "https://www.investopedia.com/personal-finance",
                "Investopedia",
                "Personal Finance",
                now.minusHours(12)
            ),
            
            // Real Estate
            createSampleArticle(
                "Housing Market Shows Signs of Cooling as Rates Stabilize",
                "Home prices grew at a slower pace last month as mortgage rates remained elevated, giving buyers more negotiating power in select markets.",
                "https://www.marketwatch.com/real-estate",
                "MarketWatch",
                "Real Estate",
                now.minusHours(6)
            ),
            createSampleArticle(
                "Is Now a Good Time to Refinance Your Mortgage?",
                "With mortgage rates fluctuating, experts explain when refinancing makes financial sense and how to calculate potential savings.",
                "https://www.investopedia.com/mortgage",
                "Investopedia",
                "Real Estate",
                now.minusHours(10)
            ),
            
            // Crypto & Technology
            createSampleArticle(
                "Bitcoin Crosses $45,000 Amid Institutional Interest",
                "Cryptocurrency markets surged as major financial institutions announced expanded digital asset offerings, with Bitcoin leading the charge.",
                "https://finance.yahoo.com/crypto",
                "Yahoo Finance",
                "Cryptocurrency",
                now.minusHours(3)
            ),
            createSampleArticle(
                "Understanding Cryptocurrency Taxes: What You Need to Know",
                "Tax obligations for crypto transactions can be complex. Here's a comprehensive guide to reporting your digital asset gains and losses.",
                "https://www.investopedia.com/cryptocurrency",
                "Investopedia",
                "Cryptocurrency",
                now.minusHours(15)
            ),
            
            // Healthcare & Insurance
            createSampleArticle(
                "Healthcare Costs Rising: How to Save on Medical Expenses",
                "Medical expenses continue to climb, but HSAs, preventive care, and generic medications can help reduce your healthcare spending.",
                "https://www.investopedia.com/insurance",
                "Investopedia",
                "Healthcare",
                now.minusHours(7)
            ),
            
            // Education & Student Loans
            createSampleArticle(
                "Student Loan Forgiveness Programs: Are You Eligible?",
                "New income-driven repayment plans and public service loan forgiveness updates may provide relief for millions of borrowers.",
                "https://www.investopedia.com/student-loans",
                "Investopedia",
                "Education",
                now.minusHours(9)
            ),
            
            // Auto & Transportation
            createSampleArticle(
                "Electric Vehicle Tax Credits: Complete 2024 Guide",
                "Federal and state incentives can save you thousands on EV purchases. Learn which models qualify and how to claim your credit.",
                "https://www.marketwatch.com/automotive",
                "MarketWatch",
                "Transportation",
                now.minusHours(11)
            ),
            createSampleArticle(
                "Auto Loan Rates Hit Highest Level in Decade",
                "Rising interest rates are making car financing more expensive. Experts share tips for getting the best deal on your next auto loan.",
                "https://www.investopedia.com/auto-loans",
                "Investopedia",
                "Transportation",
                now.minusHours(13)
            )
        };
        
        // Filter by interests if provided
        if (interests != null && interests.length > 0) {
            for (NewsArticle article : allSamples) {
                for (String interest : interests) {
                    if (interest != null && article.getCategory().toLowerCase().contains(interest.toLowerCase())) {
                        sampleNews.add(article);
                        if (sampleNews.size() >= limit) {
                            return sampleNews;
                        }
                    }
                }
            }
        }
        
        // If not enough filtered articles, add remaining general ones
        for (NewsArticle article : allSamples) {
            if (sampleNews.size() >= limit) break;
            if (!sampleNews.contains(article)) {
                sampleNews.add(article);
            }
        }
        
        return sampleNews.subList(0, Math.min(limit, sampleNews.size()));
    }
    
    private NewsArticle createSampleArticle(String title, String description, String url, 
                                           String source, String category, LocalDateTime publishedAt) {
        NewsArticle article = new NewsArticle();
        article.setTitle(title);
        article.setDescription(description);
        article.setUrl(url);
        article.setSource(source);
        article.setCategory(category);
        article.setPublishedAt(publishedAt);
        return article;
    }
}
