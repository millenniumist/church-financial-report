#!/bin/bash

# One-command cleanup script
# Runs both Elasticsearch and Cloudinary cleanup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=================================="
echo -e "Storage Cleanup - All Systems"
echo -e "==================================${NC}"
echo ""

# 1. Elasticsearch Log Cleanup
echo -e "${YELLOW}[1/2] Elasticsearch Log Management${NC}"
echo ""

if [ -f "$SCRIPT_DIR/setup-elasticsearch-ilm.sh" ]; then
  bash "$SCRIPT_DIR/setup-elasticsearch-ilm.sh"
else
  echo -e "${RED}✗ Elasticsearch ILM script not found${NC}"
fi

echo ""
echo ""

# 2. Cloudinary Media Cleanup
echo -e "${YELLOW}[2/2] Cloudinary Media Cleanup${NC}"
echo ""

if [ -f "$SCRIPT_DIR/cloudinary-cleanup.js" ]; then
  # Check if Node.js is available
  if command -v node &> /dev/null; then
    cd "$SCRIPT_DIR"
    node cloudinary-cleanup.js
  else
    echo -e "${RED}✗ Node.js not found. Cannot run Cloudinary cleanup.${NC}"
    echo -e "${YELLOW}Install Node.js: https://nodejs.org/${NC}"
  fi
else
  echo -e "${RED}✗ Cloudinary cleanup script not found${NC}"
fi

echo ""
echo -e "${GREEN}=================================="
echo -e "✅ Cleanup Complete"
echo -e "==================================${NC}"
echo ""
echo "Next steps:"
echo "  • Review Elasticsearch indices: curl 'http://localhost:9200/_cat/indices?v'"
echo "  • Check Cloudinary usage: https://cloudinary.com/console"
echo "  • To actually delete Cloudinary files: DRY_RUN=false $SCRIPT_DIR/cloudinary-cleanup.js"
echo ""
