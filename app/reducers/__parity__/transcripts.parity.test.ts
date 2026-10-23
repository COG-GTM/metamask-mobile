// Test-only tooling: reads and writes transcript fixtures from Jest.
// eslint-disable-next-line import/no-nodejs-modules
import fs from 'fs';
import { buildFlowScenarios } from './flows';
import {
  TRANSCRIPTS_DIR,
  flowTranscriptFile,
  readTranscript,
  recordAllTranscripts,
  reducerTranscriptFile,
  replayFlowScenario,
  replayReducerScenario,
} from './recorder';
import { buildReducerScenarios } from './scenarios';
import { UNDEFINED_SENTINEL, decode, encode } from './serialize';
import type { FlowTranscript, ReducerTranscript } from './types';

const reducerScenarios = buildReducerScenarios();
const flowScenarios = buildFlowScenarios();

describe('reducer parity transcripts', () => {
  if (process.env.RECORD_TRANSCRIPTS === '1') {
    beforeAll(() => {
      recordAllTranscripts();
    });
  }

  it('serialises undefined values and errors losslessly', () => {
    const value = {
      a: undefined,
      b: [undefined, null, 1],
      c: { d: 'x', e: undefined },
      err: new Error('boom'),
    };
    const encoded = encode(value);
    expect(JSON.parse(JSON.stringify(encoded))).toStrictEqual(encoded);
    expect((encoded as Record<string, unknown>).a).toBe(UNDEFINED_SENTINEL);
    expect(decode(JSON.parse(JSON.stringify(encoded)))).toStrictEqual(value);
  });

  it('has exactly one transcript file per scenario', () => {
    const expected = [
      ...reducerScenarios.map((s) => reducerTranscriptFile(s.reducerKey)),
      ...flowScenarios.map((f) => flowTranscriptFile(f.name)),
    ].sort();
    const actual = fs
      .readdirSync(TRANSCRIPTS_DIR)
      .filter((file) => file.endsWith('.json'))
      .sort();
    expect(actual).toStrictEqual(expected);
  });

  describe.each(reducerScenarios.map((s) => [s.reducerKey, s] as const))(
    'reducer %s',
    (key, scenario) => {
      it('replays the legacy transcript identically', () => {
        const recorded = readTranscript<ReducerTranscript>(
          reducerTranscriptFile(key),
        );
        const replayed = replayReducerScenario(scenario);
        expect(replayed.reducerKey).toBe(recorded.reducerKey);
        expect(replayed.segments).toStrictEqual(recorded.segments);
      });
    },
  );

  describe.each(flowScenarios.map((f) => [f.name, f] as const))(
    'user flow %s',
    (name, flow) => {
      it('replays the legacy transcript through the root reducer identically', () => {
        const recorded = readTranscript<FlowTranscript>(
          flowTranscriptFile(name),
        );
        const replayed = replayFlowScenario(flow);
        expect(replayed.seed).toStrictEqual(recorded.seed);
        expect(replayed.steps).toStrictEqual(recorded.steps);
      });
    },
  );
});
