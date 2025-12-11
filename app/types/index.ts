/**
 * Core type definitions for MetaMask Mobile
 * This module re-exports and extends types from various controllers
 */

// Re-export Engine types for convenience
export type {
  EngineState,
  EngineContext,
  Controllers,
  ControllerName,
  StatefulControllers,
  BaseControllerMessenger,
} from '../core/Engine/types';

// Re-export transaction types from the transaction controller
export type {
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';

// Export transaction-related types
export * from './transaction';
