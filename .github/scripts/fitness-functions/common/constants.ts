// Exclude checking for files in .github directory
const EXCLUDE_REGEX = /^.github/;

enum AUTOMATION_TYPE {
  CI = 'ci',
  PRE_COMMIT_HOOK = 'pre-commit-hook',
  PRE_PUSH_HOOK = 'pre-push-hook',
}

// only allow TS and TSX files in the app directory only
const APP_FOLDER_JS_REGEX = /^(app).*\.(js|jsx)$/;

// Detect JS/JSX files in e2e directory (should also be TypeScript)
const E2E_FOLDER_JS_REGEX = /^(e2e).*\.(js|jsx)$/;

// Combined regex for all source folders that should use TypeScript
// Excludes: config files (*.config.js), scripts folder, and .github folder
const SOURCE_FOLDERS_JS_REGEX = /^(app|e2e).*\.(js|jsx)$/;

// Regex to detect explicit 'any' type usage in TypeScript files
// Matches: `: any`, `as any`, `<any>`, `<any,`, `any>`, `any,` in generics
const EXPLICIT_ANY_REGEX = /(?::\s*any\b|as\s+any\b|<any[,>]|,\s*any[,>])/;

export {
  EXCLUDE_REGEX,
  APP_FOLDER_JS_REGEX,
  E2E_FOLDER_JS_REGEX,
  SOURCE_FOLDERS_JS_REGEX,
  EXPLICIT_ANY_REGEX,
  AUTOMATION_TYPE,
};
