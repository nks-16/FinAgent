package com.finagent.controller;

import com.finagent.model.SimulationRequest;
import com.finagent.model.SimulationResult;
import com.finagent.service.InvestmentSimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/simulator")
@CrossOrigin(origins = "*")
public class SimulationController {

    @Autowired
    private InvestmentSimulationService simulationService;

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("service", "Investment Simulator API");
        response.put("status", "UP");
        return ResponseEntity.ok(response);
    }

    /**
     * Run investment simulation
     * POST /api/simulator/run
     */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runSimulation(@RequestBody Map<String, Object> request) {
        try {
            // Parse request
            SimulationRequest simRequest = parseSimulationRequest(request);
            
            // Run simulation
            SimulationResult result = simulationService.runSimulation(simRequest);
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("result", result);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Simulation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Compare multiple scenarios
     * POST /api/simulator/compare
     */
    @PostMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareScenarios(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> scenarios = (List<Map<String, Object>>) request.get("scenarios");
            
            if (scenarios == null || scenarios.isEmpty()) {
                throw new IllegalArgumentException("At least one scenario is required");
            }
            
            List<SimulationResult> results = new ArrayList<>();
            
            for (Map<String, Object> scenario : scenarios) {
                SimulationRequest simRequest = parseSimulationRequest(scenario);
                SimulationResult result = simulationService.runSimulation(simRequest);
                results.add(result);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("scenarios", results);
            response.put("comparison", generateComparison(results));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Comparison failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get optimal portfolio allocation suggestions
     * POST /api/simulator/optimize
     */
    @PostMapping("/optimize")
    public ResponseEntity<Map<String, Object>> optimizePortfolio(@RequestBody Map<String, Object> request) {
        try {
            // Extract user preferences
            Object riskToleranceObj = request.get("riskTolerance");
            String riskTolerance = riskToleranceObj != null ? riskToleranceObj.toString() : "moderate";
            
            Object timeHorizonObj = request.get("timeHorizon");
            Integer timeHorizon = timeHorizonObj instanceof Number ? 
                ((Number) timeHorizonObj).intValue() : 10;
            
            // Generate optimal allocations based on risk tolerance
            Map<String, Double> optimalAllocation = generateOptimalAllocation(riskTolerance);
            
            // Create simulation request with optimal allocation
            SimulationRequest simRequest = new SimulationRequest();
            simRequest.setInitialInvestment(
                request.get("initialInvestment") instanceof Number ? 
                ((Number) request.get("initialInvestment")).doubleValue() : 10000.0
            );
            simRequest.setMonthlyContribution(
                request.get("monthlyContribution") instanceof Number ? 
                ((Number) request.get("monthlyContribution")).doubleValue() : 500.0
            );
            simRequest.setTimeHorizonYears(timeHorizon);
            simRequest.setAssetAllocations(optimalAllocation);
            
            // Run simulation with optimal allocation
            SimulationResult result = simulationService.runSimulation(simRequest);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("optimalAllocation", optimalAllocation);
            response.put("projectedResult", result);
            response.put("riskLevel", riskTolerance);
            response.put("rationale", generateRationale(riskTolerance));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Optimization failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Parse request map into SimulationRequest object
     */
    private SimulationRequest parseSimulationRequest(Map<String, Object> request) {
        SimulationRequest simRequest = new SimulationRequest();
        
        // Parse initial investment
        Object initialInvObj = request.get("initialInvestment");
        simRequest.setInitialInvestment(
            initialInvObj instanceof Number ? ((Number) initialInvObj).doubleValue() : 10000.0
        );
        
        // Parse monthly contribution
        Object monthlyContObj = request.get("monthlyContribution");
        simRequest.setMonthlyContribution(
            monthlyContObj instanceof Number ? ((Number) monthlyContObj).doubleValue() : 0.0
        );
        
        // Parse time horizon
        Object timeHorizonObj = request.get("timeHorizon");
        simRequest.setTimeHorizonYears(
            timeHorizonObj instanceof Number ? ((Number) timeHorizonObj).intValue() : 10
        );
        
        // Parse asset allocations
        @SuppressWarnings("unchecked")
        Map<String, Object> allocationsObj = (Map<String, Object>) request.get("assetAllocations");
        if (allocationsObj != null) {
            Map<String, Double> allocations = new HashMap<>();
            for (Map.Entry<String, Object> entry : allocationsObj.entrySet()) {
                Object value = entry.getValue();
                Double allocationValue = value instanceof Number ? 
                    ((Number) value).doubleValue() : 0.0;
                allocations.put(entry.getKey(), allocationValue);
            }
            simRequest.setAssetAllocations(allocations);
        } else {
            // Default balanced allocation
            simRequest.setAssetAllocations(Map.of(
                "stocks", 60.0,
                "bonds", 30.0,
                "cash", 10.0
            ));
        }
        
        // Parse optional parameters
        Object inflationObj = request.get("includeInflation");
        simRequest.setIncludeInflation(
            inflationObj != null ? Boolean.parseBoolean(inflationObj.toString()) : true
        );
        
        Object inflationRateObj = request.get("inflationRate");
        simRequest.setInflationRate(
            inflationRateObj instanceof Number ? ((Number) inflationRateObj).doubleValue() : 3.0
        );
        
        Object rebalancingObj = request.get("includeRebalancing");
        simRequest.setIncludeRebalancing(
            rebalancingObj != null ? Boolean.parseBoolean(rebalancingObj.toString()) : true
        );
        
        Object rebalanceFreqObj = request.get("rebalancingFrequency");
        simRequest.setRebalancingFrequencyMonths(
            rebalanceFreqObj instanceof Number ? ((Number) rebalanceFreqObj).intValue() : 12
        );
        
        Object modeObj = request.get("simulationMode");
        simRequest.setSimulationMode(
            modeObj != null ? modeObj.toString() : "simple"
        );
        
        return simRequest;
    }

    /**
     * Generate comparison summary for multiple scenarios
     */
    private Map<String, Object> generateComparison(List<SimulationResult> results) {
        Map<String, Object> comparison = new HashMap<>();
        
        double maxReturn = results.stream()
            .mapToDouble(SimulationResult::getFinalValue)
            .max()
            .orElse(0);
        
        double minReturn = results.stream()
            .mapToDouble(SimulationResult::getFinalValue)
            .min()
            .orElse(0);
        
        double avgReturn = results.stream()
            .mapToDouble(SimulationResult::getFinalValue)
            .average()
            .orElse(0);
        
        comparison.put("maxFinalValue", maxReturn);
        comparison.put("minFinalValue", minReturn);
        comparison.put("averageFinalValue", avgReturn);
        comparison.put("totalScenarios", results.size());
        
        return comparison;
    }

    /**
     * Generate optimal allocation based on risk tolerance
     */
    private Map<String, Double> generateOptimalAllocation(String riskTolerance) {
        switch (riskTolerance.toLowerCase()) {
            case "conservative":
                return Map.of(
                    "bonds", 50.0,
                    "stocks", 25.0,
                    "reits", 15.0,
                    "cash", 10.0
                );
            case "aggressive":
                return Map.of(
                    "stocks", 60.0,
                    "international", 20.0,
                    "reits", 10.0,
                    "crypto", 5.0,
                    "bonds", 5.0
                );
            case "moderate":
            default:
                return Map.of(
                    "stocks", 50.0,
                    "bonds", 30.0,
                    "reits", 10.0,
                    "international", 7.0,
                    "cash", 3.0
                );
        }
    }

    /**
     * Generate rationale for optimal allocation
     */
    private String generateRationale(String riskTolerance) {
        switch (riskTolerance.toLowerCase()) {
            case "conservative":
                return "Your conservative portfolio prioritizes capital preservation with 50% bonds and minimal exposure to volatile assets. Expected steady returns with low risk.";
            case "aggressive":
                return "Your aggressive portfolio maximizes growth potential with 60% stocks and emerging asset classes. Higher volatility but strong long-term returns expected.";
            case "moderate":
            default:
                return "Your balanced portfolio offers 50/30/20 allocation across stocks, bonds, and alternative assets for optimal risk-adjusted returns.";
        }
    }
}
