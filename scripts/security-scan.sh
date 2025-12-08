#!/bin/bash

# Sprint 4 Security Scanning Script (UC-143)
# Run OWASP ZAP baseline scan and dependency audit
#
# Prerequisites:
# - Docker installed
# - Node.js installed
# - OWASP ZAP Docker image: docker pull ghcr.io/zaproxy/zaproxy:stable

set -e

echo "========================================"
echo "Sprint 4 Security Scan - UC-143"
echo "========================================"

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8080}"
REPORT_DIR="./security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create report directory
mkdir -p "$REPORT_DIR"

echo ""
echo "1. Running npm audit for dependency vulnerabilities..."
echo "----------------------------------------"
npm audit --json > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>&1 || true
npm audit --audit-level=high || echo "Note: Some vulnerabilities found. Review the report."

echo ""
echo "2. Checking for outdated dependencies..."
echo "----------------------------------------"
npm outdated --json > "$REPORT_DIR/npm-outdated-$TIMESTAMP.json" 2>&1 || true

echo ""
echo "3. Running ESLint security rules..."
echo "----------------------------------------"
npm run lint 2>&1 | tee "$REPORT_DIR/eslint-$TIMESTAMP.log" || true

echo ""
echo "4. Checking for secrets in codebase..."
echo "----------------------------------------"
# Simple pattern matching for common secret patterns
echo "Scanning for potential hardcoded secrets..."
SECRETS_FOUND=0

# Check for potential API keys, tokens, passwords
if grep -r -E "(api[_-]?key|apikey|secret[_-]?key|password|token|bearer)" \
   --include="*.ts" --include="*.tsx" --include="*.js" \
   --exclude-dir=node_modules --exclude-dir=.git \
   src/ 2>/dev/null | grep -v -E "(process\.env|Deno\.env|import\.meta\.env|// |/\*|interface|type )" | head -20; then
  echo "Warning: Potential secrets found. Please review above matches."
  SECRETS_FOUND=1
else
  echo "No obvious hardcoded secrets detected."
fi

echo ""
echo "5. OWASP ZAP Baseline Scan..."
echo "----------------------------------------"
if command -v docker &> /dev/null; then
  echo "Starting OWASP ZAP scan against $BASE_URL..."
  
  # Check if target is reachable
  if curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
    docker run --rm -v "$(pwd)/$REPORT_DIR:/zap/wrk:rw" \
      --network="host" \
      ghcr.io/zaproxy/zaproxy:stable \
      zap-baseline.py -t "$BASE_URL" \
      -r "zap-report-$TIMESTAMP.html" \
      -J "zap-report-$TIMESTAMP.json" \
      -I || echo "ZAP scan completed with findings"
  else
    echo "Warning: Target $BASE_URL is not reachable. Skipping ZAP scan."
    echo "Start the dev server first: npm run dev"
  fi
else
  echo "Docker not found. Skipping OWASP ZAP scan."
  echo "Install Docker to run ZAP: https://docs.docker.com/get-docker/"
fi

echo ""
echo "6. TypeScript strict mode check..."
echo "----------------------------------------"
npm run typecheck 2>&1 | tee "$REPORT_DIR/typecheck-$TIMESTAMP.log" || true

echo ""
echo "7. Generating security report summary..."
echo "----------------------------------------"

# Create summary report
cat > "$REPORT_DIR/security-summary-$TIMESTAMP.md" << EOF
# Security Scan Summary
**Date:** $(date)
**Target:** $BASE_URL

## Checks Performed
- [x] npm audit (dependency vulnerabilities)
- [x] npm outdated (outdated dependencies)
- [x] ESLint security rules
- [x] Hardcoded secrets scan
- [x] TypeScript strict mode check
- [$(command -v docker &> /dev/null && echo "x" || echo " ")] OWASP ZAP baseline scan

## Reports Generated
- npm-audit-$TIMESTAMP.json
- npm-outdated-$TIMESTAMP.json
- eslint-$TIMESTAMP.log
- typecheck-$TIMESTAMP.log
$(command -v docker &> /dev/null && echo "- zap-report-$TIMESTAMP.html" || echo "")
$(command -v docker &> /dev/null && echo "- zap-report-$TIMESTAMP.json" || echo "")

## Recommendations
1. Review and update vulnerable dependencies
2. Ensure all secrets are stored in environment variables
3. Enable CSP headers in production
4. Implement rate limiting on API endpoints
5. Regular security audits and penetration testing
EOF

echo ""
echo "========================================"
echo "Security scan complete!"
echo "Reports saved to: $REPORT_DIR"
echo "========================================"
