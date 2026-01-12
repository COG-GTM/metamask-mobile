#!/usr/bin/env node

/**
 * Enzyme to React Testing Library Migration Helper Script
 *
 * This script analyzes test files using Enzyme and provides migration guidance
 * to help developers convert tests to React Testing Library (RTL).
 *
 * Usage:
 *   node scripts/migrate-test.js <file-path>
 *   node scripts/migrate-test.js --analyze-all
 *   node scripts/migrate-test.js --summary
 *
 * Examples:
 *   node scripts/migrate-test.js app/components/UI/Button/Button.test.tsx
 *   node scripts/migrate-test.js --analyze-all
 *   node scripts/migrate-test.js --summary
 */

const fs = require('fs');
const path = require('path');

// Common Enzyme to RTL migration patterns
const MIGRATION_PATTERNS = [
  {
    name: 'Import Statement',
    enzyme: "import { shallow } from 'enzyme'",
    rtl: "import { render, screen } from '@testing-library/react-native'",
    description: 'Replace Enzyme shallow import with RTL render and screen',
  },
  {
    name: 'Import Statement (mount)',
    enzyme: "import { mount } from 'enzyme'",
    rtl: "import { render, screen } from '@testing-library/react-native'",
    description: 'Replace Enzyme mount import with RTL render and screen',
  },
  {
    name: 'Shallow Render',
    enzyme: 'const wrapper = shallow(<Component />)',
    rtl: 'const { getByText, getByTestId } = render(<Component />)',
    description: 'Replace shallow() with render() from RTL',
  },
  {
    name: 'Mount Render',
    enzyme: 'const wrapper = mount(<Component />)',
    rtl: 'const { getByText, getByTestId } = render(<Component />)',
    description: 'Replace mount() with render() from RTL',
  },
  {
    name: 'Snapshot Test',
    enzyme: 'expect(wrapper).toMatchSnapshot()',
    rtl: 'expect(toJSON()).toMatchSnapshot()',
    description: 'Use toJSON() from render result for snapshots',
  },
  {
    name: 'Find by Text (props.children)',
    enzyme: "expect(wrapper.find('Text').props().children).toBe('text')",
    rtl: "expect(screen.getByText('text')).toBeTruthy()",
    description: 'Use getByText to find elements by their text content',
  },
  {
    name: 'Find by Component',
    enzyme: "wrapper.find('ComponentName')",
    rtl: "screen.getByTestId('component-test-id')",
    description: 'Use testID props and getByTestId instead of finding by component name',
  },
  {
    name: 'Find by TestID (findWhere)',
    enzyme: "wrapper.findWhere((node) => node.prop('testID') === 'my-id')",
    rtl: "screen.getByTestId('my-id')",
    description: 'Use getByTestId directly instead of findWhere',
  },
  {
    name: 'Check Element Exists',
    enzyme: 'expect(wrapper.find(Component).exists()).toBe(true)',
    rtl: "expect(screen.getByTestId('component-id')).toBeTruthy()",
    description: 'Use query methods to check element existence',
  },
  {
    name: 'Check Element Not Exists',
    enzyme: 'expect(wrapper.find(Component).exists()).toBe(false)',
    rtl: "expect(screen.queryByTestId('component-id')).toBeNull()",
    description: 'Use queryBy methods (returns null if not found) for negative assertions',
  },
  {
    name: 'Simulate Click',
    enzyme: "wrapper.find('Button').simulate('press')",
    rtl: "fireEvent.press(screen.getByRole('button'))",
    description: 'Use fireEvent from RTL for user interactions',
  },
  {
    name: 'Simulate Change',
    enzyme: "wrapper.find('TextInput').simulate('changeText', 'new value')",
    rtl: "fireEvent.changeText(screen.getByTestId('input'), 'new value')",
    description: 'Use fireEvent.changeText for text input changes',
  },
  {
    name: 'Get Props',
    enzyme: "wrapper.find('Component').props()",
    rtl: 'Use getByTestId and check specific behaviors instead of props',
    description: 'RTL encourages testing behavior over implementation details',
  },
  {
    name: 'Set Props',
    enzyme: 'wrapper.setProps({ newProp: value })',
    rtl: 'rerender(<Component newProp={value} />)',
    description: 'Use rerender from render result to update props',
  },
  {
    name: 'Get State',
    enzyme: 'wrapper.state()',
    rtl: 'Test the visible output/behavior instead of internal state',
    description: 'RTL discourages testing internal state directly',
  },
  {
    name: 'Instance Methods',
    enzyme: 'wrapper.instance().methodName()',
    rtl: 'Test the visible effects of the method instead',
    description: 'RTL discourages testing instance methods directly',
  },
  {
    name: 'Update Wrapper',
    enzyme: 'wrapper.update()',
    rtl: 'await waitFor(() => expect(...).toBeTruthy())',
    description: 'Use waitFor for async updates',
  },
  {
    name: 'With Redux Provider',
    enzyme: 'shallow(<Provider store={store}><Component /></Provider>)',
    rtl: "renderWithProvider(<Component />, { state: mockState })",
    description: 'Use renderWithProvider utility from app/util/test/renderWithProvider',
  },
];

