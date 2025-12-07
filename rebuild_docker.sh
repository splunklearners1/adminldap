#!/bin/bash
# Script to rebuild and restart the LDAP Docker container on Linux
# This fixes the "Cannot GET /" error

echo "========================================"
echo "LDAP Docker Container - Rebuild Script"
echo "========================================"
echo ""

echo "Step 1: Stopping current container..."
docker-compose down
echo ""

echo "Step 2: Rebuilding container (this may take a minute)..."
docker-compose build --no-cache
echo ""

echo "Step 3: Starting container..."
docker-compose up -d
echo ""

echo "Step 4: Waiting for container to start..."
sleep 3
echo ""

echo "Step 5: Checking container status..."
docker-compose ps
echo ""

echo "Step 6: Showing recent logs..."
docker-compose logs --tail=20
echo ""

echo "========================================"
echo "Container should now be running!"
echo "========================================"
echo ""
echo "Web Interface: http://172.31.9.197:3000"
echo "LDAP Server:   ldap://172.31.9.197:1389"
echo ""
echo "To view live logs, run: docker-compose logs -f"
echo "To stop container, run: docker-compose down"
echo ""
