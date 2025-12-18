#!/usr/bin/env bash

# This script checks if version-related fields are being modified in files
# other than package.json. It's designed to be used as a pre-commit hook
# to prevent direct edits to version fields in non-package.json files.
#
# Usage: ./scripts/check-version-changes.sh [files...]
#
# If no files are provided, it checks staged files.

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Files that should NOT have their version fields edited directly
PROTECTED_FILES=(
  "android/app/build.gradle"
  "ios/MetaMask.xcodeproj/project.pbxproj"
  "bitrise.yml"
)

# Version patterns to check for in each file type
check_version_changes() {
  local file="$1"
  local has_version_change=0
  
  case "$file" in
    android/app/build.gradle)
      if git diff --cached "$file" 2>/dev/null | grep -E '^\+.*versionName|^\+.*versionCode' > /dev/null; then
        has_version_change=1
      fi
      ;;
    ios/MetaMask.xcodeproj/project.pbxproj)
      if git diff --cached "$file" 2>/dev/null | grep -E '^\+.*MARKETING_VERSION|^\+.*CURRENT_PROJECT_VERSION' > /dev/null; then
        has_version_change=1
      fi
      ;;
    bitrise.yml)
      if git diff --cached "$file" 2>/dev/null | grep -E '^\+\s+VERSION_NAME:|^\+\s+VERSION_NUMBER:|^\+\s+FLASK_VERSION' > /dev/null; then
        has_version_change=1
      fi
      ;;
  esac
  
  return $has_version_change
}

# Get list of staged files
if [[ $# -gt 0 ]]; then
  STAGED_FILES=("$@")
else
  STAGED_FILES=($(git diff --cached --name-only 2>/dev/null || echo ""))
fi

VIOLATIONS=()

for file in "${STAGED_FILES[@]}"; do
  for protected in "${PROTECTED_FILES[@]}"; do
    if [[ "$file" == "$protected" ]]; then
      if check_version_changes "$file"; then
        VIOLATIONS+=("$file")
      fi
    fi
  done
done

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo -e "${RED}=============================================="
  echo "VERSION FIELD CHANGE DETECTED"
  echo -e "==============================================${NC}"
  echo ""
  echo -e "${YELLOW}The following files have version field changes:${NC}"
  for v in "${VIOLATIONS[@]}"; do
    echo "  - $v"
  done
  echo ""
  echo "Version fields should only be updated through package.json."
  echo "Please use one of the following methods instead:"
  echo ""
  echo "  1. Update package.json and run: yarn version:bump"
  echo "  2. Run the version sync script: ./scripts/set-versions.sh"
  echo ""
  echo "To bypass this check (not recommended), use: git commit --no-verify"
  echo ""
  exit 1
fi

exit 0
