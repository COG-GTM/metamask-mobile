import { Store } from 'redux';
import { RootAction, RootState } from '../../reducers';

/**
 * Redux store type
 */
export type ReduxStore = Store<RootState, RootAction>;
