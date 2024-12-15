import React, { createContext, useState, useEffect, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeApp } from "firebase/app";
import axios from "axios";
import { showToast } from "../functions/utils";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// AuthContext
export const AuthContext = createContext();

export function useAuthProvider() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDocFetched, setUserDocFetched] = useState(false);

  // Effect to sync auth state across tabs
  useEffect(() => {
    const syncAuthState = (event) => {
      if (event.key === "authState") {
        const authState = JSON.parse(event.newValue);
        if (authState) {
          setUser(authState.user);
          setUserDoc(authState.userDoc);
        } else {
          setUser(null);
          setUserDoc(null);
        }
      }
    };
    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  useEffect(() => {
    console.log("Setting up auth state listener");
    // Check for existing auth state in local storage
    const existingAuthState = localStorage.getItem("authState");
    if (existingAuthState) {
      const { user, userDoc } = JSON.parse(existingAuthState);
      setUser(user);
      setUserDoc(userDoc);
    }

    let tokenRefreshInterval;

    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user);

      if (user) {
        console.log("User authenticated, updating state");

        // Token refresh function
        const refreshToken = async () => {
          try {
            console.log("Attempting to refresh token...");
            const newToken = await user.getIdToken(true);
            console.log("Token refreshed successfully");
            return newToken;
          } catch (error) {
            console.error("Error refreshing token:", error);

            // If token refresh fails, trigger logout
            setUser(null);
            setUserDoc(null);
            localStorage.removeItem("authState");
            setLoading(false);
            showToast("error", "Session expired. Please login again.");
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
              window.location.reload();
            }
            return null;
          }
        };

        // Set up periodic token refresh
        tokenRefreshInterval = setInterval(refreshToken, 50 * 60 * 1000); // every 50 minutes
        // tokenRefreshInterval = setInterval(refreshToken, 60 * 1000); // every 1 minute for testing

        // Fetch user document
        const fetchUserDoc = async (retryCount = 0) => {
          try {
            const idToken = await user.getIdToken();
            const response = await axios.get(`/api/user/${user.uid}`, {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            });
            if (response.data) {
              setUserDoc(response.data);
              localStorage.setItem("authState", JSON.stringify({ user, userDoc: response.data }));
              console.log("User updated: ", response.data);
            } else if (retryCount < 3) {
              // If user document doesn't exist, wait and retry
              setTimeout(() => fetchUserDoc(retryCount + 1), 1000);
              return;
            } else {
              console.error("Failed to fetch user document after multiple attempts");
            }
          } catch (error) {
            console.error(`Error fetching user document, retried ${retryCount}: ${error}`);
            if (retryCount < 3) {
              setTimeout(() => fetchUserDoc(retryCount + 1), 1000);
              return;
            }
          }
          setLoading(false);
        };

        setUser(user);
        fetchUserDoc();
        setUserDocFetched(true);
      } else {
        console.log("User not authenticated, clearing state");
        // Clear the token refresh interval if it exists
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
        }
        setUser(null);
        setUserDoc(null);
        localStorage.removeItem("authState");
        setLoading(false);
        setUserDocFetched(true);
      }
    });

    // Clean up function
    return () => {
      unsubscribe();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  const handleLogout = async (navigate) => {
    try {
      await auth.signOut();
      setUser(null);
      setUserDoc(null);
      localStorage.removeItem("authState");
      navigate("/login");
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
      showToast("error", "Failed to log out.");
    }
  };

  const setPersistenceBasedOnRemember = async (rememberMe) => {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      console.log(`Persistence set to ${rememberMe ? "local" : "session"}`);
    } catch (error) {
      console.error("Error setting persistence:", error);
    }
  };

  return {
    user,
    setUser,
    userDoc,
    setUserDoc,
    handleLogout,
    loading,
    setLoading,
    userDocFetched,
    setPersistenceBasedOnRemember,
  };
}

export function AuthProvider({ children }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{!auth.loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  // Log conetxt for bebugging (!!! Remove before production !!!)
  // console.log("AuthContext value:", context);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
