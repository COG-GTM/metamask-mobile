/* eslint-disable import/prefer-default-export */
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { VirtualFile } from '@metamask/snaps-utils';
import { stringToBytes } from '@metamask/utils';
import { NativeModules } from 'react-native';
import ReactNativeBlobUtil, { FetchBlobResponse } from 'react-native-blob-util';
import {
  BaseNpmLocation,
  getNpmCanonicalBasePath,
  TARBALL_SIZE_SAFETY_LIMIT,
} from '@metamask/snaps-controllers';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../../../util/Logger';

const { RNTar } = NativeModules;

const SNAPS_NPM_LOG_TAG = 'snaps/ NPM';

/**
 * Maximum number of entries in a Snap tarball. Also enforced by the native
 * RNTar extractors (android RNTar/TarExtractor.java, ios/RnTar.swift).
 */
export const MAX_TARBALL_ENTRIES = 5000;

/**
 * Directory (relative to DocumentDir) where Snap tarballs are downloaded and
 * extracted, each into its own fresh subdirectory.
 */
export const SNAPS_NPM_EXTRACTION_DIR = 'snaps-npm';

const decompressFile = async (
  path: string,
  targetPath: string,
): Promise<string> => {
  try {
    const decompressedDataLocation = await RNTar.unTar(path, targetPath);
    if (decompressedDataLocation) {
      return decompressedDataLocation;
    }
    throw new Error('Was unable to decompress tgz file');
  } catch (error) {
    throw new Error(`${SNAPS_NPM_LOG_TAG} decompressFile error: ${error}`);
  }
};

const findAllPaths = async (path: string): Promise<string[]> => {
  const isDir = await ReactNativeBlobUtil.fs.isDir(path);
  if (!isDir) {
    return [path];
  }
  const fileNames = await ReactNativeBlobUtil.fs.ls(path);
  const paths = fileNames.map((fileName) => `${path}/${fileName}`);
  return (await Promise.all(paths.map(findAllPaths))).flat(
    Infinity,
  ) as string[];
};

const readAndParseAt = async (path: string) => {
  try {
    const contents = stringToBytes(
      await ReactNativeBlobUtil.fs.readFile(path, 'utf8'),
    );
    return { path, contents };
  } catch (error) {
    throw new Error(`${SNAPS_NPM_LOG_TAG} readAndParseAt error: ${error}`);
  }
};

interface StoredNpmPackage {
  extractionDir: string;
  packagePath: string;
}

const fetchAndStoreNPMPackage = async (
  inputRequest: RequestInfo,
): Promise<StoredNpmPackage> => {
  const baseDir = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${SNAPS_NPM_EXTRACTION_DIR}`;
  const id = uuidv4();
  const extractionDir = `${baseDir}/${id}`;
  const filePath = `${baseDir}/${id}.tgz`;
  const urlToFetch: string =
    typeof inputRequest === 'string' ? inputRequest : inputRequest.url;

  let response: FetchBlobResponse | undefined;
  try {
    if (!(await ReactNativeBlobUtil.fs.isDir(baseDir))) {
      await ReactNativeBlobUtil.fs.mkdir(baseDir);
    }
    let exceededSizeLimit = false;
    const task = ReactNativeBlobUtil.config({
      fileCache: true,
      path: filePath,
    }).fetch('GET', urlToFetch);
    task.progress((received: string, total: string) => {
      if (
        Number(received) > TARBALL_SIZE_SAFETY_LIMIT ||
        Number(total) > TARBALL_SIZE_SAFETY_LIMIT
      ) {
        exceededSizeLimit = true;
        task.cancel();
      }
    });
    try {
      response = await task;
    } catch (error) {
      if (exceededSizeLimit) {
        throw new Error('Snap tarball exceeds size limit');
      }
      throw error;
    }
    const dataPath = response.data;
    const { size } = await ReactNativeBlobUtil.fs.stat(dataPath);
    if (exceededSizeLimit || Number(size) > TARBALL_SIZE_SAFETY_LIMIT) {
      throw new Error('Snap tarball exceeds size limit');
    }
    const packagePath = await decompressFile(dataPath, extractionDir);
    return { extractionDir, packagePath };
  } catch (error) {
    await cleanupFileSystem(extractionDir);
    throw new Error(
      `${SNAPS_NPM_LOG_TAG} fetchAndStoreNPMPackage failed to fetch with error: ${error}`,
    );
  } finally {
    // remove downloaded archive
    await cleanupFileSystem(filePath);
  }
};

const cleanupFileSystem = async (path: string) => {
  try {
    if (await ReactNativeBlobUtil.fs.exists(path)) {
      await ReactNativeBlobUtil.fs.unlink(path);
    }
  } catch (error) {
    Logger.error(
      error as Error,
      `${SNAPS_NPM_LOG_TAG} cleanupFileSystem failed to clean files at path`,
    );
  }
};

export class NpmLocation extends BaseNpmLocation {
  async fetchNpmTarball(
    tarballUrl: URL,
  ): Promise<Map<string, VirtualFile<unknown>>> {
    // Fetches and unpacks the NPM package on the local filesystem using native code
    const { extractionDir, packagePath: npmPackageDataLocation } =
      await fetchAndStoreNPMPackage(tarballUrl.toString());

    try {
      // Find all paths contained within the tarball
      const paths = await findAllPaths(npmPackageDataLocation);
      if (paths.length > MAX_TARBALL_ENTRIES) {
        throw new Error(
          `${SNAPS_NPM_LOG_TAG} Snap tarball exceeds limit of ${MAX_TARBALL_ENTRIES} entries`,
        );
      }

      const files = await Promise.all(paths.map(readAndParseAt));

      const canonicalBase = getNpmCanonicalBasePath(
        this.meta.registry,
        this.meta.packageName,
      );

      const map = new Map();

      files.forEach(({ path, contents }) => {
        // Remove most of the base path
        const normalizedPath = path.replace(`${npmPackageDataLocation}/`, '');
        map.set(
          normalizedPath,
          new VirtualFile({
            value: contents,
            path: normalizedPath,
            data: { canonicalPath: new URL(path, canonicalBase).toString() },
          }),
        );
      });

      return map;
    } finally {
      // Cleanup filesystem
      await cleanupFileSystem(extractionDir);
    }
  }
}
///: END:ONLY_INCLUDE_IF
