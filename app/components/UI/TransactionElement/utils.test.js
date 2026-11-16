import {
  CONTRACT_CREATION_SIGNATURE,
  TRANSACTION_TYPES,
  generateTransferData,
} from '../../../util/transactions';
import { swapsUtils } from '@metamask/swaps-controller';
import Engine from '../../../core/Engine';
import decodeTransaction, { decodeIncomingTransfer } from './utils';

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      getQRKeyringState: async () => ({ subscribe: () => ({}) }),
    },
    AssetsContractController: {
      getERC721OwnerOf: jest.fn().mockResolvedValue(undefined),
    },
    SmartTransactionsController: {
      state: {
        smartTransactionsState: {
          smartTransactions: {},
        },
      },
    },
    TokenListController: {
      state: {
        tokensChainsCache: {
          '0x1': {
            data: [
              {
                '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
                  address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
                  symbol: 'SNX',
                  decimals: 18,
                  name: 'Synthetix Network Token',
                  iconUrl:
                    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f.png',
                  type: 'erc20',
                  aggregators: [
                    'Aave',
                    'Bancor',
                    'CMC',
                    'Crypto.com',
                    'CoinGecko',
                    '1inch',
                    'PMM',
                    'Synthetix',
                    'Zerion',
                    'Lifi',
                  ],
                  occurrences: 10,
                  fees: {
                    '0x5fd79d46eba7f351fe49bff9e87cdea6c821ef9f': 0,
                    '0xda4ef8520b1a57d7d63f1e249606d1a459698876': 0,
                  },
                },
              },
            ],
          },
        },
      },

      preventPollingOnNetworkRestart: false,
    },
  },
}));

