import React from 'react';
import useFavicon from './useFavicon';


const withFaviconAwareness =
(
Children) =>



// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(props) => {
  const { url } = props;
  const favicon = useFavicon(url);

  let faviconSource;
  if (
  typeof favicon === 'object' &&
  favicon !== null &&
  !Array.isArray(favicon))
  {
    faviconSource = favicon.uri;
  }

  return <Children {...props} {...faviconSource && { faviconSource }} />;
};

export default withFaviconAwareness;