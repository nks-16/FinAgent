package com.finagent.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/export")
public class ExportController {

    @PostMapping(value = "/csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportCsv(@RequestBody Map<String, Object> payload) {
        StringBuilder sb = new StringBuilder();
        sb.append("field,value\n");
        Object query = payload.getOrDefault("query", "");
        Object response = payload.getOrDefault("response", "");
        sb.append("query,\"").append(escapeCsv(String.valueOf(query))).append("\"\n");
        sb.append("response,\"").append(escapeCsv(String.valueOf(response))).append("\"\n");

        Object sources = payload.get("sources");
        if (sources instanceof List<?> list) {
            int i = 1;
            for (Object s : list) {
                sb.append("source_").append(i++).append(",\"")
                  .append(escapeCsv(String.valueOf(s))).append("\"\n");
            }
        }

        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(new MediaType("text","csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report.csv")
                .body(bytes);
    }

    private String escapeCsv(String in) {
        return in.replace("\"", "\"\"");
    }
}
