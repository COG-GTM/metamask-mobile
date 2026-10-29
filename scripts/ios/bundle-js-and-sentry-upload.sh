#!/bin/bash
set -e

# Enable usage of nvm if it exists
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
. "$HOME/.nvm/nvm.sh"
elif [[ -x "$(command -v brew)" && -s "$(brew --prefix nvm)/nvm.sh" ]]; then
. "$(brew --prefix nvm)/nvm.sh"
fi

# Set node binary to use
export NODE_BINARY=$(which node)

# Source environment if file exists
WITH_ENVIRONMENT="../node_modules/react-native/scripts/xcode/with-environment.sh"
if [ -f "$WITH_ENVIRONMENT" ]; then
  . "$WITH_ENVIRONMENT"
fi

# Set Sentry properties
export SENTRY_PROPERTIES=${SENTRY_PROPERTIES:-"../sentry.properties"}

# Sentry environment variable used by Sentry CLI to upload files. Upload is disabled by default
export SENTRY_DISABLE_AUTO_UPLOAD=${SENTRY_DISABLE_AUTO_UPLOAD:-"true"}
# TODO - Move to JS side to be shared between platforms
export SENTRY_DIST=$CURRENT_PROJECT_VERSION
export SENTRY_RELEASE="$PRODUCT_BUNDLE_IDENTIFIER@$MARKETING_VERSION+$SENTRY_DIST"


# Bundle with Expo CLI (same as android/app/build.gradle)
if [[ -z "$ENTRY_FILE" ]]; then
  export ENTRY_FILE="$("$NODE_BINARY" -e "require('expo/scripts/resolveAppEntry')" "$PROJECT_DIR/.." ios absolute | tail -n 1)"
fi
if [[ -z "$CLI_PATH" ]]; then
  export CLI_PATH="$("$NODE_BINARY" --print "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })")"
fi
if [[ -z "$BUNDLE_COMMAND" ]]; then
  export BUNDLE_COMMAND="export:embed"
fi

# Generate JS bundle and upload Sentry source maps
# RN 0.81's with-environment.sh runs its argument as a single command, so call the scripts directly.
REACT_NATIVE_XCODE="../node_modules/react-native/scripts/react-native-xcode.sh"
SENTRY_XCODE="../node_modules/@sentry/react-native/scripts/sentry-xcode.sh"
/bin/sh "$SENTRY_XCODE" "$REACT_NATIVE_XCODE"

# Upload Sentry debug symbols
if [ "$SENTRY_DISABLE_AUTO_UPLOAD" == "false" ]; then
    [ "$SENTRY_INCLUDE_NATIVE_SOURCES" == "true" ] && INCLUDE_SOURCES_FLAG="--include-sources" || INCLUDE_SOURCES_FLAG=""
    ../node_modules/@sentry/cli/bin/sentry-cli debug-files upload "$INCLUDE_SOURCES_FLAG" "$DWARF_DSYM_FOLDER_PATH"
fi
