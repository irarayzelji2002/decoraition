import axios from "axios";
import { auth, db } from "../../../firebase";
import { showToast } from "../../../functions/utils";
const API_BASE_URL = "http://localhost:5000/api";

export const fetchUserData = async (setUser, setUsername) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const response = await axios.get(`${API_BASE_URL}/user/${user.uid}`);
      const userData = response.data;
      setUser(userData);
      setUsername(userData.username || "");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    showToast("error", "Failed to fetch user data");
  }
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

export const handleLogout = async (navigate) => {
  try {
    await axios.post(`${API_BASE_URL}/logout`);
    navigate("/");
  } catch (error) {
    console.error("Error logging out:", error);
    showToast("error", "Failed to log out");
  }
};

export const handleSettings = async (navigate) => {
  try {
    await axios.post(`${API_BASE_URL}/settings`);
    navigate("/settings");
  } catch (error) {
    console.error("Error navigating to settings:", error);
    showToast("error", "Failed to navigate to settings");
  }
};

export const handleCreateDesign = async (userId, navigate) => {
  try {
    const currentUser = auth.currentUser;
    const randomString = Math.random().toString(36).substring(2, 6);
    const designId = new Date().getTime().toString() + randomString;

    if (currentUser) {
      const designRef = doc(db, "designs", designId);
      await setDoc(designRef, {
        name: "Untitled",
        createdAt: new Date(),
        createdBy: currentUser.uid,
      });

      toast.success("Design created successfully!", {
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

      setTimeout(() => navigate(`/design/${designId}`), 1500);
    }
  } catch (error) {
    console.error("Error creating project:", error);
    showToast("error", "Failed to create project");
  }
};

export const handleDeleteDesign = async (designId, setDesigns) => {
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
    console.error("Error deleting design:", error);
    showToast("error", "Failed to delete design");
  }
};

export const handleDeleteProject = async (projectId, setProjects) => {
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
    console.error("Error deleting project:", error);
    showToast("error", "Failed to delete project");
  }
};

// Client-side functions
export const toggleDarkMode = (isDarkMode, setIsDarkMode) => {
  const newMode = !isDarkMode;
  setIsDarkMode(newMode);
  document.body.classList.toggle("dark-mode", newMode);
};

export const toggleMenu = (isMenuOpen, setIsMenuOpen) => {
  setIsMenuOpen(!isMenuOpen);
};

export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};
