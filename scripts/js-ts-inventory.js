/* eslint-disable import/no-commonjs, no-console */
/**
 * Regenerates the JS -> TS migration inventory under `docs/js-ts-migration/`.
 *
 *   node scripts/js-ts-inventory.js [--probe <tsv>] [--out <dir>]
 *
 * It walks every file under `app/`, builds the intra-`app/` import graph, works
 * out which remaining `.js`/`.jsx` files need `.ts` vs `.tsx`, assigns each of
 * them to exactly one workstream, and writes `inventory.json` + `inventory.md`.
 *
 * `--probe` optionally merges a TSV of `path<TAB>ownErrors<TAB>totalErrors`
 * produced by renaming each file in isolation and running `yarn lint:tsc`.
 * See docs/js-ts-migration/README.md ("Refreshing the inventory").
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');
const CODE_EXT = ['.js', '.jsx', '.ts', '.tsx'];
const RESOLVE_ORDER = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.ios.ts',
  '.ios.tsx',
  '.ios.js',
  '.android.ts',
  '.android.js',
  '.native.js',
  '.json',
  '.d.ts',
];

/** Fan-in at or above which a file is treated as a serialized "hub". */
const HUB_THRESHOLD = 50;
/** Fan-in at or above which a file must be converted first inside its own workstream. */
const HIGH_FAN_IN_THRESHOLD = 15;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__snapshots__') {
        continue;
      }
      walk(full, out);
    } else if (CODE_EXT.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

const IMPORT_RE =
  /(?:^|\s)(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]|(?:^|[^.\w])require\(\s*['"]([^'"]+)['"]\s*\)|(?:^|\s)import\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:^|\s)import\s+['"]([^'"]+)['"]|jest\.mock\(\s*['"]([^'"]+)['"]/g;

function extractSpecifiers(source) {
  const specs = new Set();
  let match;
  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(source)) !== null) {
    const spec = match[1] || match[2] || match[3] || match[4] || match[5];
    if (spec) {
      specs.add(spec);
    }
  }
  return [...specs];
}

/** Resolve a module specifier to an absolute file path inside `app/`, or null. */
function resolveSpecifier(spec, fromFile, fileSet) {
  let base;
  if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else if (spec.startsWith('images/')) {
    base = path.join(APP, 'images', spec.slice('images/'.length));
  } else {
    return null; // third-party package
  }

  if (fileSet.has(base)) {
    return base;
  }
  for (const ext of RESOLVE_ORDER) {
    if (fileSet.has(base + ext)) {
      return base + ext;
    }
  }
  for (const ext of RESOLVE_ORDER) {
    const idx = path.join(base, `index${ext}`);
    if (fileSet.has(idx)) {
      return idx;
    }
  }
  return null;
}

const JSX_RE = /<\/[A-Za-z][\w.]*>|<[A-Z][\w.]*[\s/>]|<>|<[a-z]+[\s][^<>]*\/>/;

