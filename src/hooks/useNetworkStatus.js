import { useState, useEffect } from "react";
import { showToast } from "../functions/utils";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastToastTime, setLastToastTime] = useState(0);

  const showToastWithDebounce = (type, message) => {
    const currentTime = Date.now();
    if (currentTime - lastToastTime > 5000) {
      // 5-second debounce
      showToast(type, message);
      setLastToastTime(currentTime);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/health-check", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (response.ok) {
          if (!isOnline) {
            setIsOnline(true);
            showToastWithDebounce("success", "Back online");
          }
        }
      } catch (err) {
        if (isOnline) {
          setIsOnline(false);
          showToastWithDebounce("error", "Network connection lost");
        }
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Initial check
    checkConnection();

    // Add listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Polling interval to recheck connection state
    const intervalId = setInterval(checkConnection, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, lastToastTime]);

  useEffect(() => {
    console.log("Network status changed:", isOnline);
  }, [isOnline]);

  return isOnline;
};
