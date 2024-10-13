import { useState, useEffect, useRef } from "react";

const useFirestoreSnapshots = (collections, stateSetterFunctions) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5000");

    ws.current.onopen = () => {
      setIsConnected(true);
      ws.current.send(JSON.stringify({ collections }));
    };

    ws.current.onmessage = (event) => {
      const { collection, data } = JSON.parse(event.data);
      const stateSetter = stateSetterFunctions[collection];
      if (stateSetter) {
        stateSetter(data);
        console.log(`State updated for collection: ${collection}`);
        console.log(data);
      } else {
        console.error(`No state setter found for collection: ${collection}`);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [collections, stateSetterFunctions]);

  return isConnected;
};

export default useFirestoreSnapshots;
