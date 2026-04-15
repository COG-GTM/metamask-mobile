

import { box } from './box';

export const section = ({
  element: e,
  theme,
  ...params
}) => {
  const { children, props } = box({
    element: e,
    theme,
    ...params
  });

  return {
    element: 'Box',
    children,
    props: {
      ...props,
      padding: 16,
      gap: 8,
      // This is meant to be the inverse color of the container background.
      // TODO: Support multiple background colors.
      backgroundColor: theme.colors.background.alternative,
      borderRadius: 8
    }
  };
};