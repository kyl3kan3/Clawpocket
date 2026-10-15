import test from 'node:test';
import assert from 'node:assert/strict';
import { gatewayUrl } from '../src/gateway/url.ts';

test('secure endpoints support host, custom port, IPv6 and TLS URL', () => {
  assert.equal(gatewayUrl('gateway.example'), 'wss://gateway.example:18789/');
  assert.equal(gatewayUrl('gateway.example:9000'), 'wss://gateway.example:9000/');
  assert.equal(gatewayUrl('[::1]:9000'), 'wss://[::1]:9000/');
  assert.equal(gatewayUrl('wss://gateway.example:443'), 'wss://gateway.example/');
});
test('plaintext, credentials, query tokens and paths are rejected', () => {
  for (const input of ['ws://10.0.0.1:18789','http://example.com','wss://u:p@example.com','wss://example.com/?token=x','wss://example.com/socket','']) assert.throws(() => gatewayUrl(input));
});
