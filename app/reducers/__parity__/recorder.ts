// Test-only tooling: reads and writes transcript fixtures from Jest.
// eslint-disable-next-line import/no-nodejs-modules
import fs from 'fs';
// eslint-disable-next-line import/no-nodejs-modules
import path from 'path';
import type { AnyAction, Reducer } from 'redux';
import rootReducer from '..';
import initialRootState from '../../util/test/initial-root-state';
import { FIXED_NOW, INIT_ACTION } from './builders';
import { buildFlowScenarios } from './flows';
import { REDUCERS } from './reducers';
import { buildReducerScenarios } from './scenarios';
import { decode, encode, type Encoded } from './serialize';
import type {
  FlowScenario,
  FlowTranscript,
  RecordedStep,
  ReducerScenario,
  ReducerTranscript,
  ScenarioStep,
} from './types';

export const TRANSCRIPTS_DIR = path.join(__dirname, 'transcripts');
const RECORDED_AT = '2026-10-23 @ 687645507a988caba704751354554147e419f21d';

const clone = <T>(value: T): T => decode(encode(value)) as T;

function withFixedNow<T>(fn: () => T): T {
  const realNow = Date.now;
  Date.now = () => FIXED_NOW;
  try {
    return fn();
  } finally {
    Date.now = realNow;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyReducer = Reducer<any, AnyAction>;

function runSteps(
  reducer: AnyReducer,
  seed: unknown,
  steps: ScenarioStep[],
  project: (state: unknown) => unknown = (state) => state,
): RecordedStep[] {
  let state = seed;
  return steps.map((scenarioStep) => {
    const action = clone(scenarioStep.action);
    const actionBefore = encode(action);
    const next = withFixedNow(() => reducer(state, action));
    const actionAfter = encode(action);
    const recorded: RecordedStep = {
      label: scenarioStep.label,
      creator: scenarioStep.creator,
      args: encode(scenarioStep.args),
      action: actionBefore,
      state: encode(project(next)),
      sameRef: next === state,
    };
    if (JSON.stringify(actionAfter) !== JSON.stringify(actionBefore)) {
      recorded.actionAfter = actionAfter;
    }
    state = next;
    return recorded;
  });
}

export function replayReducerScenario(
  scenario: ReducerScenario,
): ReducerTranscript {
  const reducer = REDUCERS[scenario.reducerKey];
  if (!reducer) {
    throw new Error(`No reducer registered for ${scenario.reducerKey}`);
  }
  return {
    kind: 'reducer',
    reducerKey: scenario.reducerKey,
    source: scenario.source,
    recordedAt: RECORDED_AT,
    segments: scenario.segments.map((segment) => ({
      label: segment.label,
      seed: encode(segment.seed),
      steps: runSteps(reducer, clone(segment.seed), segment.steps),
    })),
  };
}

/** Everything except the Engine background state (owned by controllers, not reducers). */
export function nonEngineState(state: unknown): Record<string, unknown> {
  const { engine: _engine, ...rest } = state as Record<string, unknown>;
  return rest;
}

/** Fixed root seed: the shared test fixture with every undefined slice initialised. */
export function buildRootSeed(): Record<string, unknown> {
  return withFixedNow(() =>
    (rootReducer as AnyReducer)({ ...initialRootState }, INIT_ACTION),
  );
}

export function replayFlowScenario(flow: FlowScenario): FlowTranscript {
  const seed = buildRootSeed();
  return {
    kind: 'flow',
    name: flow.name,
    description: flow.description,
    recordedAt: RECORDED_AT,
    seed: encode(nonEngineState(seed)),
    steps: runSteps(
      rootReducer as AnyReducer,
      seed,
      flow.steps,
      nonEngineState,
    ),
  };
}

export const reducerTranscriptFile = (key: string) => `reducer.${key}.json`;
export const flowTranscriptFile = (name: string) => `flow.${name}.json`;

export function readTranscript<T>(file: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf8'),
  ) as T;
}

function writeTranscript(file: string, transcript: Encoded | object) {
  fs.writeFileSync(
    path.join(TRANSCRIPTS_DIR, file),
    `${JSON.stringify(transcript, null, 2)}\n`,
  );
}

/** Records every transcript from the code currently on disk (run on LEGACY code only). */
export function recordAllTranscripts(): string[] {
  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
  const written: string[] = [];
  for (const scenario of buildReducerScenarios()) {
    const file = reducerTranscriptFile(scenario.reducerKey);
    writeTranscript(file, replayReducerScenario(scenario));
    written.push(file);
  }
  for (const flow of buildFlowScenarios()) {
    const file = flowTranscriptFile(flow.name);
    writeTranscript(file, replayFlowScenario(flow));
    written.push(file);
  }
  return written;
}
