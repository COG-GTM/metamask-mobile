import {
  preventJavaScriptFileAdditions,
  preventJavaScriptFileAdditionsStrict,
} from './javascript-additions';
import { preventCodeBlocksRule } from './prevent-code-blocks';
import { preventAnyTypeAdditions } from './typescript-any-additions';
import { trackMigrationProgress } from './migration-progress';

const RULES: IRule[] = [
  {
    name: 'Check for blacklisted code blocks',
    fn: preventCodeBlocksRule,
    docURL: '[WIP] No documentation exists for this rule yet.',
  },
  {
    name: 'Check for js or jsx file being added in app folder',
    fn: preventJavaScriptFileAdditions,
    docURL: '[WIP] No documentation exists for this rule yet.',
  },
  {
    name: 'Check for js or jsx file being added in source folders (app, e2e)',
    fn: preventJavaScriptFileAdditionsStrict,
    docURL: '[WIP] No documentation exists for this rule yet.',
  },
  {
    name: 'Check for explicit any type additions in TypeScript files',
    fn: preventAnyTypeAdditions,
    docURL: '[WIP] No documentation exists for this rule yet.',
  },
];

interface IRule {
  name: string;
  fn: (diff: string) => boolean;
  docURL?: string;
}

function runFitnessFunctionRule(rule: IRule, diff: string): void {
  const { name, fn, docURL } = rule;
  console.log(`Checking rule "${name}"...`);

  const hasRulePassed: boolean = fn(diff) as boolean;
  if (hasRulePassed === true) {
    console.log(`...OK`);
  } else {
    console.log(`...FAILED. Changes not accepted by the fitness function.`);

    if (docURL) {
      console.log(`For more info: ${docURL}.`);
    }

    process.exit(1);
  }
}

export {
  RULES,
  runFitnessFunctionRule,
  preventJavaScriptFileAdditions,
  preventJavaScriptFileAdditionsStrict,
  preventAnyTypeAdditions,
  trackMigrationProgress,
};
export type { IRule };
