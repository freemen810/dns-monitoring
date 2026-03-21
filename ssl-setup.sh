#!/bin/bash

################################################################################
# DNS Monitoring - SSL Certificate Setup Script
# Generates free SSL certificates using Let's Encrypt & Certbot
#
# Usage:
#   ./ssl-setup.sh                    # Interactive mode
#   ./ssl-setup.sh mydomain.com       # Non-interactive mode
#
# Requirements:
#   - certbot installed (https://certbot.eff.org/)
#   - Domain must be publicly accessible
#   - Port 80 must be open (temporarily for validation)
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if certbot is installed
check_certbot() {
    if ! command -v certbot &> /dev/null; then
        log_error "Certbot is not installed"
        echo ""
        echo "Install certbot first:"
        echo "  macOS:   brew install certbot"
        echo "  Ubuntu:  sudo apt-get install certbot"
        echo "  Debian:  sudo apt-get install certbot"
        echo "  CentOS:  sudo yum install certbot"
        echo ""
        echo "Or visit: https://certbot.eff.org/instructions"
        exit 1
    fi
    log_success "Certbot found"
}

# Get domain from argument or user input
get_domain() {
    if [ -n "$1" ]; then
        DOMAIN="$1"
    else
        echo ""
        log_info "=========================================="
        log_info "SSL Certificate Generation"
        log_info "=========================================="
        echo ""
        read -p "Enter your domain (e.g., example.com): " DOMAIN
    fi

    # Validate domain
    if [ -z "$DOMAIN" ]; then
        log_error "Domain cannot be empty"
        exit 1
    fi

    log_info "Domain: $DOMAIN"
}

# Get email for certificate
get_email() {
    echo ""
    read -p "Enter email for Let's Encrypt notices (e.g., admin@example.com): " EMAIL

    if [ -z "$EMAIL" ]; then
        log_warning "No email provided, using noreply@example.com"
        EMAIL="noreply@example.com"
    fi

    log_info "Email: $EMAIL"
}

# Validate domain is accessible
validate_domain() {
    log_info "Validating domain accessibility..."

    if dig +short "$DOMAIN" | grep -qE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'; then
        log_success "Domain resolves to an IP address"
    else
        log_warning "Could not verify domain. Proceeding anyway..."
        log_warning "Make sure port 80 is accessible from the internet"
    fi
}

# Check if SSL directory exists
check_ssl_directory() {
    if [ ! -d "ssl" ]; then
        mkdir -p ssl
        log_success "Created ssl/ directory"
    fi
}

# Generate SSL certificate
generate_certificate() {
    echo ""
    log_info "=========================================="
    log_info "Generating SSL Certificate"
    log_info "=========================================="
    echo ""

    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --preferred-challenges http \
        -d "$DOMAIN"; then

        log_success "Certificate generated successfully"
        return 0
    else
        log_error "Failed to generate certificate"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Make sure port 80 is open to the internet"
        echo "  2. Make sure the domain resolves to this server"
        echo "  3. Try again in a few minutes (rate limiting)"
        echo "  4. Check certbot logs: sudo certbot renew --dry-run"
        return 1
    fi
}

# Copy certificates to ssl directory
copy_certificates() {
    log_info "Copying certificates to ssl/ directory..."

    CERT_SOURCE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    KEY_SOURCE="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
    CERT_DEST="ssl/cert.pem"
    KEY_DEST="ssl/key.pem"

    # Try with sudo if needed
    if [ -r "$CERT_SOURCE" ]; then
        cp "$CERT_SOURCE" "$CERT_DEST"
        cp "$KEY_SOURCE" "$KEY_DEST"
        chmod 644 "$CERT_DEST" "$KEY_DEST"
        log_success "Certificates copied"
    else
        log_error "Cannot read certificate files"
        log_info "Trying with sudo..."

        if sudo cp "$CERT_SOURCE" "$CERT_DEST" && sudo cp "$KEY_SOURCE" "$KEY_DEST"; then
            sudo chmod 644 "$CERT_DEST" "$KEY_DEST"
            log_success "Certificates copied with sudo"
        else
            log_error "Failed to copy certificates"
            echo ""
            echo "Manual copy:"
            echo "  sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem"
            echo "  sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem"
            echo "  sudo chmod 644 ssl/*.pem"
            return 1
        fi
    fi
}

