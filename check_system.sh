#!/bin/bash

echo "=========================================="
echo "Project-Companion System Diagnostic Report"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check API Gateway
echo "1. Checking API Gateway..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API Gateway is running on port 8080"
else
    echo -e "${RED}✗${NC} API Gateway not responding on port 8080"
fi

# 2. Check Workspace Service
echo ""
echo "2. Checking Workspace Service..."
if curl -s http://localhost:8081/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Workspace Service is running on port 8081"
else
    echo -e "${YELLOW}⚠${NC} Workspace Service not responding on port 8081 (may not have /health)"
fi

# 3. Check MinIO
echo ""
echo "3. Checking MinIO..."
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MinIO is running on port 9000"
else
    echo -e "${YELLOW}⚠${NC} MinIO not responding on port 9000"
fi

# 4. Check Frontend
echo ""
echo "4. Checking Frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is running on port 5173"
else
    echo -e "${YELLOW}⚠${NC} Frontend not responding on port 5173"
fi

# 5. List running services
echo ""
echo "5. Running Services:"
ps aux | grep -E "java|node|npm" | grep -v grep | awk '{print "  - " $NF}'

echo ""
echo "=========================================="
echo "To verify file storage:"
echo ""
echo "Database check:"
echo "  SELECT COUNT(*) FROM project_files;"
echo ""
echo "API debug endpoint:"
echo "  curl http://localhost:8080/api/v1/workspace/projects/1/files/debug"
echo ""
echo "MinIO check:"
echo "  Login to http://localhost:9001"
echo "  Check 'projects' bucket for stored files"
echo "=========================================="
