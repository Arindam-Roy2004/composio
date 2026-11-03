import { describe, expect, it } from "vitest";
import { assertSafeUrl, isPrivateAddress, type LookupFn } from "@/lib/security/urlGuard";

const resolvesTo = (...addresses: string[]): LookupFn => async () =>
  addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));

describe("isPrivateAddress", () => {
  it.each([
    "10.1.2.3", "127.0.0.1", "0.0.0.0", "169.254.169.254", "172.16.0.1", "172.31.255.255",
    "192.168.1.1", "100.64.0.1", "224.0.0.1", "255.255.255.255", "198.18.0.1",
  ])("blocks IPv4 %s", (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "100.128.0.1", "140.82.112.3"])("allows public IPv4 %s", (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );

  it.each([
    "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "fec0::1", "ff02::1",
    "::ffff:127.0.0.1", "::ffff:169.254.169.254", "::ffff:7f00:1", "64:ff9b::a9fe:a9fe", "2002:c0a8:0101::1",
    "2001:db8::1", "fe80::1%eth0",
  ])("blocks IPv6 %s", (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(["2606:4700:4700::1111", "::ffff:8.8.8.8", "2001:4860:4860::8888"])("allows public IPv6 %s", (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );

  it("treats garbage as unsafe", () => expect(isPrivateAddress("not-an-ip")).toBe(true));
});

describe("assertSafeUrl", () => {
  const pub = resolvesTo("140.82.112.3");

  it("accepts a public https URL", async () => {
    await expect(assertSafeUrl("https://docs.github.com/en/apps", { lookup: pub })).resolves.toBeInstanceOf(URL);
  });

  it.each([
    "file:///etc/passwd",
    "javascript:alert(1)",
    "http://localhost:3000",
    "http://printer.local",
    "http://metadata.google.internal",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://2130706433/",
    "http://0x7f000001/",
    "https://user:pass@example.com/",
    "https://example.com:8443/",
    "http://intranet/",
  ])("rejects %s", async (u) => {
    await expect(assertSafeUrl(u, { lookup: pub })).rejects.toThrow();
  });

  it("rejects a hostname that resolves to a private address", async () => {
    await expect(assertSafeUrl("https://evil.example.com", { lookup: resolvesTo("10.0.0.5") })).rejects.toThrow(/private/);
  });

  it("rejects when ANY resolved address is private", async () => {
    await expect(
      assertSafeUrl("https://mixed.example.com", { lookup: resolvesTo("140.82.112.3", "fd00::1") }),
    ).rejects.toThrow(/private/);
  });

  it("rejects DNS that resolves to mapped private IPv6", async () => {
    await expect(
      assertSafeUrl("https://rebind.example.com", { lookup: resolvesTo("::ffff:192.168.0.10") }),
    ).rejects.toThrow(/private/);
  });

  it("rejects unresolvable hosts", async () => {
    const fail: LookupFn = async () => { throw new Error("ENOTFOUND"); };
    await expect(assertSafeUrl("https://nope.example.com", { lookup: fail })).rejects.toThrow(/resolve/);
  });
});
