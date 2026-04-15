/* eslint-disable import/prefer-default-export */
import { useMemo } from 'react';
import { useAppThemeFromContext } from '../../util/theme';


/**
 * Hook that handles both passing style sheet variables into style sheet and memoization.
 *
 * @param styleSheet Return value of useStyles hook.
 * @param vars Variables of styleSheet function.
 * @returns StyleSheet object.
 */
export const useStyles = (
styleSheet,
vars) =>
{
  const theme = useAppThemeFromContext();
  const styles = useMemo(
    () => styleSheet({ theme, vars }),
    [styleSheet, theme, vars]
  );
  return { styles, theme };
};