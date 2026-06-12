import { useEffect, useRef, useState } from "react";
import { CORE_URL } from "./const";

export function useCoreWs() {
  const [status, setStatus] = useState<
    "connected" | "disconnected" | "pending"
  >("pending");
  const websocket = useRef<WebSocket>(null);

  useEffect(() => {
    const ws = new WebSocket(CORE_URL + "/ws");
    websocket.current = ws;

    ws.onopen = () => {
      setStatus("connected");
    };
    ws.onclose = () => {
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  return { status };
}
