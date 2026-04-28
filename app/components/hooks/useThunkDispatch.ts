import { ThunkAction as ReduxThunkAction, ThunkDispatch } from 'redux-thunk';
import { useDispatch } from 'react-redux';
import { RootState } from '../../reducers';
import { RootAction } from '../../store/actionTypes';

export type ThunkAction = ReduxThunkAction<void, RootState, unknown, RootAction>;

function useThunkDispatch() {
  return useDispatch<ThunkDispatch<RootState, unknown, RootAction>>();
}

export default useThunkDispatch;
