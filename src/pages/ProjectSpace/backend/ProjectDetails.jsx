import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase"; // Adjust the import path as necessary
import { showToast } from "../../../functions/utils";
import { collection, addDoc } from "firebase/firestore";

import { query, where, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { CheckCircle } from "@mui/icons-material";
import { DeleteIcon } from "../../../components/svg/DefaultMenuIcons";
import axios from "axios";

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
      console.log(`Fetched designs: ${JSON.stringify(response.data)}`); // Debug log
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
      showToast("error", "Failed to fetch pins.");
    }
  } catch (error) {
    console.error("Error fetching pins:", error);
    showToast("error", "Failed to fetch pins");
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
    const response = await fetch(`/api/projects/${projectId}/pins/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pins }),
    });
    if (!response.ok) {
      throw new Error("Failed to save pin order");
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
    showToast("success", "Pin location updated successfully");
  } catch (error) {
    console.error("Error updating pin location:", error);
    showToast("error", "Failed to update pin location");
  }
};
