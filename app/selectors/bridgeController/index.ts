import { RootState } from '../../reducers';
export const selectBridgeControllerState = (state: RootState) =>
    state.engine.backgroundState.BridgeController;
