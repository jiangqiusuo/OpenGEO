// Code generated from OpenAPI operationId=createMonitorRun. DO NOT EDIT.
package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

func main() {
	baseURL := strings.TrimRight(getenv("OPENGEO_BASE_URL", "http://localhost:8787"), "/")
	body := []byte("{\n  \"capability_id\": \"observe.ai_answer\",\n  \"prompts\": [\n    \"How visible is OpenGEO for this question?\"\n  ],\n  \"turnaround_class\": \"best_effort\",\n  \"interaction_mode\": \"search\"\n}")
	req, err := http.NewRequest(http.MethodPost, baseURL+"/v1/monitor-runs", bytes.NewReader(body))
	if err != nil { panic(err) }
	req.Header.Set("content-type", "application/json")
	req.Header.Set("idempotency-key", getenv("OPENGEO_IDEMPOTENCY_KEY", "example-monitor-001"))
	req.Header.Set("prefer", "wait=5")
	if key := os.Getenv("OPENGEO_API_KEY"); key != "" { req.Header.Set("authorization", "Bearer "+key) }
	res, err := http.DefaultClient.Do(req)
	if err != nil { panic(err) }
	defer res.Body.Close()
	out, err := io.ReadAll(res.Body)
	if err != nil { panic(err) }
	if res.StatusCode >= 400 { panic(fmt.Sprintf("HTTP %d: %s", res.StatusCode, strings.TrimSpace(string(out)))) }
	fmt.Println(string(out))
}

func getenv(name, fallback string) string {
	if value := os.Getenv(name); value != "" { return value }
	return fallback
}
