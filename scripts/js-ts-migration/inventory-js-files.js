#!/usr/bin/env node

/**
 * JavaScript to TypeScript Migration - File Inventory Script
 * 
 * This script scans the app/ directory for all .js and .jsx files,
 * generates a dependency graph, identifies leaf nodes, and categorizes
 * files by type and complexity.
 * 
 * Usage: node scripts/js-ts-migration/inventory-js-files.js
 * 
 * Output: docs/js-ts-migration/js-files-inventory.json
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../../app');
const OUTPUT_DIR = path.join(__dirname, '../../docs/js-ts-migration');

// File categories based on directory structure
const CATEGORIES = {
  UTILITIES: 'utilities',
  BASE_COMPONENTS: 'base-components',
  UI_COMPONENTS: 'ui-components',
  VIEWS: 'views',
  CORE: 'core',
  ACTIONS: 'actions',
  REDUCERS: 'reducers',
  SELECTORS: 'selectors',
  STORE: 'store',
  CONSTANTS: 'constants',
  LIB: 'lib',
  MOCKS: 'mocks',
  OTHER: 'other'
};

// Complexity sizing based on file characteristics
const COMPLEXITY = {
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L'
};

/**
 * Recursively find all .js and .jsx files in a directory
 */
function findJsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and __mocks__ for dependency analysis
      if (entry.name !== 'node_modules') {
        findJsFiles(fullPath, files);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Categorize a file based on its path
 */
function categorizeFile(filePath) {
  const relativePath = path.relative(APP_DIR, filePath);
  
  if (relativePath.startsWith('util/')) return CATEGORIES.UTILITIES;
  if (relativePath.startsWith('components/Base/')) return CATEGORIES.BASE_COMPONENTS;
  if (relativePath.startsWith('components/UI/')) return CATEGORIES.UI_COMPONENTS;
  if (relativePath.startsWith('components/Views/')) return CATEGORIES.VIEWS;
  if (relativePath.startsWith('components/Nav/')) return CATEGORIES.VIEWS;
  if (relativePath.startsWith('core/')) return CATEGORIES.CORE;
  if (relativePath.startsWith('actions/')) return CATEGORIES.ACTIONS;
  if (relativePath.startsWith('reducers/')) return CATEGORIES.REDUCERS;
  if (relativePath.startsWith('selectors/')) return CATEGORIES.SELECTORS;
  if (relativePath.startsWith('store/')) return CATEGORIES.STORE;
  if (relativePath.startsWith('constants/')) return CATEGORIES.CONSTANTS;
  if (relativePath.startsWith('lib/')) return CATEGORIES.LIB;
  if (relativePath.startsWith('__mocks__/')) return CATEGORIES.MOCKS;
  
  return CATEGORIES.OTHER;
}

/**
 * Extract imports from a JavaScript file
 */
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = [];
    
    // Match ES6 imports
    const es6ImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*\s*from\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Match require statements
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Check if a file uses PropTypes
 */
function usesPropTypes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes('PropTypes') || content.includes('prop-types');
  } catch (error) {
    return false;
  }
}

/**
 * Check if a file is a test file
 */
function isTestFile(filePath) {
  const fileName = path.basename(filePath);
  return fileName.includes('.test.') || fileName.includes('.spec.') || filePath.includes('__tests__');
}

/**
 * Estimate complexity based on file characteristics
 */
function estimateComplexity(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const imports = extractImports(filePath);
    const hasPropTypes = usesPropTypes(filePath);
    const hasClass = content.includes('class ') && content.includes('extends');
    const hasHooks = /use[A-Z]\w+/.test(content);
    const hasRedux = content.includes('connect(') || content.includes('useSelector') || content.includes('useDispatch');
    
    // Scoring system for complexity
    let score = 0;
    
    // Line count scoring
    if (lines > 500) score += 3;
    else if (lines > 200) score += 2;
    else if (lines > 100) score += 1;
    
    // Import count scoring
    if (imports.length > 20) score += 2;
    else if (imports.length > 10) score += 1;
    
    // Feature scoring
    if (hasPropTypes) score += 1;
    if (hasClass) score += 1;
    if (hasHooks) score += 1;
    if (hasRedux) score += 1;
    
    // Determine complexity
    if (score >= 5) return COMPLEXITY.LARGE;
    if (score >= 2) return COMPLEXITY.MEDIUM;
    return COMPLEXITY.SMALL;
  } catch (error) {
    return COMPLEXITY.MEDIUM;
  }
}

/**
 * Get line count of a file
 */
