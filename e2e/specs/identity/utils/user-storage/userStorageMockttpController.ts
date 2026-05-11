import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import {
  determineIfFeatureEntryFromURL,
  getDecodedProxiedURL,
} from '../helpers';
// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';

const baseUrl =
  'https://user-storage\\.api\\.cx\\.metamask\\.io\\/api\\/v1\\/userstorage';

export type UserStorageFeatureName =
  (typeof USER_STORAGE_FEATURE_NAMES)[keyof typeof USER_STORAGE_FEATURE_NAMES];

export const pathRegexps: Record<UserStorageFeatureName, RegExp> = {
  [USER_STORAGE_FEATURE_NAMES.accounts]: new RegExp(
    `${baseUrl}/${USER_STORAGE_FEATURE_NAMES.accounts}`,
    'u',
  ),
  [USER_STORAGE_FEATURE_NAMES.networks]: new RegExp(
    `${baseUrl}/${USER_STORAGE_FEATURE_NAMES.networks}`,
    'u',
  ),
  [USER_STORAGE_FEATURE_NAMES.notifications]: new RegExp(
    `${baseUrl}/${USER_STORAGE_FEATURE_NAMES.notifications}`,
    'u',
  ),
};

export interface UserStorageEntry {
  HashedKey: string;
  Data: unknown;
}

export interface PathData {
  response: UserStorageEntry[];
}

export interface MockRequest {
  // `url` is what mockttp gives us at runtime, but some unit tests historically
  // pass a `path` field instead. Accept either shape via the index signature.
  url?: string;
  body?: { getJson: () => Promise<unknown> };
  [key: string]: unknown;
}

export interface SetupPathOverrides {
  getResponse?: UserStorageEntry[];
  getStatusCode?: number;
  putStatusCode?: number;
  deleteStatusCode?: number;
}

// Mockttp's request rule builder is structurally complex. We only narrow to the
// subset of methods used by the controller. All callback parameters are widened
// to `unknown` so that mockttp's stricter `CompletedRequest`-typed callbacks
// remain assignable here (bivariant method-parameter checking).
export type MockttpMatchingCallback = (request: unknown) => unknown;
export type MockttpThenCallback = (request: unknown) => unknown;

export interface MockttpRequestBuilder {
  matching(predicate: MockttpMatchingCallback): MockttpRequestBuilder;
  always(): MockttpRequestBuilder;
  thenCallback(cb: MockttpThenCallback): unknown;
}

export interface MockttpServerLike {
  forGet(path: string | RegExp): MockttpRequestBuilder;
  forPut(path: string | RegExp): MockttpRequestBuilder;
  forPost(path: string | RegExp): MockttpRequestBuilder;
  forDelete(path: string | RegExp): MockttpRequestBuilder;
}

export class UserStorageMockttpController {
  paths: Map<UserStorageFeatureName, PathData> = new Map();

  eventEmitter: EventEmitter = new EventEmitter();

  async onGet(
    path: UserStorageFeatureName,
    request: MockRequest,
    statusCode = 200,
  ): Promise<{ statusCode: number; json: unknown }> {
    const internalPathData = this.paths.get(path);

    if (!internalPathData) {
      this.eventEmitter.emit('GET_NOT_FOUND', {
        path,
        statusCode,
      });
      return {
        statusCode,
        json: null,
      };
    }

    const isFeatureEntry = determineIfFeatureEntryFromURL(request.url);

    if (isFeatureEntry) {
      const json =
        internalPathData.response?.find(
          (entry: UserStorageEntry) =>
            entry.HashedKey ===
            getDecodedProxiedURL(request.url).split('/').pop(),
        ) || null;

      this.eventEmitter.emit('GET_SINGLE', {
        path,
        statusCode,
      });

      return {
        statusCode,
        json,
      };
    }

    const json = internalPathData?.response.length
      ? internalPathData.response
      : null;

    this.eventEmitter.emit('GET_ALL', {
      path,
      statusCode,
    });

    return {
      statusCode,
      json,
    };
  }

