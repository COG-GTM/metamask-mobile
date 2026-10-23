# Parity round 1: legacy reducers vs RTK slices

| | Legacy `86884c5` | Migrated `f8b96ff` |
|---|---|---|
| Jest suites (pass / fail) | 1214 (1005 / 209) | 1214 (1005 / 209) |
| Jest tests (pass / fail / skip / todo) | 7237 (7055 / 182 / 0 / 0) | 7237 (7055 / 182 / 0 / 0) |
| Snapshots (total / matched / unmatched / written) | 499 / 499 / 0 / 0 | 499 / 499 / 0 / 0 |
| Per-test diff (file + full name) | | 0 differences, 0 regressions, 0 flaky (336 failing rows on both sides, each failed 3/3 reruns) |
| Transcripts (committed replay / re-record) | 37/37 pass, 35 re-recorded | 37/37 pass, 35 re-recorded, byte-identical to legacy and to the committed fixtures |
| Persisted state (real `persistConfig.ts`) | | identical (13 flows) |
| `tsc --noEmit` error lines | 55 | 55 (3 messages print the newly typed RootState, see D1) |
| ESLint changed files | exit 1 (missing-rule config error x26); exit 0 with that rule off | exit 0 |
| TS app gate | exit 0 | exit 0 |
| Metro android `--dev false` | FAIL (no bundle) | FAIL (no bundle), same baseline `multiformats` blocker |

**Verdict: `parity`.** The criteria were zero regressions, identical totals, every baseline-passing test still passing, all transcripts identical and persisted state identical. All of them were met as observed. Metro fails on both sides (pre-existing, D3), so the production bundle size could not be compared.

## Files
- `summary.json`: totals, differences D1-D4 with classification and root cause, pre-existing failures, ticket PR states.
- `tests-legacy.tsv`, `tests-migrated.tsv`: every test's status (file, full name, status). Suites that fail to run appear as `<test suite failed to run>`.
- `test-diff.tsv`: every row that differs or fails, with the 3x rerun result and the failure cause.
- `flaky-reruns.json`, `failure-causes.json`: raw rerun outcomes and the extracted failure causes.
- `transcript-diff.txt`: sha256 of each transcript for the committed fixture, the legacy re-record and the migrated re-record.
- `persisted-state-diff.txt`, `persisted-state/`: sha256 per flow, plus the legacy persisted output. The migrated output is byte-identical.
- `logs/`: command logs (Jest shard logs and JSON gzipped), `scripts/`: the exact drivers used.

## Commands (both sides, Node v20.20.2, shared symlinked node_modules)
- `scripts/run-jest.sh`: `npx jest ./app/ ./locales/ --ci --coverage=false --json --shard=i/4`. SnapUIAddressInput runs on its own because it crashes V8 on both sides.
- `scripts/run-flaky.sh`: reruns every failing suite 3x.
- `scripts/run-transcripts.sh`: replays the committed transcripts, then `RECORD_TRANSCRIPTS=1` re-records them (copied out, fixtures restored), then dumps persisted state with real redux-persist.
- `scripts/run-real-rehydrate.sh`: replays with the real `REHYDRATE` constant, because testSetup.js mocks redux-persist.
- `scripts/run-static.sh`: `npx tsc --noEmit`, `eslint <changed files>` and the TS app gate.
- `scripts/run-metro.sh`: `npx react-native bundle --platform android --dev false`, run through `scripts/metro.parity.config.js` so Metro follows the symlinked node_modules.

Temporary test files and the legacy `.eslintrc.js` tweak for the D3 cross-check were reverted. No application code was changed.
