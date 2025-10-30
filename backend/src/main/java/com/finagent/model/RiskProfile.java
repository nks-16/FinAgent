package com.finagent.model;

import java.util.List;

public class RiskProfile {
    private Integer score;
    private String category;
    private List<RiskRecommendation> recommendations;

    public RiskProfile() {
    }

    public RiskProfile(Integer score, String category, List<RiskRecommendation> recommendations) {
        this.score = score;
        this.category = category;
        this.recommendations = recommendations;
    }

    // Getters and Setters
    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<RiskRecommendation> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<RiskRecommendation> recommendations) {
        this.recommendations = recommendations;
    }

    public static class RiskRecommendation {
        private String title;
        private String description;

        public RiskRecommendation() {
        }

        public RiskRecommendation(String title, String description) {
            this.title = title;
            this.description = description;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
