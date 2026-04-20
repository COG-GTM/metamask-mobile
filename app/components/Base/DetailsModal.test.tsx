// Third party dependencies.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

// Internal dependencies.
import DetailsModal from './DetailsModal';
import { TransactionDetailsModalSelectorsIDs } from '../../../e2e/selectors/Transactions/TransactionDetailsModal.selectors';

describe('DetailsModal', () => {
  it('renders children and compound subcomponents', () => {
    const onClose = jest.fn();
    const { getByTestId, toJSON } = render(
      <DetailsModal>
        <DetailsModal.Header>
          <DetailsModal.Title>Details</DetailsModal.Title>
          <DetailsModal.CloseIcon onPress={onClose} />
        </DetailsModal.Header>
        <DetailsModal.Body>
          <DetailsModal.Section borderBottom>
            <DetailsModal.Column>
              <DetailsModal.SectionTitle>Left</DetailsModal.SectionTitle>
              <RNText>Left value</RNText>
            </DetailsModal.Column>
            <DetailsModal.Column end>
              <DetailsModal.SectionTitle>Right</DetailsModal.SectionTitle>
              <RNText>Right value</RNText>
            </DetailsModal.Column>
          </DetailsModal.Section>
        </DetailsModal.Body>
      </DetailsModal>,
    );

    expect(getByTestId(TransactionDetailsModalSelectorsIDs.TITLE)).toBeTruthy();
    expect(getByTestId(TransactionDetailsModalSelectorsIDs.BODY)).toBeTruthy();

    fireEvent.press(getByTestId(TransactionDetailsModalSelectorsIDs.CLOSE_ICON));
    expect(onClose).toHaveBeenCalledTimes(1);

    expect(toJSON()).toMatchSnapshot();
  });
});
