/* eslint-disable no-console */
/* eslint-disable import/no-nodejs-modules */
import path from 'path';
import {
  removeFencedCode,
  lintTransformedFile,
  FeatureLabels,
} from '@metamask/build-utils';
import { ESLint, Linter } from 'eslint';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const defaultTransformer = require('metro-react-native-babel-transformer') as {
  transform: (options: TransformOptions) => unknown;
};
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const svgTransformer = require('react-native-svg-transformer') as {
  transform: (options: TransformOptions) => unknown;
};

interface TransformOptions {
  src: string;
  filename: string;
  options: Record<string, unknown>;
}

// Code fence removal variables
const fileExtsToScan = ['.js', '.jsx', '.cjs', '.mjs', '.ts', '.tsx'];
const availableFeatures = new Set([
  'flask',
  'preinstalled-snaps',
  'external-snaps',
  'beta',
  'keyring-snaps',
  'multi-srp',
  'bitcoin',
  'solana',
]);

const mainFeatureSet = new Set(['preinstalled-snaps', 'multi-srp']);
const betaFeatureSet = new Set([
  'beta',
  'preinstalled-snaps',
  'keyring-snaps',
  'multi-srp',
  'solana',
]);
const flaskFeatureSet = new Set([
  'flask',
  'preinstalled-snaps',
  'external-snaps',
  'keyring-snaps',
  'multi-srp',
  'bitcoin',
  'solana',
]);

/**
 * Gets the features for the current build type, used to determine which code
 * fences to remove.
 *
 * @returns The set of features to be included in the build.
 */
function getBuildTypeFeatures(): Set<string> {
  const buildType = process.env.METAMASK_BUILD_TYPE ?? 'main';
  switch (buildType) {
    case 'main':
      return mainFeatureSet;
    case 'beta':
      return betaFeatureSet;
    case 'flask':
      return flaskFeatureSet;
    default:
      throw new Error(
        `Invalid METAMASK_BUILD_TYPE of ${buildType} was passed to metro transform`,
      );
  }
}

/**
 * The Metro transformer function. Notably, handles code fence removal.
 * See https://github.com/MetaMask/core/tree/main/packages/build-utils for details.
 */
export const transform = async ({
  src,
  filename,
  options,
}: TransformOptions): Promise<unknown> => {
  if (filename.endsWith('.svg')) {
    return svgTransformer.transform({ src, filename, options });
  }

  /**
   * Params based on builds we're code splitting
   * i.e: flavorDimensions "version" productFlavors from android/app/build.gradle
   */
  if (
    !path.normalize(filename).split(path.sep).includes('node_modules') &&
    fileExtsToScan.includes(path.extname(filename))
  ) {
    const featureLabels: FeatureLabels = {
      all: availableFeatures,
      active: getBuildTypeFeatures(),
    };
    const [processedSource, didModify] = removeFencedCode(
      filename,
      src,
      featureLabels,
    );

    if (didModify) {
      await lintTransformedFile(
        getESLintInstance(),
        filename,
        processedSource,
      );
    }
    return defaultTransformer.transform({
      src: processedSource,
      filename,
      options,
    });
  }
  return defaultTransformer.transform({ src, filename, options });
};

/**
 * The singleton ESLint instance.
 */
let eslintInstance: ESLint | undefined;

/**
 * Gets the singleton ESLint instance, initializing it if necessary.
 * Initializing involves reading the ESLint configuration from disk and
 * modifying it according to the needs of code fence removal.
 *
 * @returns The singleton ESLint instance.
 */
function getESLintInstance(): ESLint {
  if (!eslintInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const eslintrc = require('./.eslintrc.js') as Linter.Config;

    eslintrc.overrides?.forEach((override) => {
      const rules = override.rules ?? {};

      // We don't want linting to fail for purely stylistic reasons.
      rules['prettier/prettier'] = 'off';
      // Sometimes we use `let` instead of `const` to assign variables depending on
      // the build type.
      rules['prefer-const'] = 'off';

      override.rules = rules;
    });

    // also override the rules section
    // We don't want linting to fail for purely stylistic reasons.
    if (eslintrc.rules) {
      eslintrc.rules['prettier/prettier'] = 0;
      // Sometimes we use `let` instead of `const` to assign variables depending on
      // the build type.
      eslintrc.rules['prefer-const'] = 0;
    }

    // Remove all test-related overrides. We will never lint test files here.
    if (eslintrc.overrides) {
      eslintrc.overrides = eslintrc.overrides.filter(
        (override) =>
          !(
            (override.extends &&
              (Array.isArray(override.extends)
                ? override.extends
                : [override.extends]
              ).find(
                (configName) =>
                  configName.includes('jest') || configName.includes('mocha'),
              )) ||
            (override.plugins &&
              override.plugins.find((pluginName) =>
                pluginName.includes('jest'),
              ))
          ),
      );
    }

    eslintInstance = new ESLint({ baseConfig: eslintrc, useEslintrc: false });
  }
  return eslintInstance;
}