  async onPut(
    path: UserStorageFeatureName,
    request: MockRequest,
    statusCode = 204,
  ): Promise<{ statusCode: number }> {
    const isFeatureEntry = determineIfFeatureEntryFromURL(request.url);

    const data = ((await request.body?.getJson()) ?? null) as
      | {
          batch_delete?: string[];
          data?: string | Record<string, unknown>;
        }
      | null;

    // We're handling batch delete inside the PUT method due to API limitations
    if (data?.batch_delete) {
      const keysToDelete = data.batch_delete;

      const internalPathData = this.paths.get(path);

      if (!internalPathData) {
        this.eventEmitter.emit('DELETE_BATCH_NOT_FOUND', {
          path,
          statusCode,
        });
        return {
          statusCode,
        };
      }

      this.paths.set(path, {
        ...internalPathData,
        response: internalPathData.response.filter(
          (entry: UserStorageEntry) => !keysToDelete.includes(entry.HashedKey),
        ),
      });

      this.eventEmitter.emit('DELETE_BATCH', {
        path,
        statusCode,
      });
    }

    if (data?.data) {
      const newOrUpdatedSingleOrBatchEntries: UserStorageEntry[] =
        isFeatureEntry && typeof data?.data === 'string'
          ? [
              {
                HashedKey:
                  getDecodedProxiedURL(request.url).split('/').pop() ?? '',
                Data: data?.data,
              },
            ]
          : Object.entries(
              data?.data as Record<string, unknown>,
            ).map(([key, value]) => ({
              HashedKey: key,
              Data: value,
            }));

      newOrUpdatedSingleOrBatchEntries.forEach((entry) => {
        const internalPathData = this.paths.get(path);

        if (!internalPathData) {
          return;
        }

        const doesThisEntryExist = internalPathData.response?.find(
          (existingEntry: UserStorageEntry) =>
            existingEntry.HashedKey === entry.HashedKey,
        );

        if (doesThisEntryExist) {
          this.paths.set(path, {
            ...internalPathData,
            response: internalPathData.response.map(
              (existingEntry: UserStorageEntry) =>
                existingEntry.HashedKey === entry.HashedKey
                  ? entry
                  : existingEntry,
            ),
          });
        } else {
          this.paths.set(path, {
            ...internalPathData,
            response: [...(internalPathData?.response || []), entry],
          });
        }

        if (newOrUpdatedSingleOrBatchEntries.length === 1) {
          this.eventEmitter.emit('PUT_SINGLE', {
            path,
            statusCode,
          });
        } else {
          this.eventEmitter.emit('PUT_BATCH', {
            path,
            statusCode,
          });
        }
      });
    }

    return {
      statusCode,
    };
  }

  async onDelete(
    path: UserStorageFeatureName,
    request: MockRequest,
    statusCode = 204,
  ): Promise<{ statusCode: number }> {
    const internalPathData = this.paths.get(path);

    if (!internalPathData) {
      this.eventEmitter.emit('DELETE_NOT_FOUND', {
        path,
        statusCode,
      });

      return {
        statusCode,
      };
    }

    const isFeatureEntry = determineIfFeatureEntryFromURL(request.url);

    if (isFeatureEntry) {
      this.paths.set(path, {
        ...internalPathData,
        response: internalPathData?.response.filter(
          (entry: UserStorageEntry) =>
            entry.HashedKey !==
            getDecodedProxiedURL(request.url).split('/').pop(),
        ),
      });

      this.eventEmitter.emit('DELETE_SINGLE', {
        path,
        statusCode,
      });
    } else {
      this.paths.set(path, {
        ...internalPathData,
        response: [],
      });

      this.eventEmitter.emit('DELETE_ALL', {
        path,
        statusCode,
      });
    }

    return {
      statusCode,
    };
  }

  /**
   * @param path - path for feature
   * @param server - mockttp server instance
   * @param overrides - initial state of this mock user storage
   */
  async setupPath(
    path: UserStorageFeatureName,
    server: MockttpServerLike,
    overrides?: SetupPathOverrides,
  ): Promise<void> {
    const previouslySetupPath = this.paths.get(path);

    this.paths.set(path, {
      response: overrides?.getResponse || previouslySetupPath?.response || [],
    });

    await server
      .forGet('/proxy')
      .matching((request: unknown) =>
        pathRegexps[path].test(
          getDecodedProxiedURL((request as MockRequest).url),
        ),
      )
      .always()
      .thenCallback((request: unknown) =>
        this.onGet(path, request as MockRequest, overrides?.getStatusCode),
      );
    await server
      .forPut('/proxy')
      .matching((request: unknown) =>
        pathRegexps[path].test(
          getDecodedProxiedURL((request as MockRequest).url),
        ),
      )
      .always()
      .thenCallback((request: unknown) =>
        this.onPut(path, request as MockRequest, overrides?.putStatusCode),
      );
    await server
      .forDelete('/proxy')
      .matching((request: unknown) =>
        pathRegexps[path].test(
          getDecodedProxiedURL((request as MockRequest).url),
        ),
      )
      .always()
      .thenCallback((request: unknown) =>
        this.onDelete(
          path,
          request as MockRequest,
          overrides?.deleteStatusCode,
        ),
      );
  }
}
