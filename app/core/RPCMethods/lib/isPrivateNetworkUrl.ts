import ParsedURL from 'url-parse';

const LOCAL_HOSTNAME_SUFFIXES = [
  '.localhost',
  '.local',
  '.localdomain',
  '.internal',
  '.intranet',
  '.corp',
  '.lan',
  '.home',
  '.home.arpa',
];

// [network, prefix length]
const NON_PUBLIC_IPV4_RANGES: [number, number][] = [
  [0x00000000, 8], // 0.0.0.0/8
  [0x0a000000, 8], // 10.0.0.0/8
  [0x64400000, 10], // 100.64.0.0/10 carrier-grade NAT
  [0x7f000000, 8], // 127.0.0.0/8 loopback
  [0xa9fe0000, 16], // 169.254.0.0/16 link-local
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0000000, 24], // 192.0.0.0/24
  [0xc0a80000, 16], // 192.168.0.0/16
  [0xc6120000, 15], // 198.18.0.0/15 benchmarking
  [0xe0000000, 3], // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved
];

/**
 * Parses one IPv4 component in decimal, octal (`0` prefix) or hex (`0x`).
 *
 * @param part - A single dot-separated component.
 * @returns The numeric value, or `NaN` if the component is malformed.
 */
const parseIpv4Part = (part: string): number => {
  if (/^0x[0-9a-f]*$/i.test(part)) {
    return part.length === 2 ? 0 : parseInt(part.slice(2), 16);
  }
  if (/^0[0-7]+$/.test(part)) {
    return parseInt(part.slice(1), 8);
  }
  if (/^(0|[1-9][0-9]*)$/.test(part)) {
    return parseInt(part, 10);
  }
  return NaN;
};

/**
 * Parses an IPv4 host the way URL parsers do (including shorthand, octal and
 * hex forms such as `127.1`, `0177.0.0.1`, `0x7f000001` or `2130706433`).
 *
 * @returns The address as an unsigned 32-bit number, `null` if the host is not
 * IPv4-like, or `NaN` if it looks like IPv4 but cannot be parsed.
 */
const parseIpv4 = (hostname: string): number | null => {
  const parts = hostname.split('.');
  if (parts[parts.length - 1] === '') {
    parts.pop();
  }
  const last = parts[parts.length - 1];
  if (!last || !/^(0x[0-9a-f]*|[0-9]+)$/i.test(last)) {
    return null;
  }
  if (parts.length > 4) {
    return NaN;
  }
  const numbers = parts.map(parseIpv4Part);
  if (numbers.some((n) => Number.isNaN(n))) {
    return NaN;
  }
  const head = numbers.slice(0, -1);
  const tail = numbers[numbers.length - 1];
  if (head.some((n) => n > 255) || tail >= 256 ** (5 - numbers.length)) {
    return NaN;
  }
  return head.reduce((acc, n, i) => acc + n * 256 ** (3 - i), tail);
};

/**
 * @param address - An IPv4 address as an unsigned 32-bit number.
 * @returns Whether the address falls in a `NON_PUBLIC_IPV4_RANGES` entry.
 */
const isNonPublicIpv4 = (address: number) =>
  NON_PUBLIC_IPV4_RANGES.some(
    ([network, prefix]) =>
      Math.floor(address / 2 ** (32 - prefix)) ===
      Math.floor(network / 2 ** (32 - prefix)),
  );

/**
 * Only global unicast (2000::/3) is treated as public. 6to4 (2002::/16) is
 * rejected because it embeds an arbitrary IPv4 address.
 *
 * @param hostname - An IPv6 address without brackets.
 * @returns Whether the address is not global unicast.
 */
const isNonPublicIpv6 = (hostname: string) => {
  const firstGroup = hostname.split(':')[0];
  if (!/^[0-9a-f]{1,4}$/i.test(firstGroup)) {
    return true;
  }
  const first = parseInt(firstGroup, 16);
  // eslint-disable-next-line no-bitwise
  return (first & 0xe000) !== 0x2000 || first === 0x2002;
};

/**
 * Returns true when the URL's host is loopback, private, link-local or
 * otherwise not a public internet host. Used to stop dapp-supplied URLs from
 * making the wallet send requests into the user's local network.
 *
 * DNS names are classified by name only; a public name that resolves to a
 * private address is not detected.
 *
 * @param url - The URL to check.
 * @returns Whether the URL points at a non-public host.
 */
export const isPrivateNetworkUrl = (url: string): boolean => {
  let hostname: string;
  try {
    hostname = new ParsedURL(url).hostname.toLowerCase();
  } catch {
    return true;
  }
  hostname = hostname.replace(/^\[(.*)\]$/, '$1').replace(/\.+$/, '');

  if (!hostname) {
    return true;
  }
  if (hostname.includes(':')) {
    return isNonPublicIpv6(hostname);
  }
  // Anything other than plain LDH labels (e.g. percent-encoding) may be
  // decoded differently by the native HTTP stack, so it is not trusted.
  if (!/^[a-z0-9.-]+$/.test(hostname)) {
    return true;
  }

  const ipv4 = parseIpv4(hostname);
  if (ipv4 !== null) {
    return Number.isNaN(ipv4) || isNonPublicIpv4(ipv4);
  }

  if (!hostname.includes('.') || hostname === 'localhost') {
    return true;
  }
  return LOCAL_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
};

export default isPrivateNetworkUrl;
