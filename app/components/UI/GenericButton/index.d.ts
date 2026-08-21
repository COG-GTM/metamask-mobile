// Platform specific implementations live in `index.ios.tsx` and
// `index.android.tsx`; TypeScript does not resolve platform extensions, so the
// iOS implementation types are re-exported here for type checking.
export { default } from './index.ios';
