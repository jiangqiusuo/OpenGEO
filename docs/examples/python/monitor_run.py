#!/usr/bin/env python3
"""Generated from OpenAPI operationId=createMonitorRun. Uses only the Python standard library."""
import json
import os
import urllib.request

base_url = os.environ.get("OPENGEO_BASE_URL", "http://localhost:8787").rstrip("/")
body = "{\n  \"capability_id\": \"observe.ai_answer\",\n  \"prompts\": [\n    \"How visible is OpenGEO for this question?\"\n  ],\n  \"turnaround_class\": \"best_effort\",\n  \"interaction_mode\": \"search\"\n}"
request = urllib.request.Request(
    base_url + "/v1/monitor-runs",
    data=body.encode("utf-8"),
    method="POST",
    headers={
        "content-type": "application/json",
        "idempotency-key": os.environ.get("OPENGEO_IDEMPOTENCY_KEY", "example-monitor-001"),
        "prefer": "wait=5",
        **({"authorization": "Bearer " + os.environ["OPENGEO_API_KEY"]} if os.environ.get("OPENGEO_API_KEY") else {}),
    },
)
with urllib.request.urlopen(request) as response:
    print(json.dumps(json.load(response), ensure_ascii=False, indent=2))
