import { doc, collection, query, where, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { CheckCircle } from "@mui/icons-material";
import Delete from "@mui/icons-material/Delete.js";
import { db, auth } from "../../../firebase"; // Adjust the import path as needed

// HomepageFunctions.jsx
export const searchProjects = (searchQuery, designs, setFilteredDesigns) => {
  if (searchQuery.trim()) {
    const results = designs.filter((design) =>
      design.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDesigns(results);
  } else {
    setFilteredDesigns([]); // Clear search results when no query
  }
};

export const handleKeyPress = (event, searchProjects, searchQuery, designs, setFilteredDesigns) => {
  if (event.key === "Enter") {
    searchProjects(searchQuery, designs, setFilteredDesigns);
  }
};

export const fetchUserData = (user, setUsername, setUser) => {
  const userRef = doc(db, "users", user.uid);
  onSnapshot(userRef, (doc) => {
    const userData = doc.data();
    setUsername(userData.username);
    setUser({
      uid: user.uid,
      email: user.email,
      profilePicture: userData.photoURL || "",
    });
  });
};

export const fetchDesigns = (userId, setDesigns) => {
  const designsRef = collection(db, "designs");
  const q = query(
    designsRef,
    where("createdBy", "==", userId),
    where("createdAt", ">", new Date(0))
  );

  const unsubscribeDesigns = onSnapshot(q, (querySnapshot) => {
    const designList = [];
    querySnapshot.forEach((doc) => {
      designList.push({ id: doc.id, ...doc.data() });
    });
    setDesigns(designList);
  });

  return () => unsubscribeDesigns();
};

export const fetchProjects = (userId, setProjects) => {
  const projectsRef = collection(db, "projects");
  const q = query(projectsRef, where("createdBy", "==", userId));

  const unsubscribeProjects = onSnapshot(q, (querySnapshot) => {
    const projectList = [];
    querySnapshot.forEach((doc) => {
      projectList.push({ id: doc.id, ...doc.data() });
    });
    setProjects(projectList);
  });

  return () => unsubscribeProjects();
};

export const handleLogout = (navigate) => {
  signOut(auth)
    .then(() => {
      navigate("/");
    })
    .catch((error) => {
      console.error("Sign-out error:", error);
    });
};

export const handleSettings = (navigate) => {
  signOut(auth)
    .then(() => {
      navigate("/settings");
    })
    .catch((error) => {
      console.error("Settings error:", error);
    });
};

export const toggleDarkMode = (darkMode, setDarkMode) => {
  setDarkMode(!darkMode);
  document.body.classList.toggle("dark-mode", !darkMode);
};

export const handleCreateProject = async (navigate) => {
  try {
    const currentUser = auth.currentUser;
    const randomString = Math.random().toString(36).substring(2, 6);
    const projectId = new Date().getTime().toString() + randomString;

    if (currentUser) {
      const projectRef = doc(db, "projects", projectId);
      await setDoc(projectRef, {
        name: "Untitled",
        createdAt: new Date(),
        createdBy: currentUser.uid,
      });

      toast.success("Project created successfully!", {
        icon: <CheckCircle />,
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          color: "var(--color-white)",
          backgroundColor: "var(--inputBg)",
        },
        progressStyle: {
          backgroundColor: "var(--brightFont)",
        },
      });

      setTimeout(() => navigate(`/project/${projectId}`), 1500);
    }
  } catch (error) {
    console.error("Error creating project: ", error);
    toast.error("Error creating project! Please try again.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
};

export const handleDeleteDesign = async (designId) => {
  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const designRef = doc(db, "designs", designId);
      await deleteDoc(designRef);

      toast.success("Design deleted", {
        icon: <Delete />,
        style: {
          color: "var(--color-white)",
          backgroundColor: "var(--inputBg)",
        },
        progressStyle: {
          backgroundColor: "var(--brightFont)",
        },
      });
    }
  } catch (error) {
    console.error("Error deleting design: ", error);
  }
};

export const handleDeleteProject = async (projectId) => {
  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const designRef = doc(db, "projects", projectId);
      await deleteDoc(designRef);

      toast.success("Project deleted", {
        icon: <Delete />,
        style: {
          color: "var(--color-white)",
          backgroundColor: "var(--inputBg)",
        },
        progressStyle: {
          backgroundColor: "var(--brightFont)",
        },
      });
    }
  } catch (error) {
    console.error("Error deleting design: ", error);
  }
};

export const toggleMenu = (menuOpen, setMenuOpen) => {
  setMenuOpen(!menuOpen);
};

export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString(); // This will format the date and time based on the user's locale
};
