export const determineIfFeatureEntryFromURL = (url: string): boolean => {
  const decodedUrl = decodeURIComponent(url);
  return (
    decodedUrl.substring(decodedUrl.lastIndexOf('userstorage') + 12).split('/')
      .length === 2
  );
};

export const getDecodedProxiedURL = (url: string): string =>
  decodeURIComponent(String(new URL(url).searchParams.get('url')));
