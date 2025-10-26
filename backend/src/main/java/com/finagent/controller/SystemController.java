package com.finagent.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/system")
public class SystemController {

    private final RestTemplate http = new RestTemplate();

    @Value("${agent.baseUrl:http://localhost:8000}")
    private String agentBaseUrl;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> aggregateHealth() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("service", "finagent-backend");

        try {
            ResponseEntity<Map<String, Object>> r = http.exchange(
                agentBaseUrl + "/health",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> agentHealth = r.getBody();
            resp.put("agent", agentHealth);
        } catch (Exception e) {
            resp.put("agent", Map.of("error", e.getMessage()));
        }

        try {
            ResponseEntity<Map<String, Object>> r = http.exchange(
                agentBaseUrl + "/collections/stats",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> stats = r.getBody();
            resp.put("stats", stats);
        } catch (Exception e) {
            resp.put("stats", Map.of("error", e.getMessage()));
        }

        try {
            ResponseEntity<Map<String, Object>> r = http.exchange(
                agentBaseUrl + "/anomaly/status",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> anomaly = r.getBody();
            resp.put("anomaly", anomaly);
        } catch (Exception e) {
            resp.put("anomaly", Map.of("error", e.getMessage()));
        }

        return ResponseEntity.ok(resp);
    }
}
