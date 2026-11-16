import React from 'react';
import { render } from '@testing-library/react-native';

import { PPOMView } from './PPOMView';

jest.mock('./ppom.html.js', () => ({ html: '' }), { virtual: true });

jest.mock('react-native-webview-invoke/native', () => ({
  __esModule: true,
  default: jest.fn(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const definitions: Record<string, (...args: any[]) => any> = {};
    const bound: Record<string, jest.Mock> = {};
    return {
      definitions,
      bound,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      define: jest.fn((name: string, fn: (...args: any[]) => any) => {
        definitions[name] = fn;
      }),
      bind: jest.fn((name: string) => {
        bound[name] ??= jest.fn().mockResolvedValue(undefined);
        return bound[name];
      }),
      listener: jest.fn(),
    };
  }),
}));

jest.mock('../../util/Logger', () => ({
  __esModule: true,
  default: { log: jest.fn(), error: jest.fn() },
}));

interface MockInvoke {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definitions: Record<string, (...args: any[]) => any>;
  bound: Record<string, jest.Mock>;
  define: jest.Mock;
  bind: jest.Mock;
  listener: jest.Mock;
}

interface IsolatedPPOMView {
  ppomViewModule: typeof import('./PPOMView');
  createInvoke: jest.Mock;
  Logger: { log: jest.Mock; error: jest.Mock };
}

const loadIsolatedPPOMView = (): IsolatedPPOMView => {
  let isolated: IsolatedPPOMView | undefined;
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
    isolated = {
      ppomViewModule: require('./PPOMView'),
      createInvoke: require('react-native-webview-invoke/native').default,
      Logger: require('../../util/Logger').default,
    };
    /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
  });
  return isolated as IsolatedPPOMView;
};

const mountPPOMView = ({ ppomViewModule, createInvoke }: IsolatedPPOMView) => {
  const instance = new ppomViewModule.PPOMView({});
  const mockInvoke: MockInvoke =
    createInvoke.mock.results[createInvoke.mock.results.length - 1].value;
  return { instance, mockInvoke };
};

const getTrigger = (mockInvoke: MockInvoke, name: string) =>
  mockInvoke.bind(`${name}_trigger`) as jest.Mock;

