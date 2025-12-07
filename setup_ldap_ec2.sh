#!/bin/bash
# ==========================================
# LDAP Server Automated Setup Script for AWS EC2
# ==========================================

# 1. System Update
echo "--- Updating System Packages ---"
sudo yum update -y

# 2. Install Docker
echo "--- Installing Docker ---"
sudo yum install -y docker
sudo service docker start
sudo systemctl enable docker

# 3. Add current user to Docker group (avoids sudo usage for docker commands)
echo "--- Configuring Docker Permissions ---"
sudo usermod -aG docker $USER
# Note: User typically needs to logout/login for this to take effect, 
# but for the script we will use sudo or 'newgrp' context if needed.

# 4. Install Docker Compose
echo "--- Installing Docker Compose ---"
# Check if docker-compose is already installed
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    # Create symlink if needed
    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

# 5. Build and Start LDAP Service
echo "--- Building and Starting LDAP Service ---"

# Ensure execute permissions on public files just in case
chmod -R 755 public/

# Stop any existing containers
sudo /usr/local/bin/docker-compose down

# Build fresh
sudo /usr/local/bin/docker-compose build --no-cache

# Start in background
sudo /usr/local/bin/docker-compose up -d

echo ""
echo "=========================================="
echo "       INSTALLATION COMPLETE"
echo "=========================================="
echo "LDAP Server Status:"
sudo /usr/local/bin/docker-compose ps
echo ""
echo "Web Interface: http://$(curl -s http://checkip.amazonaws.com):3000"
echo "LDAP Server:   ldap://$(curl -s http://checkip.amazonaws.com):1389"
echo "=========================================="
