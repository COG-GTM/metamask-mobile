#!/usr/bin/env bash

set -e
set -u
set -o pipefail

NAT='0|[1-9][0-9]*'
ALPHANUM='[0-9]*[A-Za-z-][0-9A-Za-z-]*'
IDENT="$NAT|$ALPHANUM"
FIELD='[0-9A-Za-z-]+'

SEMVER_REGEX="\
^[vV]?\
($NAT)\\.($NAT)\\.($NAT)\
(\\-(${IDENT})(\\.(${IDENT}))*)?\
(\\+${FIELD}(\\.${FIELD})*)?$"

PACKAGE_JSON_FILE=package.json
ANDROID_BUILD_GRADLE_FILE=android/app/build.gradle
BITRISE_YML_FILE=bitrise.yml
IOS_PROJECT_FILE=ios/MetaMask.xcodeproj/project.pbxproj

# Backup directory for rollback
BACKUP_DIR=".version-backup-$$"

semver_to_nat () {
  echo "${1//./}"
}

log_and_exit () {
  echo "$1" && exit 1
}

create_backups () {
  echo "Creating backups for rollback..."
  mkdir -p "$BACKUP_DIR"
  cp "$PACKAGE_JSON_FILE" "$BACKUP_DIR/"
  cp "$ANDROID_BUILD_GRADLE_FILE" "$BACKUP_DIR/build.gradle"
  cp "$BITRISE_YML_FILE" "$BACKUP_DIR/"
  cp "$IOS_PROJECT_FILE" "$BACKUP_DIR/project.pbxproj"
  echo "Backups created in $BACKUP_DIR"
}

rollback () {
  echo "Rolling back changes due to error..."
  if [[ -d "$BACKUP_DIR" ]]; then
    cp "$BACKUP_DIR/package.json" "$PACKAGE_JSON_FILE" 2>/dev/null || true
    cp "$BACKUP_DIR/build.gradle" "$ANDROID_BUILD_GRADLE_FILE" 2>/dev/null || true
    cp "$BACKUP_DIR/bitrise.yml" "$BITRISE_YML_FILE" 2>/dev/null || true
    cp "$BACKUP_DIR/project.pbxproj" "$IOS_PROJECT_FILE" 2>/dev/null || true
    rm -rf "$BACKUP_DIR"
    echo "Rollback completed successfully"
  else
    echo "No backup found, cannot rollback"
  fi
  exit 1
}

cleanup_backups () {
  if [[ -d "$BACKUP_DIR" ]]; then
    rm -rf "$BACKUP_DIR"
    echo "Cleanup: Backup files removed"
  fi
}

# Trap to handle errors and perform rollback
trap 'rollback' ERR

