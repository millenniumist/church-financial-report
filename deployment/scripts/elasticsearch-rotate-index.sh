#!/bin/bash

# Daily Elasticsearch Index Rotation
# Creates a new index for each day to organize logs by date

ES_HOST="${ELASTICSEARCH_NODE:-http://localhost:9200}"
DATE=$(date +%Y.%m.%d)
INDEX_NAME="cc-church-logs-$DATE"

# Check if index exists
INDEX_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" "$ES_HOST/$INDEX_NAME")

if [ "$INDEX_EXISTS" = "404" ]; then
  echo "[$(date)] Creating new index: $INDEX_NAME"

  # Create index with ILM policy
  curl -X PUT "$ES_HOST/$INDEX_NAME" \
    -H 'Content-Type: application/json' \
    -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "cc-church-logs-policy"
    }
  }' 2>&1 | grep -q "acknowledged.*true" && echo "[$(date)] ✓ Index created successfully" || echo "[$(date)] ✗ Failed to create index"
else
  echo "[$(date)] Index $INDEX_NAME already exists"
fi
