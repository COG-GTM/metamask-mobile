import json, sys, os, glob
side = sys.argv[1]
root = os.path.expanduser(f'~/parity/{side}') + '/'
out = os.path.expanduser(f'~/parity/out/{side}')
files = sorted(glob.glob(f'{out}/shard*.json')) + [f'{out}/snapui.json']
seen = {}
agg = dict(snapshots_total=0, snapshots_passed=0, snapshots_failed=0, snapshots_written=0, snapshots_added=0, snapshots_updated=0, snapshots_unchecked=0, snapshots_filesRemoved=0)
missing = []
for f in files:
    if not os.path.exists(f):
        missing.append(os.path.basename(f)); continue
    d = json.load(open(f))
    s = d['snapshot']
    agg['snapshots_total'] += s['total']; agg['snapshots_passed'] += s['matched']; agg['snapshots_failed'] += s['unmatched']
    agg['snapshots_written'] += s['added'] + s['updated']; agg['snapshots_added'] += s['added']; agg['snapshots_updated'] += s['updated']
    agg['snapshots_unchecked'] += s['unchecked']; agg['snapshots_filesRemoved'] += s['filesRemoved']
    for tr in d['testResults']:
        p = tr['name'].replace(root, '')
        if p in seen: continue  # dedupe suites across shards
        seen[p] = tr
crashed = []
if not os.path.exists(f'{out}/snapui.json'):
    log = open(os.path.expanduser(f'~/parity/logs/jest-{side}-snapui.log')).read()
    if 'exit snapui 133' in log or 'V8_Fatal' in log:
        crashed.append('app/components/Snaps/SnapUIAddressInput/SnapUIAddressInput.test.tsx')
rows = []
suites = dict(total=0, passed=0, failed=0, runtime_error=0)
tests = dict(total=0, passed=0, failed=0, skipped=0, todo=0)
for p in sorted(seen):
    tr = seen[p]
    suites['total'] += 1
    ar = tr.get('assertionResults', [])
    failed_suite = tr['status'] == 'failed'
    if failed_suite: suites['failed'] += 1
    else: suites['passed'] += 1
    for a in ar:
        st = a['status']; tests['total'] += 1
        if st == 'passed': tests['passed'] += 1
        elif st == 'failed': tests['failed'] += 1
        elif st in ('pending', 'skipped', 'disabled'): tests['skipped'] += 1
        elif st == 'todo': tests['todo'] += 1
        rows.append((p, a['fullName'], st))
    if failed_suite and (tr.get('testExecError') or not ar or (tr.get('message') and not any(a['status']=='failed' for a in ar))):
        suites['runtime_error'] += 1
        rows.append((p, '<test suite failed to run>', 'failed'))
for p in crashed:
    suites['total'] += 1; suites['failed'] += 1; suites['runtime_error'] += 1
    rows.append((p, '<test suite failed to run>', 'failed'))
rows.sort(key=lambda r: r[0])
with open(f'{out}/tests.tsv', 'w') as fh:
    fh.write('file\tfull_name\tstatus\n')
    for r in rows: fh.write('\t'.join(x.replace('\t',' ').replace('\n',' ') for x in r) + '\n')
summ = dict(suites=suites, tests=tests, **agg, missing_json=missing, crashed_suites=crashed)
json.dump(summ, open(f'{out}/jest-summary.json', 'w'), indent=2)
print(side, json.dumps(summ))
