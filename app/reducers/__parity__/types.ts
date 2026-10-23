import type { AnyAction } from 'redux';
import type { Encoded } from './serialize';

/** One action dispatched in a transcript, built from a real action creator or a raw literal. */
export interface ScenarioStep {
  label: string;
  /** `actions/<module>.<exportName>` of the creator, or `raw` for a literal action. */
  creator: string;
  args: unknown[];
  action: AnyAction;
}

export interface ScenarioSegment {
  label: string;
  /** Input state; `undefined` exercises the reducer's initial state. */
  seed: unknown;
  steps: ScenarioStep[];
}

export interface ReducerScenario {
  /** Key of the reducer in combineReducers (app/reducers/index.ts). */
  reducerKey: string;
  source: string;
  segments: ScenarioSegment[];
}

export interface FlowScenario {
  name: string;
  description: string;
  steps: ScenarioStep[];
}

export interface RecordedStep {
  label: string;
  creator: string;
  args: Encoded;
  action: Encoded;
  /** Present only when the reducer mutated the dispatched action object. */
  actionAfter?: Encoded;
  state: Encoded;
  /** Whether the reducer returned the exact input reference. */
  sameRef: boolean;
}

export interface ReducerTranscript {
  kind: 'reducer';
  reducerKey: string;
  source: string;
  recordedAt: string;
  segments: { label: string; seed: Encoded; steps: RecordedStep[] }[];
}

export interface FlowTranscript {
  kind: 'flow';
  name: string;
  description: string;
  recordedAt: string;
  /** Non-engine slice of the root seed state. */
  seed: Encoded;
  steps: RecordedStep[];
}
