/**
 * `GenericButton` only exists as platform-specific modules (`index.ios.tsx` and
 * `index.android.tsx`), which Metro resolves but TypeScript does not. Both
 * implementations expose the same props, so re-export one of them as the type
 * of the directory import. This declaration is invisible to Metro and Jest,
 * which never resolve `index.d.ts` for a directory import.
 */
export { default } from './index.ios';
