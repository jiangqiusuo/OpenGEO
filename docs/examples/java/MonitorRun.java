// Code generated from OpenAPI operationId=createMonitorRun. DO NOT EDIT.
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public final class MonitorRun {
  public static void main(String[] args) throws Exception {
    String baseUrl = System.getenv().getOrDefault("OPENGEO_BASE_URL", "http://localhost:8787").replaceAll("/+$", "");
    String body = "{\n  \"capability_id\": \"observe.ai_answer\",\n  \"prompts\": [\n    \"How visible is OpenGEO for this question?\"\n  ],\n  \"turnaround_class\": \"best_effort\",\n  \"interaction_mode\": \"search\"\n}";
    HttpRequest.Builder builder = HttpRequest.newBuilder()
        .uri(URI.create(baseUrl + "/v1/monitor-runs"))
        .header("content-type", "application/json")
        .header("idempotency-key", System.getenv().getOrDefault("OPENGEO_IDEMPOTENCY_KEY", "example-monitor-001"))
        .header("prefer", "wait=5")
        .POST(HttpRequest.BodyPublishers.ofString(body));
    String apiKey = System.getenv("OPENGEO_API_KEY");
    if (apiKey != null && !apiKey.isBlank()) builder.header("authorization", "Bearer " + apiKey);
    HttpResponse<String> response = HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() >= 400) throw new IllegalStateException("HTTP " + response.statusCode() + ": " + response.body());
    System.out.println(response.body());
  }
}