// Simulates the WebView side of invoke-lib's bindAsync protocol: every
// `${name}_trigger` message is answered through `${name}_resolve`/`_reject`.
const respondFromWebView = (
  mockInvoke: MockInvoke,
  name: string,
  reply: { result?: unknown; error?: string },
) => {
  getTrigger(mockInvoke, name).mockImplementation(
    async ({ id }: { id: number }) => {
      if (reply.error) {
        mockInvoke.definitions[`${name}_reject`]({
          id,
          error: { message: reply.error },
        });
      } else {
        mockInvoke.definitions[`${name}_resolve`]({
          id,
          args: [reply.result],
        });
      }
    },
  );
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('PPOMView', () => {
  it('should render correctly', () => {
    expect(() => {
      render(<PPOMView />);
    }).not.toThrow();
  });

  it('wires finishedLoading and console bridges through invoke.define', () => {
    const isolated = loadIsolatedPPOMView();
    const { mockInvoke } = mountPPOMView(isolated);

    expect(Object.keys(mockInvoke.definitions)).toEqual(
      expect.arrayContaining([
        'console.log',
        'console.error',
        'console.warn',
        'finishedLoading',
      ]),
    );
  });

  describe('ppomInit', () => {
    it('waits for the WebView to report finishedLoading before calling ppomInit', async () => {
      const isolated = loadIsolatedPPOMView();
      const onResolved = jest.fn();

      const initPromise = isolated.ppomViewModule.ppomInit().then(onResolved);
      const { mockInvoke } = mountPPOMView(isolated);
      respondFromWebView(mockInvoke, 'ppomInit', {});
      await flushPromises();

      expect(onResolved).not.toHaveBeenCalled();
      expect(getTrigger(mockInvoke, 'ppomInit')).not.toHaveBeenCalled();

      mockInvoke.definitions.finishedLoading();
      await initPromise;

      expect(getTrigger(mockInvoke, 'ppomInit')).toHaveBeenCalledTimes(1);
      expect(getTrigger(mockInvoke, 'ppomInit')).toHaveBeenCalledWith({
        id: expect.any(Number),
        args: [],
      });
      expect(onResolved).toHaveBeenCalledTimes(1);
    });

    it('resolves without waiting when the WebView has already loaded', async () => {
      const isolated = loadIsolatedPPOMView();
      const { mockInvoke } = mountPPOMView(isolated);
      respondFromWebView(mockInvoke, 'ppomInit', {});
      mockInvoke.definitions.finishedLoading();

      await expect(isolated.ppomViewModule.ppomInit()).resolves.toBeUndefined();
      expect(getTrigger(mockInvoke, 'ppomInit')).toHaveBeenCalledTimes(1);
    });

    it('tolerates a repeated finishedLoading and keeps serving later ppomInit calls', async () => {
      const isolated = loadIsolatedPPOMView();
      const initPromise = isolated.ppomViewModule.ppomInit();
      const { mockInvoke } = mountPPOMView(isolated);
      respondFromWebView(mockInvoke, 'ppomInit', {});

      mockInvoke.definitions.finishedLoading();
      await initPromise;
      expect(() => mockInvoke.definitions.finishedLoading()).not.toThrow();

      await expect(isolated.ppomViewModule.ppomInit()).resolves.toBeUndefined();
      expect(getTrigger(mockInvoke, 'ppomInit')).toHaveBeenCalledTimes(2);
    });

    it('rejects when the WebView ppomInit call fails', async () => {
      const isolated = loadIsolatedPPOMView();
      const { mockInvoke } = mountPPOMView(isolated);
      respondFromWebView(mockInvoke, 'ppomInit', { error: 'wasm init failed' });
      mockInvoke.definitions.finishedLoading();

      await expect(isolated.ppomViewModule.ppomInit()).rejects.toThrow(
        'wasm init failed',
      );
    });
  });

  describe('PPOM', () => {
    it('awaits PPOM.new before validating a request', async () => {
      const isolated = loadIsolatedPPOMView();
      const { mockInvoke } = mountPPOMView(isolated);
      mockInvoke.definitions.finishedLoading();
      respondFromWebView(mockInvoke, 'PPOM.validateJsonRpc', {
        result: { result_type: 'Benign' },
      });

      const ppom = isolated.ppomViewModule.PPOM.new(jest.fn(), [
        ['file', new Uint8Array([1, 2, 3])],
      ]);
      const newTrigger = getTrigger(mockInvoke, 'PPOM.new');
      expect(newTrigger).toHaveBeenCalledWith({
        id: expect.any(Number),
        args: [[['file', expect.any(String)]]],
      });

      const request = { method: 'eth_sendTransaction' };
      const validation = ppom.validateJsonRpc(request);
      await flushPromises();
      expect(
        getTrigger(mockInvoke, 'PPOM.validateJsonRpc'),
      ).not.toHaveBeenCalled();

      mockInvoke.definitions['PPOM.new_resolve']({
        id: newTrigger.mock.calls[0][0].id,
        args: [],
      });

      await expect(validation).resolves.toEqual({ result_type: 'Benign' });
      expect(
        getTrigger(mockInvoke, 'PPOM.validateJsonRpc'),
      ).toHaveBeenCalledWith({
        id: expect.any(Number),
        args: [request],
      });
    });

    it('exposes the jsonRpc callback to the WebView via defineAsync', async () => {
      const isolated = loadIsolatedPPOMView();
      const { mockInvoke } = mountPPOMView(isolated);
      mockInvoke.definitions.finishedLoading();
      const jsonRpc = jest.fn().mockResolvedValue('0x1');

      isolated.ppomViewModule.PPOM.new(jsonRpc, []);
      mockInvoke.definitions['PPOM.jsonRpc_trigger']({
        id: 7,
        args: [{ method: 'eth_chainId' }],
      });
      await flushPromises();

      expect(jsonRpc).toHaveBeenCalledWith({ method: 'eth_chainId' });
      expect(mockInvoke.bind('PPOM.jsonRpc_resolve')).toHaveBeenCalledWith({
        id: 7,
        args: ['0x1'],
      });
    });
  });

  describe('console bridge', () => {
    it('reports WebView console.error calls to Logger.error', () => {
      const isolated = loadIsolatedPPOMView();
      const { mockInvoke } = mountPPOMView(isolated);

      mockInvoke.definitions['console.error']('PPOM failed', { code: 1 });

      expect(isolated.Logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: '[PPOMView]' }),
        ['PPOM failed', { code: 1 }],
      );
    });

    it('forwards WebView console.log and console.warn calls to Logger.log', () => {
      const isolated = loadIsolatedPPOMView();
      const { mockInvoke } = mountPPOMView(isolated);

      mockInvoke.definitions['console.log']('loaded');
      mockInvoke.definitions['console.warn']('slow');

      expect(isolated.Logger.log).toHaveBeenCalledWith('[PPOMView]', 'loaded');
      expect(isolated.Logger.log).toHaveBeenCalledWith('[PPOMView]', 'slow');
    });
  });
});
