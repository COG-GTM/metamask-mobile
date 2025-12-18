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

BACKUP_DIR=""
ROLLBACK_NEEDED=false

semver_to_nat () {
  echo "${1//./}"
}

log_and_exit () {
  echo "$1" && exit 1
}

create_backups () {
  BACKUP_DIR=$(mktemp -d)
  echo "Creating backups in $BACKUP_DIR"
  cp "$PACKAGE_JSON_FILE" "$BACKUP_DIR/package.json.bak"
  cp "$ANDROID_BUILD_GRADLE_FILE" "$BACKUP_DIR/build.gradle.bak"
  cp "$BITRISE_YML_FILE" "$BACKUP_DIR/bitrise.yml.bak"
  cp "$IOS_PROJECT_FILE" "$BACKUP_DIR/project.pbxproj.bak"
  echo "- Backups created successfully"
}

rollback () {
  if [[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR" ]]; then
    echo "Rolling back changes..."
    if [[ -f "$BACKUP_DIR/package.json.bak" ]]; then
      cp "$BACKUP_DIR/package.json.bak" "$PACKAGE_JSON_FILE"
      echo "- Restored $PACKAGE_JSON_FILE"
    fi
    if [[ -f "$BACKUP_DIR/build.gradle.bak" ]]; then
      cp "$BACKUP_DIR/build.gradle.bak" "$ANDROID_BUILD_GRADLE_FILE"
      echo "- Restored $ANDROID_BUILD_GRADLE_FILE"
    fi
    if [[ -f "$BACKUP_DIR/bitrise.yml.bak" ]]; then
      cp "$BACKUP_DIR/bitrise.yml.bak" "$BITRISE_YML_FILE"
      echo "- Restored $BITRISE_YML_FILE"
    fi
    if [[ -f "$BACKUP_DIR/project.pbxproj.bak" ]]; then
      cp "$BACKUP_DIR/project.pbxproj.bak" "$IOS_PROJECT_FILE"
      echo "- Restored $IOS_PROJECT_FILE"
    fi
    rm -rf "$BACKUP_DIR"
    echo "Rollback complete"
  fi
}

cleanup () {
  if [[ "$ROLLBACK_NEEDED" == true ]]; then
    rollback
  elif [[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR" ]]; then
    rm -rf "$BACKUP_DIR"
  fi
}

trap cleanup EXIT

validate_package_json_updated () {
  local pkg_version
  local pkg_version_code
  local pkg_flask_version_code
  
  pkg_version=$(jq -r '.version' "$PACKAGE_JSON_FILE")
  pkg_version_code=$(jq -r '.build.versionCode' "$PACKAGE_JSON_FILE")
  pkg_flask_version_code=$(jq -r '.build.flaskVersionCode' "$PACKAGE_JSON_FILE")
  
  if [[ "$pkg_version" != "$SEMVER_VERSION" ]]; then
    echo "ERROR: package.json version ($pkg_version) does not match expected version ($SEMVER_VERSION)"
    return 1
  fi
  
  if [[ "$pkg_version_code" != "$VERSION_NUMBER" ]]; then
    echo "ERROR: package.json versionCode ($pkg_version_code) does not match expected version number ($VERSION_NUMBER)"
    return 1
  fi
  
  if [[ "$pkg_flask_version_code" != "$VERSION_NUMBER" ]]; then
    echo "ERROR: package.json flaskVersionCode ($pkg_flask_version_code) does not match expected version number ($VERSION_NUMBER)"
    return 1
  fi
  
  echo "- package.json validation passed"
  return 0
}

update_package_json () {
  local tmp="${PACKAGE_JSON_FILE}_temp"
  
  jq ".version = \"$SEMVER_VERSION\" | .build.versionCode = $VERSION_NUMBER | .build.flaskVersionCode = $VERSION_NUMBER" "$PACKAGE_JSON_FILE" > "$tmp"
  
  if [[ ! -s "$tmp" ]]; then
    rm -f "$tmp"
    echo "ERROR: Failed to update package.json"
    return 1
  fi
  
  mv "$tmp" "$PACKAGE_JSON_FILE"
  echo "- $PACKAGE_JSON_FILE updated"
  
  if ! validate_package_json_updated; then
    return 1
  fi
  
  return 0
}

update_android () {
  sed -Ei 's/(\s*versionCode )[0-9]+/\1'"$VERSION_NUMBER"'/' "$ANDROID_BUILD_GRADLE_FILE"
  sed -Ei 's/(\s*versionName )".*"/\1"'"$SEMVER_VERSION"'"/' "$ANDROID_BUILD_GRADLE_FILE"
  
  local android_version_code
  local android_version_name
  android_version_code=$(grep -oP 'versionCode \K[0-9]+' "$ANDROID_BUILD_GRADLE_FILE" | head -1)
  android_version_name=$(grep -oP 'versionName "\K[^"]+' "$ANDROID_BUILD_GRADLE_FILE" | head -1)
  
  if [[ "$android_version_code" != "$VERSION_NUMBER" ]]; then
    echo "ERROR: Android versionCode update failed"
    return 1
  fi
  
  if [[ "$android_version_name" != "$SEMVER_VERSION" ]]; then
    echo "ERROR: Android versionName update failed"
    return 1
  fi
  
  echo "- $ANDROID_BUILD_GRADLE_FILE updated"
  return 0
}

update_bitrise () {
  sed -Ei 's/(\s*VERSION_NAME: ).*/\1'"$SEMVER_VERSION"'/' "$BITRISE_YML_FILE"
  sed -Ei 's/(\s*VERSION_NUMBER: )[0-9]+/\1'"$VERSION_NUMBER"'/' "$BITRISE_YML_FILE"
  sed -Ei 's/(\s*FLASK_VERSION_NAME: ).*/\1'"$SEMVER_VERSION"'/' "$BITRISE_YML_FILE"
  sed -Ei 's/(\s*FLASK_VERSION_NUMBER: )[0-9]+/\1'"$VERSION_NUMBER"'/' "$BITRISE_YML_FILE"
  echo "- $BITRISE_YML_FILE updated"
  return 0
}

update_ios () {
  sed -Ei 's/(\s*MARKETING_VERSION = ).*/\1'"$SEMVER_VERSION;"'/' "$IOS_PROJECT_FILE"
  sed -Ei 's/(\s*CURRENT_PROJECT_VERSION = )[0-9]+/\1'"$VERSION_NUMBER"'/' "$IOS_PROJECT_FILE"
  echo "- $IOS_PROJECT_FILE updated"
  return 0
}

perform_updates () {
  create_backups
  
  echo "Step 1: Updating package.json (authoritative source)..."
  if ! update_package_json; then
    ROLLBACK_NEEDED=true
    log_and_exit "Failed to update package.json. Rolling back all changes."
  fi
  
  echo "Step 2: Propagating to Android build.gradle..."
  if ! update_android; then
    ROLLBACK_NEEDED=true
    log_and_exit "Failed to update Android build.gradle. Rolling back all changes."
  fi
  
  echo "Step 3: Propagating to bitrise.yml..."
  if ! update_bitrise; then
    ROLLBACK_NEEDED=true
    log_and_exit "Failed to update bitrise.yml. Rolling back all changes."
  fi
  
  echo "Step 4: Propagating to iOS project.pbxproj..."
  if ! update_ios; then
    ROLLBACK_NEEDED=true
    log_and_exit "Failed to update iOS project.pbxproj. Rolling back all changes."
  fi

  echo -e "-------------------"
  echo -e "All files updated successfully with:"
  echo -e "semver version: $SEMVER_VERSION"
  echo -e "version number: $VERSION_NUMBER"
}

read_current_versions_from_package_json () {
  CURRENT_SEMVER=$(jq -r '.version' "$PACKAGE_JSON_FILE")
  CURRENT_VERSION_NUMBER=$(jq -r '.build.versionCode // empty' "$PACKAGE_JSON_FILE")
  CURRENT_FLASK_VERSION_NUMBER=$(jq -r '.build.flaskVersionCode // empty' "$PACKAGE_JSON_FILE")
  
  if [[ -z "$CURRENT_VERSION_NUMBER" || "$CURRENT_VERSION_NUMBER" == "null" ]]; then
    echo "Warning: versionCode not found in package.json, falling back to bitrise.yml"
    CURRENT_VERSION_NUMBER=$(awk '/^\s+VERSION_NUMBER: /{print $2}' "$BITRISE_YML_FILE")
    CURRENT_FLASK_VERSION_NUMBER=$(awk '/^\s+FLASK_VERSION_NUMBER: /{print $2}' "$BITRISE_YML_FILE")
  fi
  
  echo "Current versions from package.json (authoritative source):"
  echo "  - version: $CURRENT_SEMVER"
  echo "  - versionCode: $CURRENT_VERSION_NUMBER"
  echo "  - flaskVersionCode: $CURRENT_FLASK_VERSION_NUMBER"
}

read_current_versions_from_package_json

if [[ -n "$CURRENT_VERSION_NUMBER" && -n "$CURRENT_FLASK_VERSION_NUMBER" ]]; then
  if [[ "$CURRENT_VERSION_NUMBER" != "$CURRENT_FLASK_VERSION_NUMBER" ]]; then
    echo "VERSION_NUMBER $CURRENT_VERSION_NUMBER and FLASK_VERSION_NUMBER $CURRENT_FLASK_VERSION_NUMBER should be the same"
    log_and_exit "Check why they are different and fix it before proceeding"
  fi
fi

if [[ -z "${SEMVER_VERSION:-}" ]]; then
  log_and_exit "SEMVER_VERSION not specified, aborting!"
fi

if [[ -z "${VERSION_NUMBER:-}" ]]; then
  log_and_exit "VERSION_NUMBER not specified, aborting!"
fi

if ! [[ $SEMVER_VERSION =~ $SEMVER_REGEX ]]; then
  log_and_exit "$SEMVER_VERSION is invalid semver!"
fi

if ! [[ $VERSION_NUMBER =~ $NAT ]] || [[ $VERSION_NUMBER =~ $SEMVER_REGEX ]]; then
  log_and_exit "$VERSION_NUMBER is not a natural number!"
fi

if [[ -n "$CURRENT_VERSION_NUMBER" && "$VERSION_NUMBER" -le "$CURRENT_VERSION_NUMBER" ]]; then
  echo "version $VERSION_NUMBER is less than or equal to current: $CURRENT_VERSION_NUMBER"
  exit 1
fi

echo "VERSION_NUMBER and SEMVER_VERSION are valid."
echo -e "-------------------"
echo "Updating files:"

perform_updates
