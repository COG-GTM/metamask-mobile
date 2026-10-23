// Parity-round tooling (not committed into app code): the shared Jest setup mocks
// redux-persist, so REHYDRATE is undefined in the committed transcripts and the
// reducers' REHYDRATE branches never match 'persist/REHYDRATE'. This replays every
// scenario with the REAL redux-persist module so those branches run too.
/* eslint-disable */
import fs from 'fs';
import path from 'path';
const OUT = process.env.REAL_REHYDRATE_OUT_DIR as string;
it('replays every transcript scenario with real redux-persist REHYDRATE', () => {
  fs.mkdirSync(OUT, { recursive: true });
  let r: any; let sc: any; let fl: any; let REHYDRATE: any;
  jest.isolateModules(() => {
    jest.resetModules();
    jest.doMock('redux-persist', () => jest.requireActual('redux-persist'));
    REHYDRATE = require('redux-persist').REHYDRATE;
    r = require('./recorder'); sc = require('./scenarios'); fl = require('./flows');
  });
  expect(REHYDRATE).toBe('persist/REHYDRATE');
  for (const s of sc.buildReducerScenarios()) {
    fs.writeFileSync(path.join(OUT, r.reducerTranscriptFile(s.reducerKey)), JSON.stringify(r.replayReducerScenario(s), null, 2) + '\n');
  }
  for (const f of fl.buildFlowScenarios()) {
    fs.writeFileSync(path.join(OUT, r.flowTranscriptFile(f.name)), JSON.stringify(r.replayFlowScenario(f), null, 2) + '\n');
  }
});
