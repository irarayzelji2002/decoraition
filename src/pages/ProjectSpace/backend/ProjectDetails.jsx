import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase"; // Adjust the import path as necessary
import { toast } from "react-toastify";
import { collection, addDoc } from "firebase/firestore";

import { query, where, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { CheckCircle, Delete } from "@mui/icons-material";
import { showToast } from "../../../functions/utils";
import axios from "axios";

// Adjust the import path as necessary

export const fetchDesigns = (
  userId,
  projectId,
  setDesigns = () => {},
  setDesignBudgetItems = () => {}
) => {
  const designsRef = collection(db, "designs");
  const q = query(designsRef, where("projectId", "==", projectId));

  const unsubscribeDesigns = onSnapshot(q, async (querySnapshot) => {
    const designList = [];
    const budgetItemsMap = {};

    for (const doc of querySnapshot.docs) {
      const design = { id: doc.id, ...doc.data() };
      designList.push(design);

      // Fetch budget items for each design within the same project
      const budgetRef = collection(db, "budgets");
      const budgetQuery = query(budgetRef, where("designId", "==", doc.id));
      const budgetSnapshot = await getDocs(budgetQuery);
      const budgetList = budgetSnapshot.docs.map((budgetDoc) => ({
        id: budgetDoc.id,
        ...budgetDoc.data(),
      }));
      budgetItemsMap[doc.id] = budgetList;
    }

    setDesigns(designList);
    setDesignBudgetItems(budgetItemsMap);
  });

  return unsubscribeDesigns;
};

export const handleCreateDesign = async (projectId, navigate) => {
  try {
    const currentUser = auth.currentUser;
    const randomString = Math.random().toString(36).substring(2, 6);
    const designId = new Date().getTime().toString() + randomString;

    if (currentUser) {
      // Design reference within the specific project
      const designRef = doc(db, "designs", designId);

      await setDoc(designRef, {
        name: "Untitled", // Default design name
        createdAt: new Date(),
        projectId: projectId, // Linking design to the project
        createdBy: currentUser.uid,
      });

      // Show toast notification when the project is created
      showToast("success", "Design created successfully!");

      // Navigate to the newly created design
      // setTimeout(
      //   () => navigate(`/design/${designId}/${projectId}/project`),
      //   1500
      // );
    }
  } catch (error) {
    console.error("Error creating design: ", error);
    showToast("error", "Error creating design! Please try again.");
  }
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

const saveData = async (projectId, formData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }
  const userId = currentUser.uid;
  try {
    await addDoc(collection(db, "events"), {
      userId: userId,
      projectId,
      taskName: formData.taskName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
      repeat: formData.repeat,
      reminders: formData.reminders,
    });
    showToast("success", "Document successfully written!");
  } catch (e) {
    console.error("Error adding document: ", e);
    showToast("error", "Error adding document! Please try again.");
  }
};

export { saveData };

export const fetchTasks = (userId, projectId, setTasks) => {
  const tasksRef = collection(db, "events");
  const q = query(tasksRef, where("projectId", "==", projectId));

  const unsubscribeTasks = onSnapshot(q, (querySnapshot) => {
    const taskList = [];
    querySnapshot.forEach((doc) => {
      taskList.push({ id: doc.id, ...doc.data() });
    });
    setTasks(taskList);
  });

  return () => unsubscribeTasks();
};

export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, "events", taskId);
    await deleteDoc(taskRef);
    showToast("success", "Task successfully deleted!");
  } catch (e) {
    console.error("Error deleting document: ", e);
    showToast("error", "Error deleting task! Please try again.");
  }
};

export const updateTask = async (userId, projectId, taskId, updatedData) => {
  try {
    const taskRef = doc(db, "events", taskId);
    await updateDoc(taskRef, updatedData);
    showToast("success", "Task updated successfully!");
  } catch (error) {
    console.error("Error updating task:", error);
    showToast("error", "Error updating task! Please try again.");
  }
};
