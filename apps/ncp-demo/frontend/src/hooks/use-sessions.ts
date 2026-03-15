import { useEffect, useState } from "react";
import type { SessionSummary } from "../lib/session";
import { refreshSessions } from "../lib/session";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    void refreshSessions(setSessions);
  }, []);

  const refresh = () => void refreshSessions(setSessions);

  return { sessions, refresh };
}
