package com.finagent.controller;

import com.finagent.model.InvestmentRecommendation;
import com.finagent.model.RiskProfile;
import com.finagent.service.InvestmentRecommendationService;
import com.finagent.service.RiskAssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class InvestmentController {

    @Autowired
    private InvestmentRecommendationService recommendationService;

    @Autowired
    private RiskAssessmentService riskAssessmentService;

    /**
     * Get personalized investment recommendations
     * POST /api/recommendations/personalized
     */
    @PostMapping("/personalized")
    public ResponseEntity<Map<String, Object>> getPersonalizedRecommendations(@RequestBody Map<String, Object> request) {
        try {
            // Extract user profile data from request with type conversion
            Map<String, Object> userProfile = new HashMap<>();
            
            // Handle age - can be Integer or String (default to 30 if null)
            Object ageObj = request.get("age");
            Integer age = ageObj instanceof Number ? ((Number) ageObj).intValue() : 
                         ageObj instanceof String ? Integer.parseInt((String) ageObj) : 30;
            userProfile.put("age", age);
            
            // Handle monthlyIncome - can be Double or String (default to 5000.0 if null)
            Object incomeObj = request.get("monthlyIncome");
            Double monthlyIncome = incomeObj instanceof Number ? ((Number) incomeObj).doubleValue() :
                                  incomeObj instanceof String ? Double.parseDouble((String) incomeObj) : 5000.0;
            userProfile.put("monthlyIncome", monthlyIncome);
            
            userProfile.put("investmentExperience", request.getOrDefault("investmentExperience", "intermediate"));
            userProfile.put("timeHorizon", request.getOrDefault("timeHorizon", "medium"));
            
            // Generate recommendations
            List<InvestmentRecommendation> recommendations = recommendationService.generateRecommendations(userProfile);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("recommendations", recommendations);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to generate recommendations: " + e.getMessage());
            e.printStackTrace(); // Log the full stack trace
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Calculate user's risk profile
     * POST /api/recommendations/risk-profile
     */
    @PostMapping("/risk-profile")
    public ResponseEntity<Map<String, Object>> calculateRiskProfile(@RequestBody Map<String, Object> request) {
        try {
            // Extract user profile data from request with type conversion
            Map<String, Object> userProfile = new HashMap<>();
            
            // Handle age - can be Integer or String (default to 30 if null)
            Object ageObj = request.get("age");
            Integer age = ageObj instanceof Number ? ((Number) ageObj).intValue() : 
                         ageObj instanceof String ? Integer.parseInt((String) ageObj) : 30;
            userProfile.put("age", age);
            
            // Handle monthlyIncome - can be Double or String (default to 5000.0 if null)
            Object incomeObj = request.get("monthlyIncome");
            Double monthlyIncome = incomeObj instanceof Number ? ((Number) incomeObj).doubleValue() :
                                  incomeObj instanceof String ? Double.parseDouble((String) incomeObj) : 5000.0;
            userProfile.put("monthlyIncome", monthlyIncome);
            
            userProfile.put("investmentExperience", request.getOrDefault("investmentExperience", "intermediate"));
            userProfile.put("timeHorizon", request.getOrDefault("timeHorizon", "medium"));
            
            // Calculate risk profile
            RiskProfile riskProfile = riskAssessmentService.calculateRiskProfile(userProfile);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("riskProfile", riskProfile);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to calculate risk profile: " + e.getMessage());
            e.printStackTrace(); // Log the full stack trace
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Health check endpoint
     * GET /api/recommendations/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Investment Recommendations API");
        return ResponseEntity.ok(response);
    }
}
