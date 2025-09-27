import { useEffect, useRef } from "react";
import { getOrCreateWsClient } from "./create-client";
import type { AppWsClient } from "./types";

function useWsClient() {
  const wsRef = useRef<AppWsClient | null>(null);

  useEffect(() => {
    const socket = getOrCreateWsClient();
    wsRef.current = socket;
    return () => socket.disconnect();
  }, []);

  return wsRef.current;
}

export { useWsClient };
