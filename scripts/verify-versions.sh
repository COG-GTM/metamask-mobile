#!/usr/bin/env bash

set -e
set -u
set -o pipefail

PACKAGE_JSON_FILE=package.json
ANDROID_BUILD_GRADLE_FILE=android/app/build.gradle
IOS_PROJECT_FILE=ios/MetaMask.xcodeproj/project.pbxproj

ERRORS_FOUND=false

echo "Version Synchronization Verification"
echo "====================================="
echo ""

echo "Reading versions from package.json (authoritative source)..."
PKG_VERSION=$(jq -r '.version' "$PACKAGE_JSON_FILE")
PKG_VERSION_CODE=$(jq -r '.build.versionCode // empty' "$PACKAGE_JSON_FILE")
PKG_FLASK_VERSION_CODE=$(jq -r '.build.flaskVersionCode // empty' "$PACKAGE_JSON_FILE")

echo "  - version: $PKG_VERSION"
echo "  - versionCode: ${PKG_VERSION_CODE:-"(not set)"}"
echo "  - flaskVersionCode: ${PKG_FLASK_VERSION_CODE:-"(not set)"}"
echo ""

if [[ -z "$PKG_VERSION_CODE" || "$PKG_VERSION_CODE" == "null" ]]; then
  echo "WARNING: package.json does not contain build.versionCode"
  echo "  Consider adding the build metadata to package.json"
  echo ""
fi

if [[ -z "$PKG_FLASK_VERSION_CODE" || "$PKG_FLASK_VERSION_CODE" == "null" ]]; then
  echo "WARNING: package.json does not contain build.flaskVersionCode"
  echo "  Consider adding the build metadata to package.json"
  echo ""
fi

echo "Reading versions from Android build.gradle..."
ANDROID_VERSION_NAME=$(sed -n 's/.*versionName "\([^"]*\)".*/\1/p' "$ANDROID_BUILD_GRADLE_FILE" | head -1)
ANDROID_VERSION_CODE=$(sed -n 's/.*versionCode \([0-9]*\).*/\1/p' "$ANDROID_BUILD_GRADLE_FILE" | head -1)

echo "  - versionName: $ANDROID_VERSION_NAME"
echo "  - versionCode: $ANDROID_VERSION_CODE"
echo ""

echo "Reading versions from iOS project.pbxproj..."
IOS_MARKETING_VERSIONS=$(sed -n 's/.*MARKETING_VERSION = \([^;]*\);.*/\1/p' "$IOS_PROJECT_FILE" | sort -u)
IOS_PROJECT_VERSIONS=$(sed -n 's/.*CURRENT_PROJECT_VERSION = \([0-9]*\).*/\1/p' "$IOS_PROJECT_FILE" | sort -u)

IOS_MARKETING_VERSION_COUNT=$(echo "$IOS_MARKETING_VERSIONS" | wc -l)
IOS_PROJECT_VERSION_COUNT=$(echo "$IOS_PROJECT_VERSIONS" | wc -l)

IOS_MARKETING_VERSION=$(echo "$IOS_MARKETING_VERSIONS" | head -1)
IOS_PROJECT_VERSION=$(echo "$IOS_PROJECT_VERSIONS" | head -1)

echo "  - MARKETING_VERSION: $IOS_MARKETING_VERSION (found in $IOS_MARKETING_VERSION_COUNT unique value(s))"
echo "  - CURRENT_PROJECT_VERSION: $IOS_PROJECT_VERSION (found in $IOS_PROJECT_VERSION_COUNT unique value(s))"
echo ""

echo "Checking for synchronization issues..."
echo "--------------------------------------"

if [[ "$IOS_MARKETING_VERSION_COUNT" -gt 1 ]]; then
  echo "ERROR: iOS project.pbxproj has inconsistent MARKETING_VERSION values:"
  echo "$IOS_MARKETING_VERSIONS" | while read -r ver; do
    echo "  - $ver"
  done
  ERRORS_FOUND=true
fi

if [[ "$IOS_PROJECT_VERSION_COUNT" -gt 1 ]]; then
  echo "ERROR: iOS project.pbxproj has inconsistent CURRENT_PROJECT_VERSION values:"
  echo "$IOS_PROJECT_VERSIONS" | while read -r ver; do
    echo "  - $ver"
  done
  ERRORS_FOUND=true
fi

if [[ "$PKG_VERSION" != "$ANDROID_VERSION_NAME" ]]; then
  echo "ERROR: Version mismatch between package.json and Android build.gradle"
  echo "  - package.json version: $PKG_VERSION"
  echo "  - Android versionName: $ANDROID_VERSION_NAME"
  ERRORS_FOUND=true
fi

if [[ "$PKG_VERSION" != "$IOS_MARKETING_VERSION" ]]; then
  echo "ERROR: Version mismatch between package.json and iOS project.pbxproj"
  echo "  - package.json version: $PKG_VERSION"
  echo "  - iOS MARKETING_VERSION: $IOS_MARKETING_VERSION"
  ERRORS_FOUND=true
fi

if [[ -n "$PKG_VERSION_CODE" && "$PKG_VERSION_CODE" != "null" ]]; then
  if [[ "$PKG_VERSION_CODE" != "$ANDROID_VERSION_CODE" ]]; then
    echo "ERROR: Version code mismatch between package.json and Android build.gradle"
    echo "  - package.json versionCode: $PKG_VERSION_CODE"
    echo "  - Android versionCode: $ANDROID_VERSION_CODE"
    ERRORS_FOUND=true
  fi
  
  if [[ "$PKG_VERSION_CODE" != "$IOS_PROJECT_VERSION" ]]; then
    echo "ERROR: Version code mismatch between package.json and iOS project.pbxproj"
    echo "  - package.json versionCode: $PKG_VERSION_CODE"
    echo "  - iOS CURRENT_PROJECT_VERSION: $IOS_PROJECT_VERSION"
    ERRORS_FOUND=true
  fi
else
  if [[ "$ANDROID_VERSION_CODE" != "$IOS_PROJECT_VERSION" ]]; then
    echo "ERROR: Version code mismatch between Android and iOS"
    echo "  - Android versionCode: $ANDROID_VERSION_CODE"
    echo "  - iOS CURRENT_PROJECT_VERSION: $IOS_PROJECT_VERSION"
    ERRORS_FOUND=true
  fi
fi

if [[ -n "$PKG_VERSION_CODE" && -n "$PKG_FLASK_VERSION_CODE" && "$PKG_VERSION_CODE" != "null" && "$PKG_FLASK_VERSION_CODE" != "null" ]]; then
  if [[ "$PKG_VERSION_CODE" != "$PKG_FLASK_VERSION_CODE" ]]; then
    echo "ERROR: Version code mismatch between versionCode and flaskVersionCode in package.json"
    echo "  - versionCode: $PKG_VERSION_CODE"
    echo "  - flaskVersionCode: $PKG_FLASK_VERSION_CODE"
    ERRORS_FOUND=true
  fi
fi

echo ""
echo "====================================="

if [[ "$ERRORS_FOUND" == true ]]; then
  echo "FAILED: Version synchronization issues detected!"
  echo ""
  echo "To fix these issues, run:"
  echo "  SEMVER_VERSION=<version> VERSION_NUMBER=<code> ./scripts/set-versions.sh"
  echo ""
  exit 1
else
  echo "PASSED: All versions are synchronized!"
  echo ""
  echo "Summary:"
  echo "  - Semantic version: $PKG_VERSION"
  echo "  - Version code: $ANDROID_VERSION_CODE"
  exit 0
fi
