# Centralized Version Management

This document explains the centralized version management system for MetaMask Mobile, which uses `package.json` as the single source of truth for all version information.

## Overview

Version information in MetaMask Mobile is synchronized across multiple files:

- `package.json` - **Source of Truth** for version and build metadata
- `android/app/build.gradle` - Android versionName and versionCode
- `ios/MetaMask.xcodeproj/project.pbxproj` - iOS MARKETING_VERSION and CURRENT_PROJECT_VERSION
- `bitrise.yml` - CI/CD VERSION_NAME and VERSION_NUMBER environment variables

## Package.json Structure

The `package.json` file contains the authoritative version information:

```json
{
  "version": "7.45.2",
  "build": {
    "versionCode": 1810,
    "flaskVersionCode": 1810
  }
}
```

- `version`: The semantic version string (e.g., "7.45.2")
- `build.versionCode`: The numeric build version for Android and iOS
- `build.flaskVersionCode`: The numeric build version for Flask builds

## NPM Scripts

The following npm scripts are available for version management:

### `yarn version:bump`

Synchronizes version information from `package.json` to all other files. This script:

1. Reads version and versionCode from `package.json`
2. Creates backups of all version files
3. Updates `android/app/build.gradle`
4. Updates `ios/MetaMask.xcodeproj/project.pbxproj`
5. Updates `bitrise.yml`
6. Rolls back all changes if any update fails

**Usage:**
```bash
# Update package.json first, then run:
yarn version:bump
```

### `yarn version:verify`

Verifies that all version files are synchronized with `package.json`. This script:

1. Reads version information from `package.json`
2. Compares against all other version files
3. Reports any mismatches
4. Exits with error code 1 if mismatches are found

**Usage:**
```bash
yarn version:verify
```

## Updating Versions

### Recommended Workflow

1. **Update `package.json`** with the new version:
   ```json
   {
     "version": "7.46.0",
     "build": {
       "versionCode": 1811,
       "flaskVersionCode": 1811
     }
   }
   ```

2. **Run the sync script**:
   ```bash
   yarn version:bump
   ```

3. **Verify synchronization**:
   ```bash
   yarn version:verify
   ```

4. **Commit all changes**:
   ```bash
   git add -A
   git commit -m "Bump version to 7.46.0"
   ```

### Backward Compatibility

The `set-versions.sh` script also supports the legacy interface for backward compatibility:

```bash
# Using command-line arguments
./scripts/set-versions.sh 7.46.0 1811

# Using environment variables
SEMVER_VERSION=7.46.0 VERSION_NUMBER=1811 ./scripts/set-versions.sh
```

## Pre-commit Hooks

A pre-commit hook is configured to prevent direct edits to version fields in non-package.json files. If you try to commit changes to version fields in:

- `android/app/build.gradle`
- `ios/MetaMask.xcodeproj/project.pbxproj`
- `bitrise.yml`

The commit will be blocked with a warning message. To update versions, always modify `package.json` first and then run `yarn version:bump`.

## CI/CD Integration

### GitHub Actions

The `update-latest-build-version.yml` workflow:

1. Validates `package.json` structure before updating
2. Runs the version sync script
3. Verifies synchronization after updates

### Bitrise

A `verify_version_sync` workflow is available that can be added as a `before_run` step to any build workflow:

```yaml
your_build_workflow:
  before_run:
    - verify_version_sync
  steps:
    # ... your build steps
```

This ensures builds fail early if version files are out of sync.

## Troubleshooting

### Version Mismatch Detected

If `yarn version:verify` reports mismatches:

1. Check that `package.json` has the correct version
2. Run `yarn version:bump` to synchronize all files
3. Run `yarn version:verify` again to confirm

### Rollback After Failed Update

If `yarn version:bump` fails partway through, it automatically rolls back all changes. If you need to manually restore:

1. Check for backup files in `.version-backup-*` directories
2. Restore files from the backup
3. Delete the backup directory

### Pre-commit Hook Blocking Commits

If the pre-commit hook blocks your commit:

1. Unstage the version-related changes: `git reset HEAD android/app/build.gradle`
2. Update `package.json` with the desired version
3. Run `yarn version:bump`
4. Stage and commit all files together

## Files Reference

| File | Version Fields |
|------|---------------|
| `package.json` | `version`, `build.versionCode`, `build.flaskVersionCode` |
| `android/app/build.gradle` | `versionName`, `versionCode` |
| `ios/MetaMask.xcodeproj/project.pbxproj` | `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION` |
| `bitrise.yml` | `VERSION_NAME`, `VERSION_NUMBER`, `FLASK_VERSION_NAME`, `FLASK_VERSION_NUMBER` |

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/set-versions.sh` | Synchronizes versions from package.json to all files |
| `scripts/verify-versions.sh` | Verifies all version files are in sync |
| `scripts/check-version-changes.sh` | Pre-commit hook to prevent direct version edits |
