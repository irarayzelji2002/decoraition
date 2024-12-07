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

// Create design
export const handleCreateDesign = async (user, userId, navigate) => {
  try {
    const response = await axios.post(
      "/api/design/create",
      {
        userId: userId,
        designName: "Untitled Design",
      },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.status === 200) {
      showToast("success", "Design created successfully");
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
export const handleCreateProject = async (user, userId, navigate) => {
  try {
    const response = await axios.post(
      "/api/project/create",
      {
        userId: userId,
        projectName: "Untitled Project",
      },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.status === 200) {
      showToast("success", "Project created successfully");
      setTimeout(() => navigate(`/project/${response.data.id}`), 1500);
    } else {
      showToast("error", "Failed to create project.");
    }
  } catch (error) {
    console.error("Error creating project:", error);
    showToast("error", "Failed to create project");
  }
};

// Move design to trash
export const handleMoveDesignToTrash = async (user, userDoc, designId) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/trash`,
      { userId: userDoc.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.status === 200) {
      return { success: true, message: "Design moved to trash" };
    } else {
      return { success: false, message: "Failed to move design to trash" };
    }
  } catch (error) {
    console.error("Error moving design to trash:", error.message);
    return { success: false, message: "Failed to move design to trash" };
  }
};

// Delete design permanently
export const handleDeleteDesign = async (user, userDoc, designId) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/delete`,
      { userId: userDoc.id, fromTrash: true },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );
    console.log("Trash - Design delete response:", response);
    if (response.status === 200) {
      return { success: true, message: "Trash - Design deleted successfully" };
    } else {
      return { success: false, message: "Trash - Failed to delete design" };
    }
  } catch (error) {
    console.error("Error deleting design:", error.message);
    return { success: false, message: "Trash - Failed to delete design" };
  }
};

