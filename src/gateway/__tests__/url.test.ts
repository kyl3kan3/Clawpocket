import { gatewayUrl } from "../url";

describe("gateway transport security", () => {
  it("defaults hostnames to TLS and supports explicit secure ports", () => {
    expect(gatewayUrl("gateway.example.com")).toBe("wss://gateway.example.com:18789/");
    expect(gatewayUrl("wss://gateway.example.com:443")).toBe("wss://gateway.example.com/");
  });
  it.each(["ws://10.0.0.1:18789", "http://example.com", "wss://user:secret@example.com", "wss://example.com/?token=secret"])("rejects unsafe URL %s", (url) => {
    expect(() => gatewayUrl(url)).toThrow();
  });
});
