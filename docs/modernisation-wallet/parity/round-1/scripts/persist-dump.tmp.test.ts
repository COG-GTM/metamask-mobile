// Parity-round tooling (not committed into app code): replays every user-flow
// transcript scenario through the real root reducer, then runs the redux-persist
// config from app/store/persistConfig.ts (real redux-persist, real transforms,
// blacklist) over the final root state and dumps what would be written to storage.
/* eslint-disable */
import fs from 'fs';
import path from 'path';
import rootReducer from '..';
import { buildFlowScenarios } from './flows';
import { buildRootSeed } from './recorder';
import { FIXED_NOW } from './builders';
import { decode, encode } from './serialize';

const OUT = process.env.PERSIST_OUT_DIR as string;
const clone = <T,>(v: T): T => decode(encode(v)) as T;

function withFixedNow<T>(fn: () => T): T {
  const realNow = Date.now;
  Date.now = () => FIXED_NOW;
  try { return fn(); } finally { Date.now = realNow; }
}

function loadRealPersist() {
  let persistConfig: any; let createPersistoid: any;
  jest.isolateModules(() => {
    // the setup-file mock instance lives in the shared mock registry and would win over doMock
    jest.resetModules();
    jest.doMock('redux-persist', () => jest.requireActual('redux-persist'));
    persistConfig = require('../../store/persistConfig').default;
    createPersistoid = jest.requireActual('redux-persist/lib/createPersistoid').default;
  });
  return { persistConfig, createPersistoid };
}

describe('persisted state dump', () => {
  it('dumps persisted + final root state for every flow', async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const { persistConfig, createPersistoid } = loadRealPersist();
    expect(typeof persistConfig.transforms[0].in).toBe('function');
    const meta = {
      key: persistConfig.key, version: persistConfig.version,
      blacklist: persistConfig.blacklist, transforms: persistConfig.transforms.length,
    };
    fs.writeFileSync(path.join(OUT, '_persist-config.json'), JSON.stringify(meta, null, 2) + '\n');
    for (const flow of buildFlowScenarios()) {
      let state: any = buildRootSeed();
      for (const s of flow.steps) {
        const action = clone(s.action) as any;
        state = withFixedNow(() => (rootReducer as any)(state, action));
      }
      const written: Record<string, string> = {};
      const storage = {
        setItem: async (k: string, v: string) => { written[k] = v; },
        getItem: async () => null, removeItem: async () => undefined,
      };
      const persistoid = createPersistoid({ ...persistConfig, storage });
      persistoid.update(state);
      await persistoid.flush();
      const raw = written['persist:root'];
      expect(typeof raw).toBe('string');
      const outer = JSON.parse(raw);
      const decoded: Record<string, unknown> = {};
      for (const k of Object.keys(outer).sort()) decoded[k] = JSON.parse(outer[k]);
      fs.writeFileSync(path.join(OUT, `persisted.${flow.name}.raw.txt`), raw + '\n');
      fs.writeFileSync(path.join(OUT, `persisted.${flow.name}.json`), JSON.stringify(decoded, null, 2) + '\n');
      fs.writeFileSync(path.join(OUT, `final-root.${flow.name}.json`), JSON.stringify(encode(state), null, 2) + '\n');
    }
  });
});
