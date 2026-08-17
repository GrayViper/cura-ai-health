#!/bin/bash

# Cura AI Health Stack - Startup Script
# Manages Docker Compose services for the complete medical stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
ENV_TEMPLATE=".env.template"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Cura AI Health Stack Manager${NC}"
echo -e "${GREEN}================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    echo -e "${GREEN}.env file created. Please review and update sensitive values.${NC}"
fi

# Main menu
case "${1:-help}" in
    start)
        echo -e "${YELLOW}Starting Cura AI Health stack...${NC}"
        docker-compose -f "$COMPOSE_FILE" up -d
        echo -e "${GREEN}Stack started!${NC}"
        echo ""
        echo -e "${GREEN}Services available at:${NC}"
        echo "  - Web App: http://localhost"
        echo "  - OCR API: http://localhost/api/ocr/status"
        echo "  - Orthanc DICOM: http://localhost:8042 (user: orthanc, pass: orthanc123)"
        echo "  - HAPI FHIR: http://localhost/fhir/"
        echo "  - searXNG Search: http://localhost:8888"
        echo ""
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
        
    stop)
        echo -e "${YELLOW}Stopping Cura AI Health stack...${NC}"
        docker-compose -f "$COMPOSE_FILE" down
        echo -e "${GREEN}Stack stopped!${NC}"
        ;;
        
    restart)
        echo -e "${YELLOW}Restarting Cura AI Health stack...${NC}"
        docker-compose -f "$COMPOSE_FILE" restart
        echo -e "${GREEN}Stack restarted!${NC}"
        ;;
        
    status)
        echo -e "${YELLOW}Checking service status...${NC}"
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
        
    logs)
        SERVICE="${2:-}"
        if [ -z "$SERVICE" ]; then
            docker-compose -f "$COMPOSE_FILE" logs -f
        else
            docker-compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
        fi
        ;;
        
    build)
        echo -e "${YELLOW}Building Docker images...${NC}"
        docker-compose -f "$COMPOSE_FILE" build
        echo -e "${GREEN}Build complete!${NC}"
        ;;
        
    rebuild)
        echo -e "${YELLOW}Rebuilding and restarting stack...${NC}"
        docker-compose -f "$COMPOSE_FILE" down
        docker-compose -f "$COMPOSE_FILE" build --no-cache
        docker-compose -f "$COMPOSE_FILE" up -d
        echo -e "${GREEN}Rebuild complete!${NC}"
        ;;
        
    test)
        echo -e "${YELLOW}Running health checks...${NC}"
        echo ""
        
        # OCR Service
        echo -e "${YELLOW}Testing OCR Service...${NC}"
        if curl -s http://localhost:5000/health > /dev/null; then
            echo -e "${GREEN}✓ OCR Service: Healthy${NC}"
        else
            echo -e "${RED}✗ OCR Service: Not responding${NC}"
        fi
        
        # Orthanc
        echo -e "${YELLOW}Testing Orthanc DICOM...${NC}"
        if curl -s http://localhost:8042/ > /dev/null; then
            echo -e "${GREEN}✓ Orthanc: Healthy${NC}"
        else
            echo -e "${RED}✗ Orthanc: Not responding${NC}"
        fi
        
        # HAPI FHIR
        echo -e "${YELLOW}Testing HAPI FHIR...${NC}"
        if curl -s http://localhost:8080/fhir/ > /dev/null; then
            echo -e "${GREEN}✓ HAPI FHIR: Healthy${NC}"
        else
            echo -e "${RED}✗ HAPI FHIR: Not responding${NC}"
        fi
        
        # searXNG
        echo -e "${YELLOW}Testing searXNG...${NC}"
        if curl -s http://localhost:8888/ > /dev/null; then
            echo -e "${GREEN}✓ searXNG: Healthy${NC}"
        else
            echo -e "${RED}✗ searXNG: Not responding${NC}"
        fi
        
        # Nginx
        echo -e "${YELLOW}Testing Nginx Reverse Proxy...${NC}"
        if curl -s http://localhost/health > /dev/null; then
            echo -e "${GREEN}✓ Nginx: Healthy${NC}"
        else
            echo -e "${RED}✗ Nginx: Not responding${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}Health check complete!${NC}"
        ;;
        
    clean)
        echo -e "${YELLOW}WARNING: This will remove all containers and volumes${NC}"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f "$COMPOSE_FILE" down -v
            echo -e "${GREEN}Cleanup complete!${NC}"
        else
            echo "Cleanup cancelled"
        fi
        ;;
        
    help|*)
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  start       - Start all services"
        echo "  stop        - Stop all services"
        echo "  restart     - Restart all services"
        echo "  status      - Show service status"
        echo "  logs        - View service logs (optionally specify service name)"
        echo "  build       - Build Docker images"
        echo "  rebuild     - Rebuild and restart all services"
        echo "  test        - Run health checks"
        echo "  clean       - Remove containers and volumes"
        echo "  help        - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs ocr-service"
        echo "  $0 test"
        echo ""
        ;;
esac

exit 0
