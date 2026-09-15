// Type-only entry point so `import GenericButton from '../GenericButton'`
// resolves under tsc, which does not understand the platform-specific
// `index.ios.tsx` / `index.android.tsx` suffixes that Metro and Jest use.
import GenericButton from './index.ios';

export default GenericButton;
