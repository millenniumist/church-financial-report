#!/bin/bash

# Setup Bulletins Feature on Remote Server
# This script sets up the bulletins directory and runs migrations

echo "======================================"
echo "📄 Setting up Bulletins Feature"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load deployment config
if [ -f "deployment/.env" ]; then
    # Parse .env file properly (handle quoted values)
    eval $(grep -v '^#' deployment/.env | grep -E 'hostIp|username|password' | sed 's/ = /=/g' | sed 's/^/export /')
else
    echo -e "${RED}✗ deployment/.env not found${NC}"
    exit 1
fi

REMOTE_HOST="${hostIp}"
REMOTE_USER="${username}"
REMOTE_PASS="${password}"

echo -e "${BLUE}Remote Server:${NC} ${REMOTE_USER}@${REMOTE_HOST}"
echo ""

# Step 1: Create bulletins directory
echo "Step 1: Creating bulletins directory..."
sshpass -p "${REMOTE_PASS}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
mkdir -p /home/mill/hosting/bulletins
chmod 755 /home/mill/hosting/bulletins
ls -la /home/mill/hosting/ | grep bulletins
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Bulletins directory created${NC}"
else
    echo -e "${RED}✗ Failed to create directory${NC}"
    exit 1
fi

echo ""

# Step 2: Run database migration
echo "Step 2: Running database migration..."
sshpass -p "${REMOTE_PASS}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
cd /home/mill/hosting
echo "Running: npx prisma migrate deploy"
npx prisma migrate deploy 2>&1 | tail -10
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration completed${NC}"
else
    echo -e "${YELLOW}⚠ Migration may have failed - check output above${NC}"
fi

echo ""

# Step 3: Verify setup
echo "Step 3: Verifying setup..."
sshpass -p "${REMOTE_PASS}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
echo "Checking bulletins directory:"
ls -la /home/mill/hosting/bulletins 2>&1 || echo "Directory check failed"

echo ""
echo "Checking database connection:"
cd /home/mill/hosting
npx prisma db execute --stdin <<SQL 2>&1 | tail -5
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'Bulletin'
);
SQL
EOF

echo ""
echo "======================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Deploy the code: ./deployment/deploy-remote.sh"
echo "  2. Visit: https://www.chonburichurch.com/admin/bulletins"
echo "  3. Upload your first bulletin!"
echo ""
