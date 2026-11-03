// SSRF guard. Ported from Sagewell backend/shared/libs/urlGuard.js and extended:
// CGNAT, multicast/reserved, IPv6 ULA/link-local/site-local, IPv4-mapped/NAT64/6to4
// addresses are checked against the embedded IPv4, and DNS lookup is injectable for tests.
import dns from "node:dns/promises";
import net from "node:net";
import { BadRequestError } from "@/lib/http/errors";

export type LookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

const defaultLookup: LookupFn = (hostname) => dns.lookup(hostname, { all: true, verbatim: true });

const ALLOWED_PORTS = new Set(["", "80", "443"]);

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, p) => (acc << 8) + Number(p), 0) >>> 0;
}

function inV4Cidr(ip: number, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ip & mask) === (ipv4ToInt(base) & mask);
}

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local / cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

export function isPrivateIPv4(ip: string): boolean {
  if (net.isIPv4(ip) === false) return true;
  const n = ipv4ToInt(ip);
  return BLOCKED_V4.some(([base, bits]) => inV4Cidr(n, base, bits));
}

/** Expands an IPv6 address (optionally with an embedded dotted IPv4 tail) into 8 hextets. */
function expandIPv6(ip: string): number[] | null {
  let addr = ip.split("%")[0]!.toLowerCase();
  const tail = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    if (!net.isIPv4(tail[1]!)) return null;
    const n = ipv4ToInt(tail[1]!);
    addr = addr.slice(0, -tail[1]!.length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - head.length - rest.length : 0;
  if (fill < 0) return null;
  const parts = [...head, ...Array(fill).fill("0"), ...rest];
  if (parts.length !== 8) return null;
  const nums = parts.map((p) => parseInt(p, 16));
  return nums.some((x) => Number.isNaN(x) || x < 0 || x > 0xffff) ? null : nums;
}

function v4FromHextets(hi: number, lo: number): string {
  return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff].join(".");
}

export function isPrivateIPv6(ip: string): boolean {
  const h = expandIPv6(ip);
  if (!h) return true;
  const allZeroPrefix = (n: number) => h.slice(0, n).every((x) => x === 0);

  if (h.every((x) => x === 0)) return true; // ::
  if (allZeroPrefix(7) && h[7] === 1) return true; // ::1
  if (allZeroPrefix(5) && h[5] === 0xffff) return isPrivateIPv4(v4FromHextets(h[6]!, h[7]!)); // ::ffff:a.b.c.d
  if (allZeroPrefix(6)) return true; // deprecated IPv4-compatible ::a.b.c.d
  if (h[0] === 0x64 && h[1] === 0xff9b && h.slice(2, 6).every((x) => x === 0))
    return isPrivateIPv4(v4FromHextets(h[6]!, h[7]!)); // NAT64 64:ff9b::/96
  if (h[0] === 0x2002) return isPrivateIPv4(v4FromHextets(h[1]!, h[2]!)); // 6to4
  if ((h[0]! & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
  if ((h[0]! & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((h[0]! & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((h[0]! & 0xff00) === 0xff00) return true; // multicast
  if (h[0] === 0x2001 && h[1] === 0x0db8) return true; // documentation
  return false;
}

export function isPrivateAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIPv4(address);
  if (family === 6) return isPrivateIPv6(address);
  return true; // unknown family = unsafe
}

function bareHostname(url: URL): string {
  return url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

/**
 * Synchronous checks that need no DNS: scheme, credentials, port, blocked hostnames and literal IPs.
 * Used by sanitizeQuery (inside a sync DTO) and as the first half of assertSafeUrl.
 */
export function assertSafeUrlSync(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BadRequestError("Only http and https URLs are allowed");
  }
  if (url.username || url.password) throw new BadRequestError("URLs with credentials are not allowed");
  if (!ALLOWED_PORTS.has(url.port)) throw new BadRequestError("Only default ports are allowed");

  const host = bareHostname(url);
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home.arpa") ||
    !host.includes(".") && !net.isIP(host)
  ) {
    throw new BadRequestError("This host is not allowed");
  }
  if (net.isIP(host) && isPrivateAddress(host)) {
    throw new BadRequestError("This address range is not allowed");
  }
  return url;
}

/** Full guard: sync checks, then reject if ANY resolved address is private. */
export async function assertSafeUrl(rawUrl: string, opts: { lookup?: LookupFn } = {}): Promise<URL> {
  const url = assertSafeUrlSync(rawUrl);
  const host = bareHostname(url);
  if (net.isIP(host)) return url;

  let addresses: { address: string }[];
  try {
    addresses = await (opts.lookup ?? defaultLookup)(host);
  } catch {
    throw new BadRequestError("Could not resolve this host");
  }
  if (!addresses.length) throw new BadRequestError("Could not resolve this host");
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new BadRequestError("This host resolves to a private address and is not allowed");
    }
  }
  return url;
}
