import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { PROTOCOL } from "../constants/protocol";

/**
 * Probe whether the Tailscale gateway host is reachable.
 * Returns true if reachable, false if not, null while probing.
 */
export function useTailscaleReachability(host: string | null) {
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!host) {
      setReachable(null);
      return;
    }

    let cancelled = false;

    const probe = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          PROTOCOL.TAILSCALE_PROBE_TIMEOUT_MS
        );

        const res = await fetch(`http://${host}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!cancelled) {
          setReachable(res.ok);
        }
      } catch {
        if (!cancelled) {
          setReachable(false);
        }
      }
    };

    probe();
    const interval = setInterval(probe, PROTOCOL.TAILSCALE_PROBE_INTERVAL_MS);
    const unsubscribe = NetInfo.addEventListener(() => {
      probe();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [host]);

  return reachable;
}

/**
 * Check if a hostname looks like a Tailscale address.
 */
export function isTailscaleHost(host: string): boolean {
  // 100.x.x.x range (Tailscale CGNAT)
  if (/^100\./.test(host)) return true;
  // MagicDNS .ts.net suffix
  if (host.endsWith(".ts.net")) return true;
  return false;
}
