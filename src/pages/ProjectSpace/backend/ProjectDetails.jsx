import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase"; // Adjust the import path as necessary
import { showToast } from "../../../functions/utils";
import { collection, addDoc } from "firebase/firestore";

import { query, where, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";

// Adjust the import path as necessary

export const fetchProjectDesigns = async (projectId, setDesigns) => {
  try {
    const token = await auth.currentUser.getIdToken();
    console.log(`Fetching designs for projectId: ${projectId}`); // Debug log

    const response = await axios.get(`/api/project/${projectId}/designs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      setDesigns(response.data);
    } else {
      showToast("error", "Failed to fetch project designs.");
    }
  } catch (error) {
    console.error("Error fetching project designs:", error);
    showToast("error", "Failed to fetch project designs");
  }
};

export const fetchDesigns = async (userId, projectId, setDesigns) => {
  await fetchProjectDesigns(projectId, setDesigns);
};

export const handleDeleteDesign = async (projectId, designId) => {
  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const projectRef = doc(db, "designs", designId);

      await deleteDoc(projectRef);
      showToast("success", "Design deleted");
    }
  } catch (error) {
    console.error("Error deleting design: ", error);
  }
};

export const useHandleNameChange = (newName, userId, projectId, setIsEditingName) => {
  const handleNameChange = async () => {
    if (newName.trim() === "") {
      alert("Design name cannot be empty");
      return;
    }

    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, { name: newName });
      setIsEditingName(false);
      showToast("success", "Design name updated successfully!");
    } catch (error) {
      console.error("Error updating design name:", error);
      alert("Failed to update design name");
    }
  };

  return handleNameChange;
};

export const handleNameChange = async (projectId, newName, user, userDoc, setIsEditingName) => {
  try {
    const response = await axios.put(
      `/api/project/${projectId}/update-name`,
      { name: newName, userId: userDoc.id },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      setIsEditingName(false);
      return { success: true, message: "Project name updated successfully" };
    }
  } catch (error) {
    console.error("Error updating project name:", error);
    return { success: false, message: "Failed to update project name" };
  }
};

export const useProjectDetails = (projectId, setUserId, setProjectData, setNewName) => {
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        const fetchProjectDetails = async () => {
          try {
            const projectRef = doc(db, "projects", projectId);
            const projectSnapshot = await getDoc(projectRef);
            if (projectSnapshot.exists()) {
              const project = projectSnapshot.data();
              setProjectData(project);
              setNewName(project.name);

              // Listen for real-time updates to the project document
              const unsubscribeProject = onSnapshot(projectRef, (doc) => {
                if (doc.exists()) {
                  const updatedProject = doc.data();
                  setProjectData(updatedProject);
                  setNewName(updatedProject.name);
                }
              });

              // Cleanup listener on component unmount
              return () => unsubscribeProject();
            } else {
              console.error("Project not found");
            }
          } catch (error) {
            console.error("Error fetching project details:", error);
          }
        };

        fetchProjectDetails();
      } else {
        console.error("User is not authenticated");
      }
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [projectId, setUserId, setProjectData, setNewName]);
};

export const fetchTasks = async (timelineId) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.get(`/api/timeline/${timelineId}/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

export const deleteTask = async (userId, projectId, taskId) => {
  try {
    const token = await auth.currentUser.getIdToken();
    await axios.delete(`/api/timeline/event/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (e) {
    console.error("Error deleting document: ", e);
    showToast("error", "Error deleting task! Please try again.");
  }
};

export const updateTask = async (userId, projectId, taskId, updatedData) => {
  try {
    const token = await auth.currentUser.getIdToken();
    await axios.put(`/api/timeline/event/${taskId}`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error updating task:", error);
  }
};

export const createEvent = async (timelineId, eventData) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.post(
      `/api/timeline/${timelineId}/event`,
      {
        timelineId: eventData.timelineId,
        eventName: eventData.eventName,
        dateRange: eventData.dateRange,
        repeating: eventData.repeating,
        repeatEvery: eventData.repeatEvery,
        description: eventData.description,
        reminders: eventData.reminders,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Event created successfully");
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const fetchTimelineId = async (userId, projectId) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.get(`/api/project/${projectId}/timelineId`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.timelineId;
  } catch (error) {
    console.error("Error fetching timelineId:", error);
    throw error;
  }
};

export const fetchTaskDetails = async (userId, taskId) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.get(`/api/timeline/event/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching task details:", error);
    throw error;
  }
};

export const fetchPins = async (projectId, setPins) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.get(`/api/project/${projectId}/pins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      setPins(response.data);
    } else {
      showToast("error", "Failed to fetch pins");
    }
  } catch (error) {
    console.error("Error fetching pins:", error);
  }
};

export const addPinToDatabase = async (projectId, pinData) => {
  try {
    const pinRef = collection(db, "pins");
    await addDoc(pinRef, {
      projectId,
      ...pinData,
    });
    showToast("success", "Pin added successfully");
  } catch (error) {
    console.error("Error adding pin: ", error);
    showToast("error", "Failed to add pin");
  }
};

export const savePinOrder = async (projectId, pins) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.post(
      `/api/project/${projectId}/pins/order`,
      { pins },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status === 200) {
      showToast("Saved Pin");
    }
  } catch (error) {
    console.error("Error saving pin order:", error);
  }
};

export const deleteProjectPin = async (projectId, pinId) => {
  try {
    console.log(`Deleting pin ${pinId} from project ${projectId}`); // Debug log
    const token = await auth.currentUser.getIdToken();
    const response = await axios.delete(`/api/project/${projectId}/pin/${pinId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      showToast("success", "Pin deleted successfully");
    } else {
      showToast("error", "Failed to delete pin");
    }
  } catch (error) {
    console.error("Error deleting pin:", error);
    showToast("error", "Failed to delete pin");
  }
};

export const updatePinLocation = async (projectId, pinId, location) => {
  try {
    const token = await auth.currentUser.getIdToken();
    await axios.put(
      `/api/project/${projectId}/pin/${pinId}`,
      { location },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error("Error updating pin location:", error);
    showToast("error", "Failed to update pin location");
  }
};

export const updatePinInDatabase = async (projectId, pinId, pinData) => {
  try {
    const token = await auth.currentUser.getIdToken();
    await axios.put(`/api/project/${projectId}/pin/${pinId}`, pinData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    showToast("success", "Pin updated successfully");
  } catch (error) {
    console.error("Error updating pin: ", error);
    showToast("error", "Failed to update pin");
  }
};

export const handleAddCollaborators = async (
  project,
  emails,
  role,
  message,
  notifyPeople,
  user,
  userDoc
) => {
  try {
    const response = await axios.post(
      `/api/project/${project.id}/share`,
      { userId: userDoc.id, emails, role, message, notifyPeople },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.data.success) {
      return {
        success: true,
        message: "Project shared successfully",
      };
    } else {
      return {
        success: false,
        message: "Failed to share project",
      };
    }
  } catch (error) {
    console.error("Error sharing project:", error);
    return {
      success: false,
      message: error.response?.data?.error || "Failed to share project",
    };
  }
};

export const handleAccessChange = async (
  project,
  initEmailsWithRole,
  emailsWithRole,
  generalAccessSetting,
  generalAccessRole,
  user,
  userDoc
) => {
  try {
    const response = await axios.post(
      `/api/project/${project.id}/change-access`,
      {
        userId: userDoc.id,
        initEmailsWithRole,
        emailsWithRole,
        generalAccessSetting,
        generalAccessRole,
      },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.data.success) {
      return {
        success: true,
        message: "Project access changed",
      };
    } else {
      return {
        success: false,
        message: "Failed to change access of project",
      };
    }
  } catch (error) {
    console.error("Error changing access of project:", error);
    return {
      success: false,
      message: error.response?.data?.error || "Failed to change access of project",
    };
  }
};

export const handlePlanImageUpload = async (file, projectId, setPlanImage) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.post(`/api/project/${projectId}/planImage`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200) {
      setPlanImage(response.data.planImage);
    } else {
      showToast("error", "Failed to upload plan image");
    }
  } catch (error) {
    console.error("Error uploading plan image:", error);
    showToast("error", "Failed to upload plan image");
  }
};

export const fetchPlanImage = async (projectId, setPlanImage) => {
  console.log(`Fetching plan image for project ${projectId}`); // Debug log
  try {
    const token = await auth.currentUser.getIdToken();
    console.log("Token acquired:", token); // Debug log
    const response = await axios.get(`/api/project/${projectId}/planImage`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Response received:", response); // Debug log

    if (response.status === 200 && response.data.planImage) {
      setPlanImage(response.data.planImage);
    } else if (response.status === 404) {
      console.warn("Plan image not found, please upload an image.");
      setPlanImage(null);
    } else {
      showToast("error", "Failed to fetch plan image");
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn("Plan image not found, please upload an image.");
      setPlanImage(null);
    } else {
      console.error("Error fetching plan image:", error);
      showToast("error", "Failed to fetch plan image");
    }
  }
};

export const handleCreateDesign = async (projectId, projectName, user, userDoc) => {
  try {
    const response = await axios.post(
      `/api/project/${projectId}/create-design`,
      {
        userId: userDoc.id,
        designName: `Untitled Design for ${projectName}`,
        projectId,
      },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );
    if (response.status === 200) {
      return {
        success: true,
        message: "Design created successfully",
        designId: response.data.designId,
      };
    }
  } catch (error) {
    console.error("Error creating design:", error);
    return {
      success: false,
      message: error?.response?.data?.error || "Failed to create design",
    };
  }
};

export const handleCreateDesignWithLoading = async (projectId, setDesigns) => {
  await handleCreateDesign(projectId, setDesigns);
};

export const fetchUserDesigns = async (userId) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await axios.get(`/api/design/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user designs:", error);
    showToast("error", "Failed to fetch user designs");
    return [];
  }
};

export const updateDesignProjectId = async (designId, projectId) => {
  try {
    const token = await auth.currentUser.getIdToken();
    await axios.put(
      `/api/design/${designId}/update-project`,
      { projectId, modifiedAt: new Date() },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    showToast("success", "Design imported successfully");
  } catch (error) {
    console.error("Error updating design projectId:", error);
    showToast("error", "Failed to import design");
  }
};

export const importDesignToProject = async (projectId, selectedDesignId, user, userDoc) => {
  try {
    const response = await axios.put(
      `/api/project/${projectId}/import-design`,
      { userId: userDoc.id, designId: selectedDesignId },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Design imported successfully" };
    }
  } catch (error) {
    console.error("Error importing design:", error);
    return { success: false, message: error?.response?.data?.error || "Failed to import design" };
  }
};

export const removeDesignFromProject = async (projectId, designId, user, userDoc) => {
  try {
    const response = await axios.put(
      `/api/project/${projectId}/remove-design`,
      { userId: userDoc.id, designId },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Design removed from project" };
    }
  } catch (error) {
    console.error("Error removing design from project:", error);
    return {
      success: false,
      message: error?.response?.data?.error || "Failed to remove design from project",
    };
  }
};
