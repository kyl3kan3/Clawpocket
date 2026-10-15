# Gateway transport

Gateway sessions now require WSS. A bare hostname or IP uses port 18789; explicit `wss://host:port` URLs are supported. Configure TLS with a certificate trusted by the device (including Tailscale/private-network gateways). Plain WS and credentials embedded in URLs are rejected before a socket opens. The application does not disable certificate validation.

If an existing gateway only supports plaintext, put it behind a TLS reverse proxy before reconnecting. Rotate gateway tokens that may previously have crossed untrusted networks.

## Focused offline verification

Run with Node 24: `node --test tests/transport-security.test.mjs`. These regression tests isolate network, framework, and persistence dependencies; they do not replace the full app build, live-provider integration, or staging migration tests.