// Restore design from trash
export const handleRestoreDesign = async (user, userDoc, designId) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/restoreFromTrash`,
      { userId: userDoc.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.status === 200) {
      return { success: true, message: "Design restored successfully" };
    } else {
      return { success: false, message: "Failed to restore design" };
    }
  } catch (error) {
    console.error("Error deleting design:", error.message);
    return { success: false, message: "Failed to restore design" };
  }
};

// Move design to trash
export const handleMoveProjectToTrash = async (user, userDoc, projectId) => {
  try {
    const response = await axios.post(
      `/api/project/${projectId}/trash`,
      { userId: userDoc.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.status === 200) {
      return { success: true, message: "Project moved to trash" };
    } else {
      return { success: false, message: "Failed to move project to trash" };
    }
  } catch (error) {
    console.error("Error moving project to trash:", error.message);
    return { success: false, message: "Failed to move project to trash" };
  }
};

// Delete project permanently
export const handleDeleteProject = async (user, userDoc, projectId) => {
  try {
    const response = await axios.post(
      `/api/project/${projectId}/delete`,
      { userId: userDoc.id, fromTrash: true },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );
    console.log("Trash - Project delete response:", response);
    if (response.status === 200) {
      return { success: false, message: "Trash - Project deleted successfully" };
    } else {
      return { success: false, message: "Trash - Failed to delete project" };
    }
  } catch (error) {
    console.error("Error deleting project:", error.message);
    return { success: false, message: "Trash - Failed to delete project" };
  }
};

// Restore project from trash
export const handleRestoreProject = async (user, userDoc, projectId) => {
  try {
    const response = await axios.post(
      `/api/project/${projectId}/restoreFromTrash`,
      { userId: userDoc.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.status === 200) {
      return { success: true, message: "Project restored successfully" };
    } else {
      return { success: false, message: "Failed to restore project" };
    }
  } catch (error) {
    console.error("Error deleting project:", error.message);
    return { success: false, message: "Failed to restore project" };
  }
};

// Tiled and list view change
export const handleViewChange = async (user, userId, layoutSettings, field, setView) => {
  const value = layoutSettings[field] === 0 ? 1 : 0;
  try {
    const response = await axios.put(
      "/api/user/layout-settings",
      {
        userId: userId,
        [field]: value,
      },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );
    if (response.status === 200) {
      setView(value);
      console.log("Layout setting updated");
    }
  } catch (error) {
    console.error("Error updating layout setting:", error);
  }
};

// Client-side functions
export const toggleDarkMode = async (user, userId, isDarkMode, setIsDarkMode) => {
  const idToken = await user.getIdToken();
  const newMode = !isDarkMode;
  const theme = newMode === true ? 0 : 1;

  try {
    const response = await axios.put(
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

// Shown time in homepages
//   Show "X seconds ago" for times less than a minute ago
//   Show "X minutes ago" for times less than an hour ago
//   Show "X hours ago" for times less than a day ago
//   Show the date in MM/DD/YYYY format for dates a day or more old

// For list view
export const formatDate = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);

  const dateAgo = formatDateAgo(date);
  if (dateAgo) return dateAgo;

  // If more than a day, return the date in MM/DD/YYYY format
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

// For tiled view
export const formatDateLong = (timestamp) => {
  // Handle both formats of timestamp (_seconds and seconds)
  const seconds = timestamp._seconds || timestamp.seconds;
  const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds;
  if (seconds === undefined || nanoseconds === undefined) {
    console.error("Invalid timestamp:", timestamp);
    return "Invalid date";
  }
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);

  const dateAgo = formatDateAgo(date);
  if (dateAgo) return dateAgo;

  // If more than a day, return the date in "Month Day, Year" format
  return (
    "at " +
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  );
};

// For Details Modal
export const formatDateDetail = (timestamp) => {
  // Handle both formats of timestamp (_seconds and seconds)
  const seconds = timestamp._seconds || timestamp.seconds;
  const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds;
  if (seconds === undefined || nanoseconds === undefined) {
    console.error("Invalid timestamp:", timestamp);
    return "Invalid date";
  }
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);

  const dateAgo = formatDateAgo(date);
  if (dateAgo) return dateAgo;

  // Get hours and minutes from the date object
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Format time in AM/PM format
  const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;

  // If more than a day, return the date in "Month Day, Year" format with time
  return (
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }) +
    " at " +
    formattedTime
  );
};

// For Restore and History Modal
export const formatDateDetailComma = (timestamp) => {
  // Handle both formats of timestamp (_seconds and seconds)
  const seconds = timestamp._seconds || timestamp.seconds;
  const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds;
  if (seconds === undefined || nanoseconds === undefined) {
    console.error("Invalid timestamp:", timestamp);
    return "Invalid date";
  }
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);

  const dateAgo = formatDateAgo(date);
  if (dateAgo) return dateAgo;

  // Get hours and minutes from the date object
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Format time in AM/PM format
  const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;

  // If more than a day, return the date in "Month Day, Year" format with time
  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    ", " +
    formattedTime
  );
};

export const formatDateAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${diffInSeconds === 1 ? "sec" : "secs"} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const remainingSeconds = diffInSeconds % 60;
    return `${diffInMinutes} ${diffInMinutes === 1 ? "min" : "mins"} and ${remainingSeconds} ${
      remainingSeconds === 1 ? "sec" : "secs"
    } ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60;
    return `${diffInHours} ${diffInHours === 1 ? "hr" : "hrs"} and ${remainingMinutes} ${
      remainingMinutes === 1 ? "min" : "mins"
    } ago`;
  }

  // Handle dates beyond 24 hours ago (optional)
  return null;
};

export const getUsername = async (userId) => {
  try {
    const response = await axios.get(`/api/user/get-username/${userId}`);

    if (response.status === 200) {
      const username = response.data.username;
      return username;
    }
  } catch (error) {
    console.error("Error fetching username:", error);
    return "";
  }
};

export const getUser = async (userId) => {
  try {
    const response = await axios.get(`/api/user/get-other-user-data/${userId}`);

    if (response.status === 200) {
      const user = response.data.user;
      return { success: true, message: "User data retrieved", user };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, message: "User data retrieval failed", user: null };
  }
};

export const getUsernames = async (userIds) => {
  try {
    const response = await axios.post(
      "/api/user/get-usernames",
      Array.isArray(userIds) ? userIds : [userIds]
    );

    if (response.status === 200) {
      const usernames = response.data.usernames;
      return usernames;
    }
  } catch (error) {
    console.error("Error fetching usernames:", error.message);
  }
  return [];
};

export function formatDateNowDash() {
  const now = new Date();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[now.getMonth()];
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert to 12-hour format

  return `${month}-${day}-${year}-${String(hours).padStart(2, "0")}-${minutes}-${ampm}`;
}

// Sanitize filename - only allow alphanumeric, dots, dashes, and underscores
export const sanitizeFileName = (str) => {
  return str
    .replace(/[^a-zA-Z0-9.-_\s]/g, "") // Remove special characters except dots, dashes, underscores
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .trim();
};

// Truncate and sanitize design name
export const truncateString = (str, maxLength) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};
