package com.finagent.model;

import java.time.LocalDateTime;

public class NewsArticle {
    private String title;
    private String description;
    private String url;
    private String source;
    private String category;
    private LocalDateTime publishedAt;
    private String imageUrl;
    private String[] tags;

    public NewsArticle() {}

    public NewsArticle(String title, String description, String url, String source, 
                      String category, LocalDateTime publishedAt, String imageUrl, String[] tags) {
        this.title = title;
        this.description = description;
        this.url = url;
        this.source = source;
        this.category = category;
        this.publishedAt = publishedAt;
        this.imageUrl = imageUrl;
        this.tags = tags;
    }

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String[] getTags() { return tags; }
    public void setTags(String[] tags) { this.tags = tags; }
}
