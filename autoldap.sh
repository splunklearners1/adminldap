#!/bin/bash
# ============================================================
# LDAP Server Auto-Installer
# Use with: git clone ... && cd ... && ./autoldap.sh
# ============================================================

echo "--- [1/3] Detecting OS and Installing Docker ---"
if [ -f /etc/amazon-release ]; then
    # Amazon Linux 2/2023
    yum update -y
    yum install -y docker
    service docker start
    systemctl enable docker
    usermod -aG docker ec2-user
elif [ -f /etc/redhat-release ]; then
    # RHEL / CentOS
    yum update -y
    yum install -y docker
    systemctl start docker
    systemctl enable docker
else
    # Fallback/Debian/Ubuntu (just in case)
    apt-get update -y
    apt-get install -y docker.io
    systemctl start docker
    systemctl enable docker
fi

echo "--- [2/3] Installing Docker Compose ---"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Symlink if needed
    if [ ! -f /usr/bin/docker-compose ]; then
        ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
fi

echo "--- [3/3] Building and Starting LDAP Server ---"
# We assume we are already in the project directory
/usr/local/bin/docker-compose down
/usr/local/bin/docker-compose build --no-cache
/usr/local/bin/docker-compose up -d

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
