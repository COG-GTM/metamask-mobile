import React, { Profiler } from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react-native';
import { SnapIcon } from './SnapIcon';

const SNAP_ID = 'npm:@metamask/bip32-example-snap';

const buildInitialState = (svgIcon?: string) => ({
  settings: {},
  counter: 0,
  engine: {
    backgroundState: {
      SubjectMetadataController: {
        subjectMetadata: {
          [SNAP_ID]: {
            extensionId: null,
            iconUrl: null,
            name: 'BIP-32 Example Snap',
            origin: SNAP_ID,
            subjectType: 'snap',
            svgIcon,
            version: '1.0.0',
          },
        },
      },
    },
  },
});

const buildStore = (svgIcon?: string) => {
  const initialState = buildInitialState(svgIcon);
  return createStore(
    (state: typeof initialState | undefined, action: { type: string }) => {
      const current = state ?? initialState;
      return action.type === 'UNRELATED'
        ? { ...current, counter: current.counter + 1 }
        : current;
    },
  );
};

describe('SnapIcon', () => {
  it('renders the snap svg icon', () => {
    const { toJSON } = render(
      <Provider store={buildStore('<svg />')}>
        <SnapIcon snapId={SNAP_ID} />
      </Provider>,
    );

    expect(JSON.stringify(toJSON())).toContain(
      `data:image/svg+xml;utf8,${encodeURIComponent('<svg />')}`,
    );
  });

  it('falls back to the first letter of the snap name', () => {
    const { getByText } = render(
      <Provider store={buildStore()}>
        <SnapIcon snapId={SNAP_ID} />
      </Provider>,
    );

    expect(getByText('B')).toBeDefined();
  });

  it('does not re-render when an unrelated store update is dispatched', () => {
    const store = buildStore('<svg />');
    const onRender = jest.fn();

    render(
      <Provider store={store}>
        <Profiler id="snap-icon" onRender={onRender}>
          <SnapIcon snapId={SNAP_ID} />
        </Profiler>
      </Provider>,
    );
    const rendersAfterMount = onRender.mock.calls.length;

    act(() => {
      store.dispatch({ type: 'UNRELATED' });
      store.dispatch({ type: 'UNRELATED' });
    });

    expect(onRender).toHaveBeenCalledTimes(rendersAfterMount);
  });
});
