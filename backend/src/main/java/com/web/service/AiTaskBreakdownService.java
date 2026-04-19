package com.web.service;

import com.web.dto.AI.TaskDto;
import com.web.dto.AI.SubTaskDto;
import com.web.exception.AiServiceException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AiTaskBreakdownService {

    private static final String TECH_LEAD_PERSONA = "Bạn là một Tech Lead lão luyện.\n";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final URI geminiUri;

    public AiTaskBreakdownService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
            String geminiApiUrl) {

        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.geminiUri = UriComponentsBuilder.fromHttpUrl(geminiApiUrl)
                .queryParam("key", apiKey)
                .build()
                .toUri();
    }

    /**
     * Phân tích mô tả dự án thành danh sách Task chính.
     * Các task thiếu dueDate sẽ được mặc định là ngày mai.
     */
    public List<TaskDto> breakdownProject(String userMessage) {
        String requestBody = buildProjectRequestBody(userMessage);
        String aiJsonOutput = callGemini(requestBody);

        List<TaskDto> result = parseJson(aiJsonOutput, new TypeReference<>() {});

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        result.forEach(task -> {
            if (task.getDueDate() == null) task.setDueDate(tomorrow);
        });
        return result;
    }

    /**
     * Phân tích mô tả task thành danh sách SubTask.
     */
    public List<SubTaskDto> breakdownTask(String userMessage) {
        String requestBody = buildTaskRequestBody(userMessage);
        String aiJsonOutput = callGemini(requestBody);
        return parseJson(aiJsonOutput, new TypeReference<>() {});
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String callGemini(String requestBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(geminiUri, requestEntity, String.class);
        log.debug("Gemini raw response: {}", response.getBody());

        String extracted = extractTextFromGeminiResponse(response.getBody());
        log.debug("Extracted AI JSON: {}", extracted);
        return extracted;
    }

    private <T> T parseJson(String json, TypeReference<T> typeRef) {
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            throw new AiServiceException("Lỗi parse JSON từ Gemini: " + json, e);
        }
    }

    private String buildProjectRequestBody(String userMessage) {
        String today = LocalDate.now().toString();
        String prompt = TECH_LEAD_PERSONA
                + "Hôm nay là ngày: " + today + "\n"
                + "Nhiệm vụ: Phân tích yêu cầu dự án sau và chia thành 4-6 Tasks chính.\n"
                + "BẮT BUỘC trả về DUY NHẤT một JSON Array với cấu trúc:\n"
                + "[{\"title\": \"Tên công việc\", \"description\": \"Mô tả cách làm\", \"dueDate\": \"YYYY-MM-DD\", \"priority\": \"LOW|MEDIUM|HIGH\"}]\n"
                + "Quy tắc dueDate: bắt đầu từ ngày mai. Không thêm trường khác.\n"
                + "Yêu cầu: " + userMessage;
        return buildJsonRequest(prompt);
    }

    private String buildTaskRequestBody(String userMessage) {
        String prompt = TECH_LEAD_PERSONA
                + "Nhiệm vụ: Phân tích task sau và chia thành 3-5 đầu việc (sub-tasks).\n"
                + "BẮT BUỘC trả về DUY NHẤT một JSON Array với cấu trúc:\n"
                + "[{\"content\": \"Tên đầu việc\"}]\n"
                + "LƯU Ý: Chỉ có trường content, không có title, description, dueDate. Không giải thích thêm.\n"
                + "Yêu cầu: " + userMessage;
        return buildJsonRequest(prompt);
    }

    private String buildJsonRequest(String prompt) {
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("responseMimeType", "application/json")
        );
        try {
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new AiServiceException("Lỗi tạo request body", e);
        }
    }

    private String extractTextFromGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty()) throw new AiServiceException("Gemini không trả về candidates");

            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isEmpty()) throw new AiServiceException("Gemini không trả về parts");

            String text = parts.get(0).path("text").asText();
            if (text.isBlank()) throw new AiServiceException("Gemini trả về text rỗng");

            return text;
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("Lỗi parse response từ Gemini", e);
        }
    }
}