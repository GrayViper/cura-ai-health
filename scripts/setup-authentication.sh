#!/bin/bash

# Setup Authentication for Cura AI Health Services
# Creates .htpasswd for basic auth and JWT token validation

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Authentication Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if htpasswd is available
if ! command -v htpasswd &> /dev/null; then
    echo -e "${YELLOW}⚠ htpasswd not found. Installing apache2-utils...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y apache2-utils
    elif command -v brew &> /dev/null; then
        brew install httpd
    else
        echo -e "${RED}Please install htpasswd manually and try again${NC}"
        exit 1
    fi
fi

CONFIG_DIR="config"
HTPASSWD_FILE="$CONFIG_DIR/.htpasswd"

echo -e "${YELLOW}Step 1: Create Nginx Basic Auth Credentials${NC}"
echo ""
echo "This will be used for Orthanc DICOM access"
echo "Note: Basic auth is for development only. Use OAuth2/JWT for production."
echo ""

# Check if .htpasswd already exists
if [ -f "$HTPASSWD_FILE" ]; then
    echo -e "${YELLOW}Existing .htpasswd file found${NC}"
    read -p "Do you want to regenerate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing credentials"
        echo ""
    else
        rm -f "$HTPASSWD_FILE"
    fi
fi

if [ ! -f "$HTPASSWD_FILE" ]; then
    read -p "Enter username for Orthanc access [orthanc]: " username
    username=${username:-orthanc}
    
    echo -e "${YELLOW}Enter password for user '$username':${NC}"
    read -s password
    echo ""
    
    # Create htpasswd file
    htpasswd -c -b "$HTPASSWD_FILE" "$username" "$password"
    
    echo -e "${GREEN}✓ .htpasswd created successfully${NC}"
    echo "  Location: $HTPASSWD_FILE"
    echo "  Username: $username"
    echo ""
fi

echo -e "${YELLOW}Step 2: Generate JWT Secret Key${NC}"
echo ""

JWT_SECRET_FILE="$CONFIG_DIR/.jwt-secret"

if [ -f "$JWT_SECRET_FILE" ]; then
    echo -e "${YELLOW}JWT secret file already exists${NC}"
    read -p "Do you want to regenerate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing JWT secret"
        echo ""
        exit 0
    else
        rm -f "$JWT_SECRET_FILE"
    fi
fi

# Generate a strong random JWT secret
JWT_SECRET=$(openssl rand -base64 32)

echo "$JWT_SECRET" > "$JWT_SECRET_FILE"
chmod 600 "$JWT_SECRET_FILE"

echo -e "${GREEN}✓ JWT secret generated${NC}"
echo "  Location: $JWT_SECRET_FILE"
echo "  Length: 32 bytes (base64 encoded)"
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Authentication Setup Complete${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

echo "Files Created:"
echo "  1. $HTPASSWD_FILE - Basic auth credentials"
echo "  2. $JWT_SECRET_FILE - JWT signing key"
echo ""

echo "Environment Variables to add to .env:"
echo "  JWT_SECRET=$(cat $JWT_SECRET_FILE)"
echo "  BASIC_AUTH_ENABLED=true"
echo ""

echo "Usage:"
echo ""
echo "1. Basic Auth (Orthanc):"
echo "   - Username: (from .htpasswd)"
echo "   - Password: (from .htpasswd)"
echo "   - Nginx will prompt for credentials"
echo ""
echo "2. JWT Token (API protection):"
echo "   - Use JWT_SECRET=$(cat $JWT_SECRET_FILE)"
echo "   - Add Authorization header: Bearer <token>"
echo ""

echo "Next Steps:"
echo "1. Add JWT_SECRET to .env file"
echo "2. Update docker-compose.yml to pass JWT_SECRET to services"
echo "3. Implement token validation in OCR service (see examples below)"
echo ""

echo -e "${YELLOW}Example: JWT Token Validation in Flask${NC}"
echo ""
cat << 'EOF'
# In OCR service (services/ocr/app.py):

import jwt
from functools import wraps
from flask import request, jsonify

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret')

def require_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token required'}), 401
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user = payload
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

@app.route('/api/v1/ocr/extract', methods=['POST'])
@require_token  # Add this decorator
def extract_ocr():
    # Protected endpoint
    user_id = request.user.get('sub')
    # ... rest of function
EOF

echo ""
