export const getAllUrlParams = (url) => {
  const queryString = url.split('?')?.[1];
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = {};
  if (queryString) {
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      obj[key] = value;
    });
  }
  return obj;
};

export default getAllUrlParams;