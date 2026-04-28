#!/usr/bin/env bash
# -------------------------------------------------------------------
# generate-test-addresses.sh
# Generate well-known Bitcoin test addresses for development.
# These are NOT real private keys — they are public test vectors
# commonly used in Bitcoin development.
#
# Usage: ./scripts/bitcoin/generate-test-addresses.sh
# -------------------------------------------------------------------

set -euo pipefail

echo "============================================="
echo " Bitcoin Test Addresses for Development"
echo "============================================="
echo ""
echo "These are well-known test vectors from BIP-84/BIP-86."
echo "Do NOT send real BTC to these addresses."
echo ""

echo "--- Testnet (P2WPKH / Bech32) ---"
echo "  tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
echo "  tb1qrp33g0q5b5698ahp5jnf5yzjmgces69hsx4rcp"
echo "  tb1q0ht9tyks4vh7p5p904t340cr9nvahy7um9zdem"
echo ""

echo "--- Testnet (P2SH-P2WPKH / Nested SegWit) ---"
echo "  2N3oefVeg6stiTb5Kh3ozCRPPqnMgraPNKT"
echo "  2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc"
echo ""

echo "--- Testnet (P2PKH / Legacy) ---"
echo "  mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn"
echo "  mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r"
echo ""

echo "--- Signet (same format as testnet) ---"
echo "  tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
echo ""

echo "--- Regtest (Bech32) ---"
echo "  bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw"
echo ""

echo "============================================="
echo " UTXO-based Test Scenarios"
echo "============================================="
echo ""
echo "Use these addresses in unit tests and mock data."
echo "See app/core/Bitcoin/__tests__/fixtures/ for test fixtures."
echo ""

# Generate a JSON file with test addresses for programmatic use
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUTPUT_FILE="${REPO_ROOT}/app/core/Bitcoin/__tests__/fixtures/test-addresses.json"

mkdir -p "$(dirname "$OUTPUT_FILE")"

cat > "$OUTPUT_FILE" << 'EOF'
{
  "testnet": {
    "bech32": [
      "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
      "tb1qrp33g0q5b5698ahp5jnf5yzjmgces69hsx4rcp",
      "tb1q0ht9tyks4vh7p5p904t340cr9nvahy7um9zdem"
    ],
    "nestedSegwit": [
      "2N3oefVeg6stiTb5Kh3ozCRPPqnMgraPNKT",
      "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc"
    ],
    "legacy": [
      "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
      "mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r"
    ]
  },
  "signet": {
    "bech32": [
      "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
    ]
  },
  "regtest": {
    "bech32": [
      "bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw"
    ]
  }
}
EOF

echo "Test addresses written to: app/core/Bitcoin/__tests__/fixtures/test-addresses.json"
