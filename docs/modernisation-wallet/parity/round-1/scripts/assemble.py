import json, os, shutil, hashlib, collections, gzip, re, subprocess
P=os.path.expanduser('~/parity'); O=P+'/out'; L=P+'/logs'
DEST=os.path.join(P,'migrated','docs/modernisation-wallet/parity/round-1')
LEG='86884c59947115d264b49475870f47dc58df7404'
MIG=subprocess.check_output(['git','-C',P+'/migrated','rev-parse','HEAD'],text=True).strip()
os.makedirs(DEST+'/logs',exist_ok=True)
def rows(side):
    r=[l.rstrip('\n').split('\t') for l in open(f'{O}/{side}/tests.tsv')][1:]
    return r
lr,mr=rows('legacy'),rows('migrated')
shutil.copy(f'{O}/legacy/tests.tsv',DEST+'/tests-legacy.tsv')
shutil.copy(f'{O}/migrated/tests.tsv',DEST+'/tests-migrated.tsv')
# multiset per (file,name)
def ms(r):
    d=collections.defaultdict(list)
    for f,n,s in r: d[(f,n)].append(s)
    return {k:sorted(v) for k,v in d.items()}
lm,mm=ms(lr),ms(mr)
flaky=json.load(open(O+'/flaky.json'))
causes=json.load(open(O+'/failure-causes.json'))
diffs=[]; out=['file\tfull_name\tlegacy_status\tmigrated_status\tdiffers\tlegacy_3x_rerun\tmigrated_3x_rerun\tclassification\tcause']
for k in sorted(set(lm)|set(mm)):
    a,b=lm.get(k,['absent']),mm.get(k,['absent'])
    if a==b and all(s=='passed' for s in a): continue
    key='\t'.join(k)
    fl=flaky['legacy'].get(key,['n/a'])[0]; fm=flaky['migrated'].get(key,['n/a'])[0]
    if a!=b:
        cls='REGRESSION' if all(s=='passed' for s in a) else 'UNCLASSIFIED'
        diffs.append(k)
    else:
        cls='PRE-EXISTING' if fl=='deterministic-fail' and fm=='deterministic-fail' else ('FLAKY' if 'flaky' in (fl+fm) else 'PRE-EXISTING')
    c=causes['legacy'].get(k[0],['',''])
    out.append('\t'.join([k[0],k[1],','.join(a),','.join(b),'yes' if a!=b else 'no',fl,fm,cls,f'{c[0]}: {c[1]}'.replace('\t',' ')]))
open(DEST+'/test-diff.tsv','w').write('\n'.join(out)+'\n')
# transcripts
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
TL=f'{O}/legacy/recorded'; TM=f'{O}/migrated/recorded'; TC=P+'/legacy/app/reducers/__parity__/transcripts'
names=sorted(set(os.listdir(TL))|set(os.listdir(TM))|set(os.listdir(TC)))
tx=['Transcript re-record diff (RECORD_TRANSCRIPTS=1 on both sides, identical seed, FIXED_NOW, same Node 20 / shared node_modules)',
    f'legacy={LEG} migrated={MIG}','','name\tsha256(committed fixture)\tsha256(legacy re-record)\tsha256(migrated re-record)\tresult']
tdiffs=[]; ident=0
for n in names:
    c,l,m=[sha(d+'/'+n) if os.path.exists(d+'/'+n) else 'MISSING' for d in (TC,TL,TM)]
    ok=(c==l==m); ident+=ok
    if not ok: tdiffs.append(n)
    tx.append(f'{n}\t{c}\t{l}\t{m}\t{"IDENTICAL" if ok else "DIFF"}')
