import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase"; // Adjust the import path as needed

export const fetchUserData = (user, setUsername, setUser) => {
  const userRef = doc(db, "users", user.uid);
  onSnapshot(userRef, (doc) => {
    const userData = doc.data();
    setUsername(userData.username);
    setUser({
      uid: user.uid,
      email: user.email,
      profilePicture: userData.photoURL || "", // Fetch profile picture from Firestore
    });
  });
};

export const useUserData = (
  user,
  setUser,
  setUsername,
  fetchDesigns,
  setDesigns,
  fetchProjects,
  setProjects
) => {
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      onSnapshot(userRef, (doc) => {
        setUsername(doc.data().username);
      });
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchUserData(user, setUsername, setUser);
        fetchDesigns(user.uid);
        fetchProjects(user.uid);
      } else {
        setUser(null);
        setDesigns([]);
        setProjects([]);
      }
    });

    return () => unsubscribeAuth();
  }, [user]);
};
