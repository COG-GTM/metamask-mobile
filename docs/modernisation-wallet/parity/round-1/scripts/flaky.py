import json, os, collections
res = {}
for side in ['legacy', 'migrated']:
    root = os.path.expanduser(f'~/parity/{side}') + '/'
    out = os.path.expanduser(f'~/parity/out/{side}')
    runs = []
    for r in (1, 2, 3):
        d = json.load(open(f'{out}/rerun{r}.json'))
        c = collections.defaultdict(list)
        for tr in d['testResults']:
            p = tr['name'].replace(root, '')
            ar = tr.get('assertionResults', [])
            for a in ar: c[(p, a['fullName'])].append(a['status'])
            if tr['status'] == 'failed' and (tr.get('testExecError') or not ar or (tr.get('message') and not any(a['status']=='failed' for a in ar))):
                c[(p, '<test suite failed to run>')].append('failed')
        snap = open(os.path.expanduser(f'~/parity/logs/rerun-{side}-snapui-{r}.log')).read()
        c[('app/components/Snaps/SnapUIAddressInput/SnapUIAddressInput.test.tsx', '<test suite failed to run>')].append('failed' if 'exit snapui 0' not in snap else 'passed')
        runs.append(c)
    fails = collections.Counter()
    for i, l in enumerate(open(f'{out}/tests.tsv')):
        if i == 0: continue
        f, n, st = l.rstrip('\n').split('\t')
        if st == 'failed': fails[(f, n)] += 1
    cls = {}
    for k, cnt in fails.items():
        sts = [sorted(run.get(k, ['missing'])) for run in runs]
        flat = [s for ss in sts for s in ss]
        if all(ss.count('failed') == cnt for ss in sts): cls[k] = ('deterministic-fail', sts)
        elif any(ss.count('failed') < cnt for ss in sts): cls[k] = ('FLAKY', sts)
        else: cls[k] = ('fail-or-missing', sts)
    res[side] = cls
    print(side, collections.Counter(v[0] for v in cls.values()))
    for k, v in cls.items():
        if v[0] != 'deterministic-fail': print('  ', k, v)
json.dump({s: {f'{k[0]}\t{k[1]}': v for k, v in c.items()} for s, c in res.items()}, open(os.path.expanduser('~/parity/out/flaky.json'), 'w'), indent=1)
