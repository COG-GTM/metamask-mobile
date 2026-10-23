import json, os, glob, re, collections
def causes(side):
    root = os.path.expanduser(f'~/parity/{side}') + '/'
    out = os.path.expanduser(f'~/parity/out/{side}')
    res = {}
    for f in sorted(glob.glob(f'{out}/shard*.json')):
        for tr in json.load(open(f))['testResults']:
            if tr['status'] != 'failed': continue
            p = tr['name'].replace(root, '')
            msg = tr.get('message') or ''
            ar = tr.get('assertionResults', [])
            runtime = not any(a['status'] == 'failed' for a in ar)
            txt = re.sub(r'\x1b\[[0-9;]*m', '', msg)
            if 'allowFontScaling' in txt: c = "react-native mock: Cannot read properties of undefined (reading 'allowFontScaling')"
            elif 'removeListener is not a function' in txt: c = 'DeviceEventEmitter.removeListener is not a function'
            elif 'ppom.html' in txt: c = "Cannot find module './ppom.html.js' (generated file, needs yarn setup)"
            elif "reading 'source'" in txt: c = "Cannot read properties of undefined (reading 'source')"
            elif "reading 'style'" in txt: c = "Cannot read properties of undefined (reading 'style')"
            elif 'Invalid array length' in txt: c = 'RangeError: Invalid array length'
            else:
                first = next((l.strip() for l in txt.splitlines() if l.strip() and not l.strip().startswith('●')), '')[:160]
                c = 'other: ' + first
            res[p] = (('runtime' if runtime else 'assertion'), c)
    res['app/components/Snaps/SnapUIAddressInput/SnapUIAddressInput.test.tsx'] = ('runtime', 'V8 Fatal "invalid size error" (exit 133) crashes the Jest worker')
    return res
L = causes('legacy'); M = causes('migrated')
print('same suites', set(L) == set(M), 'same causes', all(L[k] == M.get(k) for k in L))
cnt = collections.Counter(v[1] for v in L.values())
for k, v in cnt.most_common(): print(v, k)
json.dump({'legacy': L, 'migrated': M}, open(os.path.expanduser('~/parity/out/failure-causes.json'), 'w'), indent=1)
