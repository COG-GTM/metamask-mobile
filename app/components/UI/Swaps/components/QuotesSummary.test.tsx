import React from 'react';
import { Text } from 'react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import QuotesSummaryUntyped from './QuotesSummary';

const QuotesSummary = QuotesSummaryUntyped as any;

describe('QuotesSummary', () => {
  it('matches the snapshot', () => {
    const { toJSON } = renderWithProvider(
      <QuotesSummary testID="quotes-summary">
        <QuotesSummary.Header>
          <QuotesSummary.HeaderText>Header</QuotesSummary.HeaderText>
        </QuotesSummary.Header>
        <QuotesSummary.Body>
          <Text>Body</Text>
          <QuotesSummary.Separator />
        </QuotesSummary.Body>
      </QuotesSummary>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders header content', () => {
    const { getByText } = renderWithProvider(
      <QuotesSummary>
        <QuotesSummary.Header>
          <QuotesSummary.HeaderText>My Title</QuotesSummary.HeaderText>
        </QuotesSummary.Header>
      </QuotesSummary>,
    );
    expect(getByText('My Title')).toBeTruthy();
  });

  it('renders body content', () => {
    const { getByText } = renderWithProvider(
      <QuotesSummary>
        <QuotesSummary.Body>
          <Text>Body content</Text>
        </QuotesSummary.Body>
      </QuotesSummary>,
    );
    expect(getByText('Body content')).toBeTruthy();
  });

  it('renders the piggy bank when savings prop is true', () => {
    const { toJSON } = renderWithProvider(
      <QuotesSummary>
        <QuotesSummary.Header savings>
          <QuotesSummary.HeaderText>Savings</QuotesSummary.HeaderText>
        </QuotesSummary.Header>
      </QuotesSummary>,
    );
    expect(toJSON()).toBeTruthy();
  });
});
