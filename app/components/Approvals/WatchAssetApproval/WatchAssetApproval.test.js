import React from 'react';
import useApprovalRequest from '../../Views/confirmations/hooks/useApprovalRequest';
import { shallow } from 'enzyme';
import { ApprovalTypes } from '../../../core/RPCMethods/RPCMethodMiddleware';

import WatchAssetApproval from './WatchAssetApproval';

jest.mock('../../Views/confirmations/hooks/useApprovalRequest');

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

describe('WatchAssetApproval', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders', () => {
    mockApprovalRequest({
      type: ApprovalTypes.WATCH_ASSET,
      requestData: {}
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });

    const wrapper = shallow(<WatchAssetApproval />);

    expect(wrapper).toMatchSnapshot();
  });

  it('returns null if no request data', () => {
    mockApprovalRequest({
      type: ApprovalTypes.WATCH_ASSET
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });

    const wrapper = shallow(<WatchAssetApproval />);

    expect(wrapper).toMatchSnapshot();
  });

  it('returns null if no approval request', () => {
    mockApprovalRequest(undefined);

    const wrapper = shallow(<WatchAssetApproval />);
    expect(wrapper).toMatchSnapshot();
  });

  it('sets isVisible to false if incorrect approval request type', () => {
    mockApprovalRequest({
      type: ApprovalTypes.ADD_ETHEREUM_CHAIN,
      requestData: {}
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });

    const wrapper = shallow(<WatchAssetApproval />);
    expect(wrapper).toMatchSnapshot();
  });
});