#!/usr/bin/env bash
# -------------------------------------------------------------------
# check-bitcoin-deps.sh
# Verify that Bitcoin development dependencies are available.
# Usage: ./scripts/bitcoin/check-bitcoin-deps.sh
# -------------------------------------------------------------------

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
WARN=0
FAIL=0

ok()   { echo -e "  ${GREEN}[OK]${NC}   $1"; PASS=$((PASS + 1)); }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; WARN=$((WARN + 1)); }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; FAIL=$((FAIL + 1)); }

echo "============================================="
echo " Bitcoin Dev Environment Dependency Check"
echo "============================================="
echo ""

# --------------------------------------------------
# 1. Node.js
# --------------------------------------------------
echo "--- Runtime ---"
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version)
  ok "Node.js ${NODE_VERSION}"
else
  fail "Node.js is not installed"
fi

# --------------------------------------------------
# 2. Yarn
# --------------------------------------------------
if command -v yarn &>/dev/null; then
  YARN_VERSION=$(yarn --version)
  ok "Yarn ${YARN_VERSION}"
else
  fail "Yarn is not installed"
fi

# --------------------------------------------------
# 3. npm package: bitcoin-address-validation
# --------------------------------------------------
echo ""
echo "--- npm packages (Bitcoin-related) ---"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

check_npm_pkg() {
  local pkg="$1"
  if [ -d "${REPO_ROOT}/node_modules/${pkg}" ]; then
    local ver
    ver=$(node -p "require('${pkg}/package.json').version" 2>/dev/null || echo "unknown")
    ok "${pkg}@${ver}"
  else
    fail "${pkg} is not installed — run 'yarn install'"
  fi
}

check_npm_pkg "bitcoin-address-validation"
check_npm_pkg "@metamask/bitcoin-wallet-snap"
check_npm_pkg "@metamask/keyring-api"

# --------------------------------------------------
# 4. Network connectivity to public Bitcoin APIs
# --------------------------------------------------
echo ""
echo "--- Bitcoin API connectivity ---"

check_api() {
  local name="$1"
  local url="$2"
  if curl -sf --max-time 10 "${url}" >/dev/null 2>&1; then
    ok "${name} reachable"
  else
    warn "${name} unreachable (${url})"
  fi
}

check_api "Blockstream Testnet" "https://blockstream.info/testnet/api/blocks/tip/height"
check_api "Mempool.space Testnet" "https://mempool.space/testnet/api/blocks/tip/height"
check_api "Mempool.space Signet"  "https://mempool.space/signet/api/blocks/tip/height"

# --------------------------------------------------
# 5. Optional: curl / jq for scripts
# --------------------------------------------------
echo ""
echo "--- Optional tools ---"

if command -v curl &>/dev/null; then
  ok "curl $(curl --version | head -1 | awk '{print $2}')"
else
  warn "curl not found — some scripts may not work"
fi

if command -v jq &>/dev/null; then
  ok "jq $(jq --version 2>&1)"
else
  warn "jq not found — install with: brew install jq / apt-get install jq"
fi

# --------------------------------------------------
# Summary
# --------------------------------------------------
echo ""
echo "============================================="
echo " Results: ${GREEN}${PASS} passed${NC}, ${YELLOW}${WARN} warnings${NC}, ${RED}${FAIL} failed${NC}"
echo "============================================="

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}Some required dependencies are missing. Please install them before proceeding.${NC}"
  exit 1
fi

if [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}Some optional dependencies or APIs are unavailable. Development may still work.${NC}"
  exit 0
fi

echo -e "${GREEN}All checks passed! Ready for Bitcoin development.${NC}"
