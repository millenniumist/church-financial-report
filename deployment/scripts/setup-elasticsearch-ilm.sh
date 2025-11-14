#!/bin/bash

# Elasticsearch Index Lifecycle Management (ILM) Setup
# Automatically manages and cleans up old logs to prevent disk space issues

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ES_HOST="${ELASTICSEARCH_NODE:-http://localhost:9200}"
INDEX_PATTERN="cc-church-logs-*"

echo -e "${YELLOW}Setting up Elasticsearch Index Lifecycle Management...${NC}"
echo ""

# Configuration
RETENTION_DAYS="${LOG_RETENTION_DAYS:-90}"  # Keep logs for 90 days
HOT_PHASE_DAYS="${HOT_PHASE_DAYS:-7}"       # Keep in hot phase for 7 days
WARM_PHASE_DAYS="${WARM_PHASE_DAYS:-30}"    # Move to warm after 30 days

echo "Configuration:"
echo "  Elasticsearch: $ES_HOST"
echo "  Index Pattern: $INDEX_PATTERN"
echo "  Total Retention: $RETENTION_DAYS days"
echo "  Hot Phase: $HOT_PHASE_DAYS days (searchable, no rollover)"
echo "  Warm Phase: $WARM_PHASE_DAYS days (read-only, compressed)"
echo "  Delete Phase: After $RETENTION_DAYS days"
echo ""

# 1. Create ILM Policy
echo -e "${YELLOW}[1/4] Creating ILM policy...${NC}"

curl -X PUT "$ES_HOST/_ilm/policy/cc-church-logs-policy" \
  -H 'Content-Type: application/json' \
  -d "{
  \"policy\": {
    \"phases\": {
      \"hot\": {
        \"min_age\": \"0ms\",
        \"actions\": {
          \"set_priority\": {
            \"priority\": 100
          }
        }
      },
      \"warm\": {
        \"min_age\": \"${WARM_PHASE_DAYS}d\",
        \"actions\": {
          \"set_priority\": {
            \"priority\": 50
          },
          \"readonly\": {},
          \"forcemerge\": {
            \"max_num_segments\": 1
          },
          \"shrink\": {
            \"number_of_shards\": 1
          }
        }
      },
      \"delete\": {
        \"min_age\": \"${RETENTION_DAYS}d\",
        \"actions\": {
          \"delete\": {}
        }
      }
    }
  }
}"

echo ""
echo -e "${GREEN}✓ ILM policy created${NC}"
echo ""

# 2. Create Index Template
echo -e "${YELLOW}[2/4] Creating index template...${NC}"

curl -X PUT "$ES_HOST/_index_template/cc-church-logs-template" \
  -H 'Content-Type: application/json' \
  -d "{
  \"index_patterns\": [\"$INDEX_PATTERN\"],
  \"template\": {
    \"settings\": {
      \"number_of_shards\": 1,
      \"number_of_replicas\": 0,
      \"index.lifecycle.name\": \"cc-church-logs-policy\",
      \"index.lifecycle.rollover_alias\": \"cc-church-logs\"
    },
    \"mappings\": {
      \"properties\": {
        \"@timestamp\": {
          \"type\": \"date\"
        },
        \"message\": {
          \"type\": \"text\"
        },
        \"log.level\": {
          \"type\": \"keyword\"
        },
        \"http.request.method\": {
          \"type\": \"keyword\"
        },
        \"http.response.status_code\": {
          \"type\": \"integer\"
        },
        \"url.path\": {
          \"type\": \"keyword\"
        },
        \"event.duration\": {
          \"type\": \"long\"
        }
      }
    }
  },
  \"priority\": 500
}"

echo ""
echo -e "${GREEN}✓ Index template created${NC}"
echo ""

# 3. Apply ILM policy to existing indices
echo -e "${YELLOW}[3/4] Applying ILM policy to existing indices...${NC}"

# Get all existing cc-church-logs indices
INDICES=$(curl -s "$ES_HOST/_cat/indices/$INDEX_PATTERN?h=index" | tr '\n' ' ')

if [ -n "$INDICES" ]; then
  for INDEX in $INDICES; do
    echo "  Applying to: $INDEX"
    curl -X PUT "$ES_HOST/$INDEX/_settings" \
      -H 'Content-Type: application/json' \
      -d "{
      \"index.lifecycle.name\": \"cc-church-logs-policy\"
    }" 2>/dev/null
  done
  echo ""
  echo -e "${GREEN}✓ Applied ILM policy to existing indices${NC}"
else
  echo "  No existing indices found"
fi

echo ""

# 4. Create daily index rollover script
echo -e "${YELLOW}[4/4] Creating daily index management script...${NC}"

cat > /tmp/elasticsearch-rotate-index.sh << 'ROTATE_SCRIPT'
#!/bin/bash

# Daily Index Rotation Script
# Creates a new index for each day to organize logs by date

ES_HOST="${ELASTICSEARCH_NODE:-http://localhost:9200}"
DATE=$(date +%Y.%m.%d)
INDEX_NAME="cc-church-logs-$DATE"

# Check if index exists
if curl -s "$ES_HOST/$INDEX_NAME" | grep -q "index_not_found_exception"; then
  echo "Creating new index: $INDEX_NAME"

  # Create index with ILM policy
  curl -X PUT "$ES_HOST/$INDEX_NAME" \
    -H 'Content-Type: application/json' \
    -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "cc-church-logs-policy"
    }
  }'

  echo ""
  echo "✓ Index created successfully"
else
  echo "Index $INDEX_NAME already exists"
fi
ROTATE_SCRIPT

chmod +x /tmp/elasticsearch-rotate-index.sh

# Move to hosting directory if on remote
if [ -d "/home/mill/hosting/scripts" ]; then
  mv /tmp/elasticsearch-rotate-index.sh /home/mill/hosting/scripts/
  echo -e "${GREEN}✓ Index rotation script created${NC}"
else
  echo -e "${YELLOW}⚠️  Local mode: Script saved to /tmp/${NC}"
fi

echo ""
echo -e "${GREEN}=================================="
echo -e "✅ Elasticsearch ILM Setup Complete"
echo -e "==================================${NC}"
echo ""
echo "What was configured:"
echo "  ✓ ILM Policy: Automatically manages log lifecycle"
echo "  ✓ Index Template: Auto-applies settings to new indices"
echo "  ✓ Existing Indices: ILM applied to all current logs"
echo "  ✓ Rotation Script: Daily index creation"
echo ""
echo "Lifecycle phases:"
echo "  1. Hot Phase (0-${WARM_PHASE_DAYS} days): Active logs, fully searchable"
echo "  2. Warm Phase (${WARM_PHASE_DAYS}-${RETENTION_DAYS} days): Read-only, compressed, merged"
echo "  3. Delete Phase (${RETENTION_DAYS}+ days): Automatically deleted"
echo ""
echo "Monitoring commands:"
echo "  # View ILM status"
echo "  curl $ES_HOST/_ilm/status"
echo ""
echo "  # Check policy"
echo "  curl $ES_HOST/_ilm/policy/cc-church-logs-policy"
echo ""
echo "  # View index lifecycle"
echo "  curl '$ES_HOST/_cat/indices/$INDEX_PATTERN?v&h=index,docs.count,store.size,creation.date.string'"
echo ""
echo "  # Explain ILM for specific index"
echo "  curl $ES_HOST/$INDEX_PATTERN/_ilm/explain"
echo ""
