#!/bin/bash

# Generate SSL/TLS Certificates for Cura AI Health
# Creates self-signed certificates for development
# For production, use Let's Encrypt or your certificate authority

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
CERT_DIR="config/ssl"
CERT_VALIDITY_DAYS=365
KEY_SIZE=4096

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}SSL/TLS Certificate Generator${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Create certificate directory
mkdir -p "$CERT_DIR/certs"
mkdir -p "$CERT_DIR/private"

# Check if certificates already exist
if [ -f "$CERT_DIR/certs/server.crt" ] && [ -f "$CERT_DIR/private/server.key" ]; then
    echo -e "${YELLOW}SSL certificates already exist in $CERT_DIR${NC}"
    read -p "Do you want to regenerate them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing certificates"
        exit 0
    fi
fi

# Certificate details
COUNTRY="US"
STATE="California"
CITY="San Francisco"
ORG="Cura AI Health"
COMMON_NAME="localhost"
ALT_NAMES="DNS:localhost,DNS:*.localhost,DNS:127.0.0.1,IP:127.0.0.1"

echo -e "${YELLOW}Generating self-signed SSL/TLS certificate...${NC}"
echo "Certificate Details:"
echo "  Country: $COUNTRY"
echo "  State: $STATE"
echo "  City: $CITY"
echo "  Organization: $ORG"
echo "  Common Name: $COMMON_NAME"
echo "  Validity: $CERT_VALIDITY_DAYS days"
echo "  Key Size: $KEY_SIZE bits"
echo ""

# Generate private key
echo -e "${YELLOW}1. Generating private key...${NC}"
openssl genrsa -out "$CERT_DIR/private/server.key" "$KEY_SIZE" 2>/dev/null
echo -e "${GREEN}✓ Private key generated${NC}"

# Generate certificate request
echo -e "${YELLOW}2. Creating certificate request...${NC}"
openssl req -new \
    -key "$CERT_DIR/private/server.key" \
    -out "$CERT_DIR/certs/server.csr" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$COMMON_NAME" \
    2>/dev/null
echo -e "${GREEN}✓ Certificate request created${NC}"

# Create extensions file for SAN (Subject Alternative Names)
echo -e "${YELLOW}3. Creating certificate with SANs...${NC}"
cat > "$CERT_DIR/certs/san.ext" << EOF
subjectAltName=$ALT_NAMES
EOF

# Generate self-signed certificate
openssl x509 -req \
    -days "$CERT_VALIDITY_DAYS" \
    -in "$CERT_DIR/certs/server.csr" \
    -signkey "$CERT_DIR/private/server.key" \
    -out "$CERT_DIR/certs/server.crt" \
    -extfile "$CERT_DIR/certs/san.ext" \
    2>/dev/null
echo -e "${GREEN}✓ Self-signed certificate generated${NC}"

# Set proper permissions
chmod 600 "$CERT_DIR/private/server.key"
chmod 644 "$CERT_DIR/certs/server.crt"

# Display certificate information
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Certificate Information${NC}"
echo -e "${GREEN}================================${NC}"
openssl x509 -in "$CERT_DIR/certs/server.crt" -noout -text | grep -A 2 "Subject:\|Not Before:\|Not After:\|Public-Key:"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Certificate Files Created${NC}"
echo -e "${GREEN}================================${NC}"
echo "Private Key: $CERT_DIR/private/server.key"
echo "Certificate: $CERT_DIR/certs/server.crt"
echo ""

# Create environment variable file
echo -e "${YELLOW}Creating SSL environment configuration...${NC}"
cat > "$CERT_DIR/.env.ssl" << EOF
# SSL/TLS Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/etc/nginx/ssl/certs/server.crt
SSL_KEY_PATH=/etc/nginx/ssl/private/server.key
SSL_PROTOCOLS=TLSv1.2 TLSv1.3
SSL_CIPHERS=HIGH:!aNULL:!MD5
SSL_PREFER_SERVER_CIPHERS=on
SSL_SESSION_TIMEOUT=1d
SSL_SESSION_CACHE=shared:SSL:50m
EOF

echo -e "${GREEN}✓ SSL configuration created${NC}"
echo "  Location: $CERT_DIR/.env.ssl"
echo ""

# Instructions
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Next Steps${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "1. Update docker-compose.yml to use HTTPS:"
echo "   - Uncomment the HTTPS server block in config/nginx.conf"
echo "   - Restart nginx: docker-compose restart nginx"
echo ""
echo "2. Access with HTTPS:"
echo "   https://localhost (you'll get a certificate warning in browser)"
echo "   - This is normal for self-signed certificates"
echo "   - Click 'Advanced' → 'Proceed anyway' in your browser"
echo ""
echo "3. For production:"
echo "   - Use certificates from Let's Encrypt (free)"
echo "   - Or use your organization's certificate authority"
echo "   - Replace files in: $CERT_DIR"
echo ""
echo "4. Verify certificate:"
echo "   openssl s_client -connect localhost:443"
echo ""

# Create certificate renewal reminder
echo -e "${YELLOW}Certificate Renewal Reminder${NC}"
echo "Self-signed certificate expires in $CERT_VALIDITY_DAYS days"
echo "Set a calendar reminder to regenerate before expiration"
echo ""
