import axios from "axios";
import { showToast } from "../../../functions/utils";

// Get user designs
export const fetchUserDesigns = async (userId, setDesigns) => {
  try {
    const response = await axios.get(`/api/design/${userId}`);

    if (response.status === 200) {
      setDesigns(response.data);
    } else {
      // showToast("error", "Failed to fetch user designs.");
    }
  } catch (error) {
    console.error("Error fetching designs:", error);

    showToast("error", "Failed to fetch designs");
  }
};

// Get user projects
export const fetchUserProjects = async (userId, setProjects) => {
  try {
    const response = await axios.get(`/api/project/${userId}`);

    if (response.status === 200) {
      setProjects(response.data);
    } else {
      // showToast("error", "Failed to fetch user designs.");
    }
  } catch (error) {
    console.error("Error fetching projects:", error);

    showToast("error", "Failed to fetch projects");
  }
};

// Logout
export const handleLogout = async (navigate) => {
  try {
    const response = await axios.post(`/api/logout`);
    if (response.data.success) {
      navigate("/");
    }
  } catch (error) {
    console.error("Error logging out:", error);
    showToast("error", "Failed to log out.");
  }
};

// Create design
export const handleCreateDesign = async (userId, navigate, setDesigns) => {
  try {
    const response = await axios.post("/api/design/create", {
      userId: userId,
      designName: "Untitled Design",
    });

    if (response.status === 200) {
      showToast("success", "Design created successfully");
      // fetchUserDesigns(userId, setDesigns);
      setTimeout(() => navigate(`/design/${response.data.id}`), 1500);
    } else {
      showToast("error", "Failed to create design.");
    }
  } catch (error) {
    console.error("Error creating design:", error);

    showToast("error", "Failed to create design");
  }
};

// Create project
export const handleCreateProject = async (userId, navigate, setProjects) => {
  try {
    const response = await axios.post("/api/project/create", {
      userId: userId,
      projectName: "Untitled Project",
    });

    if (response.status === 200) {
      showToast("success", "Project created successfully");
      fetchUserDesigns(userId, setProjects);
      setTimeout(() => navigate(`/project/${response.data.id}`), 1500);
    } else {
      showToast("error", "Failed to create project.");
    }
  } catch (error) {
    console.error("Error creating project:", error);

    showToast("error", "Failed to create project");
  }
};

// Delete design
export const handleDeleteDesign = async (userId, designId, navigate, setDesigns) => {
  try {
    const response = await axios.delete(`/api/design/delete/${designId}`);

    if (response.status === 200) {
      showToast("success", "Design deleted successfully");
      fetchUserDesigns(userId, setDesigns);
      setTimeout(() => navigate("/homepage"), 1500);
    } else {
      showToast("error", "Failed to delete design.");
    }
  } catch (error) {
    console.error("Error deleting design:", error);

    showToast("error", "Failed to delete design");
  }
};

// Delete project
export const handleDeleteProject = async (userId, projectId, navigate, setProjects) => {
  try {
    const response = await axios.delete(`/api/project/delete/${projectId}`);

    if (response.status === 200) {
      showToast("success", "Project deleted successfully");
      fetchUserProjects(userId, setProjects);
      setTimeout(() => navigate("/homepage"), 1500);
    } else {
      showToast("error", "Failed to delete project.");
    }
  } catch (error) {
    console.error("Error deleting project:", error);

    showToast("error", "Failed to delete project");
  }
};

// Tiled and list view change
export const handleViewChange = async (userId, layoutSettings, field) => {
  const value = layoutSettings[field] === 0 ? 1 : 0;
  try {
    await axios.patch("/api/users/layout-settings", { userId: userId, [field]: value });
    showToast("success", "Layout setting updated");
  } catch (error) {
    console.error("Error updating layout setting:", error);
    showToast("error", "Failed to update layout setting");
  }
};

// Client-side functions
export const toggleDarkMode = async (user, userId, isDarkMode, setIsDarkMode) => {
  const idToken = await user.getIdToken();
  const newMode = !isDarkMode;
  const theme = newMode === true ? 0 : 1;

  try {
    const response = await axios.post(
      "/api/user/theme",
      {
        userId: userId,
        theme: theme,
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    if (response.status === 200) {
      setIsDarkMode(newMode);
      document.body.classList.toggle("dark-mode", newMode);
      showToast("success", `Theme changed to ${newMode === true ? "dark" : "white"} mode`);
    } else {
      console.error("Failed to update theme");
    }
  } catch (error) {
    console.error("Error updating theme:", error);
  }
};

export const toggleMenu = (isMenuOpen, setIsMenuOpen) => {
  setIsMenuOpen(!isMenuOpen);
};

export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};
