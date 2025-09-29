import { useEffect, useRef } from "react";
import { connectWsClient } from "./create-client";
import type { AppWsClient } from "./types";

function useWsClient() {
  const wsRef = useRef<AppWsClient | null>(null);

  useEffect(() => {
    const socket = connectWsClient();
    wsRef.current = socket;
    return () => socket.disconnect();
  }, []);

  return wsRef.current;
}

export { useWsClient };
