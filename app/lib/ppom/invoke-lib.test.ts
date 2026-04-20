import extendInvoke from './invoke-lib';

type BindHandler = (payload: unknown) => unknown;
type DefinedHandlers = Record<string, BindHandler>;

interface MockInvoke {
  (...args: unknown[]): unknown;
  define: jest.Mock;
  bind: jest.Mock;
  defineAsync?: (name: string, func: (...args: unknown[]) => Promise<unknown>) => void;
  bindAsync?: (name: string) => (...args: unknown[]) => Promise<unknown>;
  definedHandlers: DefinedHandlers;
  boundHandlers: Record<string, jest.Mock>;
}

const createMockInvoke = (): MockInvoke => {
  const definedHandlers: DefinedHandlers = {};
  const boundHandlers: Record<string, jest.Mock> = {};

  const invoke = jest.fn() as unknown as MockInvoke;
  invoke.definedHandlers = definedHandlers;
  invoke.boundHandlers = boundHandlers;

  invoke.define = jest.fn((name: string, handler: BindHandler) => {
    definedHandlers[name] = handler;
  });

  invoke.bind = jest.fn((name: string) => {
    const boundHandler = jest.fn().mockResolvedValue(undefined);
    boundHandlers[name] = boundHandler;
    return boundHandler;
  });

  return invoke;
};

describe('invoke-lib', () => {
  it('defineAsync registers a trigger that resolves on success', async () => {
    const invoke = createMockInvoke();
    extendInvoke(invoke);

    invoke.defineAsync?.('my_fn', async (...args: unknown[]) => {
      const [x, y] = args as [number, number];
      return x + y;
    });

    expect(invoke.define).toHaveBeenCalledWith('my_fn_trigger', expect.any(Function));
    expect(invoke.bind).toHaveBeenCalledWith('my_fn_resolve');
    expect(invoke.bind).toHaveBeenCalledWith('my_fn_reject');

    const trigger = invoke.definedHandlers.my_fn_trigger as (payload: {
      id: number;
      args: unknown[];
    }) => void;
    trigger({ id: 7, args: [2, 3] });
    await new Promise((resolve) => setImmediate(resolve));

    expect(invoke.boundHandlers.my_fn_resolve).toHaveBeenCalledWith({
      id: 7,
      args: [5],
    });
  });

  it('defineAsync forwards rejections through the reject callback', async () => {
    const invoke = createMockInvoke();
    extendInvoke(invoke);

    invoke.defineAsync?.('err_fn', async () => {
      throw new Error('boom');
    });

    const trigger = invoke.definedHandlers.err_fn_trigger as (payload: {
      id: number;
      args: unknown[];
    }) => void;
    trigger({ id: 1, args: [] });
    await new Promise((resolve) => setImmediate(resolve));

    expect(invoke.boundHandlers.err_fn_reject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        error: expect.objectContaining({ message: 'boom' }),
      }),
    );
  });

  it('bindAsync resolves when the resolve handler is invoked', async () => {
    const invoke = createMockInvoke();
    extendInvoke(invoke);

    const caller = invoke.bindAsync?.('rt') as (...args: unknown[]) => Promise<unknown>;
    // Ensure the trigger send returns a thenable (mock default is undefined)
    invoke.boundHandlers.rt_trigger.mockResolvedValue(undefined);

    const promise = caller('a', 1);
    // Grab the id passed into the trigger
    const [{ id }] = invoke.boundHandlers.rt_trigger.mock.calls[0] as [
      { id: number; args: unknown[] },
    ];
    const resolveHandler = invoke.definedHandlers.rt_resolve as (payload: {
      id: number;
      args: unknown[];
    }) => void;
    resolveHandler({ id, args: ['ok'] });

    await expect(promise).resolves.toBe('ok');
  });

  it('bindAsync rejects when the reject handler is invoked', async () => {
    const invoke = createMockInvoke();
    extendInvoke(invoke);

    const caller = invoke.bindAsync?.('rt2') as (...args: unknown[]) => Promise<unknown>;
    invoke.boundHandlers.rt2_trigger.mockResolvedValue(undefined);

    const promise = caller();
    const [{ id }] = invoke.boundHandlers.rt2_trigger.mock.calls[0] as [
      { id: number; args: unknown[] },
    ];
    const rejectHandler = invoke.definedHandlers.rt2_reject as (payload: {
      id: number;
      error: { message: string };
    }) => void;
    rejectHandler({ id, error: { message: 'kaboom' } });

    await expect(promise).rejects.toThrow('kaboom');
  });
});
