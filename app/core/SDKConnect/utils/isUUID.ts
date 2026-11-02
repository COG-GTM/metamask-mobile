export const isUUID = (str: string) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * SDK channel ids are used directly as PermissionController subjects, the
 * same namespace as in-app browser hostnames. Only UUIDs are accepted so an
 * SDK connection can never collide with (and inherit) a website's permissions.
 */
export const isValidSDKChannelId = (channelId: unknown): channelId is string =>
  typeof channelId === 'string' && isUUID(channelId);
