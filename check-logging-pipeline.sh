#!/bin/bash
# Diagnostic script to check the logging pipeline on Pi
# Run this on the Pi: bash check-logging-pipeline.sh

echo "=== LOGGING PIPELINE DIAGNOSTICS ==="
echo ""

echo "1. Checking nextjs-app container..."
CONTAINER_ID=$(docker ps --format '{{.ID}} {{.Names}}' | grep nextjs-app | awk '{print $1}')
if [ -z "$CONTAINER_ID" ]; then
  echo "❌ nextjs-app container not running!"
  exit 1
fi
echo "✓ Container ID: $CONTAINER_ID"
echo ""

echo "2. Checking if app outputs logs..."
echo "   Last 10 lines from container:"
docker logs --tail 10 nextjs-app 2>&1
echo ""

echo "3. Testing API to generate logs..."
curl -s http://localhost:8358/api/health > /dev/null && echo "✓ API call successful"
sleep 2
echo "   New logs from container:"
docker logs --since 5s nextjs-app 2>&1 | head -5
echo ""

echo "4. Checking Filebeat status..."
if docker ps --format '{{.Names}}' | grep -q '^filebeat$'; then
  echo "✓ Filebeat is running"
  echo "   Filebeat logs (last 10 lines):"
  docker logs --tail 10 filebeat 2>&1
else
  echo "❌ Filebeat not running!"
  echo "   Start it with: docker-compose up -d filebeat"
fi
echo ""

echo "5. Checking Elasticsearch..."
LOG_COUNT=$(curl -s "http://localhost:9200/.ds-cc-church-logs-*/_count" | python3 -c "import sys, json; print(json.load(sys.stdin)['count'])" 2>/dev/null)
echo "✓ Total logs in Elasticsearch: $LOG_COUNT"
echo ""

echo "6. Checking latest log timestamp..."
curl -s "http://localhost:9200/.ds-cc-church-logs-*/_search?size=1&sort=@timestamp:desc" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['hits']['hits']:
    latest = data['hits']['hits'][0]['_source']
    print(f\"Latest log: {latest.get('@timestamp', 'N/A')}\")
    print(f\"Container ID in log: {latest.get('container', {}).get('id', 'N/A')[:12]}\")
    print(f\"Current container ID: $CONTAINER_ID\")
    if latest.get('container', {}).get('id', '')[:12] != \"$CONTAINER_ID\"[:12]:
        print(\"⚠️  Log is from OLD container! Filebeat needs to be restarted.\")
    else:
        print(\"✓ Log is from current container\")
else:
    print('No logs found')
" 2>/dev/null
echo ""

echo "=== DIAGNOSIS COMPLETE ==="
echo ""
echo "If logs aren't appearing:"
echo "1. Check if docker logs shows JSON output (should see console.log JSON)"
echo "2. Restart Filebeat: docker restart filebeat"
echo "3. Wait 30s and rerun this script"
