#!/bin/bash
# ============================================================
# LDAP Server Auto-Installer (Amazon Linux Only)
# Use with: git clone ... && cd ... && ./autoldap.sh
# ============================================================

# Check skipped as per user request


echo "--- [1/3] Installing Docker on Amazon Linux ---"
sudo yum update -y

# Check if docker is already installed
if ! command -v docker &> /dev/null; then
    # Try Amazon Linux 2 Extras first
    if command -v amazon-linux-extras &> /dev/null; then
        echo "Detected Amazon Linux 2. Using amazon-linux-extras..."
        sudo amazon-linux-extras install docker -y
    else
        # Amazon Linux 2023 or Standard Yum
        echo "Using standard yum install..."
        sudo yum install -y docker
    fi
else
    echo "Docker is already installed."
fi

# Start Docker
sudo service docker start
sudo systemctl enable docker
sudo usermod -aG docker ec2-user || echo "ec2-user not found, skipping group add"

# Verify Docker is running
if ! sudo docker info &> /dev/null; then
    echo "ERROR: Docker failed to start or install."
    exit 1
fi
echo "Docker is running successfully."

echo "--- [2/3] Installing Docker Compose ---"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Symlink if needed
    if [ ! -f /usr/bin/docker-compose ]; then
        sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
fi

echo "--- [3/3] Building and Starting LDAP Server ---"
# We assume we are already in the project directory
sudo /usr/local/bin/docker-compose down
sudo /usr/local/bin/docker-compose build --no-cache
sudo /usr/local/bin/docker-compose up -d

echo ""
echo "============================================================"
echo "                   INSTALLATION COMPLETE"
echo "============================================================"
echo "Access the LDAP Web UI at:"
echo "   http://$(curl -s http://checkip.amazonaws.com):3000"
echo ""
echo "LDAP Connection Info:"
echo "   Host: $(curl -s http://checkip.amazonaws.com)"
echo "   Port: 1389"
echo "============================================================"
