/** Tokens must never be sent over an unencrypted WebSocket. */
export function gatewayUrl(input: string): string {
  const value = input.trim();
  const explicitScheme = value.includes('://');
  const url = new URL(explicitScheme ? value : `wss://${value}`);
  if (url.protocol !== 'wss:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Use a secure wss:// gateway URL without embedded credentials.');
  }
  if (!url.hostname || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error('Enter the gateway host or its wss:// URL.');
  }
  if (!explicitScheme && !url.port) url.port = '18789';
  return url.toString();
}
