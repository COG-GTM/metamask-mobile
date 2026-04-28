import { Store } from 'redux';
import { RootState } from '../../reducers';
import { RootAction } from '../../store/actionTypes';

/**
 * Redux store type
 */
export type ReduxStore = Store<RootState, RootAction>;
