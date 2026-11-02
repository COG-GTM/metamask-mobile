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

const SNAPS_NPM_EXTRACTION_DIR = 'snaps-npm';

/**
 * Creates a fresh, unique directory for a single tarball download and
 * extraction, so archive entries can never land on top of existing app files.
 */
const createExtractionRoot = async (): Promise<string> => {
  const extractionRoot = `${
    ReactNativeBlobUtil.fs.dirs.CacheDir
  }/${SNAPS_NPM_EXTRACTION_DIR}/${uuidv4()}`;
  await ReactNativeBlobUtil.fs.mkdir(extractionRoot);
  return extractionRoot;
};

const fetchAndStoreNPMPackage = async (
  inputRequest: RequestInfo,
  extractionRoot: string,
): Promise<string> => {
  const filePath = `${extractionRoot}/archive.tgz`;
  const contentsDir = `${extractionRoot}/contents`;
  const expectedPackageDir = `${contentsDir}/package`;
  const urlToFetch: string =
    typeof inputRequest === 'string' ? inputRequest : inputRequest.url;

  try {
    const response: FetchBlobResponse = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: filePath,
    }).fetch('GET', urlToFetch);
    try {
      const dataPath = response.data;
      const { size } = await ReactNativeBlobUtil.fs.stat(dataPath);
      if (Number(size) > TARBALL_SIZE_SAFETY_LIMIT) {
        throw new Error('Snap tarball exceeds size limit');
      }
      await decompressFile(dataPath, contentsDir);
      return expectedPackageDir;
    } finally {
      // remove response file from cache
      response.flush();
    }
  } catch (error) {
    throw new Error(
      `${SNAPS_NPM_LOG_TAG} fetchAndStoreNPMPackage failed to fetch with error: ${error}`,
    );
  }
};

const cleanupFileSystem = async (path: string) => {
  try {
    await ReactNativeBlobUtil.fs.unlink(path);
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
    const extractionRoot = await createExtractionRoot();
    try {
      // Fetches and unpacks the NPM package on the local filesystem using native code
      const npmPackageDataLocation = await fetchAndStoreNPMPackage(
        tarballUrl.toString(),
        extractionRoot,
      );

      // Find all paths contained within the tarball
      const paths = await findAllPaths(npmPackageDataLocation);

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
      await cleanupFileSystem(extractionRoot);
    }
  }
}
///: END:ONLY_INCLUDE_IF
