import { ITrackingEvent } from '../../core/Analytics/MetaMetrics.types';

export enum ActionType {
  SAVE_EVENT = 'SAVE_EVENT',
  CLEAR_EVENTS = 'CLEAR_EVENTS',
  SET_COMPLETED_ONBOARDING = 'SET_COMPLETED_ONBOARDING',
}

export const SAVE_EVENT = ActionType.SAVE_EVENT;
export const CLEAR_EVENTS = ActionType.CLEAR_EVENTS;
export const SET_COMPLETED_ONBOARDING = ActionType.SET_COMPLETED_ONBOARDING;

export interface SaveEventAction {
  type: typeof SAVE_EVENT;
  event: [ITrackingEvent];
}

export interface ClearEventsAction {
  type: typeof CLEAR_EVENTS;
}

export interface SetCompletedOnboardingAction {
  type: typeof SET_COMPLETED_ONBOARDING;
  completedOnboarding: boolean;
}

export type Action =
  | SaveEventAction
  | ClearEventsAction
  | SetCompletedOnboardingAction;

export type OnboardingActionTypes = Action;

export function saveOnboardingEvent(
  eventArgs: [ITrackingEvent],
): SaveEventAction {
  return {
    type: SAVE_EVENT,
    event: eventArgs,
  };
}

export function clearOnboardingEvents(): ClearEventsAction {
  return {
    type: CLEAR_EVENTS,
  };
}

export function setCompletedOnboarding(
  completedOnboarding: boolean,
): SetCompletedOnboardingAction {
  return {
    type: SET_COMPLETED_ONBOARDING,
    completedOnboarding,
  };
}