function getLineCount(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Resolve import path to actual file path
 */
function resolveImportPath(importPath, fromFile) {
  // Skip external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }
  
  const fromDir = path.dirname(fromFile);
  let resolvedPath = path.resolve(fromDir, importPath);
  
  // Try different extensions
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
  
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  
  return null;
}

/**
 * Build dependency graph for all JS files
 */
function buildDependencyGraph(jsFiles) {
  const graph = {};
  const reverseGraph = {};
  
  // Initialize graphs
  for (const file of jsFiles) {
    graph[file] = [];
    reverseGraph[file] = [];
  }
  
  // Build dependency relationships
  for (const file of jsFiles) {
    const imports = extractImports(file);
    
    for (const importPath of imports) {
      const resolvedPath = resolveImportPath(importPath, file);
      
      if (resolvedPath && jsFiles.includes(resolvedPath)) {
        graph[file].push(resolvedPath);
        reverseGraph[resolvedPath].push(file);
      }
    }
  }
  
  return { graph, reverseGraph };
}

/**
 * Identify leaf nodes (files with no or few dependents)
 */
function identifyLeafNodes(reverseGraph, threshold = 2) {
  const leafNodes = [];
  
  for (const [file, dependents] of Object.entries(reverseGraph)) {
    if (dependents.length <= threshold) {
      leafNodes.push({
        file,
        dependentCount: dependents.length,
        dependents
      });
    }
  }
  
  return leafNodes.sort((a, b) => a.dependentCount - b.dependentCount);
}

/**
 * Main function to generate inventory
 */
function generateInventory() {
  console.log('Scanning for JavaScript files in app/ directory...\n');
  
  const jsFiles = findJsFiles(APP_DIR);
  console.log(`Found ${jsFiles.length} JavaScript files\n`);
  
  // Build dependency graph
  console.log('Building dependency graph...');
  const { graph, reverseGraph } = buildDependencyGraph(jsFiles);
  
  // Identify leaf nodes
  console.log('Identifying leaf nodes...');
  const leafNodes = identifyLeafNodes(reverseGraph);
  
  // Categorize and analyze files
  console.log('Analyzing files...\n');
  
  const inventory = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalFiles: jsFiles.length,
      appDirectory: APP_DIR
    },
    summary: {
      byCategory: {},
      byComplexity: { S: 0, M: 0, L: 0 },
      withPropTypes: 0,
      testFiles: 0,
      leafNodes: leafNodes.length
    },
    files: [],
    leafNodes: [],
    categoryBreakdown: {}
  };
  
  // Process each file
  for (const filePath of jsFiles) {
    const relativePath = path.relative(APP_DIR, filePath);
    const category = categorizeFile(filePath);
    const complexity = estimateComplexity(filePath);
    const hasPropTypes = usesPropTypes(filePath);
    const isTest = isTestFile(filePath);
    const lineCount = getLineCount(filePath);
    const imports = extractImports(filePath);
    const dependents = reverseGraph[filePath] || [];
    const dependencies = graph[filePath] || [];
    
    const fileInfo = {
      path: relativePath,
      fullPath: filePath,
      category,
      complexity,
      lineCount,
      hasPropTypes,
      isTestFile: isTest,
      importCount: imports.length,
      dependentCount: dependents.length,
      dependencyCount: dependencies.length,
      dependencies: dependencies.map(d => path.relative(APP_DIR, d)),
      dependents: dependents.map(d => path.relative(APP_DIR, d))
    };
    
    inventory.files.push(fileInfo);
    
    // Update summary
    inventory.summary.byCategory[category] = (inventory.summary.byCategory[category] || 0) + 1;
    inventory.summary.byComplexity[complexity]++;
    if (hasPropTypes) inventory.summary.withPropTypes++;
    if (isTest) inventory.summary.testFiles++;
    
    // Update category breakdown
    if (!inventory.categoryBreakdown[category]) {
      inventory.categoryBreakdown[category] = [];
    }
    inventory.categoryBreakdown[category].push(fileInfo);
  }
  
  // Add leaf nodes
  inventory.leafNodes = leafNodes.map(node => ({
    path: path.relative(APP_DIR, node.file),
    dependentCount: node.dependentCount,
    dependents: node.dependents.map(d => path.relative(APP_DIR, d))
  }));
  
  // Sort files by category and complexity
  inventory.files.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.complexity !== b.complexity) {
      const order = { S: 0, M: 1, L: 2 };
      return order[a.complexity] - order[b.complexity];
    }
    return a.path.localeCompare(b.path);
  });
  
  return inventory;
}

/**
 * Generate CSV output
 */
function generateCSV(inventory) {
  const headers = [
    'Path',
    'Category',
    'Complexity',
    'Lines',
    'Has PropTypes',
    'Is Test',
    'Import Count',
    'Dependent Count',
    'Dependency Count'
  ];
  
  const rows = inventory.files.map(file => [
    file.path,
    file.category,
    file.complexity,
    file.lineCount,
    file.hasPropTypes ? 'Yes' : 'No',
    file.isTestFile ? 'Yes' : 'No',
    file.importCount,
    file.dependentCount,
    file.dependencyCount
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Print summary to console
 */
function printSummary(inventory) {
  console.log('='.repeat(60));
  console.log('JavaScript Files Inventory Summary');
  console.log('='.repeat(60));
  console.log(`\nTotal JavaScript files: ${inventory.metadata.totalFiles}`);
  console.log(`Test files: ${inventory.summary.testFiles}`);
  console.log(`Files with PropTypes: ${inventory.summary.withPropTypes}`);
  console.log(`Leaf nodes (0-2 dependents): ${inventory.summary.leafNodes}`);
  
  console.log('\nBy Category:');
  for (const [category, count] of Object.entries(inventory.summary.byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }
  
  console.log('\nBy Complexity:');
  console.log(`  Small (S): ${inventory.summary.byComplexity.S}`);
  console.log(`  Medium (M): ${inventory.summary.byComplexity.M}`);
  console.log(`  Large (L): ${inventory.summary.byComplexity.L}`);
  
  console.log('\nTop 10 Leaf Nodes (easiest to migrate first):');
  inventory.leafNodes.slice(0, 10).forEach((node, i) => {
    console.log(`  ${i + 1}. ${node.path} (${node.dependentCount} dependents)`);
  });
}

// Main execution
function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const inventory = generateInventory();
  
  // Write JSON output
  const jsonPath = path.join(OUTPUT_DIR, 'js-files-inventory.json');
  fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2));
  console.log(`\nJSON inventory written to: ${jsonPath}`);
  
  // Write CSV output
  const csvPath = path.join(OUTPUT_DIR, 'js-files-inventory.csv');
  fs.writeFileSync(csvPath, generateCSV(inventory));
  console.log(`CSV inventory written to: ${csvPath}`);
  
  // Print summary
  printSummary(inventory);
  
  return inventory;
}

main();
