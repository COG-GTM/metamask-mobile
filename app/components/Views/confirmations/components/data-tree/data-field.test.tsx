import React from 'react';

import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import DataField from './data-field';
import { PrimaryTypeOrder, PrimaryTypePermit } from '../../constants/signatures';
import { NONE_DATE_VALUE } from '../../utils/date';

const CHAIN_ID = '0x1';
const state = { engine: { backgroundState } };

describe('DataField', () => {
  it('renders an address when the value is a valid hex address', () => {
    const { getByText, toJSON } = renderWithProvider(
      <DataField
        chainId={CHAIN_ID}
        depth={0}
        label="wallet"
        type="address"
        value="0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
      />,
      { state },
    );
    expect(getByText('Wallet')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a simple text value for non-special fields', () => {
    const { getByText } = renderWithProvider(
      <DataField
        chainId={CHAIN_ID}
        depth={0}
        label="contents"
        type="string"
        value="Hi, Bob!"
      />,
      { state },
    );
    expect(getByText('Contents')).toBeDefined();
    expect(getByText('Hi, Bob!')).toBeDefined();
  });

  it('renders "None" for a date field whose value is the NONE sentinel', () => {
    const { getByText } = renderWithProvider(
      <DataField
        chainId={CHAIN_ID}
        depth={0}
        label="startTime"
        primaryType={PrimaryTypeOrder.Order}
        type="uint256"
        value={NONE_DATE_VALUE.toString()}
      />,
      { state },
    );
    expect(getByText('Start Time')).toBeDefined();
    expect(getByText('None')).toBeDefined();
  });

  it('renders a formatted date for a date field with a unix timestamp', () => {
    // 1647359825 → March 15, 2022 15:57 UTC
    const { getByText } = renderWithProvider(
      <DataField
        chainId={CHAIN_ID}
        depth={0}
        label="endTime"
        primaryType={PrimaryTypeOrder.Order}
        type="uint256"
        value="1647359825"
      />,
      { state },
    );
    expect(getByText('End Time')).toBeDefined();
    expect(getByText('15 March 2022, 15:57')).toBeDefined();
  });

  it('renders a decimals-aware token value for token fields', () => {
    const { getByText } = renderWithProvider(
      <DataField
        chainId={CHAIN_ID}
        depth={0}
        label="value"
        primaryType={PrimaryTypePermit.Permit}
        type="uint256"
        value="10000"
        tokenDecimals={2}
      />,
      { state },
    );
    expect(getByText('Value')).toBeDefined();
    expect(getByText('100')).toBeDefined();
  });

  it('renders boolean values as "true" / "false"', () => {
    const { getByText: getTrue } = renderWithProvider(
      <DataField
        chainId={CHAIN_ID}
        depth={0}
        label="approved"
        type="bool"
        value="1"
      />,
      { state },
    );
    expect(getTrue('true')).toBeDefined();

    const { getByText: getFalse } = renderWithProvider(
      <DataField
        chainId={CHAIN_ID}
        depth={0}
        label="approved"
        type="bool"
        value=""
      />,
      { state },
    );
    expect(getFalse('false')).toBeDefined();
  });
});