function stripCommentsAndStrings(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/`(?:\\[\s\S]|[^\\`])*`/g, '``')
    .replace(/'(?:\\.|[^\\'])*'/g, "''")
    .replace(/"(?:\\.|[^\\"])*"/g, '""');
}

/**
 * Files outside `app/` that hard-code a `.js` path (jest.config.js,
 * .eslintignore, index.js, ...) must be updated in the same PR as the rename.
 */
function findConfigReferences(jsPaths) {
  const { execSync } = require('child_process');
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(
      (p) =>
        p &&
        !p.startsWith('app/') &&
        !p.startsWith('ios/') &&
        !p.startsWith('android/') &&
        !p.startsWith('locales/') &&
        !p.startsWith('docs/js-ts-migration/') &&
        p !== 'scripts/js-ts-inventory.js',
    );
  const contents = tracked
    .map((p) => {
      try {
        return [p, fs.readFileSync(path.join(ROOT, p), 'utf8')];
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const refs = new Map(jsPaths.map((p) => [p, []]));
  for (const [file, text] of contents) {
    for (const p of jsPaths) {
      if (text.includes(p)) {
        refs.get(p).push(file);
      }
    }
  }
  return refs;
}

function buildGraph() {
  const allFiles = walk(APP);
  const fileSet = new Set(allFiles);
  const sources = new Map(allFiles.map((f) => [f, fs.readFileSync(f, 'utf8')]));

  const dependencies = new Map();
  const dependents = new Map(allFiles.map((f) => [f, new Set()]));
  for (const f of allFiles) {
    const deps = new Set();
    for (const spec of extractSpecifiers(sources.get(f))) {
      const resolved = resolveSpecifier(spec, f, fileSet);
      if (resolved && resolved !== f) {
        deps.add(resolved);
        dependents.get(resolved).add(f);
      }
    }
    dependencies.set(f, deps);
  }
  return { allFiles, sources, dependencies, dependents };
}

// ---------------------------------------------------------------------------
// Workstream definitions. Rules are evaluated top to bottom; first match wins,
// which guarantees every file lands in exactly one workstream.
// ---------------------------------------------------------------------------
const migrationNumber = (p) => {
  const m = /migrations\/(\d{3})/.exec(p);
  return m ? Number(m[1]) : -1;
};

const HUB_UTILS = [
  'app/util/networks/index.js',
  'app/util/device/index.js',
  'app/util/number/index.js',
  'app/util/transactions/index.js',
  'app/util/general/index.js',
  'app/constants/network.js',
];

const WORKSTREAMS = [
  {
    id: 'WS-01',
    name: 'Hub — core utilities',
    serialized: true,
    area: 'app/util, app/constants',
    match: (p) => HUB_UTILS.includes(p),
    notes:
      'Highest fan-in files in the repo. Convert strictly one at a time, one PR each, ' +
      'and let each PR land before starting the next. Everything else benefits from these ' +
      'being typed first.',
  },
  {
    id: 'WS-02',
    name: 'Hub — shared UI primitives',
    serialized: true,
    area: 'app/components/UI/Navbar, app/components/UI/StyledButton',
    match: (p) =>
      p.startsWith('app/components/UI/Navbar/') ||
      p.startsWith('app/components/UI/StyledButton/'),
    notes:
      'Imported by 70+ screens each. Serialize internally; convert `StyledButton` before ' +
      '`Navbar`. One PR per file.',
  },
  {
    id: 'WS-03',
    name: 'Redux actions',
    area: 'app/actions',
    match: (p) => p.startsWith('app/actions/'),
    notes:
      'Leaf modules. Export a discriminated-union `Action` type from each module so WS-04 ' +
      'can consume it. Reference: `app/actions/onboarding/index.ts`.',
  },
  {
    id: 'WS-04',
    name: 'Redux reducers',
    area: 'app/reducers',
    match: (p) => p.startsWith('app/reducers/'),
    notes:
      'Depends on WS-03 for action union types — start after WS-03 lands, or type the ' +
      'action parameter locally and tighten later. Reference: `app/reducers/security/index.ts`.',
  },
  {
    id: 'WS-05',
    name: 'Store migrations 000–013',
    area: 'app/store/migrations',
    match: (p) =>
      p.startsWith('app/store/migrations/') && migrationNumber(p) <= 13,
    notes:
      '`app/store/migrations/index.ts` imports these without an extension, so renaming needs ' +
      'no change there — the three migration workstreams stay conflict-free. Reference: `028.ts`.',
  },
  {
    id: 'WS-06',
    name: 'Store migrations 014–020 (+ tests)',
    area: 'app/store/migrations',
    match: (p) =>
      p.startsWith('app/store/migrations/') &&
      migrationNumber(p) >= 14 &&
      migrationNumber(p) <= 20,
    notes: 'Same procedure as WS-05; these have co-located `.test.js` files to rename too.',
  },
  {
    id: 'WS-07',
    name: 'Store migrations 021–028 (+ tests)',
    area: 'app/store/migrations',
    match: (p) =>
      p.startsWith('app/store/migrations/') && migrationNumber(p) >= 21,
    notes: 'Same procedure as WS-05.',
  },
  {
    id: 'WS-08',
    name: 'Utilities (non-hub)',
    area: 'app/util (excluding app/util/test)',
    match: (p) => p.startsWith('app/util/') && !p.startsWith('app/util/test/'),
    notes:
      'Leaf-first within the workstream. References: `app/util/string/index.ts`, ' +
      '`app/util/mnemonic/index.ts`.',
  },
  {
    id: 'WS-09',
    name: 'Test infrastructure',
    area: 'app/util/test',
    match: (p) => p.startsWith('app/util/test/'),
    notes:
      '`app/util/test/utils.js` and `testSetup.js` are loaded by the whole suite — a mistake ' +
      'here breaks every other workstream. Run the full `yarn test:unit` (not just related ' +
      'tests) before opening the PR. A previous single-file conversion in this folder was ' +
      'reverted by PR 11746, so treat it as high risk.',
  },
  {
    id: 'WS-10',
    name: 'Core services & singletons',
    area: 'app/core (top level, BackgroundBridge, WalletConnect)',
    match: (p) =>
      p.startsWith('app/core/') &&
      !p.startsWith('app/core/RPCMethods/') &&
      !p.startsWith('app/core/Permissions/'),
    notes:
      'Order by complexity: `TransactionTypes` → `DrawerStatusTracker` → `ClipboardManager` → ' +
      '`PreventScreenshot` → `MobilePortStream` → `EntryScriptWeb3` → `SecureKeychain` → ' +
      '`Vault` → `NotificationManager` → `BackgroundBridge`. Native-module surfaces may need ' +
      'new ambient declarations.',
  },
  {
    id: 'WS-11',
    name: 'RPC methods & permissions',
    area: 'app/core/RPCMethods, app/core/Permissions',
    match: (p) =>
      p.startsWith('app/core/RPCMethods/') ||
      p.startsWith('app/core/Permissions/'),
    notes:
      'Use JSON-RPC types from `@metamask/utils`. Preserve `///: BEGIN:ONLY_INCLUDE_IF(...)` ' +
      'preprocessor comments byte-for-byte. Reference: `app/core/RPCMethods/RPCMethodMiddleware.ts`.',
  },
  {
    id: 'WS-12',
    name: 'Constants, images, lib & mocks',
    area: 'app/constants, app/images, app/lib, app/__mocks__',
    match: (p) => /^app\/(constants|images|lib|__mocks__)\//.test(p),
    notes:
      'Mostly trivial. `app/images/image-icons.js` already has an ambient declaration in ' +
      '`app/declarations/index.d.ts` — check it still lines up after the rename.',
  },
  {
    id: 'WS-13',
    name: 'Base components',
    area: 'app/components/Base',
    match: (p) => p.startsWith('app/components/Base/'),
    notes:
      '`RemoteImage` (17 dependents) and the `Keypad` family are the high fan-in items — ' +
      'convert them first, each in its own PR.',
  },
  {
    id: 'WS-14',
    name: 'Navigation',
    area: 'app/components/Nav',
    match: (p) => p.startsWith('app/components/Nav/'),
    notes:
      'Define the `RootStackParamList` here; every downstream screen typing depends on it, ' +
      'so land this early even though the file count is small.',
  },
  {
    id: 'WS-15',
    name: 'Swaps',
    area: 'app/components/UI/Swaps',
    match: (p) => p.startsWith('app/components/UI/Swaps/'),
    notes:
      'Self-contained subtree. Convert `utils/index.js` and `components/TokenIcon.js` first ' +
      '(15 dependents each), then the rest leaf-first.',
  },
  // WS-16..WS-19 (UI components) and WS-24..WS-27 (Views) are generated below.
  {
    id: 'WS-20',
    name: 'Legacy confirmations — shared components',
    area: 'app/components/Views/confirmations/legacy/components',
    match: (p) =>
      p.startsWith('app/components/Views/confirmations/legacy/components/'),
    notes:
      'Largest confirmations cluster. Type transaction objects with `TransactionMeta` from ' +
      '`@metamask/transaction-controller`. Needs manual QA of the approve/sign flows.',
  },
  {
    id: 'WS-21',
    name: 'Legacy confirmations — send flow',
    area: 'app/components/Views/confirmations/legacy/SendFlow',
    match: (p) =>
      p.startsWith('app/components/Views/confirmations/legacy/SendFlow/'),
    notes:
      'State is threaded between screens through navigation params — type the route params ' +
      'once and reuse. Needs manual QA of the full send flow.',
  },
  {
    id: 'WS-22',
    name: 'Legacy confirmations — approval entry points',
    area: 'app/components/Views/confirmations (remainder)',
    match: (p) => p.startsWith('app/components/Views/confirmations/'),
    notes: 'Depends on WS-20; start after most of it has landed.',
  },
  {
    id: 'WS-23',
    name: 'Settings views',
    area: 'app/components/Views/Settings',
    match: (p) => p.startsWith('app/components/Views/Settings/'),
    notes: 'Needs manual QA for adding/switching networks.',
  },
];

