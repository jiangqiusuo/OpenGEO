#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${OPENGEO_BASE_URL:-http://localhost:8787}"
IDEMPOTENCY_KEY="${OPENGEO_IDEMPOTENCY_KEY:-example-monitor-001}"
headers=(-H "content-type: application/json" -H "idempotency-key: $IDEMPOTENCY_KEY" -H "prefer: wait=5")
if [[ -n "${OPENGEO_API_KEY:-}" ]]; then
  headers+=(-H "Authorization: Bearer ${OPENGEO_API_KEY}")
fi

curl --fail-with-body -X POST "$BASE_URL/v1/monitor-runs" "${headers[@]}" --data '{
  "capability_id": "observe.ai_answer",
  "prompts": [
    "How visible is OpenGEO for this question?"
  ],
  "turnaround_class": "best_effort",
  "interaction_mode": "search"
}'
