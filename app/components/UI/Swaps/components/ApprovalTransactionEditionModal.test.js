/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('react-native-modal', () => {
  const RN = jest.requireActual('react-native');
  const MockModal = ({ isVisible, children }) =>
    isVisible ? <RN.View testID="modal">{children}</RN.View> : null;
  return { __esModule: true, default: MockModal };
});

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const RN = jest.requireActual('react-native');
  return {
    KeyboardAwareScrollView: ({ children }) => <RN.View>{children}</RN.View>,
  };
});

jest.mock(
  '../../../Views/confirmations/legacy/components/ApproveTransactionReview/EditPermission',
  () => {
    const RN = jest.requireActual('react-native');
    const EditPermission = (props) => (
      <RN.View testID="edit-permission">
        <RN.Text>{props.tokenSymbol}</RN.Text>
      </RN.View>
    );
    return { __esModule: true, default: EditPermission };
  },
);

jest.mock('../../../../util/transactions', () => ({
  decodeApproveData: jest.fn(() => ({ encodedAmount: '0x0' })),
  generateTxWithNewTokenAllowance: jest.fn(() => ({
    to: '0xspender',
    data: '0xdata',
  })),
}));

jest.mock('../../../../util/number', () => ({
  fromTokenMinimalUnitString: jest.fn(() => '0'),
  hexToBN: jest.fn(() => ({ toString: () => '0' })),
}));

jest.mock('@metamask/swaps-controller', () => {
  const actual = jest.requireActual('@metamask/swaps-controller');
  return {
    ...actual,
    swapsUtils: {
      ...actual.swapsUtils,
      getSwapsContractAddress: jest.fn(() => '0xcontract'),
    },
  };
});

jest.mock('../../../../reducers/swaps', () => ({
  selectSwapsApprovalTransaction: jest.fn(() => ({
    data: '0xoriginal',
    to: '0xto',
  })),
}));

import ApprovalTransactionEditionModal from './ApprovalTransactionEditionModal';

const mockStore = configureMockStore();
const store = mockStore({});

const wrapWithProvider = (ui) => <Provider store={store}>{ui}</Provider>;

const defaultProps = {
  approvalTransaction: { data: '0xabc', to: '0xto' },
  editQuoteTransactionsVisible: true,
  minimumSpendLimit: '0',
  onCancelEditQuoteTransactions: jest.fn(),
  setApprovalTransaction: jest.fn(),
  sourceToken: { symbol: 'TKN', decimals: 6 },
  chainId: '0x1',
};

describe('ApprovalTransactionEditionModal', () => {
  it('matches the snapshot when visible', () => {
    const { toJSON } = render(
      wrapWithProvider(<ApprovalTransactionEditionModal {...defaultProps} />),
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the modal when visible', () => {
    const { getByTestId } = render(
      wrapWithProvider(<ApprovalTransactionEditionModal {...defaultProps} />),
    );
    expect(getByTestId('modal')).toBeTruthy();
  });

  it('does not render the modal body when not visible', () => {
    const { queryByTestId } = render(
      wrapWithProvider(
        <ApprovalTransactionEditionModal
          {...defaultProps}
          editQuoteTransactionsVisible={false}
        />,
      ),
    );
    expect(queryByTestId('modal')).toBeNull();
  });
});
