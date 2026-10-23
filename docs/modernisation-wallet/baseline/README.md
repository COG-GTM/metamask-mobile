# Legacy baseline @ 687645507a988caba704751354554147e419f21d

Node v20.20.2. Run on the Devin VM. The parity suite (`app/reducers/__parity__/transcripts.parity.test.ts`) is counted in the Jest totals.

## Jest (`jest ./app/ ./locales/ --ci --coverage=false --json`)

Ran as 4 parallel `--shard=i/4` processes, plus a separate run of the parity suite on legacy code. Totals add up all 5 JSON outputs ([jest-summary.json](jest-summary.json)).

| | total | passed | failed | skipped/pending |
|---|---|---|---|---|
| Suites | 1214 | 1005 | 209 (154 of them are runtime errors, i.e. the suite failed to run) | 0 |
| Tests | 7237 | 7055 | 182 | 0 (todo 0) |
| Snapshots | 499 | 499 matched | 0 unmatched | 0 written, 0 obsolete files |

Wall time: 251.1 s for the 4 shards in parallel (earliest start to latest end), plus 19.0 s for the parity suite.

- [jest-tests.tsv](jest-tests.tsv): `file<TAB>full test name<TAB>status`, one row for each assertion (7,237 rows). Suites that failed to run get one extra row `<test suite failed to run>` with status `failed` (154 rows). That gives 7,391 data rows: 7,055 passed and 336 failed.
- [jest-failures.txt](jest-failures.txt): each failing suite with its first error. Root causes, as suite counts: `allowFontScaling` undefined in a react-native mock (123), `DeviceEventEmitter.removeListener is not a function` (55), missing generated `./ppom.html.js` (18), `reading 'source'` (10), `reading 'style'` (2), `RangeError: Invalid array length` (1).
- Ticket gate: after migration these totals must be identical. Per-test status must match the TSV.

## TypeScript (`npx tsc --noEmit -p tsconfig.json`)

Exit code 2. There are **55** `error TS` lines, all already present in legacy code; none come from `app/reducers/__parity__`. The full output is in [tsc-output.txt](tsc-output.txt).

## Metro (`npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/legacy.bundle`)

See [metro.md](metro.md). Result: **FAILED** (exit 1). No bundle was produced.