/**
 * Split a set of sibling component directories into N balanced groups so that
 * no two sessions ever touch the same component folder.
 */
function makeDirGroups(files, prefix, count) {
  const dirs = [...new Set(files.map((f) => f.path.split('/')[3]))].sort((a, b) =>
    a.localeCompare(b),
  );
  const counts = new Map(dirs.map((d) => [d, 0]));
  for (const f of files) {
    const d = f.path.split('/')[3];
    counts.set(d, counts.get(d) + 1);
  }
  const target = Math.ceil(files.length / count);
  const groups = [];
  let current = [];
  let size = 0;
  for (const d of dirs) {
    if (size >= target && groups.length < count - 1) {
      groups.push(current);
      current = [];
      size = 0;
    }
    current.push(d);
    size += counts.get(d);
  }
  groups.push(current);
  return groups.map((g) => ({
    dirs: g,
    label: `${g[0]}…${g[g.length - 1]}`,
    prefix,
  }));
}

function main() {
  const args = process.argv.slice(2);
  const probeArg = args.indexOf('--probe');
  const outArg = args.indexOf('--out');
  const outDir =
    outArg !== -1
      ? path.resolve(args[outArg + 1])
      : path.join(ROOT, 'docs', 'js-ts-migration');

  const probe = new Map();
  if (probeArg !== -1) {
    for (const line of fs
      .readFileSync(args[probeArg + 1], 'utf8')
      .split('\n')
      .filter(Boolean)) {
      const [p, own, total] = line.split('\t');
      probe.set(p, { own: Number(own), total: Number(total) });
    }
  }

  const { allFiles, sources, dependencies, dependents } = buildGraph();

  const jsPaths = allFiles
    .filter((f) => ['.js', '.jsx'].includes(path.extname(f)))
    .map((f) => path.relative(ROOT, f));
  const configRefs = findConfigReferences(jsPaths);

  const files = allFiles
    .filter((f) => ['.js', '.jsx'].includes(path.extname(f)))
    .map((f) => {
      const rel = path.relative(ROOT, f);
      const src = sources.get(f);
      const hasJsx = JSX_RE.test(stripCommentsAndStrings(src));
      const deps = [...dependencies.get(f)].map((d) => path.relative(ROOT, d));
      const dependentList = [...dependents.get(f)].map((d) =>
        path.relative(ROOT, d),
      );
      const p = probe.get(rel);
      return {
        path: rel,
        dir: path.dirname(rel),
        ext: path.extname(rel),
        hasJsx,
        target: hasJsx ? '.tsx' : '.ts',
        renamedPath: rel.replace(/\.jsx?$/, hasJsx ? '.tsx' : '.ts'),
        lines: src.split('\n').length,
        dependents: dependentList.length,
        jsDependents: dependentList.filter((d) => /\.jsx?$/.test(d)).length,
        dependencies: deps.length,
        jsDependencies: deps.filter((d) => /\.jsx?$/.test(d)).length,
        dependentPaths: dependentList.sort(),
        isTest: /\.(test|spec)\.jsx?$/.test(rel),
        configReferences: configRefs.get(rel) ?? [],
        tscErrors: p ? p.own : null,
        tscErrorsRepoWide: p ? p.total : null,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  // Generated per-directory groups for the two large component trees.
  const uiRest = files.filter(
    (f) =>
      f.path.startsWith('app/components/UI/') &&
      !WORKSTREAMS.some((w) => w.match(f.path)),
  );
  const uiGroups = makeDirGroups(uiRest, 'app/components/UI/', 4);
  const generated = uiGroups.map((g, i) => ({
    id: `WS-${String(16 + i).padStart(2, '0')}`,
    name: `UI components ${g.label}`,
    area: `app/components/UI/{${g.dirs.join(', ')}}`,
    dirSet: new Set(g.dirs.map((d) => `app/components/UI/${d}`)),
    match(p) {
      return [...this.dirSet].some((d) => p.startsWith(`${d}/`));
    },
    notes:
      'Disjoint set of component folders — no other session touches these directories. ' +
      'Replace `PropTypes` with a `Props` interface; snapshots must stay byte-identical.',
  }));
  WORKSTREAMS.splice(15, 0, ...generated);

  const viewsRest = files.filter(
    (f) =>
      f.path.startsWith('app/components/Views/') &&
      !WORKSTREAMS.some((w) => w.match(f.path)),
  );
  const viewGroups = makeDirGroups(viewsRest, 'app/components/Views/', 4);
  const generatedViews = viewGroups.map((g, i) => ({
    id: `WS-${24 + i}`,
    name: `Views ${g.label}`,
    area: `app/components/Views/{${g.dirs.join(', ')}}`,
    dirSet: new Set(g.dirs.map((d) => `app/components/Views/${d}`)),
    match(p) {
      return [...this.dirSet].some((d) => p.startsWith(`${d}/`));
    },
    notes:
      'Disjoint set of screen folders. Mostly class components — define `Props`/`State` ' +
      'interfaces and keep `connect()` as-is.',
  }));
  WORKSTREAMS.push(...generatedViews);

  const catchAll = {
    id: 'WS-99',
    name: 'Unassigned',
    area: '—',
    match: () => true,
    notes: 'Files that no rule matched — assign an owner manually.',
  };
  const streams = [...WORKSTREAMS, catchAll];

  for (const f of files) {
    const ws = streams.find((w) => w.match(f.path));
    f.workstream = ws.id;
    f.isHub = f.dependents >= HUB_THRESHOLD;
    f.isHighFanIn = f.dependents >= HIGH_FAN_IN_THRESHOLD;
  }

  const byStream = new Map(streams.map((w) => [w.id, []]));
  for (const f of files) {
    byStream.get(f.workstream).push(f);
  }
  // Leaf-first ordering inside a workstream: fewest dependents first, then
  // fewest intra-workstream dependencies, then path for stability.
  for (const list of byStream.values()) {
    list.sort(
      (a, b) =>
        a.dependents - b.dependents ||
        a.dependencies - b.dependencies ||
        a.path.localeCompare(b.path),
    );
    list.forEach((f, i) => {
      f.order = i + 1;
    });
  }

  const summary = streams
    .map((w) => ({
      id: w.id,
      name: w.name,
      area: w.area,
      serialized: Boolean(w.serialized),
      notes: w.notes,
      files: byStream.get(w.id).length,
      tsx: byStream.get(w.id).filter((f) => f.hasJsx).length,
      tests: byStream.get(w.id).filter((f) => f.isTest).length,
      cleanFiles: byStream.get(w.id).filter((f) => f.tscErrors === 0).length,
      errorTotal: byStream
        .get(w.id)
        .reduce((n, f) => n + (f.tscErrors ?? 0), 0),
    }))
    .filter((w) => w.files > 0);

  const totals = {
    appFiles: allFiles.length,
    tsFiles: allFiles.length - files.length,
    jsFiles: files.length,
    needTsx: files.filter((f) => f.hasJsx).length,
    needTs: files.filter((f) => !f.hasJsx).length,
    testFiles: files.filter((f) => f.isTest).length,
    hubFiles: files.filter((f) => f.isHub).length,
    probed: files.filter((f) => f.tscErrors !== null).length,
    zeroErrorFiles: files.filter((f) => f.tscErrors === 0).length,
    workstreams: summary.length,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'inventory.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString().slice(0, 10),
        thresholds: { HUB_THRESHOLD, HIGH_FAN_IN_THRESHOLD },
        totals,
        workstreams: summary,
        files: files.map(({ dependentPaths, ...rest }) => rest),
      },
      null,
      2,
    )}\n`,
  );

  fs.writeFileSync(
    path.join(outDir, 'inventory.md'),
    renderMarkdown({ totals, summary, byStream, files }),
  );
  console.log(`wrote ${outDir}/inventory.json and inventory.md`);
  console.log(totals);
}

function renderMarkdown({ totals, summary, byStream, files }) {
  const L = [];
  L.push('# JS → TS migration inventory');
  L.push('');
  L.push(
    '<!-- Generated by `node scripts/js-ts-inventory.js`. Edit the "Owner" and "Status"',
  );
  L.push(
    '     columns by hand; everything else is regenerated. See README.md. -->',
  );
  L.push('');
  L.push(`Generated: \`${new Date().toISOString().slice(0, 10)}\``);
  L.push('');
  L.push('| | |');
  L.push('|---|---|');
  L.push(`| Files under \`app/\` | ${totals.appFiles} |`);
  L.push(`| Already TypeScript | ${totals.tsFiles} |`);
  L.push(`| **Remaining JavaScript** | **${totals.jsFiles}** |`);
  L.push(`| → become \`.tsx\` (contain JSX) | ${totals.needTsx} |`);
  L.push(`| → become \`.ts\` | ${totals.needTs} |`);
  L.push(`| of which are test files | ${totals.testFiles} |`);
  L.push(
    `| Convert cleanly today (0 \`tsc\` errors) | ${totals.zeroErrorFiles} / ${totals.probed} measured |`,
  );
  L.push(`| Hub files (≥ ${HUB_THRESHOLD} dependents) | ${totals.hubFiles} |`);
  L.push(`| Workstreams | ${totals.workstreams} |`);
  L.push('');
  L.push('## Workstreams');
  L.push('');
  L.push(
    'Each workstream is a disjoint set of files. One session owns one workstream; sessions in ',
  );
  L.push(
    'different workstreams never touch the same file or folder, so their PRs cannot conflict.',
  );
  L.push('');
  L.push(
    '| ID | Workstream | Files | `.tsx` | 0-error | Total `tsc` errors | Owner (session URL) | Status |',
  );
  L.push('|---|---|---|---|---|---|---|---|');
  for (const w of summary) {
    L.push(
      `| ${w.id} | ${w.name}${w.serialized ? ' ⚠️ serialized' : ''} | ${
        w.files
      } | ${w.tsx} | ${w.cleanFiles} | ${w.errorTotal} | _unclaimed_ | not started |`,
    );
  }
  L.push('');
  L.push('## Legend');
  L.push('');
  L.push('- **Target** — `.ts` or `.tsx`, decided by whether the file contains JSX.');
  L.push(
    '- **In** — number of files under `app/` that import this file (fan-in). Higher = riskier.',
  );
  L.push('- **Out** — number of files under `app/` this file imports (fan-out).');
  L.push(
    '- **Errors** — `tsc` errors reported *in this file* when it alone is renamed and `yarn lint:tsc`',
  );
  L.push(
    '  is run against a clean tree. `0` means the rename is mechanical. `—` means not measured.',
  );
  L.push(
    '- **Ripple** — errors the same rename surfaces in *other* files. Non-zero means the PR has to',
  );
  L.push('  touch files outside the renamed one, so review it more carefully.');
  L.push(
    '- **#** — recommended conversion order inside the workstream (leaf-first: lowest fan-in first).',
  );
  L.push('- 🔒 marks a hub file (≥ 50 dependents); ⚠️ marks high fan-in (≥ 15 dependents).');
  L.push(
    '- 📌 marks a file whose path is hard-coded outside `app/` (jest config, ignore files, entry',
  );
  L.push(
    '  points). Those references must be updated in the same PR — see "Config-referenced files".',
  );
  L.push('');
  L.push('## File assignments');
  L.push('');
  for (const w of summary) {
    const list = byStream.get(w.id);
    L.push(`### ${w.id} — ${w.name}`);
    L.push('');
    L.push(`**Area:** \`${w.area}\`  `);
    L.push(
      `**Files:** ${w.files} · **Owner:** _unclaimed_ · **Serialized:** ${
        w.serialized ? 'yes — one file at a time, wait for each PR to land' : 'no'
      }`,
    );
    L.push('');
    L.push(w.notes);
    L.push('');
    L.push('| # | File | Target | In | Out | Errors | Ripple | Status |');
    L.push('|---|---|---|---|---|---|---|---|');
    for (const f of list) {
      const flag =
        (f.isHub ? ' 🔒' : f.isHighFanIn ? ' ⚠️' : '') +
        (f.configReferences.length ? ' 📌' : '');
      const ripple =
        f.tscErrorsRepoWide === null
          ? '—'
          : f.tscErrorsRepoWide - f.tscErrors;
      L.push(
        `| ${f.order} | \`${f.path}\`${flag} | \`${f.target}\` | ${
          f.dependents
        } | ${f.dependencies} | ${
          f.tscErrors === null ? '—' : f.tscErrors
        } | ${ripple} | todo |`,
      );
    }
    L.push('');
  }

  const quickWins = files.filter(
    (f) => f.tscErrors === 0 && f.tscErrorsRepoWide === 0,
  );
  if (quickWins.length) {
    L.push('## Quick wins — rename-only conversions');
    L.push('');
    L.push(
      `${quickWins.length} files produce zero \`tsc\` errors anywhere when renamed, so the PR is the`,
    );
    L.push(
      'rename plus whatever `yarn lint` asks for. Good first PRs for a session picking up a workstream.',
    );
    L.push('');
    L.push('| File | Target | In | Workstream |');
    L.push('|---|---|---|---|');
    for (const f of quickWins.sort((a, b) => b.dependents - a.dependents)) {
      L.push(
        `| \`${f.path}\` | \`${f.target}\` | ${f.dependents} | ${f.workstream} |`,
      );
    }
    L.push('');
  }

  L.push('## Config-referenced files');
  L.push('');
  L.push(
    'These paths are hard-coded outside `app/`. Renaming the file without updating the reference',
  );
  L.push(
    'silently breaks Jest, ESLint or the app entry point, so the same PR must update both.',
  );
  L.push('');
  L.push('| File | Referenced from | Workstream |');
  L.push('|---|---|---|');
  for (const f of files.filter((x) => x.configReferences.length)) {
    L.push(
      `| \`${f.path}\` | ${f.configReferences
        .map((r) => `\`${r}\``)
        .join(', ')} | ${f.workstream} |`,
    );
  }
  L.push('');

  L.push('## Hub files (convert first, one PR each)');
  L.push('');
  L.push('| File | Dependents | Errors | Ripple | Workstream |');
  L.push('|---|---|---|---|---|');
  for (const f of files
    .filter((x) => x.isHub)
    .sort((a, b) => b.dependents - a.dependents)) {
    L.push(
      `| \`${f.path}\` | ${f.dependents} | ${
        f.tscErrors === null ? '—' : f.tscErrors
      } | ${
        f.tscErrorsRepoWide === null ? '—' : f.tscErrorsRepoWide - f.tscErrors
      } | ${f.workstream} |`,
    );
  }
  L.push('');
  return `${L.join('\n')}\n`;
}

main();