# Setup automatic renewal
setup_renewal() {
    echo ""
    log_info "Setting up automatic certificate renewal..."

    # Create renewal hook script
    cat > renew-certs.sh << 'EOF'
#!/bin/bash
# Auto-renewal hook for Let's Encrypt certificates
# Copy certificates to docker volume after renewal

DOMAIN=$1
CERT_SOURCE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
KEY_SOURCE="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
CERT_DEST="$(pwd)/ssl/cert.pem"
KEY_DEST="$(pwd)/ssl/key.pem"

if [ -f "$CERT_SOURCE" ]; then
    cp "$CERT_SOURCE" "$CERT_DEST"
    cp "$KEY_SOURCE" "$KEY_DEST"
    docker-compose -f docker-compose.prod.yml restart nginx
fi
EOF

    chmod +x renew-certs.sh
    log_success "Created renew-certs.sh"

    echo ""
    echo "To enable automatic renewal:"
    echo "  ${BLUE}sudo certbot renew --deploy-hook './renew-certs.sh ${DOMAIN}'${NC}"
    echo ""
    echo "Or set up a cron job:"
    echo "  ${BLUE}sudo crontab -e${NC}"
    echo "  Add: 0 3 * * * certbot renew --deploy-hook '/path/to/renew-certs.sh ${DOMAIN}'"
}

# Update nginx config
update_nginx_config() {
    echo ""
    log_info "Updating nginx.conf for HTTPS..."

    if grep -q "ssl_certificate" nginx.conf; then
        log_success "nginx.conf already has SSL configuration"
    else
        log_warning "SSL directives not found in nginx.conf"
        echo ""
        echo "Add these to the HTTPS server block in nginx.conf:"
        echo ""
        echo "  listen 443 ssl http2;"
        echo "  ssl_certificate /etc/nginx/ssl/cert.pem;"
        echo "  ssl_certificate_key /etc/nginx/ssl/key.pem;"
        echo "  ssl_protocols TLSv1.2 TLSv1.3;"
        echo "  ssl_ciphers HIGH:!aNULL:!MD5;"
        echo ""
    fi
}

# Show final instructions
show_summary() {
    echo ""
    log_success "=========================================="
    log_success "SSL Setup Complete!"
    log_success "=========================================="
    echo ""
    echo "Certificate Details:"
    echo "  Domain: $DOMAIN"
    echo "  Certificate: ssl/cert.pem"
    echo "  Private Key: ssl/key.pem"
    echo ""
    echo "Next steps:"
    echo "  1. Verify nginx.conf has SSL configuration"
    echo "  2. Update .env.prod:"
    echo "     ${BLUE}VITE_API_URL=https://$DOMAIN/api${NC}"
    echo "     ${BLUE}CORS_ORIGIN=https://$DOMAIN${NC}"
    echo "  3. Restart your deployment:"
    echo "     ${BLUE}docker-compose -f docker-compose.prod.yml restart${NC}"
    echo ""
    echo "Certificate Renewal:"
    echo "  Certificates auto-renew ~30 days before expiry"
    echo "  Check status: certbot certificates"
    echo "  Manual renew: certbot renew"
    echo ""
    echo "Test HTTPS:"
    echo "  ${BLUE}curl -k https://$DOMAIN/api/health${NC}"
    echo ""
}

# Main execution
main() {
    clear
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║  DNS Monitoring - SSL Certificate Setup                ║"
    echo "║  Generate free HTTPS certificates with Let's Encrypt   ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""

    check_certbot
    get_domain "$1"
    get_email
    validate_domain
    check_ssl_directory

    read -p "Continue with certificate generation? (y/n): " CONFIRM
    if [[ ! "$CONFIRM" == "y" && ! "$CONFIRM" == "Y" ]]; then
        log_info "Cancelled"
        exit 0
    fi

    if generate_certificate; then
        copy_certificates
        setup_renewal
        update_nginx_config
        show_summary
    else
        exit 1
    fi
}

# Run main
main "$@"