// Regex patterns to detect Enzyme usage
const ENZYME_DETECTION_PATTERNS = {
  import: /from ['"]enzyme['"]/,
  shallow: /shallow\s*\(/,
  mount: /mount\s*\(/,
  findWhere: /\.findWhere\s*\(/,
  find: /wrapper\.find\s*\(/,
  simulate: /\.simulate\s*\(/,
  props: /\.props\s*\(\s*\)/,
  state: /\.state\s*\(\s*\)/,
  instance: /\.instance\s*\(\s*\)/,
  setProps: /\.setProps\s*\(/,
  update: /wrapper\.update\s*\(/,
  exists: /\.exists\s*\(\s*\)/,
  dive: /\.dive\s*\(/,
  children: /\.children\s*\(/,
  parent: /\.parent\s*\(/,
  at: /\.at\s*\(\d+\)/,
  first: /\.first\s*\(/,
  last: /\.last\s*\(/,
  text: /\.text\s*\(/,
  html: /\.html\s*\(/,
};

// Analyze a single file
function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  // Check for Enzyme import
  if (!ENZYME_DETECTION_PATTERNS.import.test(content)) {
    return { filePath, isEnzymeFile: false, findings: [] };
  }

  // Analyze each pattern
  Object.entries(ENZYME_DETECTION_PATTERNS).forEach(([patternName, regex]) => {
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        findings.push({
          pattern: patternName,
          line: index + 1,
          code: line.trim(),
        });
      }
    });
  });

  // Calculate complexity
  const complexity = calculateComplexity(content, findings);

  return {
    filePath,
    isEnzymeFile: true,
    findings,
    complexity,
    lineCount: lines.length,
    hasRTL: /@testing-library\/react-native/.test(content),
    mockCount: (content.match(/jest\.mock/g) || []).length,
    hasEngineMock: /jest\.mock.*Engine/.test(content),
  };
}

// Calculate test complexity
function calculateComplexity(content, findings) {
  let score = 0;

  // Base score from line count
  const lineCount = content.split('\n').length;
  if (lineCount > 300) score += 3;
  else if (lineCount > 100) score += 1;

  // Score from mock count
  const mockCount = (content.match(/jest\.mock/g) || []).length;
  if (mockCount > 5) score += 2;
  else if (mockCount > 2) score += 1;

  // Score from Engine mock
  if (/jest\.mock.*Engine/.test(content)) score += 2;

  // Score from async patterns
  if (/waitFor|async|await/.test(content)) score += 1;

  // Score from complex Enzyme patterns
  const complexPatterns = ['dive', 'instance', 'state', 'setProps'];
  complexPatterns.forEach((pattern) => {
    if (findings.some((f) => f.pattern === pattern)) score += 1;
  });

  if (score >= 5) return 'Complex';
  if (score >= 2) return 'Medium';
  return 'Simple';
}

// Generate migration checklist for a file
function generateChecklist(analysis) {
  if (!analysis.isEnzymeFile) {
    return 'This file does not use Enzyme.';
  }

  const checklist = [];

  checklist.push(`\n## Migration Checklist for ${analysis.filePath}\n`);
  checklist.push(`Complexity: ${analysis.complexity}`);
  checklist.push(`Line Count: ${analysis.lineCount}`);
  checklist.push(`Mock Count: ${analysis.mockCount}`);
  checklist.push(`Has Engine Mock: ${analysis.hasEngineMock ? 'Yes' : 'No'}`);
  checklist.push(`Already has RTL: ${analysis.hasRTL ? 'Yes (partial migration)' : 'No'}`);

  checklist.push('\n### Enzyme Patterns Found:\n');

  // Group findings by pattern
  const patternGroups = {};
  analysis.findings.forEach((finding) => {
    if (!patternGroups[finding.pattern]) {
      patternGroups[finding.pattern] = [];
    }
    patternGroups[finding.pattern].push(finding);
  });

  Object.entries(patternGroups).forEach(([pattern, findings]) => {
    checklist.push(`- [ ] **${pattern}** (${findings.length} occurrence${findings.length > 1 ? 's' : ''})`);
    findings.slice(0, 3).forEach((f) => {
      checklist.push(`      Line ${f.line}: \`${f.code.substring(0, 60)}${f.code.length > 60 ? '...' : ''}\``);
    });
    if (findings.length > 3) {
      checklist.push(`      ... and ${findings.length - 3} more`);
    }
  });

  checklist.push('\n### Migration Steps:\n');
  checklist.push('1. [ ] Update imports: Replace Enzyme imports with RTL imports');
  checklist.push('2. [ ] Replace shallow/mount with render from RTL');
  checklist.push('3. [ ] Update element queries to use RTL query methods');
  checklist.push('4. [ ] Replace simulate calls with fireEvent');
  checklist.push('5. [ ] Update snapshot assertions');
  checklist.push('6. [ ] Add testID props to components if needed');
  checklist.push('7. [ ] Run tests and fix any failures');
  checklist.push('8. [ ] Update snapshots if necessary');

  if (analysis.hasEngineMock) {
    checklist.push('\n### Special Considerations:\n');
    checklist.push('- This file mocks Engine, which may require careful handling');
    checklist.push('- Review existing Engine mock patterns in migrated files');
  }

  return checklist.join('\n');
}

// Find all Enzyme test files
function findEnzymeFiles(rootDir) {
  const enzymeFiles = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes('node_modules')) {
        walkDir(filePath);
      } else if (file.match(/\.test\.(js|jsx|ts|tsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (ENZYME_DETECTION_PATTERNS.import.test(content)) {
          enzymeFiles.push(filePath);
        }
      }
    });
  }

  walkDir(rootDir);
  return enzymeFiles;
}

// Print migration patterns reference
function printPatternsReference() {
  console.log('\n=== Enzyme to RTL Migration Patterns Reference ===\n');

  MIGRATION_PATTERNS.forEach((pattern) => {
    console.log(`### ${pattern.name}`);
    console.log(`Description: ${pattern.description}\n`);
    console.log('Before (Enzyme):');
    console.log(`  ${pattern.enzyme}\n`);
    console.log('After (RTL):');
    console.log(`  ${pattern.rtl}\n`);
    console.log('---\n');
  });
}

// Print summary of all Enzyme files
function printSummary(rootDir) {
  const enzymeFiles = findEnzymeFiles(rootDir);

  console.log('\n=== Enzyme Migration Summary ===\n');
  console.log(`Total Enzyme test files: ${enzymeFiles.length}\n`);

  const complexityCount = { Simple: 0, Medium: 0, Complex: 0 };
  const analyses = [];

  enzymeFiles.forEach((file) => {
    const analysis = analyzeFile(file);
    if (analysis && analysis.isEnzymeFile) {
      analyses.push(analysis);
      complexityCount[analysis.complexity]++;
    }
  });

  console.log('Complexity Breakdown:');
  console.log(`  Simple: ${complexityCount.Simple}`);
  console.log(`  Medium: ${complexityCount.Medium}`);
  console.log(`  Complex: ${complexityCount.Complex}`);

  console.log('\nFiles by Complexity:\n');

  ['Simple', 'Medium', 'Complex'].forEach((complexity) => {
    console.log(`\n### ${complexity} (${complexityCount[complexity]} files):\n`);
    analyses
      .filter((a) => a.complexity === complexity)
      .forEach((a) => {
        const relativePath = path.relative(rootDir, a.filePath);
        console.log(`  - ${relativePath} (${a.lineCount} lines, ${a.mockCount} mocks)`);
      });
  });
}

// Main function
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Enzyme to React Testing Library Migration Helper

Usage:
  node scripts/migrate-test.js <file-path>     Analyze a specific test file
  node scripts/migrate-test.js --analyze-all   Analyze all Enzyme test files
  node scripts/migrate-test.js --summary       Print summary of all Enzyme files
  node scripts/migrate-test.js --patterns      Print migration patterns reference

Examples:
  node scripts/migrate-test.js app/components/UI/Button/Button.test.tsx
  node scripts/migrate-test.js --summary
`);
    return;
  }

  const rootDir = path.join(__dirname, '..', 'app');

  if (args[0] === '--patterns') {
    printPatternsReference();
    return;
  }

  if (args[0] === '--summary') {
    printSummary(rootDir);
    return;
  }

  if (args[0] === '--analyze-all') {
    const enzymeFiles = findEnzymeFiles(rootDir);
    console.log(`\nFound ${enzymeFiles.length} Enzyme test files.\n`);

    enzymeFiles.forEach((file) => {
      const analysis = analyzeFile(file);
      if (analysis && analysis.isEnzymeFile) {
        console.log(generateChecklist(analysis));
        console.log('\n' + '='.repeat(80) + '\n');
      }
    });
    return;
  }

  // Analyze specific file
  const filePath = path.resolve(args[0]);
  const analysis = analyzeFile(filePath);

  if (!analysis) {
    return;
  }

  if (!analysis.isEnzymeFile) {
    console.log(`${filePath} does not use Enzyme.`);
    return;
  }

  console.log(generateChecklist(analysis));
  console.log('\n### Relevant Migration Patterns:\n');

  // Find relevant patterns based on findings
  const relevantPatterns = new Set();
  analysis.findings.forEach((finding) => {
    MIGRATION_PATTERNS.forEach((pattern) => {
      if (
        pattern.name.toLowerCase().includes(finding.pattern.toLowerCase()) ||
        pattern.enzyme.toLowerCase().includes(finding.pattern.toLowerCase())
      ) {
        relevantPatterns.add(pattern);
      }
    });
  });

  relevantPatterns.forEach((pattern) => {
    console.log(`**${pattern.name}**`);
    console.log(`  Before: ${pattern.enzyme}`);
    console.log(`  After:  ${pattern.rtl}`);
    console.log(`  Note:   ${pattern.description}\n`);
  });
}

main();
