import { renderScreen } from '../../../util/test/renderWithProvider';
import LedgerMessageSignModal from './LedgerMessageSignModal';
import { RPCStageTypes } from '../../../reducers/rpcEvents';
import { RootState } from '../../../reducers';

const initialState = {
  rpcEvents: { signingEvent: RPCStageTypes.IDLE },
} as unknown as RootState;

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
