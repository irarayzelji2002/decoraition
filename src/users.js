import React, { useEffect, useState } from "react";
import "./App.css";
import "./css/loginModal.css";
// import Login from "./pages/Account/login.js";

export default function Users({ ...sharedProps }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [backendData, setBackendData] = useState({});

  useEffect(() => {
    fetch("/api/sample")
      .then((res) => res.json())
      .then((data) => {
        setBackendData(data);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
      });
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      console.log(event.target);
      setDeferredPrompt(event);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.dispatchEvent(new Event("beforeinstallprompt"));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      console.log(`deferredPrompt:`);
      console.log(deferredPrompt);
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user's response
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the A2HS prompt");
        } else {
          console.log("User dismissed the A2HS prompt");
        }
        // Clear the prompt
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      });
    }
  };

  return (
    <div className="App">
      <h1>App</h1>
      {!backendData.users ? (
        <p>Loading ...</p>
      ) : (
        backendData.users.map((user, i) => <p key={i}>{user}</p>)
      )}
      {showInstallPrompt && <button onClick={handleInstallClick}>Add to Home Screen</button>}
    </div>
  );
}
