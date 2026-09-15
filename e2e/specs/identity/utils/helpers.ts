export const determineIfFeatureEntryFromURL = (
  url: string | undefined,
): boolean => {
  const decodedUrl = decodeURIComponent(url as string);
  return (
    decodedUrl.substring(decodedUrl.lastIndexOf('userstorage') + 12).split('/')
      .length === 2
  );
};

export const getDecodedProxiedURL = (url: string | undefined): string =>
  decodeURIComponent(String(new URL(url as string).searchParams.get('url')));
