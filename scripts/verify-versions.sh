#!/usr/bin/env bash

set -e
set -u
set -o pipefail

PACKAGE_JSON_FILE=package.json
ANDROID_BUILD_GRADLE_FILE=android/app/build.gradle
BITRISE_YML_FILE=bitrise.yml
IOS_PROJECT_FILE=ios/MetaMask.xcodeproj/project.pbxproj

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success () {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_error () {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warning () {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "=============================================="
echo "Version Synchronization Verification"
echo "=============================================="
echo ""

# Track if any mismatches are found
MISMATCH_FOUND=0

# Read version from package.json (source of truth)
echo "Reading from package.json (source of truth)..."
PKG_VERSION=$(jq -r '.version' $PACKAGE_JSON_FILE)
PKG_VERSION_CODE=$(jq -r '.build.versionCode' $PACKAGE_JSON_FILE)
PKG_FLASK_VERSION_CODE=$(jq -r '.build.flaskVersionCode' $PACKAGE_JSON_FILE)

if [[ "$PKG_VERSION" == "null" ]] || [[ -z "$PKG_VERSION" ]]; then
  log_error "Could not read version from package.json"
  exit 1
fi

if [[ "$PKG_VERSION_CODE" == "null" ]] || [[ -z "$PKG_VERSION_CODE" ]]; then
  log_warning "build.versionCode not found in package.json - this field should be added for centralized version management"
  PKG_VERSION_CODE="NOT_SET"
fi

if [[ "$PKG_FLASK_VERSION_CODE" == "null" ]] || [[ -z "$PKG_FLASK_VERSION_CODE" ]]; then
  log_warning "build.flaskVersionCode not found in package.json - this field should be added for centralized version management"
  PKG_FLASK_VERSION_CODE="NOT_SET"
fi

echo ""
echo "Source of Truth (package.json):"
echo "  version: $PKG_VERSION"
echo "  build.versionCode: $PKG_VERSION_CODE"
echo "  build.flaskVersionCode: $PKG_FLASK_VERSION_CODE"
echo ""

# Read from Android build.gradle
echo "Checking android/app/build.gradle..."
ANDROID_VERSION_NAME=$(grep -E '^\s*versionName\s+"' $ANDROID_BUILD_GRADLE_FILE | sed -E 's/.*versionName\s+"([^"]+)".*/\1/')
ANDROID_VERSION_CODE=$(grep -E '^\s*versionCode\s+[0-9]+' $ANDROID_BUILD_GRADLE_FILE | sed -E 's/.*versionCode\s+([0-9]+).*/\1/')

if [[ "$ANDROID_VERSION_NAME" != "$PKG_VERSION" ]]; then
  log_error "Android versionName mismatch: $ANDROID_VERSION_NAME (expected: $PKG_VERSION)"
  MISMATCH_FOUND=1
else
  log_success "Android versionName: $ANDROID_VERSION_NAME"
fi

if [[ "$PKG_VERSION_CODE" != "NOT_SET" ]] && [[ "$ANDROID_VERSION_CODE" != "$PKG_VERSION_CODE" ]]; then
  log_error "Android versionCode mismatch: $ANDROID_VERSION_CODE (expected: $PKG_VERSION_CODE)"
  MISMATCH_FOUND=1
else
  log_success "Android versionCode: $ANDROID_VERSION_CODE"
fi

echo ""

# Read from bitrise.yml
echo "Checking bitrise.yml..."
BITRISE_VERSION_NAME=$(grep -E '^\s+VERSION_NAME:' $BITRISE_YML_FILE | head -1 | awk '{print $2}')
BITRISE_VERSION_NUMBER=$(grep -E '^\s+VERSION_NUMBER:' $BITRISE_YML_FILE | head -1 | awk '{print $2}')
BITRISE_FLASK_VERSION_NAME=$(grep -E '^\s+FLASK_VERSION_NAME:' $BITRISE_YML_FILE | head -1 | awk '{print $2}')
BITRISE_FLASK_VERSION_NUMBER=$(grep -E '^\s+FLASK_VERSION_NUMBER:' $BITRISE_YML_FILE | head -1 | awk '{print $2}')

if [[ "$BITRISE_VERSION_NAME" != "$PKG_VERSION" ]]; then
  log_error "Bitrise VERSION_NAME mismatch: $BITRISE_VERSION_NAME (expected: $PKG_VERSION)"
  MISMATCH_FOUND=1
else
  log_success "Bitrise VERSION_NAME: $BITRISE_VERSION_NAME"
fi

if [[ "$PKG_VERSION_CODE" != "NOT_SET" ]] && [[ "$BITRISE_VERSION_NUMBER" != "$PKG_VERSION_CODE" ]]; then
  log_error "Bitrise VERSION_NUMBER mismatch: $BITRISE_VERSION_NUMBER (expected: $PKG_VERSION_CODE)"
  MISMATCH_FOUND=1
else
  log_success "Bitrise VERSION_NUMBER: $BITRISE_VERSION_NUMBER"
fi

if [[ "$BITRISE_FLASK_VERSION_NAME" != "$PKG_VERSION" ]]; then
  log_error "Bitrise FLASK_VERSION_NAME mismatch: $BITRISE_FLASK_VERSION_NAME (expected: $PKG_VERSION)"
  MISMATCH_FOUND=1
else
  log_success "Bitrise FLASK_VERSION_NAME: $BITRISE_FLASK_VERSION_NAME"
fi

if [[ "$PKG_FLASK_VERSION_CODE" != "NOT_SET" ]] && [[ "$BITRISE_FLASK_VERSION_NUMBER" != "$PKG_FLASK_VERSION_CODE" ]]; then
  log_error "Bitrise FLASK_VERSION_NUMBER mismatch: $BITRISE_FLASK_VERSION_NUMBER (expected: $PKG_FLASK_VERSION_CODE)"
  MISMATCH_FOUND=1
else
  log_success "Bitrise FLASK_VERSION_NUMBER: $BITRISE_FLASK_VERSION_NUMBER"
fi

echo ""

# Read from iOS project.pbxproj
echo "Checking ios/MetaMask.xcodeproj/project.pbxproj..."
IOS_MARKETING_VERSIONS=$(grep -E '^\s*MARKETING_VERSION = ' $IOS_PROJECT_FILE | sed -E 's/.*MARKETING_VERSION = ([^;]+);.*/\1/' | sort -u)
IOS_PROJECT_VERSIONS=$(grep -E '^\s*CURRENT_PROJECT_VERSION = ' $IOS_PROJECT_FILE | sed -E 's/.*CURRENT_PROJECT_VERSION = ([0-9]+).*/\1/' | sort -u)

# Check MARKETING_VERSION
IOS_MARKETING_VERSION_COUNT=$(echo "$IOS_MARKETING_VERSIONS" | wc -l | tr -d ' ')
if [[ $IOS_MARKETING_VERSION_COUNT -gt 1 ]]; then
  log_error "Multiple different MARKETING_VERSION values found in iOS project:"
  echo "$IOS_MARKETING_VERSIONS" | while read -r ver; do
    echo "    - $ver"
  done
  MISMATCH_FOUND=1
else
  IOS_MARKETING_VERSION=$(echo "$IOS_MARKETING_VERSIONS" | head -1)
  if [[ "$IOS_MARKETING_VERSION" != "$PKG_VERSION" ]]; then
    log_error "iOS MARKETING_VERSION mismatch: $IOS_MARKETING_VERSION (expected: $PKG_VERSION)"
    MISMATCH_FOUND=1
  else
    log_success "iOS MARKETING_VERSION: $IOS_MARKETING_VERSION"
  fi
fi

# Check CURRENT_PROJECT_VERSION
IOS_PROJECT_VERSION_COUNT=$(echo "$IOS_PROJECT_VERSIONS" | wc -l | tr -d ' ')
if [[ $IOS_PROJECT_VERSION_COUNT -gt 1 ]]; then
  log_error "Multiple different CURRENT_PROJECT_VERSION values found in iOS project:"
  echo "$IOS_PROJECT_VERSIONS" | while read -r ver; do
    echo "    - $ver"
  done
  MISMATCH_FOUND=1
else
  IOS_PROJECT_VERSION=$(echo "$IOS_PROJECT_VERSIONS" | head -1)
  if [[ "$PKG_VERSION_CODE" != "NOT_SET" ]] && [[ "$IOS_PROJECT_VERSION" != "$PKG_VERSION_CODE" ]]; then
    log_error "iOS CURRENT_PROJECT_VERSION mismatch: $IOS_PROJECT_VERSION (expected: $PKG_VERSION_CODE)"
    MISMATCH_FOUND=1
  else
    log_success "iOS CURRENT_PROJECT_VERSION: $IOS_PROJECT_VERSION"
  fi
fi

echo ""
echo "=============================================="

if [[ $MISMATCH_FOUND -eq 1 ]]; then
  echo -e "${RED}Version synchronization check FAILED${NC}"
  echo ""
  echo "To fix version mismatches, run:"
  echo "  yarn version:bump"
  echo ""
  echo "Or manually update package.json and run:"
  echo "  ./scripts/set-versions.sh"
  exit 1
else
  echo -e "${GREEN}All versions are synchronized!${NC}"
  exit 0
fi
