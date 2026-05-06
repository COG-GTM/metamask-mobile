/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';
import { web } from 'detox';
import detox from 'detox/internals';
import rpcCoverageTool from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import JsonSchemaFakerRule from '@open-rpc/test-coverage/build/rules/json-schema-faker-rule';
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';

import Browser from '../pages/Browser/BrowserView';
// eslint-disable-next-line import/no-commonjs
const mockServer = require('@open-rpc/mock-server/build/index').default;
import TabBarComponent from '../pages/wallet/TabBarComponent';
import FixtureBuilder from '../fixtures/fixture-builder';
import {
  withFixtures,
  defaultGanacheOptions,
} from '../fixtures/fixture-helper';
import { loginToApp } from '../viewHelper';

import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import ConfirmationsRejectRule from './ConfirmationsRejectionRule';
import { createDriverTransport } from './helpers';
import { BrowserViewSelectorsIDs } from '../selectors/Browser/BrowserView.selectors';
import { getGanachePort } from '../fixtures/utils';
import { mockEvents } from '../api-mocking/mock-config/mock-events';

const port = getGanachePort();
const chainId = 1337;

const main = async () => {
  const openrpcDocument = await parseOpenRPCDocument(
    'https://metamask.github.io/api-specs/0.10.8/openrpc.json',
  );

  const methods = openrpcDocument.methods as any[];

  const signTypedData4 = methods.find(
    (m) => m.name === 'eth_signTypedData_v4',
  );
  const switchEthereumChain = methods.find(
    (m) => m.name === 'wallet_switchEthereumChain',
  );
  if (!switchEthereumChain) {
    throw new Error('wallet_switchEthereumChain not found');
  }
  switchEthereumChain.examples = [
    {
      name: 'wallet_switchEthereumChain',
      description: 'Example of a wallet_switchEthereumChain request to sepolia',
      params: [
        {
          name: 'SwitchEthereumChainParameter',
          value: {
            chainId: '0xaa36a7',
          },
        },
      ],
      result: {
        name: 'wallet_switchEthereumChain',
        value: null,
      },
    },
  ];

  const chainIdMethod = methods.find((m) => m.name === 'eth_chainId');
  if (!chainIdMethod) {
    throw new Error('eth_chainId not found');
  }

  chainIdMethod.examples = [
    {
      name: 'chainIdExample',
      description: 'Example of a chainId request',
      params: [],
      result: {
        name: 'chainIdResult',
        value: `0x${chainId.toString(16)}`,
      },
    },
  ];

  const blockNumber = methods.find((m) => m.name === 'eth_blockNumber');
  if (!blockNumber) {
    throw new Error('eth_blockNumber not found');
  }

  blockNumber.examples = [
    {
      name: 'blockNumberExample',
      description: 'Example of a blockNumber request',
      params: [],
      result: {
        name: 'blockNumberResult',
        value: '0x1',
      },
    },
  ];

  if (!signTypedData4) {
    throw new Error('eth_signTypedData_v4 not found');
  }
  // just update address for signTypedData
  signTypedData4.examples[0].params[0].value =
    '0x76cf1CdD1fcC252442b50D6e97207228aA4aefC3';

  signTypedData4.examples[0].params[1].value.domain.chainId = chainId;

  const personalSign = methods.find((m) => m.name === 'personal_sign');
  if (!personalSign) {
    throw new Error('personal_sign not found');
  }

  personalSign.examples = [
    {
      name: 'personalSignExample',
      description: 'Example of a personalSign request',
      params: [
        {
          name: 'data',
          value: '0xdeadbeef',
        },
        {
          name: 'address',
          value: '0x76cf1CdD1fcC252442b50D6e97207228aA4aefC3',
        },
      ],
      result: {
        name: 'personalSignResult',
        value: '0x1a8819e0c9bab700',
      },
    },
  ];

  const components = openrpcDocument.components as
    | { schemas?: Record<string, any> }
    | undefined;
  const transaction = components?.schemas?.TransactionInfo?.allOf?.[0];

  if (transaction) {
    delete transaction.unevaluatedProperties;
  }
  // net_version missing from execution-apis. see here: https://github.com/ethereum/execution-apis/issues/540
  const netVersion = {
    name: 'net_version',
    params: [],
    result: {
      description: 'Returns the current network ID.',
      name: 'net_version',
      schema: {
        type: 'string',
      },
    },
    description: 'Returns the current network ID.',
    examples: [
      {
        name: 'net_version',
        description: 'Example of a net_version request',
        params: [],
        result: {
          name: 'net_version',
          description: 'The current network ID',
          value: '0x1',
        },
      },
    ],
  };
  // add net_version
  methods.push(netVersion);

  const server = mockServer(port, openrpcDocument);
  server.start();

  const testSpecificMock = {
    GET: [mockEvents.GET.remoteFeatureFlagsOldConfirmations],
  };

  await withFixtures(
    {
      dapp: true,
      fixture: new FixtureBuilder().withGanacheNetwork().build(),
      ganacheOptions: defaultGanacheOptions,
      disableGanache: true,
      restartDevice: true,
      testSpecificMock,
    },
    async () => {
      await loginToApp();
      await TabBarComponent.tapBrowser();
      await Browser.navigateToTestDApp();

      const myWebView = web(by.id(BrowserViewSelectorsIDs.BROWSER_WEBVIEW_ID));
      const webElement = await myWebView.element(by.web.tag('body'));
      const transport = createDriverTransport(webElement as any);

      const methodsWithConfirmations = [
        'wallet_requestPermissions',
        'eth_requestAccounts',
        'wallet_watchAsset',
        'personal_sign', // requires permissions for eth_accounts
        'wallet_addEthereumChain',
        'eth_signTypedData_v4', // requires permissions for eth_accounts
        'wallet_switchEthereumChain',
        'eth_getEncryptionPublicKey', // requires permissions for eth_accounts
      ];

      // replace this with pulling tags out of the api-spec
      // tag: Confirmations
      const filteredMethods = methods
        .filter(
          (m) =>
            m.name.includes('snap') ||
            m.name.includes('Snap') ||
            m.name.toLowerCase().includes('account') ||
            m.name.includes('crypt') ||
            m.name.includes('blob') ||
            m.name.includes('sendTransaction') ||
            m.name.startsWith('wallet_scanQRCode') ||
            m.name.includes('filter') ||
            m.name.includes('Filter') ||
            m.name.includes('getBlockReceipts') || // eth_getBlockReceipts not support
            m.name.includes('maxPriorityFeePerGas') || // eth_maxPriorityFeePerGas not supported
            methodsWithConfirmations.includes(m.name),
        )
        .map((m) => m.name);

      const skip = [
        'eth_coinbase',
        'wallet_registerOnboarding',
        'eth_getEncryptionPublicKey',
        'wallet_watchAsset',
      ];

      const results = await rpcCoverageTool({
        openrpcDocument,
        transport,
        reporters: [
          'console-streaming',
          new HtmlReporter({ autoOpen: !process.env.CI }),
        ],
        rules: [
          new JsonSchemaFakerRule({
            only: [],
            skip: filteredMethods,
            numCalls: 1,
          }),
          new ExamplesRule({
            only: [],
            skip: filteredMethods,
          }),
          new ConfirmationsRejectRule({
            driver: webElement as any,
            only: methodsWithConfirmations,
          }) as any,
        ],
        skip,
      });
      const failing = (results as any[]).filter((r: any) => !r.valid);
      await detox.cleanup();

      // wait 1s to allow for cleanup
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
      process.exit(failing.length > 0 ? 1 : 0);
    },
  );
};

const start = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (detox as any).init({ workerId: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (detox as any).installWorker({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global: (globalThis as any).global,
    workerId: `w1`,
  });
  await main();
};

start();
