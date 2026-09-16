import {
  USER_STORAGE_FEATURE_NAMES,
  GetUserStorageAllFeatureEntriesResponse,
} from '@metamask/profile-sync-controller/sdk';
import { CompletedRequest, Mockttp } from 'mockttp';
import {
  determineIfFeatureEntryFromURL,
  getDecodedProxiedURL,
} from '../helpers';
// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';

const baseUrl =
  'https://user-storage\\.api\\.cx\\.metamask\\.io\\/api\\/v1\\/userstorage';

export const pathRegexps = {
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

export type UserStorageMockttpControllerPath = keyof typeof pathRegexps;

type UserStorageResponseData = GetUserStorageAllFeatureEntriesResponse[number];

interface UserStorageMockttpControllerOverrides {
  getResponse?: GetUserStorageAllFeatureEntriesResponse;
  getStatusCode?: number;
  putStatusCode?: number;
  deleteStatusCode?: number;
}

export class UserStorageMockttpController {
  paths: Map<
    UserStorageMockttpControllerPath,
    { response: UserStorageResponseData[] }
  > = new Map();

  eventEmitter = new EventEmitter();

  async onGet(
    path: UserStorageMockttpControllerPath,
    request: Pick<CompletedRequest, 'url'>,
    statusCode = 200,
  ) {
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
          (entry) =>
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
    path: UserStorageMockttpControllerPath,
    request: Pick<CompletedRequest, 'url' | 'body'>,
    statusCode = 204,
  ) {
    const isFeatureEntry = determineIfFeatureEntryFromURL(request.url);

    const data = (await request.body.getJson()) as
      | {
          batch_delete?: string[];
          data?: string | Record<string, string>;
        }
      | undefined;

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
          (entry) => !keysToDelete.includes(entry.HashedKey),
        ),
      });

      this.eventEmitter.emit('DELETE_BATCH', {
        path,
        statusCode,
      });
    }

    if (data?.data) {
      const newOrUpdatedSingleOrBatchEntries =
        isFeatureEntry && typeof data?.data === 'string'
          ? [
              {
                HashedKey: getDecodedProxiedURL(request.url)
                  .split('/')
                  .pop() as string,
                Data: data?.data,
              },
            ]
          : Object.entries(data?.data).map(([key, value]) => ({
              HashedKey: key,
              Data: value as string,
            }));

      newOrUpdatedSingleOrBatchEntries.forEach((entry) => {
        const internalPathData = this.paths.get(path);

        if (!internalPathData) {
          return;
        }

        const doesThisEntryExist = internalPathData.response?.find(
          (existingEntry) => existingEntry.HashedKey === entry.HashedKey,
        );

        if (doesThisEntryExist) {
          this.paths.set(path, {
            ...internalPathData,
            response: internalPathData.response.map((existingEntry) =>
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
    path: UserStorageMockttpControllerPath,
    request: Pick<CompletedRequest, 'url'>,
    statusCode = 204,
  ) {
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
          (entry) =>
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
   * @param server
   * @param overrides - initial state of this mock user storage
   */
  async setupPath(
    path: UserStorageMockttpControllerPath,
    server: Mockttp,
    overrides?: UserStorageMockttpControllerOverrides,
  ) {
    const previouslySetupPath = this.paths.get(path);

    this.paths.set(path, {
      response: overrides?.getResponse || previouslySetupPath?.response || [],
    });

    await server
      .forGet('/proxy')
      .matching((request) =>
        pathRegexps[path].test(getDecodedProxiedURL(request.url)),
      )
      .always()
      .thenCallback((request) =>
        this.onGet(path, request, overrides?.getStatusCode),
      );
    await server
      .forPut('/proxy')
      .matching((request) =>
        pathRegexps[path].test(getDecodedProxiedURL(request.url)),
      )
      .always()
      .thenCallback((request) =>
        this.onPut(path, request, overrides?.putStatusCode),
      );
    await server
      .forDelete('/proxy')
      .matching((request) =>
        pathRegexps[path].test(getDecodedProxiedURL(request.url)),
      )
      .always()
      .thenCallback((request) =>
        this.onDelete(path, request, overrides?.deleteStatusCode),
      );
  }
}
