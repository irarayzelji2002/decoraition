import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "./firebaseConfig"; // Import the configuration
import { getStorage } from "firebase/storage";

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence to browser session
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Persistence set to session");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Handle forgot password functionality
export const handleForgotPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent! Check your inbox.");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // Handle specific error codes
    switch (error.code) {
      case "auth/user-not-found":
        alert("No user found with this email.");
        break;
      case "auth/invalid-email":
        alert("Invalid email address.");
        break;
      default:
        alert("Error sending password reset email.");
    }
  }
};

export default app;
