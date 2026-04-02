import { useCallback, useEffect, useState } from "react";
import { useNodesStore } from "../stores/nodes";
import { PROTOCOL } from "../constants/protocol";
import type { ExecApproval } from "../gateway/types";

/**
 * Hook for managing exec approval queue with countdown timers.
 */
export function useExecApproval() {
  const pendingApprovals = useNodesStore((s) => s.pendingApprovals);
  const resolveApproval = useNodesStore((s) => s.resolveApproval);

  // The currently shown approval (first in queue)
  const currentApproval = pendingApprovals[0] ?? null;

  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!currentApproval) {
      setRemainingMs(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = currentApproval.expiresAt - Date.now();
      setRemainingMs(Math.max(0, remaining));

      if (remaining <= 0) {
        // Auto-expired — remove from queue
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [currentApproval]);

  const approve = useCallback(
    (action: "allow_once" | "allow_always" | "deny") => {
      if (currentApproval) {
        resolveApproval(currentApproval.id, action);
      }
    },
    [currentApproval, resolveApproval]
  );

  return {
    currentApproval,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    queueLength: pendingApprovals.length,
    approve,
    hasApprovals: pendingApprovals.length > 0,
  };
}
