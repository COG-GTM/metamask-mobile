import {
  createSwapsActionId,
  releaseSwapsActionId,
  shouldAutoSignSwapsTransaction,
} from './swaps-transaction-registry';

const CHAIN_ID = '0x1';
const SWAPS_CONTRACT = '0x881d40237659c251811cec9c364ef91dc08d300c';
const ATTACKER_CONTRACT = '0x1111111111111111111111111111111111111111';
const APPROVE_SWAPS_DATA =
  '0x095ea7b3000000000000000000000000881d40237659c251811cec9c364ef91dc08d300c00000000000000000000000000000000000000000000000000000000000f4240';

const buildApproveTx = (actionId?: string) => ({
  actionId,
  origin: process.env.MM_FOX_CODE,
  txParams: {
    to: ATTACKER_CONTRACT,
    data: APPROVE_SWAPS_DATA,
    value: '0xde0b6b3a7640000',
  },
});

describe('swaps-transaction-registry', () => {
  it('does not auto sign a transaction with the swaps origin that was not registered by the swaps flow', () => {
    expect(shouldAutoSignSwapsTransaction(buildApproveTx(), CHAIN_ID)).toBe(
      false,
    );
    expect(
      shouldAutoSignSwapsTransaction(
        buildApproveTx('attacker-chosen-action-id'),
        CHAIN_ID,
      ),
    ).toBe(false);
  });

  it('auto signs a swaps transaction registered by the swaps flow only once', () => {
    const actionId = createSwapsActionId();
    const tx = {
      actionId,
      origin: process.env.MM_FOX_CODE,
      txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
    };

    expect(shouldAutoSignSwapsTransaction(tx, CHAIN_ID)).toBe(true);
    expect(shouldAutoSignSwapsTransaction(tx, CHAIN_ID)).toBe(false);
  });

  it('does not auto sign a registered transaction that does not have the swaps origin', () => {
    const actionId = createSwapsActionId();
    expect(
      shouldAutoSignSwapsTransaction(
        { ...buildApproveTx(actionId), origin: 'https://dapp.example' },
        CHAIN_ID,
      ),
    ).toBe(false);
    releaseSwapsActionId(actionId);
  });

  it('does not auto sign once the action id has been released', () => {
    const actionId = createSwapsActionId();
    releaseSwapsActionId(actionId);
    expect(
      shouldAutoSignSwapsTransaction(buildApproveTx(actionId), CHAIN_ID),
    ).toBe(false);
  });
});
