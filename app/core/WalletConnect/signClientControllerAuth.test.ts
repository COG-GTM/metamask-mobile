import { SignClient } from '@walletconnect/sign-client';

const WALLET_PUBLIC_KEY = 'wallet-public-key';
const DAPP_PUBLIC_KEY = 'dapp-public-key';
const TOPIC = 'session-topic';

interface MockSession {
  topic: string;
  controller: string;
  peer: { publicKey: string };
  namespaces: Record<string, { accounts: string[] }>;
}

const setup = (controller: string) => {
  const client = new SignClient({ projectId: 'test', logger: 'silent' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engine = client.engine as any;
  const session: MockSession = {
    topic: TOPIC,
    controller,
    peer: { publicKey: DAPP_PUBLIC_KEY },
    namespaces: { eip155: { accounts: ['eip155:1:0xapproved'] } },
  };
  jest.spyOn(client.session, 'get').mockReturnValue(session as never);
  const update = jest
    .spyOn(client.session, 'update')
    .mockImplementation(async (_topic, value) => {
      Object.assign(session, value);
    });
  engine.setExpiry = jest.fn();
  engine.sendError = jest.fn();
  engine.sendResult = jest.fn();
  engine.isValidUpdate = jest.fn();
  engine.isValidExtend = jest.fn();
  return { engine, session, update };
};

describe('@walletconnect/sign-client controller authorization patch', () => {
  it('rejects wc_sessionUpdate from a non-controller peer', async () => {
    const { engine, session, update } = setup(WALLET_PUBLIC_KEY);

    await engine.onSessionUpdateRequest(TOPIC, {
      id: 1,
      params: { namespaces: { eip155: { accounts: ['eip155:1:0xinjected'] } } },
    });

    expect(update).not.toHaveBeenCalled();
    expect(session.namespaces.eip155.accounts).toEqual(['eip155:1:0xapproved']);
    expect(engine.sendError).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        error: expect.objectContaining({ code: 3003 }),
      }),
    );
  });

  it('rejects wc_sessionExtend from a non-controller peer', async () => {
    const { engine } = setup(WALLET_PUBLIC_KEY);

    await engine.onSessionExtendRequest(TOPIC, { id: 2 });

    expect(engine.setExpiry).not.toHaveBeenCalled();
    expect(engine.sendError).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 2,
        error: expect.objectContaining({ code: 3004 }),
      }),
    );
  });

  it('still applies updates and extends sent by the session controller', async () => {
    const { engine, update } = setup(DAPP_PUBLIC_KEY);

    await engine.onSessionUpdateRequest(TOPIC, {
      id: 3,
      params: { namespaces: { eip155: { accounts: ['eip155:1:0xnew'] } } },
    });
    await engine.onSessionExtendRequest(TOPIC, { id: 4 });

    expect(update).toHaveBeenCalled();
    expect(engine.setExpiry).toHaveBeenCalled();
    expect(engine.sendError).not.toHaveBeenCalled();
  });
});
