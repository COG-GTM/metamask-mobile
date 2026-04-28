import { ThunkAction as ReduxThunkAction, ThunkDispatch } from 'redux-thunk';
import { useDispatch } from 'react-redux';
import { RootAction, RootState } from '../../reducers';

export type ThunkAction = ReduxThunkAction<void, RootState, unknown, RootAction>;

function useThunkDispatch() {
  return useDispatch<ThunkDispatch<RootState, unknown, RootAction>>();
}

export default useThunkDispatch;