describe('Utils', () => {
  describe('decodeIncomingTransfer', () => {
    it('should decode an incoming transfer', () => {
      // Arrange
      const args = {
        tx: {
          txParams: {
            to: '0x77648f1407986479fb1fa5cc3597084b5dbdb057',
            from: '0x1440ec793ae50fa046b95bfeca5af475b6003f9e',
            value: '52daf0',
          },
          transferInformation: {
            symbol: 'USDT',
            decimals: 6,
            contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          },
          hash: '0x942d7843454266b81bf631022aa5f3f944691731b62d67c4e80c4bb5740058bb',
        },
        currentCurrency: 'usd',
        contractExchangeRates: {},
        totalGas: '0x64',
        actionKey: 'key',
        primaryCurrency: 'ETH',
        selectedAddress: '0x77648f1407986479fb1fa5cc3597084b5dbdb057',
        ticker: 'ETH',
        txChainId: '0x1',
        networkConfigurationsByChainId: {
          '0x1': {
            nativeCurrency: 'ETH',
          },
        },
      };

      // Act
      const [transactionElement, transactionDetails] =
        decodeIncomingTransfer(args);

      // Assert
      expect(transactionElement).toEqual({
        actionKey: 'key',
        renderFrom: '0x1440ec793aE50fA046B95bFeCa5aF475b6003f9e',
        renderTo: '0x77648F1407986479fb1fA5Cc3597084B5dbDB057',
        value: '5.43 USDT',
        fiatValue: undefined,
        isIncomingTransfer: true,
        transactionType: 'transaction_received_token',
      });
      expect(transactionDetails).toEqual({
        renderTotalGas: '< 0.00001 ETH',
        renderValue: '5.43 USDT',
        renderFrom: '0x1440ec793aE50fA046B95bFeCa5aF475b6003f9e',
        renderTo: '0x77648F1407986479fb1fA5Cc3597084B5dbDB057',
        hash: '0x942d7843454266b81bf631022aa5f3f944691731b62d67c4e80c4bb5740058bb',
        transactionType: 'transaction_received_token',
        summaryAmount: '5.43 USDT',
        summaryFee: '< 0.00001 ETH',
        summaryTotalAmount: '5.43 USDT / < 0.00001 ETH',
        summarySecondaryTotalAmount: undefined,
        txChainId: '0x1',
      });
    });

    it('should decode an incoming transfer with big number with 10 digits', () => {
      // Arrange
      const args = {
        tx: {
          txParams: {
            to: '0x77648f1407986479fb1fa5cc3597084b5dbdb057',
            from: '0x1440ec793ae50fa046b95bfeca5af475b6003f9e',
            value: '3B9ACA00', // 1000000000 in decimal
          },
          transferInformation: {
            symbol: 'USDT',
            decimals: 6,
            contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          },
          hash: '0x942d7843454266b81bf631022aa5f3f944691731b62d67c4e80c4bb5740058bb',
        },
        currentCurrency: 'usd',
        contractExchangeRates: {},
        totalGas: '0x64',
        actionKey: 'key',
        primaryCurrency: 'ETH',
        selectedAddress: '0x77648f1407986479fb1fa5cc3597084b5dbdb057',
        ticker: 'ETH',
        txChainId: '0x1',
        networkConfigurationsByChainId: {
          '0x1': {
            nativeCurrency: 'ETH',
          },
        },
      };

      // Act
      const [transactionElement, transactionDetails] =
        decodeIncomingTransfer(args);

      // Assert
      expect(transactionElement).toEqual({
        actionKey: 'key',
        renderFrom: '0x1440ec793aE50fA046B95bFeCa5aF475b6003f9e',
        renderTo: '0x77648F1407986479fb1fA5Cc3597084B5dbDB057',
        value: '1000 USDT',
        fiatValue: undefined,
        isIncomingTransfer: true,
        transactionType: 'transaction_received_token',
      });
      expect(transactionDetails).toEqual({
        renderTotalGas: '< 0.00001 ETH',
        renderValue: '1000 USDT',
        renderFrom: '0x1440ec793aE50fA046B95bFeCa5aF475b6003f9e',
        renderTo: '0x77648F1407986479fb1fA5Cc3597084B5dbDB057',
        hash: '0x942d7843454266b81bf631022aa5f3f944691731b62d67c4e80c4bb5740058bb',
        transactionType: 'transaction_received_token',
        summaryAmount: '1000 USDT',
        summaryFee: '< 0.00001 ETH',
        summaryTotalAmount: '1000 USDT / < 0.00001 ETH',
        summarySecondaryTotalAmount: undefined,
        txChainId: '0x1',
      });
    });
  });

  describe('decodeTransaction', () => {
    const expectedTransactionDetails = {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      renderFrom: '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD',
      renderGas: '21000',
      renderGasPrice: 1,
      renderTo: '0x1234567890AbcdEF1234567890aBcdef12345678',
      renderTotalGas: '0.00002 ETH',
      renderValue: '0 ETH',
      summaryAmount: '0 ETH',
      summaryFee: '0.00002 ETH',
      summarySecondaryTotalAmount: undefined,
      summaryTotalAmount: '0.00002 ETH',
      txChainId: '0x1',
    };

    const txParamsMock = {
      to: '0x1234567890abcdef1234567890abcdef12345678',
      from: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      value: '0',
      data: '0xa22cb4650000000000000000000000000000000000000000000000000000000000000001',
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
    };

    it('decodes a transaction with type set approval for all', async () => {
      const args = {
        tx: {
          txParams: txParamsMock,
          transactionType: TRANSACTION_TYPES.SET_APPROVAL_FOR_ALL,
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        currentCurrency: 'usd',
        contractExchangeRates: {},
        totalGas: '0x5208',
        actionKey: 'transactions.set_approval_for_all',
        primaryCurrency: 'ETH',
        selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
        ticker: 'ETH',
        txChainId: '0x1',
        networkConfigurationsByChainId: {
          '0x1': {
            nativeCurrency: 'ETH',
          },
        },
      };

      const result = await decodeTransaction(args);

      expect(result).toEqual([
        {
          actionKey: 'Set Approval For All',
          fiatValue: undefined,
          renderFrom: '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD',
          renderTo: '0x1234567890AbcdEF1234567890aBcdef12345678',
          transactionType: 'transaction_set_approval_for_all',
          value: '0 ETH',
        },
        {
          ...expectedTransactionDetails,
          transactionType: 'transaction_set_approval_for_all',
        },
      ]);
    });

    it('decodes a transaction with type increase allowance', async () => {
      const args = {
        tx: {
          txParams: {
            ...txParamsMock,
            data: '0x39509351',
          },
          transactionType: TRANSACTION_TYPES.INCREASE_ALLOWANCE,
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        currentCurrency: 'usd',
        contractExchangeRates: {},
        totalGas: '0x5208',
        actionKey: 'transactions.increase_allowance',
        primaryCurrency: 'ETH',
        selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
        ticker: 'ETH',
        txChainId: '0x1',
        networkConfigurationsByChainId: {
          '0x1': {
            nativeCurrency: 'ETH',
          },
        },
      };

      const result = await decodeTransaction(args);

      expect(result).toEqual([
        {
          actionKey: 'Increase Allowance',
          fiatValue: undefined,
          renderFrom: '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD',
          renderTo: '0x1234567890AbcdEF1234567890aBcdef12345678',
          transactionType: 'transaction_increase_allowance',
          value: '0 ETH',
        },
        {
          ...expectedTransactionDetails,
          transactionType: 'transaction_increase_allowance',
        },
      ]);
    });

    it('decodes a transaction with type contract interactions', async () => {
      const args = {
        tx: {
          txParams: {
            ...txParamsMock,
            data: CONTRACT_CREATION_SIGNATURE,
          },
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        currentCurrency: 'usd',
        contractExchangeRates: {},
        totalGas: '0x5208',
        actionKey: 'transactions.swaps_transaction',
        primaryCurrency: 'ETH',
        selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
        ticker: 'ETH',
        txChainId: '0x1',
        networkConfigurationsByChainId: {
          '0x1': {
            nativeCurrency: 'ETH',
          },
        },
      };

      const result = await decodeTransaction(args);

      expect(result).toEqual([
        {
          actionKey: 'Contract Deployment',
          fiatValue: undefined,
          contractDeployment: true,
          renderFrom: '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD',
          renderTo: 'New Contract',
          transactionType: 'transaction_site_interaction',
          value: '0.00002 ETH',
        },
        {
          ...expectedTransactionDetails,
          renderTo: 'New Contract',
        },
      ]);
    });

    describe('token, collectible, ether and swaps transactions', () => {
      const USER_ADDRESS = '0x77648F1407986479fb1fA5Cc3597084B5dbDB057';
      const OTHER_ADDRESS = '0x1440ec793aE50fA046B95bFeCa5aF475b6003f9e';
      const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
      const NFT_ADDRESS = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';
      const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
      const HASH =
        '0xabababababababababababababababababababababababababababababababab';
      const gasParams = { gas: '0x5208', gasPrice: '0x3b9aca00' };

      const baseArgs = {
        currentCurrency: 'usd',
        conversionRate: 2000,
        primaryCurrency: 'ETH',
        selectedAddress: USER_ADDRESS,
        chainId: '0x1',
        txChainId: '0x1',
        networkConfigurationsByChainId: {
          '0x1': { nativeCurrency: 'ETH' },
        },
        contractExchangeRates: {},
        tokens: {},
        collectibleContracts: [],
      };

      const { smartTransactionsState } =
        Engine.context.SmartTransactionsController.state;

      afterEach(() => {
        smartTransactionsState.smartTransactions = {};
      });

      it('decodes a sent ERC20 transfer with value and fiat amount', async () => {
        const args = {
          ...baseArgs,
          tokens: {
            [DAI_ADDRESS]: {
              address: DAI_ADDRESS,
              symbol: 'DAI',
              decimals: 18,
            },
          },
          contractExchangeRates: { [DAI_ADDRESS]: { price: 0.0005 } },
          tx: {
            id: 'erc20-transfer',
            hash: HASH,
            txParams: {
              ...gasParams,
              from: USER_ADDRESS.toLowerCase(),
              to: DAI_ADDRESS.toLowerCase(),
              value: '0x0',
              data: generateTransferData('transfer', {
                toAddress: OTHER_ADDRESS,
                amount: '14d1120d7b160000', // 1.5 * 10^18
              }),
            },
          },
        };

        const [transactionElement, transactionDetails] =
          await decodeTransaction(args);

        expect(transactionElement).toEqual({
          actionKey: 'Sent DAI',
          fiatValue: '- $1.50',
          nonce: undefined,
          renderTo: OTHER_ADDRESS.toLowerCase(),
          transactionType: TRANSACTION_TYPES.SENT_TOKEN,
          value: '1.5 DAI',
        });
        expect(transactionDetails).toEqual({
          hash: HASH,
          renderFrom: USER_ADDRESS,
          renderGas: '21000',
          renderGasPrice: 1,
          renderTo: OTHER_ADDRESS,
          renderTotalGas: '0.00002 ETH',
          renderValue: '1.5 DAI',
          summaryAmount: '1.5 DAI',
          summaryFee: '0.00002 ETH',
          summarySecondaryTotalAmount: '$1.54',
          summaryTotalAmount: '1.5 DAI / 0.00002 ETH',
          txChainId: '0x1',
        });
      });

      it('decodes a collectible transferFrom sent by the selected account', async () => {
        const args = {
          ...baseArgs,
          collectibleContracts: [
            { address: NFT_ADDRESS, name: 'CryptoKitties', symbol: 'CK' },
          ],
          tx: {
            id: 'nft-sent',
            hash: HASH,
            txParams: {
              ...gasParams,
              from: USER_ADDRESS.toLowerCase(),
              to: NFT_ADDRESS.toLowerCase(),
              value: '0x0',
              data: generateTransferData('transferFrom', {
                fromAddress: USER_ADDRESS,
                toAddress: OTHER_ADDRESS,
                tokenId: '7b', // 123
              }),
            },
          },
        };

        const [transactionElement, transactionDetails] =
          await decodeTransaction(args);

        expect(transactionElement).toEqual({
          actionKey: 'Sent CryptoKitties',
          fiatValue: 'CK',
          renderFrom: USER_ADDRESS,
          renderTo: OTHER_ADDRESS,
          transactionType: TRANSACTION_TYPES.SENT_COLLECTIBLE,
          value: '#123',
        });
        expect(transactionDetails).toEqual({
          hash: HASH,
          renderFrom: USER_ADDRESS,
          renderGas: '21000',
          renderGasPrice: 1,
          renderTo: OTHER_ADDRESS,
          renderTotalGas: '0.00002 ETH',
          renderValue: '#123 CK',
          summaryAmount: '#123 CK',
          summaryFee: '0.00002 ETH',
          summarySecondaryTotalAmount: '$0.04',
          summaryTotalAmount: '#123 CK / 0.00002 ETH',
          transactionType: TRANSACTION_TYPES.SENT_COLLECTIBLE,
          txChainId: '0x1',
        });
      });

      it('decodes a collectible transferFrom from another account as received', async () => {
        const args = {
          ...baseArgs,
          tx: {
            id: 'nft-received',
            hash: HASH,
            txParams: {
              ...gasParams,
              from: OTHER_ADDRESS.toLowerCase(),
              to: NFT_ADDRESS.toLowerCase(),
              value: '0x0',
              data: generateTransferData('transferFrom', {
                fromAddress: OTHER_ADDRESS,
                toAddress: USER_ADDRESS,
                tokenId: '7b',
              }),
            },
          },
        };

        const [transactionElement, transactionDetails] =
          await decodeTransaction(args);

        expect(transactionElement).toEqual({
          actionKey: 'Sent Collectible',
          fiatValue: undefined,
          renderFrom: OTHER_ADDRESS,
          renderTo: USER_ADDRESS,
          transactionType: TRANSACTION_TYPES.RECEIVED_COLLECTIBLE,
          value: '#123',
        });
        expect(transactionDetails).toEqual({
          hash: HASH,
          renderFrom: OTHER_ADDRESS,
          renderGas: '21000',
          renderGasPrice: 1,
          renderTo: USER_ADDRESS,
          renderTotalGas: '0.00002 ETH',
          renderValue: '#123',
          summaryAmount: '#123',
          summaryFee: '0.00002 ETH',
          summarySecondaryTotalAmount: '$0.04',
          summaryTotalAmount: '#123 / 0.00002 ETH',
          transactionType: TRANSACTION_TYPES.RECEIVED_COLLECTIBLE,
          txChainId: '0x1',
        });
      });

      it('decodes a plain ether send', async () => {
        const args = {
          ...baseArgs,
          tx: {
            id: 'eth-sent',
            hash: HASH,
            toSmartContract: false,
            txParams: {
              ...gasParams,
              from: USER_ADDRESS.toLowerCase(),
              to: OTHER_ADDRESS.toLowerCase(),
              value: '0xde0b6b3a7640000', // 1 ETH
            },
          },
        };

        const [transactionElement, transactionDetails] =
          await decodeTransaction(args);

        expect(transactionElement).toEqual({
          actionKey: 'Sent ETH',
          fiatValue: '$2000.00',
          renderFrom: USER_ADDRESS,
          renderTo: OTHER_ADDRESS,
          transactionType: TRANSACTION_TYPES.SENT,
          value: '1 ETH',
        });
        expect(transactionDetails).toEqual({
          hash: HASH,
          renderFrom: USER_ADDRESS,
          renderGas: '21000',
          renderGasPrice: 1,
          renderTo: OTHER_ADDRESS,
          renderTotalGas: '0.00002 ETH',
          renderValue: '1 ETH',
          summaryAmount: '1 ETH',
          summaryFee: '0.00002 ETH',
          summarySecondaryTotalAmount: '$2000.04',
          summaryTotalAmount: '1.00002 ETH',
          transactionType: TRANSACTION_TYPES.SENT,
          txChainId: '0x1',
        });
      });

      it('decodes a plain ether receive', async () => {
        const args = {
          ...baseArgs,
          primaryCurrency: 'Fiat',
          tx: {
            id: 'eth-received',
            hash: HASH,
            toSmartContract: false,
            txParams: {
              ...gasParams,
              from: OTHER_ADDRESS.toLowerCase(),
              to: USER_ADDRESS.toLowerCase(),
              value: '0xde0b6b3a7640000',
            },
          },
        };

        const [transactionElement, transactionDetails] =
          await decodeTransaction(args);

        expect(transactionElement).toEqual({
          actionKey: 'Received ETH',
          fiatValue: '$2000.00',
          renderFrom: OTHER_ADDRESS,
          renderTo: USER_ADDRESS,
          transactionType: TRANSACTION_TYPES.RECEIVED,
          value: '1 ETH',
        });
        expect(transactionDetails).toEqual({
          hash: HASH,
          renderFrom: OTHER_ADDRESS,
          renderGas: '21000',
          renderGasPrice: 1,
          renderTo: USER_ADDRESS,
          renderTotalGas: '0.00002 ETH',
          renderValue: '1 ETH',
          summaryAmount: '$2000.00',
          summaryFee: '$0.04',
          summarySecondaryTotalAmount: '1.00002 ETH',
          summaryTotalAmount: '$2000.04',
          transactionType: TRANSACTION_TYPES.RECEIVED,
          txChainId: '0x1',
        });
      });

      describe('swaps', () => {
        const SWAPS_CONTRACT = swapsUtils.getSwapsContractAddress('0x1');
        const SWAPS_CONTRACT_CHECKSUM =
          '0x881D40237659C251811CEC9c364ef91dC08D300C';
        // ETH source: summaryTotalAmount = 1 ETH swapped + 0.00002 ETH gas
        const expectedSwapDetails = {
          hash: HASH,
          renderFrom: USER_ADDRESS,
          renderGas: 21000,
          renderGasPrice: 1,
          renderTo: SWAPS_CONTRACT_CHECKSUM,
          renderTotalGas: '0.00002 ETH',
          renderValue: '1 ETH',
          summaryAmount: '1 ETH',
          summaryFee: '0.00002 ETH',
          summarySecondaryTotalAmount: '$2000.04',
          summaryTotalAmount: '1.00002 ETH',
          txChainId: '0x1',
        };
        const expectedSwapElement = {
          actionKey: 'Swap ETH to DAI',
          fiatValue: '$2000.00',
          notificationKey: 'Swap complete (ETH to DAI)',
          renderFrom: USER_ADDRESS,
          renderTo: SWAPS_CONTRACT_CHECKSUM,
          transactionType: TRANSACTION_TYPES.SITE_INTERACTION,
          value: '-1 ETH',
        };
        const swapsTokens = [
          { address: NATIVE_ADDRESS, symbol: 'ETH', decimals: 18 },
          { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
        ];
        const swapTransaction = {
          action: 'swap',
          sourceToken: { address: NATIVE_ADDRESS, decimals: 18 },
          destinationToken: { address: DAI_ADDRESS, decimals: 18 },
          sourceAmount: '1000000000000000000', // 1 ETH
          destinationAmount: '2000000000000000000000', // 2000 DAI quoted
          receivedDestinationAmount: '1990000000000000000000', // 1990 DAI received
        };
        const swapTx = {
          id: 'swap-tx-id',
          hash: HASH,
          status: 'confirmed',
          txParams: {
            ...gasParams,
            from: USER_ADDRESS.toLowerCase(),
            to: SWAPS_CONTRACT,
            value: '0xde0b6b3a7640000',
            data: '0x5f575529',
          },
        };
        const swapArgs = {
          ...baseArgs,
          swapsTokens,
          contractExchangeRates: { [DAI_ADDRESS]: { price: 0.0005 } },
        };

        it('decodes a swap keyed by tx.id with the ETH source total including gas', async () => {
          const [transactionElement, transactionDetails] =
            await decodeTransaction({
              ...swapArgs,
              tx: swapTx,
              swapsTransactions: { [swapTx.id]: swapTransaction },
            });

          expect(transactionElement).toEqual(expectedSwapElement);
          expect(transactionDetails).toEqual(expectedSwapDetails);
        });

        it('prefers receivedDestinationAmount over the quoted destinationAmount', async () => {
          const swapsTransactions = { [swapTx.id]: swapTransaction };

          const [received] = await decodeTransaction({
            ...swapArgs,
            assetSymbol: 'DAI',
            tx: swapTx,
            swapsTransactions,
          });
          const [quoted] = await decodeTransaction({
            ...swapArgs,
            assetSymbol: 'DAI',
            tx: swapTx,
            swapsTransactions: {
              [swapTx.id]: {
                ...swapTransaction,
                receivedDestinationAmount: '0',
              },
            },
          });

          expect(received.value).toBe('+1990 DAI');
          expect(received.fiatValue).toBe('$1990.00');
          expect(quoted.value).toBe('+2000 DAI');
        });

        it('decodes a smart transaction swap by looking up the STX uuid from the tx hash', async () => {
          smartTransactionsState.smartTransactions = {
            '0x1': [{ txHash: HASH, uuid: 'stx-uuid' }],
          };

          const [transactionElement, transactionDetails] =
            await decodeTransaction({
              ...swapArgs,
              tx: { ...swapTx, id: 'unrelated-tx-id' },
              swapsTransactions: { 'stx-uuid': swapTransaction },
            });

          expect(transactionElement).toEqual(expectedSwapElement);
          expect(transactionDetails).toEqual(expectedSwapDetails);
        });

        it('falls through to the standard decode when the source token is unknown', async () => {
          const [transactionElement, transactionDetails] =
            await decodeTransaction({
              ...swapArgs,
              swapsTokens: [swapsTokens[1]],
              tx: swapTx,
              swapsTransactions: { [swapTx.id]: swapTransaction },
            });

          expect(transactionElement).toEqual({
            actionKey: 'Swaps transaction',
            fiatValue: '$2000.00',
            renderFrom: USER_ADDRESS,
            renderTo: SWAPS_CONTRACT_CHECKSUM,
            transactionType: TRANSACTION_TYPES.SWAPS_TRANSACTION,
            value: '1 ETH',
          });
          expect(transactionDetails).toEqual({
            hash: HASH,
            renderFrom: USER_ADDRESS,
            renderGas: '21000',
            renderGasPrice: 1,
            renderTo: SWAPS_CONTRACT_CHECKSUM,
            renderTotalGas: '0.00002 ETH',
            renderValue: '1 ETH',
            summaryAmount: '1 ETH',
            summaryFee: '0.00002 ETH',
            summarySecondaryTotalAmount: '$2000.04',
            summaryTotalAmount: '1.00002 ETH',
            transactionType: TRANSACTION_TYPES.SWAPS_TRANSACTION,
            txChainId: '0x1',
          });
        });

        it('falls through to the standard decode when the destination token is unknown', async () => {
          const [transactionElement] = await decodeTransaction({
            ...swapArgs,
            swapsTokens: [swapsTokens[0]],
            tx: swapTx,
            swapsTransactions: { [swapTx.id]: swapTransaction },
          });

          expect(transactionElement).toEqual({
            actionKey: 'Swaps transaction',
            fiatValue: '$2000.00',
            renderFrom: USER_ADDRESS,
            renderTo: SWAPS_CONTRACT_CHECKSUM,
            transactionType: TRANSACTION_TYPES.SWAPS_TRANSACTION,
            value: '1 ETH',
          });
        });
      });
    });
  });
});
