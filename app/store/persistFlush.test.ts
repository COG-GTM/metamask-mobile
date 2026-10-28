import { AppState, AppStateStatus } from 'react-native';
import { AnyAction, Dispatch } from 'redux';
import { Persistor, PersistConfig } from 'redux-persist';
import createPersistoid from 'redux-persist/lib/createPersistoid';
import { UserActionType } from '../actions/user/types';
import { flushStorageWrite, PERSIST_THROTTLE } from './persistConfig';
import {
  createFlushPersistedState,
  createPersistFlushMiddleware,
  flushPersistedStateOnAppBackground,
} from './persistFlush';

jest.mock('./migrations', () => ({ version: 1, migrations: {} }));
jest.mock('redux-persist-filesystem-storage');
jest.mock('../util/Logger');
jest.mock('./persistConfig', () => ({
  PERSIST_THROTTLE: jest.requireActual('./persistConfig').PERSIST_THROTTLE,
  flushStorageWrite: jest.fn(),
}));

interface TestState {
  engine: { backgroundState: { counter: number } };
}

const createTestPersistoid = (throttle: number) => {
  const transformIn = jest.fn((subState: unknown) => subState);
  const setItem = jest.fn().mockResolvedValue(undefined);
  const persistoid = createPersistoid({
    key: 'root',
    storage: { setItem, getItem: jest.fn(), removeItem: jest.fn() },
    throttle,
    transforms: [{ in: transformIn, out: (s: unknown) => s }],
  } as unknown as PersistConfig<TestState>);
  return { persistoid, transformIn, setItem };
};

const engineState = (counter: number): TestState => ({
  engine: { backgroundState: { counter } },
});

describe('persistFlush', () => {
  describe('redux-persist throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const updateOncePerTick = (
      persistoid: ReturnType<typeof createTestPersistoid>['persistoid'],
      updates: number,
    ) => {
      for (let i = 1; i <= updates; i++) {
        persistoid.update(engineState(i));
        jest.advanceTimersByTime(50);
      }
    };

    it('transforms and serializes on every tick without a throttle', () => {
      const { persistoid, transformIn, setItem } = createTestPersistoid(0);
      updateOncePerTick(persistoid, 20);
      jest.runOnlyPendingTimers();
      expect(transformIn).toHaveBeenCalledTimes(20);
      expect(setItem).toHaveBeenCalledTimes(20);
    });

    it('coalesces a burst of engine updates with PERSIST_THROTTLE and persists the latest state', () => {
      const { persistoid, transformIn, setItem } =
        createTestPersistoid(PERSIST_THROTTLE);
      // 20 updates spread over 1s, one per 50ms tick
      updateOncePerTick(persistoid, 20);
      jest.advanceTimersByTime(PERSIST_THROTTLE * 2);
      expect(transformIn.mock.calls.length).toBeLessThanOrEqual(2);
      const lastWrite = JSON.parse(setItem.mock.calls.at(-1)[1]);
      expect(JSON.parse(lastWrite.engine)).toEqual(engineState(20).engine);
    });

    it('writes all changed keys once per window instead of one key per window', () => {
      const { persistoid, transformIn, setItem } =
        createTestPersistoid(PERSIST_THROTTLE);
      // Rehydration-like update where many top-level keys change at once
      const keys = Array.from({ length: 25 }, (_, i) => `slice${i}`);
      const state = Object.fromEntries(keys.map((k) => [k, { k }]));
      persistoid.update(state as unknown as TestState);

      jest.advanceTimersByTime(PERSIST_THROTTLE);

      expect(transformIn).toHaveBeenCalledTimes(keys.length);
      expect(setItem).toHaveBeenCalledTimes(1);
      expect(Object.keys(JSON.parse(setItem.mock.calls[0][1]))).toEqual(keys);
    });

    it('persists state changed after a write within the next window', () => {
      const { persistoid, setItem } = createTestPersistoid(PERSIST_THROTTLE);
      persistoid.update(engineState(1));
      jest.advanceTimersByTime(PERSIST_THROTTLE);
      expect(setItem).toHaveBeenCalledTimes(1);

      persistoid.update(engineState(2));
      jest.advanceTimersByTime(PERSIST_THROTTLE * 2);

      expect(setItem).toHaveBeenCalledTimes(2);
      expect(JSON.parse(JSON.parse(setItem.mock.calls[1][1]).engine)).toEqual(
        engineState(2).engine,
      );
    });

    it('flush() writes queued state immediately', async () => {
      const { persistoid, setItem } = createTestPersistoid(PERSIST_THROTTLE);
      persistoid.update(engineState(7));
      expect(setItem).not.toHaveBeenCalled();
      await persistoid.flush();
      expect(setItem).toHaveBeenCalledTimes(1);
      expect(JSON.parse(JSON.parse(setItem.mock.calls[0][1]).engine)).toEqual(
        engineState(7).engine,
      );
    });
  });

  describe('createFlushPersistedState', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('flushes the persistor and then the debounced storage write', async () => {
      const calls: string[] = [];
      const persistor = {
        flush: jest.fn(async () => {
          calls.push('persistor');
        }),
      } as unknown as Persistor;
      (flushStorageWrite as jest.Mock).mockImplementation(async () => {
        calls.push('storage');
      });

      await createFlushPersistedState(() => persistor)();

      expect(calls).toEqual(['persistor', 'storage']);
    });

    it('is a no-op before the persistor exists', async () => {
      await createFlushPersistedState(() => undefined)();
      expect(flushStorageWrite).not.toHaveBeenCalled();
    });
  });

  describe('createPersistFlushMiddleware', () => {
    const run = (action: AnyAction) => {
      const flush = jest.fn().mockResolvedValue(undefined);
      const next = jest.fn((a: AnyAction) => a) as unknown as Dispatch &
        jest.Mock;
      const middleware = createPersistFlushMiddleware(flush);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = middleware({} as any)(next)(action);
      return { flush, next, result };
    };

    it.each([UserActionType.LOCKED_APP, UserActionType.LOGOUT])(
      'flushes after %s',
      (type) => {
        const { flush, next, result } = run({ type });
        expect(next).toHaveBeenCalledWith({ type });
        expect(result).toEqual({ type });
        expect(flush).toHaveBeenCalledTimes(1);
      },
    );

    it('does not flush for other actions', () => {
      const { flush, next } = run({ type: 'UPDATE_BG_STATE' });
      expect(next).toHaveBeenCalled();
      expect(flush).not.toHaveBeenCalled();
    });
  });

  describe('flushPersistedStateOnAppBackground', () => {
    it.each<[AppStateStatus, number]>([
      ['background', 1],
      ['inactive', 1],
      ['active', 0],
    ])('on %s flushes %i time(s)', (nextAppState, expected) => {
      let listener: ((state: AppStateStatus) => void) | undefined;
      jest
        .spyOn(AppState, 'addEventListener')
        .mockImplementation((_type, handler) => {
          listener = handler as (state: AppStateStatus) => void;
          return { remove: jest.fn() } as unknown as ReturnType<
            typeof AppState.addEventListener
          >;
        });
      const flush = jest.fn().mockResolvedValue(undefined);

      flushPersistedStateOnAppBackground(flush);
      listener?.(nextAppState);

      expect(flush).toHaveBeenCalledTimes(expected);
    });
  });
});