rr=sorted(os.listdir(f'{O}/legacy/real-rehydrate'))
rr_ok=all(sha(f'{O}/legacy/real-rehydrate/{n}')==sha(f'{O}/migrated/real-rehydrate/{n}') for n in rr)
tx+=['',f'Committed-fixture replay suite (transcripts.parity.test.ts): legacy {json.load(open(O+"/legacy/replay.json"))["numPassedTests"]}/{json.load(open(O+"/legacy/replay.json"))["numTotalTests"]} passed, migrated {json.load(open(O+"/migrated/replay.json"))["numPassedTests"]}/{json.load(open(O+"/migrated/replay.json"))["numTotalTests"]} passed',
     f'Supplemental replay with the REAL redux-persist REHYDRATE constant (testSetup.js mocks redux-persist): {len(rr)} files, {"IDENTICAL" if rr_ok else "DIFF"} legacy vs migrated',
     f'diff -r legacy-recorded migrated-recorded: {"no differences" if not tdiffs else tdiffs}',
     f'TOTAL {len(names)} transcripts, {ident} identical on both sides and equal to the committed legacy fixtures']
open(DEST+'/transcript-diff.txt','w').write('\n'.join(tx)+'\n')
# persisted state
PL=f'{O}/legacy/persist'; PM=f'{O}/migrated/persist'
pn=sorted(set(os.listdir(PL))|set(os.listdir(PM)))
ps=['Persisted state diff: real app/store/persistConfig.ts (key/version/blacklist/transforms, actual redux-persist createPersistoid) over the final root state of each user-flow transcript','',
    'file\tsha256(legacy)\tsha256(migrated)\tresult']
p_ok=True
for n in pn:
    a=sha(PL+'/'+n) if os.path.exists(PL+'/'+n) else 'MISSING'; b=sha(PM+'/'+n) if os.path.exists(PM+'/'+n) else 'MISSING'
    p_ok&=a==b; ps.append(f'{n}\t{a}\t{b}\t{"IDENTICAL" if a==b else "DIFF"}')
ps+=['',f'persist config: {open(PL+"/_persist-config.json").read().strip()}',f'RESULT: {"IDENTICAL" if p_ok else "DIFF"} ({len(pn)} files)']
open(DEST+'/persisted-state-diff.txt','w').write('\n'.join(ps)+'\n')
os.makedirs(DEST+'/persisted-state',exist_ok=True)
for n in pn:
    if n.startswith('persisted.') or n.startswith('_'): shutil.copy(PL+'/'+n,DEST+'/persisted-state/'+n)
# static
def tsc_count(side): return sum(1 for l in open(f'{L}/tsc-{side}.log') if ' error TS' in l)
def metro(side):
    b=f'{O}/{side}/android.bundle'; log=open(f'{L}/metro-{side}.log',errors='replace').read()
    ok=os.path.exists(b) and re.search(r'^exit 0 ',log,re.M) is not None
    err=[l for l in log.splitlines() if l.startswith('error ')]
    return ok,(os.path.getsize(b) if os.path.exists(b) else 0),(err[0][:400] if err else '')
js={s:json.load(open(f'{O}/{s}/jest-summary.json')) for s in ('legacy','migrated')}
summ={}
for s,sh in (('legacy',LEG),('migrated',MIG)):
    j=js[s]; ok,size,err=metro(s)
    summ[s]=dict(sha=sh,suites=j['suites']['total'],suites_passed=j['suites']['passed'],suites_failed=j['suites']['failed'],
      tests=j['tests']['total'],passed=j['tests']['passed'],failed=j['tests']['failed'],skipped=j['tests']['skipped'],todo=j['tests']['todo'],
      snapshots_total=j['snapshots_total'],snapshots_passed=j['snapshots_passed'],snapshots_failed=j['snapshots_failed'],
      snapshots_written=j['snapshots_written'],snapshots_added=j['snapshots_added'],snapshots_updated=j['snapshots_updated'],
      crashed_suites=j['crashed_suites'],tsc_errors=tsc_count(s),metro_bundle_bytes=size,metro_ok=ok,metro_first_error=err)
json.dump(dict(summ=summ,diffs=[list(d) for d in diffs],tdiffs=tdiffs,ident=ident,total=len(names),p_ok=p_ok,rr_ok=rr_ok,
  causes=collections.Counter(v[1] for v in causes['legacy'].values()).most_common()),open(O+'/assembled.json','w'),indent=1)
print(json.dumps(summ,indent=1)); print('test diffs',len(diffs),'transcripts',ident,'/',len(names),'persist',p_ok,'rr',rr_ok)
