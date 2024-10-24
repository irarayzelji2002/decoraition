import React, { createContext, useState, useEffect, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user);
      setUser(user);
      if (user) {
        console.log("User authenticated, updating state");
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
        fetchUserDoc();
        setUserDocFetched(true);
      } else {
        console.log("User not authenticated, clearing state");
        setUser(null);
        setUserDoc(null);
        setLoading(false);
        setUserDocFetched(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async (navigate) => {
    try {
      await auth.signOut();
      setUser(null);
      setUserDoc(null);
      navigate("/login");
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
      showToast("error", "Failed to log out.");
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
  };
}

export function AuthProvider({ children }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{!auth.loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  // Log conetxt for bebugging (!!! Remove before production !!!)
  console.log("AuthContext value:", context);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
