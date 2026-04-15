import React from 'react';
import useApprovalRequest from '../../Views/confirmations/hooks/useApprovalRequest';
import { shallow } from 'enzyme';
import { ApprovalTypes } from '../../../core/RPCMethods/RPCMethodMiddleware';




import FlowLoaderModal from './FlowLoaderModal';
import useApprovalFlow from '../../Views/confirmations/hooks/useApprovalFlow';

jest.mock('../../Views/confirmations/hooks/useApprovalRequest');
jest.mock('../../Views/confirmations/hooks/useApprovalFlow');

const APPROVAL_FLOW_MOCK = {
  id: 'testId1',
  loadingText: 'testLoadingText'
};

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockApprovalRequest = (approvalRequest) => {

  useApprovalRequest.
  mockReturnValue({
    approvalRequest
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
};

const mockApprovalFlow = (approvalFlow) => {
  useApprovalFlow.mockReturnValue({
    approvalFlow
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
};

describe('FlowLoaderModal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders', () => {
    mockApprovalFlow(APPROVAL_FLOW_MOCK);
    mockApprovalRequest(undefined);

    const wrapper = shallow(<FlowLoaderModal />);

    expect(wrapper).toMatchSnapshot();
  });

  it('returns null if no approval flow', () => {
    mockApprovalFlow(undefined);
    mockApprovalRequest(undefined);

    const wrapper = shallow(<FlowLoaderModal />);
    expect(wrapper).toMatchSnapshot();
  });

  it('returns null if approval request', () => {
    mockApprovalFlow(APPROVAL_FLOW_MOCK);
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockApprovalRequest({ type: ApprovalTypes.CONNECT_ACCOUNTS });

    const wrapper = shallow(<FlowLoaderModal />);
    expect(wrapper).toMatchSnapshot();
  });
});