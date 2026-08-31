import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/appStore';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const { addAlert } = useAppStore();

  useEffect(() => {
    let timeout: any;
    const connect = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws/events');
      ws.current.onopen = () => setConnected(true);
      ws.current.onclose = () => {
        setConnected(false);
        timeout = setTimeout(connect, 3000);
      };
      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'ALERT') {
          addAlert(data.payload);
        }
      };
    };
    
    // connect(); // Disabled for simulation
    return () => {
      clearTimeout(timeout);
      ws.current?.close();
    };
  }, [addAlert]);

  return { connected };
}
