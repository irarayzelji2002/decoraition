import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase"; // Adjust the import path as necessary
import { toast } from "react-toastify";
import { collection, addDoc } from "firebase/firestore";

import { query, where, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { CheckCircle, Delete } from "@mui/icons-material";

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
      const projectRef = doc(db, "users", currentUser.uid, "projects", projectId);

      // Design reference within the specific project
      const designRef = doc(db, "designs", designId);

      await setDoc(designRef, {
        name: "Untitled", // Default design name
        createdAt: new Date(),
        projectId: projectId, // Linking design to the project
        createdBy: currentUser.uid,
      });

      // Show toast notification when the project is created
      toast.success("Design created successfully!", {
        icon: <CheckCircle />,
        position: "top-right",
        autoClose: 3000, // 3 seconds auto close
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

      // Navigate to the newly created design
      // setTimeout(
      //   () => navigate(`/design/${designId}/${projectId}/project`),
      //   1500
      // );
    }
  } catch (error) {
    console.error("Error creating design: ", error);
    toast.error("Error creating design! Please try again.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
};

export const handleDeleteDesign = async (projectId, designId) => {
  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const projectRef = doc(db, "projects", projectId, "designs", designId);

      await deleteDoc(projectRef);

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
      toast.success("Design name updated successfully!", {
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
    } catch (error) {
      console.error("Error updating design name:", error);
      alert("Failed to update design name");
    }
  };

  return handleNameChange;
};

export const useProjectDetails = (projectId, setUserId, setProjectData, setNewName) => {
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        const fetchProjectDetails = async () => {
          try {
            const projectRef = doc(db, "users", user.uid, "projects", projectId);
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
    await addDoc(collection(db, "users", userId, "projects", projectId, "timeline"), {
      projectId,
      taskName: formData.taskName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
      repeat: formData.repeat,
      reminders: formData.reminders,
    });
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
    toast.success("Document successfully written!", {
      position: "top-right",
      autoClose: 1500,
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
      onClose: () => window.history.back(),
    });
  } catch (e) {
    console.error("Error adding document: ", e);
    toast.error("Error adding document! Please try again.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
};

export { saveData };

export const fetchTasks = (userId, projectId, setTasks) => {
  const tasksRef = collection(db, "users", userId, "projects", projectId, "timeline");
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
    const taskRef = doc(db, "users", userId, "projects", projectId, "timeline", taskId);
    const taskRef = doc(db, "events", taskId);
    await deleteDoc(taskRef);
    toast.success("Task successfully deleted!", {
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
  } catch (e) {
    console.error("Error deleting document: ", e);
    toast.error("Error deleting task! Please try again.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
};

export const updateTask = async (userId, projectId, taskId, updatedData) => {
  try {
    const taskRef = doc(db, "users", userId, "projects", projectId, "timeline", taskId);
    const taskRef = doc(db, "events", taskId);
    await updateDoc(taskRef, updatedData);
    toast.success("Task updated successfully!", {
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
  } catch (error) {
    console.error("Error updating task:", error);
    toast.error("Error updating task! Please try again.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
};
