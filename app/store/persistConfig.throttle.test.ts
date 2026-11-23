import { getPersistentState } from '@metamask/base-controller';
import FilesystemStorage from 'redux-persist-filesystem-storage';
import createPersistoid from 'redux-persist/lib/createPersistoid';
import { Persistor } from 'redux-persist';
import persistConfig, { flushPersistedState } from './persistConfig';

jest.unmock('redux-persist');
jest.mock('redux-persist-filesystem-storage');
jest.mock('../util/device');
jest.mock('../util/Logger');
jest.mock('./migrations', () => ({ version: 1, migrations: {} }));
jest.mock('@metamask/base-controller', () => ({
  getPersistentState: jest.fn((state: Record<string, unknown>) => state),
}));
jest.mock('../core/Engine', () => ({
  __esModule: true,
  default: {
    context: {
      TokenRatesController: { metadata: {} },
      TokenBalancesController: { metadata: {} },
    },
  },
}));

const engineState = (tick: number) => ({
  backgroundState: {
    TokenRatesController: { tick },
    TokenBalancesController: { tick },
  },
});

const STATE_CHANGES = 10;
const STATE_CHANGE_INTERVAL_MS = 50;

const simulatePollingBurst = (
  persistoid: ReturnType<typeof createPersistoid>,
) => {
  for (let tick = 1; tick <= STATE_CHANGES; tick++) {
    persistoid.update({ engine: engineState(tick) });
    jest.advanceTimersByTime(STATE_CHANGE_INTERVAL_MS);
  }
};

const lastWrittenEngine = () => {
  const calls = (FilesystemStorage.setItem as jest.Mock).mock.calls;
  const [, value] = calls[calls.length - 1];
  return JSON.parse(JSON.parse(value).engine);
};

describe('persistConfig throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (FilesystemStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throttles processing by the storage debounce delay', () => {
    expect(persistConfig.throttle).toBe(200);
  });

  it('transforms engine state once per throttle window instead of once per state change', () => {
    const persistoid = createPersistoid(persistConfig);

    simulatePollingBurst(persistoid);
    jest.advanceTimersByTime(1000);

    // 2 controllers per transform; 500 ms burst / 200 ms window
    const transforms = (getPersistentState as jest.Mock).mock.calls.length / 2;
    expect(transforms).toBeLessThanOrEqual(3);
    expect(transforms).toBeLessThan(STATE_CHANGES);
    expect(lastWrittenEngine()).toEqual(engineState(STATE_CHANGES));
  });

  it('transforms on every state change without throttle', () => {
    const persistoid = createPersistoid({ ...persistConfig, throttle: 0 });

    simulatePollingBurst(persistoid);
    jest.advanceTimersByTime(1000);

    expect((getPersistentState as jest.Mock).mock.calls.length / 2).toBe(
      STATE_CHANGES,
    );
  });

  it('flushPersistedState writes the latest state without waiting for timers', async () => {
    const persistoid = createPersistoid(persistConfig);
    const persistor = {
      flush: async () => persistoid.flush(),
    } as unknown as Persistor;

    persistoid.update({ engine: engineState(42) });
    expect(FilesystemStorage.setItem).not.toHaveBeenCalled();

    await flushPersistedState(persistor);

    expect(FilesystemStorage.setItem).toHaveBeenCalledTimes(1);
    expect(lastWrittenEngine()).toEqual(engineState(42));
  });
});
