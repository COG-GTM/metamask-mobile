#!/usr/bin/env ts-node
/**
 * Batch Type Stub Generator for Remaining `any` Reducers
 *
 * Generates TypeScript type stub files for all reducers currently typed as `any`
 * in app/reducers/index.ts RootState interface.
 *
 * For each such reducer:
 * 1. Finds the corresponding reducer file under app/reducers/
 * 2. Reads the reducer's initialState to infer the state shape
 * 3. Generates a TypeScript interface based on initial state keys and value types
 * 4. Writes the interface to a types.ts file alongside the reducer
 * 5. Outputs a suggested diff for RootState with proper types replacing `any`
 *
 * Usage:
 *   yarn generate-reducer-types
 */

import * as fs from 'fs';
import * as path from 'path';

interface ReducerInfo {
  name: string;
  dirName: string;
  filePath: string;
  fileExtension: string;
  initialState: Record<string, unknown>;
  interfaceName: string;
  generatedInterface: string;
  typesFilePath: string;
  rootStateEntry: string;
  importStatement: string;
}

/**
 * Map reducer name in RootState to its directory name under app/reducers/
 */
const REDUCER_DIR_MAP: Record<string, string> = {
  legalNotices: 'legalNotices',
  collectibles: 'collectibles',
  privacy: 'privacy',
  bookmarks: 'bookmarks',
  browser: 'browser',
  modals: 'modals',
  settings: 'settings',
  alert: 'alert',
  transaction: 'transaction',
  wizard: 'wizard',
  notification: 'notification',
  swaps: 'swaps',
  infuraAvailability: 'infuraAvailability',
  networkOnboarded: 'networkSelector',
  experimentalSettings: 'experimentalSettings',
  signatureRequest: 'signatureRequest',
  rpcEvents: 'rpcEvents',
  accounts: 'accounts',
};

/**
 * Convert a reducer name to a PascalCase state interface name
 */
function toStateInterfaceName(reducerName: string): string {
  const pascal = reducerName
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return `${pascal}State`;
}

/**
 * Infer TypeScript type from a JavaScript value
 */
function inferType(value: unknown, depth: number = 0): string {
  if (value === null) {
    return 'unknown | null';
  }
  if (value === undefined) {
    return 'unknown | undefined';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'unknown[]';
    }
    const elementType = inferType(value[0], depth + 1);
    return `${elementType}[]`;
  }
  if (typeof value === 'object' && value !== null) {
    if (depth > 2) {
      return 'Record<string, unknown>';
    }
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return 'Record<string, unknown>';
    }
    const indent = '  '.repeat(depth + 1);
    const closingIndent = '  '.repeat(depth);
    const entries = keys
      .map((key) => `${indent}${key}: ${inferType(obj[key], depth + 1)};`)
      .join('\n');
    return `{\n${entries}\n${closingIndent}}`;
  }
  return 'unknown';
}

/**
 * Parse the initialState object from a reducer file's content.
 * Uses a simple heuristic: find `initialState = {` and extract the object.
 */
