/* eslint-disable no-console */
/* eslint-disable import/no-nodejs-modules */
/* eslint-disable import/no-commonjs */
const path = require('path');
const {
  removeFencedCode,
  lintTransformedFile,
} = require('@metamask/build-utils');
const { ESLint } = require('eslint');
const { parseSync } = require('@babel/core');
// Expo's transformer passes Metro's source type to babel-preset-expo, which keeps @babel/runtime
// helper imports out of polyfill scripts (they run before `require` exists).
const defaultTransformer = require(require.resolve(
  '@expo/metro-config/babel-transformer',
  {
    paths: [require.resolve('expo/package.json')],
  },
));
const svgTransformer = require('react-native-svg-transformer');

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
 * @returns {Set<string>} The set of features to be included in the build.
 */
function getBuildTypeFeatures() {
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

const babelTransform = async ({ src, filename, options }) => {
  const result = await defaultTransformer.transform({ src, filename, options });
  // Babel returns a null AST for files matched by `ignore` in babel.config.js (e.g. ses.cjs).
  // Expo's Metro worker would then re-parse them with @babel/core, which loads babel.config.js
  // without a filename and throws, so parse them here without any config instead.
  if (!result.ast) {
    return {
      ...result,
      ast: parseSync(src, {
        filename,
        sourceType: 'unambiguous',
        configFile: false,
        babelrc: false,
      }),
    };
  }
  return result;
};

/**
 * The Metro transformer function. Notably, handles code fence removal.
 * See https://github.com/MetaMask/core/tree/main/packages/build-utils for details.
 */
module.exports.transform = async ({ src, filename, options }) => {
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
    const [processedSource, didModify] = removeFencedCode(filename, src, {
      all: availableFeatures,
      active: getBuildTypeFeatures(),
    });

    if (didModify) {
      await lintTransformedFile(getESLintInstance(), filename, processedSource);
    }
    return babelTransform({
      src: processedSource,
      filename,
      options,
    });
  }
  return babelTransform({ src, filename, options });
};

/**
 * The singleton ESLint instance.
 *
 * @type {ESLint}
 */
let eslintInstance;

/**
 * Gets the singleton ESLint instance, initializing it if necessary.
 * Initializing involves reading the ESLint configuration from disk and
 * modifying it according to the needs of code fence removal.
 *
 * @returns {ESLint} The singleton ESLint instance.
 */
function getESLintInstance() {
  if (!eslintInstance) {
    const eslintrc = require('./.eslintrc.js');

    eslintrc.overrides.forEach((override) => {
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
    eslintrc.rules['prettier/prettier'] = 0;
    // Sometimes we use `let` instead of `const` to assign variables depending on
    // the build type.
    eslintrc.rules['prefer-const'] = 0;

    // Remove all test-related overrides. We will never lint test files here.
    eslintrc.overrides = eslintrc.overrides.filter(
      (override) =>
        !(
          (override.extends &&
            override.extends.find(
              (configName) =>
                configName.includes('jest') || configName.includes('mocha'),
            )) ||
          (override.plugins &&
            override.plugins.find((pluginName) => pluginName.includes('jest')))
        ),
    );

    eslintInstance = new ESLint({ baseConfig: eslintrc, useEslintrc: false });
  }
  return eslintInstance;
}
