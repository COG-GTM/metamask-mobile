const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Get all .js and .jsx files in the app/ directory
 * @returns {string[]} Array of file paths
 */
function getJsFiles() {
  const files = execSync('find app/ -name "*.js" -o -name "*.jsx" | sort', {
    encoding: 'utf8',
  });
  return files.trim().split('\n').filter(Boolean);
}

/**
 * Get filtered .js and .jsx files, excluding configuration, test, stories, and mock files
 * @returns {string[]} Array of filtered file paths
 */
function getFilteredJsFiles() {
  const files = execSync(
    'find app/ -name "*.js" -o -name "*.jsx" | grep -v -E "(config|\\.test\\.|\\.spec\\.|stories|mock)" | sort',
    { encoding: 'utf8' },
  );
  return files.trim().split('\n').filter(Boolean);
}

/**
 * Categorize a file based on its path according to the priority matrix
 * @param {string} filePath - The path of the file to categorize
 * @returns {string} Priority level (P0-P4)
 */
function categorizeFile(filePath) {
  if (filePath.includes('app/core/Engine/')) return 'P0';
  if (filePath.includes('app/util/')) return 'P1';
  if (filePath.includes('app/components/Nav/')) return 'P2';
  if (
    filePath.includes('app/components/UI/') ||
    filePath.includes('app/components/Views/')
  )
    return 'P3';
  if (
    filePath.includes('app/components/hooks/') ||
    filePath.includes('app/selectors/')
  )
    return 'P4';
  return 'P4'; // Default to lowest priority
}

/**
 * Generate the inventory of JavaScript files with categorization
 */
function generateInventory() {
  const jsFiles = getFilteredJsFiles();
  const inventory = {
    summary: {
      total: jsFiles.length,
      byPriority: { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 },
    },
    files: [],
  };

  jsFiles.forEach((file) => {
    const priority = categorizeFile(file);
    inventory.summary.byPriority[priority]++;
    inventory.files.push({
      path: file,
      priority,
      status: 'Todo',
    });
  });

  fs.writeFileSync(
    'scripts/js-migration-inventory.json',
    JSON.stringify(inventory, null, 2),
  );
  console.log('Inventory generated at scripts/js-migration-inventory.json');
}

/**
 * Main function to run the inventory generation
 */
function main() {
  console.log('Scanning for JavaScript files in app/ directory...');
  generateInventory();
}

main();
