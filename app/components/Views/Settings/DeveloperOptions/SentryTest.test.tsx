import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import SentryTest from './SentryTest';
import { strings } from '../../../../../locales/i18n';
import { trace } from '../../../../util/trace';

jest.mock('../../../../util/trace', () => ({
  trace: jest.fn(
    async (_opts: unknown, fn?: (ctx: unknown) => Promise<void>) => {
      if (typeof fn === 'function') {
        await fn({});
      }
    },
  ),
  TraceName: {
    DeveloperTest: 'DeveloperTest',
    NestedTest1: 'NestedTest1',
    NestedTest2: 'NestedTest2',
  },
}));

jest.mock('../../../../util/testUtils', () => ({
  sleep: jest.fn(() => Promise.resolve()),
}));

const initialState = { engine: { backgroundState } };

describe('SentryTest', () => {
  beforeEach(() => {
    (trace as jest.Mock).mockClear();
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<SentryTest />, {
      state: initialState,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the Sentry heading and generate trace button', () => {
    const { getByText } = renderWithProvider(<SentryTest />, {
      state: initialState,
    });
    expect(getByText('Sentry')).toBeTruthy();
    expect(
      getByText(
        strings('app_settings.developer_options.generate_trace_test'),
      ),
    ).toBeTruthy();
  });

  it('invokes trace when the generate trace button is pressed', async () => {
    const { getByText } = renderWithProvider(<SentryTest />, {
      state: initialState,
    });

    fireEvent.press(
      getByText(
        strings('app_settings.developer_options.generate_trace_test'),
      ),
    );

    await waitFor(() => {
      expect(trace).toHaveBeenCalled();
    });
  });
});