perform_updates () {
  # update package.json only if we're NOT reading from it (i.e., version was provided via args/env)
  if [[ "$READING_FROM_PACKAGE_JSON" == "false" ]]; then
    echo "Updating $PACKAGE_JSON_FILE..."
    tmp="${PACKAGE_JSON_FILE}_temp"
    jq ".version = \"$SEMVER_VERSION\" | .build.versionCode = $VERSION_NUMBER | .build.flaskVersionCode = $VERSION_NUMBER" $PACKAGE_JSON_FILE > "$tmp"
    mv "$tmp" $PACKAGE_JSON_FILE
    echo "- $PACKAGE_JSON_FILE updated"
  else
    echo "Skipping $PACKAGE_JSON_FILE (already source of truth)"
  fi

  # Check operating system and adjust sed commands accordingly
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS version
    
    # update android/app/build.gradle
    echo "Updating $ANDROID_BUILD_GRADLE_FILE..."
    sed -i '' -E "s/(\s*versionCode )[0-9]+/\1$VERSION_NUMBER/" $ANDROID_BUILD_GRADLE_FILE
    sed -i '' -E "s/(\s*versionName )\".*\"/\1\"$SEMVER_VERSION\"/" $ANDROID_BUILD_GRADLE_FILE
    echo "- $ANDROID_BUILD_GRADLE_FILE updated"

    # update bitrise.yml - use specific patterns to only match env var definitions
    # (lines starting with spaces followed by VERSION_NAME:, not echo statements)
    echo "Updating $BITRISE_YML_FILE..."
    sed -i '' -E "s/^(      VERSION_NAME: ).*/\1$SEMVER_VERSION/" $BITRISE_YML_FILE
    sed -i '' -E "s/^(      VERSION_NUMBER: )[0-9]+/\1$VERSION_NUMBER/" $BITRISE_YML_FILE
    sed -i '' -E "s/^(      FLASK_VERSION_NAME: ).*/\1$SEMVER_VERSION/" $BITRISE_YML_FILE
    sed -i '' -E "s/^(      FLASK_VERSION_NUMBER: )[0-9]+/\1$VERSION_NUMBER/" $BITRISE_YML_FILE
    echo "- $BITRISE_YML_FILE updated"

    # update ios/MetaMask.xcodeproj/project.pbxproj
    echo "Updating $IOS_PROJECT_FILE..."
    sed -i '' -E "s/(\s*MARKETING_VERSION = ).*/\1$SEMVER_VERSION;/" $IOS_PROJECT_FILE
    sed -i '' -E "s/(\s*CURRENT_PROJECT_VERSION = )[0-9]+/\1$VERSION_NUMBER/" $IOS_PROJECT_FILE
    echo "- $IOS_PROJECT_FILE updated"
  else
    # Linux version
    
    # update android/app/build.gradle
    echo "Updating $ANDROID_BUILD_GRADLE_FILE..."
    sed -Ei "s/(\s*versionCode )[0-9]+/\1$VERSION_NUMBER/" $ANDROID_BUILD_GRADLE_FILE
    sed -Ei "s/(\s*versionName )\".*\"/\1\"$SEMVER_VERSION\"/" $ANDROID_BUILD_GRADLE_FILE
    echo "- $ANDROID_BUILD_GRADLE_FILE updated"

    # update bitrise.yml - use specific patterns to only match env var definitions
    # (lines starting with spaces followed by VERSION_NAME:, not echo statements)
    echo "Updating $BITRISE_YML_FILE..."
    sed -Ei "s/^(      VERSION_NAME: ).*/\1$SEMVER_VERSION/" $BITRISE_YML_FILE
    sed -Ei "s/^(      VERSION_NUMBER: )[0-9]+/\1$VERSION_NUMBER/" $BITRISE_YML_FILE
    sed -Ei "s/^(      FLASK_VERSION_NAME: ).*/\1$SEMVER_VERSION/" $BITRISE_YML_FILE
    sed -Ei "s/^(      FLASK_VERSION_NUMBER: )[0-9]+/\1$VERSION_NUMBER/" $BITRISE_YML_FILE
    echo "- $BITRISE_YML_FILE updated"

    # update ios/MetaMask.xcodeproj/project.pbxproj
    echo "Updating $IOS_PROJECT_FILE..."
    sed -Ei "s/(\s*MARKETING_VERSION = ).*/\1$SEMVER_VERSION;/" $IOS_PROJECT_FILE
    sed -Ei "s/(\s*CURRENT_PROJECT_VERSION = )[0-9]+/\1$VERSION_NUMBER/" $IOS_PROJECT_FILE
    echo "- $IOS_PROJECT_FILE updated"
  fi

  echo -e "-------------------"
  echo -e "All files updated with:"
  echo -e "  semver version: $SEMVER_VERSION"
  echo -e "  version number: $VERSION_NUMBER"
}

# Track whether we're reading from package.json (skip updating it in that case)
READING_FROM_PACKAGE_JSON=false

