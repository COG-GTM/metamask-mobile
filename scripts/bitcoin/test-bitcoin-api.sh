#!/usr/bin/env bash
# -------------------------------------------------------------------
# test-bitcoin-api.sh
# Test connectivity and basic operations against Bitcoin testnet APIs.
# Usage: ./scripts/bitcoin/test-bitcoin-api.sh [testnet|signet]
# -------------------------------------------------------------------

set -euo pipefail

NETWORK="${1:-testnet}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC}   $1"; }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; }

case "$NETWORK" in
  testnet)
    BLOCKSTREAM_BASE="https://blockstream.info/testnet/api"
    MEMPOOL_BASE="https://mempool.space/testnet/api"
    ;;
  signet)
    BLOCKSTREAM_BASE=""
    MEMPOOL_BASE="https://mempool.space/signet/api"
    ;;
  *)
    echo "Usage: $0 [testnet|signet]"
    exit 1
    ;;
esac

echo "============================================="
echo " Bitcoin API Connectivity Test (${NETWORK})"
echo "============================================="
echo ""

# --------------------------------------------------
# Helper: test a single endpoint
# --------------------------------------------------
test_endpoint() {
  local label="$1"
  local url="$2"

  if [ -z "$url" ]; then
    echo -e "  ${YELLOW}[SKIP]${NC} ${label} (not available for ${NETWORK})"
    return
  fi

  local http_code
  local body
  body=$(curl -sf --max-time 15 -w "\n%{http_code}" "$url" 2>/dev/null) || true
  http_code=$(echo "$body" | tail -1)
  body=$(echo "$body" | sed '$d')

  if [ "$http_code" = "200" ]; then
    # Truncate long responses for display
    local preview
    preview=$(echo "$body" | head -c 120)
    ok "${label} -> ${preview}"
  else
    fail "${label} (HTTP ${http_code:-timeout})"
  fi
}

# --------------------------------------------------
# 1. Blockstream Esplora API
# --------------------------------------------------
if [ -n "$BLOCKSTREAM_BASE" ]; then
  echo "--- Blockstream Esplora API ---"
  test_endpoint "Tip height"        "${BLOCKSTREAM_BASE}/blocks/tip/height"
  test_endpoint "Latest block hash" "${BLOCKSTREAM_BASE}/blocks/tip/hash"
  test_endpoint "Fee estimates"     "${BLOCKSTREAM_BASE}/fee-estimates"
  echo ""
fi

# --------------------------------------------------
# 2. Mempool.space API
# --------------------------------------------------
echo "--- Mempool.space API ---"
test_endpoint "Tip height"        "${MEMPOOL_BASE}/blocks/tip/height"
test_endpoint "Latest block hash" "${MEMPOOL_BASE}/blocks/tip/hash"
test_endpoint "Fee estimates"     "${MEMPOOL_BASE}/v1/fees/recommended"
test_endpoint "Mempool info"      "${MEMPOOL_BASE}/mempool"
echo ""

# --------------------------------------------------
# 3. Address lookup (known testnet/signet genesis coinbase)
# --------------------------------------------------
echo "--- Address/TX lookup ---"
if [ "$NETWORK" = "testnet" ]; then
  SAMPLE_ADDRESS="tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
  test_endpoint "Address info (Blockstream)" "${BLOCKSTREAM_BASE}/address/${SAMPLE_ADDRESS}"
  test_endpoint "Address info (Mempool)"     "${MEMPOOL_BASE}/address/${SAMPLE_ADDRESS}"
elif [ "$NETWORK" = "signet" ]; then
  SAMPLE_ADDRESS="tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
  test_endpoint "Address info (Mempool)" "${MEMPOOL_BASE}/address/${SAMPLE_ADDRESS}"
fi

echo ""
echo "============================================="
echo -e " ${GREEN}Bitcoin ${NETWORK} API test complete.${NC}"
echo "============================================="
