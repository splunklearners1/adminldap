#!/bin/bash
# ============================================================
# LDAP Server Auto-Installer (Amazon Linux Only)
# Use with: git clone ... && cd ... && ./autoldap.sh
# ============================================================

# Check if running on Amazon Linux
if [ ! -f /etc/amazon-release ]; then
    echo "ERROR: This script is optimized for Amazon Linux only."
    exit 1
fi

echo "--- [1/3] Installing Docker on Amazon Linux ---"
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

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
