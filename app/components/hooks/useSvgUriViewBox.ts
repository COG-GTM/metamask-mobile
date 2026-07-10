import { useEffect, useState } from 'react';
import { isSafeSvgUri } from '../../util/url';

/**
 * Support svg images urls that do not have a view box
 * See: https://github.com/software-mansion/react-native-svg/issues/1202#issuecomment-1891110599
 *
 * This will return the default SVG ViewBox from an SVG URI
 * @param uri - uri to fetch
 * @param isSVG - check to see if the uri is an svg
 * @returns viewbox string
 */
export default function useSvgUriViewBox(
  uri: string,
  isSVG: boolean,
): string | undefined {
  const [viewBox, setViewBox] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isSVG || !isSafeSvgUri(uri)) {
      return;
    }

    fetch(uri)
      .then((response) => {
        // Mirror the content-type guard applied to react-native-svg's own
        // fetch so attacker-influenced URLs can't be probed via this pre-fetch.
        const contentType = response.headers.get('content-type') || '';
        if (['text/html', ''].includes(contentType)) {
          throw new Error(
            `Fetching ${uri} resulted in invalid content-type ${contentType}`,
          );
        }
        return response.text();
      })
      .then((svgContent) => {
        const widthMatch = svgContent.match(/width="([^"]+)"/);
        const heightMatch = svgContent.match(/height="([^"]+)"/);
        const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);

        if (viewBoxMatch?.[1]) {
          setViewBox(viewBoxMatch[1]);
          return;
        }

        if (widthMatch?.[1] && heightMatch?.[1]) {
          const width = widthMatch[1];
          const height = heightMatch[1];
          setViewBox(`0 0 ${width} ${height}`);
        }
      })
      .catch((error) => console.error('Error fetching SVG:', error));
  }, [isSVG, uri]);

  if (!viewBox) {
    return undefined;
  }

  return viewBox;
}
