#!/usr/bin/env bash
# -------------------------------------------------------------------
# request-testnet-btc.sh
# Helper to request testnet BTC from faucets.
# Most faucets have captchas, so this script opens the browser.
# For signet, it attempts the mempool.space API faucet.
#
# Usage: ./scripts/bitcoin/request-testnet-btc.sh <address> [testnet|signet]
# -------------------------------------------------------------------

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ADDRESS="${1:-}"
NETWORK="${2:-testnet}"

if [ -z "$ADDRESS" ]; then
  echo "Usage: $0 <bitcoin-address> [testnet|signet]"
  echo ""
  echo "Examples:"
  echo "  $0 tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx testnet"
  echo "  $0 tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx signet"
  exit 1
fi

echo "============================================="
echo " Request ${NETWORK} BTC for: ${ADDRESS}"
echo "============================================="
echo ""

case "$NETWORK" in
  testnet)
    echo -e "${YELLOW}Testnet faucets typically require captcha verification.${NC}"
    echo ""
    echo "Available faucets:"
    echo "  1. https://coinfaucet.eu/en/btc-testnet/"
    echo "  2. https://bitcoinfaucet.uo1.net/"
    echo "  3. https://testnet-faucet.com/btc-testnet/"
    echo ""
    echo "Opening faucet in default browser..."

    # Try to open the browser (works on macOS and Linux)
    if command -v open &>/dev/null; then
      open "https://coinfaucet.eu/en/btc-testnet/"
    elif command -v xdg-open &>/dev/null; then
      xdg-open "https://coinfaucet.eu/en/btc-testnet/" 2>/dev/null || true
    fi

    echo ""
    echo "Paste this address into the faucet: ${ADDRESS}"
    ;;

  signet)
    echo "Attempting Mempool.space Signet faucet API..."
    echo ""

    # The mempool.space signet faucet sometimes has an API endpoint
    FAUCET_URL="https://mempool.space/signet/api/faucet"

    echo -e "${YELLOW}Note: The API faucet may not always be available.${NC}"
    echo "Trying: POST ${FAUCET_URL}"
    echo ""

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      --max-time 15 \
      -X POST \
      -H "Content-Type: application/json" \
      -d "{\"address\": \"${ADDRESS}\"}" \
      "$FAUCET_URL" 2>/dev/null) || HTTP_CODE="000"

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
      echo -e "${GREEN}Faucet request submitted successfully!${NC}"
      echo "Check the address balance after a few blocks:"
      echo "  https://mempool.space/signet/address/${ADDRESS}"
    else
      echo -e "${YELLOW}API faucet returned HTTP ${HTTP_CODE}. Falling back to browser.${NC}"
      echo ""
      echo "Manual faucet options:"
      echo "  1. https://signetfaucet.com/"
      echo "  2. https://mempool.space/signet/faucet"
      echo ""
      echo "Paste this address: ${ADDRESS}"

      if command -v open &>/dev/null; then
        open "https://signetfaucet.com/"
      elif command -v xdg-open &>/dev/null; then
        xdg-open "https://signetfaucet.com/" 2>/dev/null || true
      fi
    fi
    ;;

  *)
    echo "Unsupported network: ${NETWORK}"
    echo "Use 'testnet' or 'signet'."
    exit 1
    ;;
esac

echo ""
echo "============================================="
echo " Monitor balance"
echo "============================================="
echo ""
echo "After receiving testnet BTC, verify with:"
echo "  curl -s https://blockstream.info/${NETWORK}/api/address/${ADDRESS} | jq '.chain_stats'"
echo ""
echo "Or check in a browser:"
if [ "$NETWORK" = "testnet" ]; then
  echo "  https://mempool.space/testnet/address/${ADDRESS}"
else
  echo "  https://mempool.space/signet/address/${ADDRESS}"
fi
