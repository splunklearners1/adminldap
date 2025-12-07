#!/bin/bash
# ============================================================
# LDAP Server Auto-Deploy Script for AWS EC2
# Source: https://github.com/splunklearners1/adminldap.git
# ============================================================

# 1. Update System & Install Git/Docker
echo "--- [1/5] Updating System and Installing Dependencies ---"
sudo yum update -y
sudo yum install -y git docker

# 2. Start & Configure Docker
echo "--- [2/5] Configuring Docker Service ---"
sudo service docker start
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# 3. Install Docker Compose
echo "--- [3/5] Installing Docker Compose ---"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    # Verify if /usr/bin/docker-compose exists, if not create link
    if [ ! -f /usr/bin/docker-compose ]; then
        sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
fi

# 4. Clone/Pull Repository
echo "--- [4/5] Fetching Code from GitHub ---"
REPO_DIR="adminldap"
REPO_URL="https://github.com/splunklearners1/adminldap.git"

if [ -d "$REPO_DIR" ]; then
    echo "Directory exists. Pulling latest changes..."
    cd $REPO_DIR
    git pull
else
    echo "Cloning repository..."
    git clone $REPO_URL $REPO_DIR
    cd $REPO_DIR
fi

# 5. Docker Compose Build & Up
echo "--- [5/5] Building and Starting LDAP Container ---"
sudo /usr/local/bin/docker-compose down
sudo /usr/local/bin/docker-compose build --no-cache
sudo /usr/local/bin/docker-compose up -d

echo ""
echo "============================================================"
echo "                   DEPLOYMENT SUCCESSFUL"
echo "============================================================"
echo "App URLs:"
echo " - Web Interface: http://$(curl -s http://checkip.amazonaws.com):3000"
echo " - LDAP Server:   ldap://$(curl -s http://checkip.amazonaws.com):1389"
echo ""
echo "Status:"
sudo /usr/local/bin/docker-compose ps
echo "============================================================"