# Check if we should read from package.json (no arguments provided)
# or use provided arguments for backward compatibility
if [[ $# -eq 0 ]]; then
  echo "Reading version information from package.json (source of truth)..."
  READING_FROM_PACKAGE_JSON=true
  
  # Read version from package.json
  SEMVER_VERSION=$(jq -r '.version' $PACKAGE_JSON_FILE)
  VERSION_NUMBER=$(jq -r '.build.versionCode' $PACKAGE_JSON_FILE)
  
  if [[ "$SEMVER_VERSION" == "null" ]] || [[ -z "$SEMVER_VERSION" ]]; then
    log_and_exit "Could not read version from package.json"
  fi
  
  if [[ "$VERSION_NUMBER" == "null" ]] || [[ -z "$VERSION_NUMBER" ]]; then
    log_and_exit "Could not read build.versionCode from package.json. Please ensure package.json has a 'build.versionCode' field."
  fi
  
  echo "Found version: $SEMVER_VERSION"
  echo "Found versionCode: $VERSION_NUMBER"
elif [[ $# -eq 2 ]]; then
  # Backward compatibility: accept SEMVER_VERSION and VERSION_NUMBER as arguments
  SEMVER_VERSION=$1
  VERSION_NUMBER=$2
  echo "Using provided version: $SEMVER_VERSION"
  echo "Using provided versionCode: $VERSION_NUMBER"
else
  # Check for environment variables (original behavior)
  if [[ -z "${SEMVER_VERSION:-}" ]] || [[ -z "${VERSION_NUMBER:-}" ]]; then
    echo "Usage: $0 [SEMVER_VERSION VERSION_NUMBER]"
    echo "  Or set SEMVER_VERSION and VERSION_NUMBER environment variables"
    echo "  Or run without arguments to read from package.json (recommended)"
    exit 1
  fi
fi

# Get current numbers from bitrise.yml for validation
CURRENT_SEMVER=$(awk '/^\s+VERSION_NAME: /{print $2}' $BITRISE_YML_FILE)
CURRENT_VERSION_NUMBER=$(awk '/^\s+VERSION_NUMBER: /{print $2}' $BITRISE_YML_FILE)
CURRENT_FLASK_VERSION_NUMBER=$(awk '/^\s+FLASK_VERSION_NUMBER: /{print $2}' $BITRISE_YML_FILE)

# Ensure version number of main variant and flask are aligned
if [[ "$CURRENT_VERSION_NUMBER" != "$CURRENT_FLASK_VERSION_NUMBER" ]]; then
  echo "WARNING: VERSION_NUMBER $CURRENT_VERSION_NUMBER and FLASK_VERSION_NUMBER $CURRENT_FLASK_VERSION_NUMBER are different"
  echo "This script will align them to the same value: $VERSION_NUMBER"
fi

# Validate SEMVER_VERSION
if [[ -z "$SEMVER_VERSION" ]]; then
  log_and_exit "SEMVER_VERSION not specified, aborting!"
fi

# Validate VERSION_NUMBER
if [[ -z "$VERSION_NUMBER" ]]; then
  log_and_exit "VERSION_NUMBER not specified, aborting!"
fi

# Check if SEMVER_VERSION is valid semver
if ! [[ $SEMVER_VERSION =~ $SEMVER_REGEX ]]; then
  log_and_exit "$SEMVER_VERSION is invalid semver!"
fi

# Check if VERSION_NUMBER is a natural number
if ! [[ $VERSION_NUMBER =~ ^[0-9]+$ ]]; then
  log_and_exit "$VERSION_NUMBER is not a natural number!"
fi

echo "VERSION_NUMBER ($VERSION_NUMBER) and SEMVER_VERSION ($SEMVER_VERSION) are valid."
echo -e "-------------------"

# Create backups before making changes
create_backups

echo "Updating files:"
perform_updates

# Cleanup backups on success
cleanup_backups

# Disable the error trap after successful completion
trap - ERR

echo -e "-------------------"
echo "Version synchronization completed successfully!"