function parseInitialState(
  content: string,
): Record<string, string> | null {
  // Find initialState declaration
  const stateMatch = content.match(
    /(?:const|let|var)\s+initialState\s*(?::\s*[^=]+)?\s*=\s*\{/,
  );
  if (!stateMatch || stateMatch.index === undefined) {
    return null;
  }

  const startIndex = content.indexOf('{', stateMatch.index);
  if (startIndex === -1) return null;

  // Find matching closing brace
  let braceCount = 0;
  let endIndex = startIndex;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }

  const stateBlock = content.substring(startIndex, endIndex + 1);

  // Parse the keys and infer types from their initial values
  const result: Record<string, string> = {};

  // Simple line-by-line parsing of key-value pairs
  const lines = stateBlock.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip opening/closing braces, comments, and empty lines
    if (
      trimmed === '{' ||
      trimmed === '}' ||
      trimmed === '};' ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed === ''
    ) {
      continue;
    }

    // Match key: value patterns
    const kvMatch = trimmed.match(
      /^(\w+)\s*:\s*(.+?)(?:,\s*(?:\/\/.*)?)?$/,
    );
    if (kvMatch) {
      const key = kvMatch[1];
      const valueStr = kvMatch[2].trim().replace(/,$/, '').trim();

      result[key] = inferTypeFromValueString(valueStr);
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Infer TypeScript type from a string representation of a value
 */
function inferTypeFromValueString(valueStr: string): string {
  // Handle common patterns
  if (valueStr === 'undefined') return 'unknown | undefined';
  if (valueStr === 'null') return 'unknown | null';
  if (valueStr === 'true' || valueStr === 'false') return 'boolean';
  if (valueStr === '[]') return 'unknown[]';
  if (valueStr === '{}') return 'Record<string, unknown>';
  if (/^-?\d+(\.\d+)?$/.test(valueStr)) return 'number';
  if (/^['"].*['"]$/.test(valueStr)) return 'string';
  if (/^`.*`$/.test(valueStr)) return 'string';

  // Handle function calls / references (e.g., AppConstants.DEFAULT_SEARCH_ENGINE)
  if (/^[A-Z]/.test(valueStr) || valueStr.includes('.')) return 'string';

  // Handle nested objects
  if (valueStr.startsWith('{')) return 'Record<string, unknown>';

  // Handle arrays
  if (valueStr.startsWith('[')) return 'unknown[]';

  return 'unknown';
}

/**
 * Generate a TypeScript interface from parsed initial state
 */
function generateInterface(
  interfaceName: string,
  stateFields: Record<string, string>,
): string {
  const fields = Object.entries(stateFields)
    .map(([key, type]) => `  ${key}: ${type};`)
    .join('\n');

  return `export interface ${interfaceName} {\n${fields}\n}\n`;
}

/**
 * Safely read a file, returning its content or null if it doesn't exist
 */
function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Process a single reducer
 */
function processReducer(
  reducerName: string,
  dirName: string,
): ReducerInfo | null {
  const reducerDir = path.resolve('app/reducers', dirName);

  // Find the reducer file by trying each candidate
  let filePath = '';
  let fileExtension = '';
  let content = '';
  const candidates = ['index.js', 'index.ts', 'index.jsx', 'index.tsx'];
  for (const candidate of candidates) {
    const candidatePath = path.join(reducerDir, candidate);
    const fileContent = safeReadFile(candidatePath);
    if (fileContent !== null) {
      filePath = candidatePath;
      fileExtension = path.extname(candidate);
      content = fileContent;
      break;
    }
  }

  if (!filePath) {
    console.warn(`  Warning: No reducer file found in ${reducerDir}`);
    return null;
  }
  const stateFields = parseInitialState(content);

  if (!stateFields) {
    console.warn(
      `  Warning: Could not parse initialState for ${reducerName} in ${filePath}`,
    );
    return null;
  }

  const interfaceName = toStateInterfaceName(reducerName);
  const generatedInterface = generateInterface(interfaceName, stateFields);

  const typesFilePath = path.join(reducerDir, 'types.ts');

  // Determine the RootState entry pattern to use
  // Follow existing patterns in the codebase
  let rootStateEntry: string;
  let importStatement: string;
  const importPath = `./reducers/${dirName}/types`;

  if (fileExtension === '.ts' || fileExtension === '.tsx') {
    // For already-TS reducers, use StateFromReducer pattern
    const reducerImportName = getReducerImportName(reducerName);
    rootStateEntry = `  ${reducerName}: StateFromReducer<typeof ${reducerImportName}>;`;
    importStatement = `// ${interfaceName} already available via StateFromReducer`;
  } else {
    // For JS reducers, use direct state interface import
    rootStateEntry = `  ${reducerName}: ${interfaceName};`;
    importStatement = `import { ${interfaceName} } from '${importPath}';`;
  }

  return {
    name: reducerName,
    dirName,
    filePath,
    fileExtension,
    initialState: stateFields as unknown as Record<string, unknown>,
    interfaceName,
    generatedInterface,
    typesFilePath,
    rootStateEntry,
    importStatement,
  };
}

/**
 * Get the reducer import variable name from RootState reducer name
 */
function getReducerImportName(reducerName: string): string {
  const importMap: Record<string, string> = {
    legalNotices: 'legalNoticesReducer',
    collectibles: 'collectiblesReducer',
    privacy: 'privacyReducer',
    bookmarks: 'bookmarksReducer',
    browser: 'browserReducer',
    modals: 'modalsReducer',
    settings: 'settingsReducer',
    alert: 'alertReducer',
    transaction: 'transactionReducer',
    wizard: 'wizardReducer',
    notification: 'notificationReducer',
    swaps: 'swapsReducer',
    infuraAvailability: 'infuraAvailabilityReducer',
    networkOnboarded: 'networkOnboardReducer',
    experimentalSettings: 'experimentalSettingsReducer',
    signatureRequest: 'signatureRequestReducer',
    rpcEvents: 'rpcEventReducer',
    accounts: 'accountsReducer',
  };
  return importMap[reducerName] || `${reducerName}Reducer`;
}

// ---- Main ----
function main(): void {
  console.log('=== Batch Type Stub Generator for Reducers ===\n');

  const reducerIndexPath = path.resolve('app/reducers/index.ts');
  const content = safeReadFile(reducerIndexPath);
  if (content === null) {
    console.error('Error: app/reducers/index.ts not found. Run from repo root.');
    process.exit(1);
  }

  // Find all reducers typed as `any` in RootState
  const anyReducers: string[] = [];
  for (const [reducerName] of Object.entries(REDUCER_DIR_MAP)) {
    const anyPattern = new RegExp(
      `@typescript-eslint/no-explicit-any[\\s\\S]*?${reducerName}:\\s*any`,
    );
    if (anyPattern.test(content)) {
      anyReducers.push(reducerName);
    }
  }

  console.log(`Found ${anyReducers.length} reducers typed as \`any\` in RootState:\n`);
  anyReducers.forEach((name) => console.log(`  - ${name}`));
  console.log('');

  const results: ReducerInfo[] = [];
  const failures: string[] = [];

  for (const reducerName of anyReducers) {
    const dirName = REDUCER_DIR_MAP[reducerName];
    console.log(`Processing: ${reducerName} (${dirName})...`);

    const info = processReducer(reducerName, dirName);
    if (info) {
      results.push(info);
    } else {
      failures.push(reducerName);
    }
  }

  // Write type stub files
  console.log('\n--- Writing Type Stubs ---\n');

  for (const info of results) {
    const existingContent = safeReadFile(info.typesFilePath) ?? '';

    // Check if interface already exists in the file
    if (existingContent.includes(`interface ${info.interfaceName}`)) {
      console.log(
        `  SKIP: ${info.typesFilePath} — ${info.interfaceName} already exists`,
      );
      continue;
    }

    const newContent = existingContent
      ? `${existingContent}\n${info.generatedInterface}`
      : info.generatedInterface;

    fs.writeFileSync(info.typesFilePath, newContent, 'utf-8');
    console.log(
      `  WROTE: ${path.relative(process.cwd(), info.typesFilePath)} — ${info.interfaceName}`,
    );
  }

  // Generate suggested diff for RootState
  console.log('\n\n=== Suggested RootState Updates ===\n');
  console.log('Add the following imports to app/reducers/index.ts:\n');

  for (const info of results) {
    if (!info.importStatement.startsWith('//')) {
      console.log(`  ${info.importStatement}`);
    }
  }

  console.log('\nUpdate the RootState interface with:\n');
  console.log('  export interface RootState {');

  // Read existing RootState to show full suggested replacement
  const rootStateMatch = content.match(
    /export interface RootState \{[\s\S]*?\n\}/,
  );
  if (rootStateMatch) {
    let updatedRootState = rootStateMatch[0];
    for (const info of results) {
      // Replace the `any` typed entry with the proper type
      const anyEntryPattern = new RegExp(
        `(\\s*//\\s*TODO:.*\\n)?\\s*//\\s*eslint-disable-next-line @typescript-eslint/no-explicit-any\\n\\s*${info.name}:\\s*any;`,
      );
      updatedRootState = updatedRootState.replace(
        anyEntryPattern,
        `\n${info.rootStateEntry}`,
      );
    }
    console.log(updatedRootState);
  }

  // Print summary
  console.log('\n\n=== Summary ===\n');
  console.log(`Type stubs generated: ${results.length}`);
  console.log(`Failed to process: ${failures.length}`);

  if (failures.length > 0) {
    console.log(`\nFailed reducers:`);
    failures.forEach((name) => console.log(`  - ${name}`));
  }

  console.log('\n--- Generated Interfaces ---\n');
  for (const info of results) {
    console.log(`${info.interfaceName} (${info.name}):`);
    console.log(info.generatedInterface);
  }

  console.log('\nNext steps:');
  console.log('  1. Review the generated type stubs in each reducer directory');
  console.log('  2. Replace `unknown` types with more specific types where possible');
  console.log('  3. Import the generated interfaces in app/reducers/index.ts');
  console.log('  4. Update the RootState interface to use the new types');
  console.log('  5. Run `tsc --noEmit` to verify everything compiles');
}

main();
