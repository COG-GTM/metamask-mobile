import { renderScreen } from '../../../util/test/renderWithProvider';
import LedgerMessageSignModal from './LedgerMessageSignModal';
import { RPCStageTypes, initialState as initialRpcEventsState } from '../../../reducers/rpcEvents';
import { makeRootState } from '../../../util/test/initial-root-state';

const initialState = makeRootState({
  rpcEvents: {
    signingEvent: {
      eventStage: RPCStageTypes.IDLE,
      rpcName: '',
    },
  },
});

describe('LedgerMessageSignModal', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      LedgerMessageSignModal,
      { name: 'LederMessageSignModal' },
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
