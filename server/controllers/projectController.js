const { db, auth, clientAuth, clientDb } = require("../firebase");
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { doc, getDoc, arrayUnion } = require("firebase/firestore");

// Create Project
exports.handleCreateProject = async (req, res) => {
  const createdDocuments = [];
  try {
    const { userId, projectName } = req.body;

    // Create project document
    const projectData = {
      projectName,
      managers: [userId],
      contentManagers: [],
      contributors: [],
      viewers: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
      projectSettings: {
        generalAccessSetting: 0, //0 for Restricted, 1 for Anyone with the link
        generalAccessRole: 0, //0 for viewer, 1 for content manager, 2 for contributor)
        allowDownload: true,
        inactivityDays: 90,
        deletionDays: 30,
        notifyDays: 7,
      },
      designs: [],
    };

    const projectRef = await db.collection("projects").add(projectData);
    const projectId = projectRef.id;
    createdDocuments.push({ collection: "projects", id: projectId });

    // Update the project document with the link field
    await projectRef.update({
      link: `/project/${projectId}`,
    });

    // Create associated planMap document
    const planMapData = {
      projectId,
      link: `/planMap/${projectId}`,
      createdAt: db.FieldValue.serverTimestamp(),
      modifiedAt: db.FieldValue.serverTimestamp(),
      planMapSettings: {
        generalAccessSetting: 0,
        generalAccessRole: 0,
        allowDownload: true,
      },
      venuePlan: { filename: "", path: "" },
      pins: [],
    };

    const planMapRef = await db.collection("planMaps").add(planMapData);
    const planMapId = planMapRef.id;
    createdDocuments.push({ collection: "planMaps", id: planMapId });

    // Create associated timeline document
    const timelineData = {
      projectId,
      link: `/timeline/${projectId}`,
      createdAt: db.FieldValue.serverTimestamp(),
      modifiedAt: db.FieldValue.serverTimestamp(),
      timelineSettings: {
        generalAccessSetting: 0,
        generalAccessRole: 0,
        allowDownload: true,
      },
      events: [],
    };

    const timelineRef = await db.collection("timelines").add(timelineData);
    const timelineId = timelineRef.id;
    createdDocuments.push({ collection: "timelines", id: timelineId });

    // Create associated projectBudget document
    const projectBudgetData = {
      projectId,
      link: `/projectBudget/${projectId}`,
      createdAt: db.FieldValue.serverTimestamp(),
      modifiedAt: db.FieldValue.serverTimestamp(),
      budgetSettings: {
        generalAccessSetting: 0,
        generalAccessRole: 0,
        allowDownload: true,
      },
      budgets: [],
      budget: {
        amount: 0,
        currency: "USD",
      },
    };

    const projectBudgetRef = await db.collection("projectBudgets").add(projectBudgetData);
    const projectBudgetId = projectBudgetRef.id;
    createdDocuments.push({ collection: "projectBudgets", id: projectBudgetId });

    // Update project document with associated IDs
    await projectRef.update({
      planMapId,
      timelineId,
      projectBudgetId,
    });

    // Update user's projects array
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const updatedProjects = userData.designs ? [...userData.projects] : [];
    updatedProjects.push({ projectId, role: 2 });
    if (!userDoc.exists) {
      throw new Error("User not found"); // 2 for manager
    }
    await userRef.update({
      projects: updatedProjects,
    });

    res.status(200).json({
      id: projectId,
      ...projectData,
      link: `/project/${projectId}`,
      planMapId,
      timelineId,
      projectBudgetId,
    });
  } catch (error) {
    console.error("Error creating project:", error);

    // Rollback: delete all created documents
    for (const doc of createdDocuments) {
      try {
        await db.collection(doc.collection).doc(doc.id).delete();
        console.log(`Deleted ${doc.id} document from ${doc.collection} collection`);
      } catch (deleteError) {
        console.error(`Error deleting ${doc.collection} document ${doc.id}:`, deleteError);
      }
    }

    res.status(500).json({ message: "Error creating project", error: error.message });
  }
};

// Read
exports.fetchUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const projectsSnapshot = await db
      .collection("projects")
      .where("managers", "array-contains", userId)
      .orderBy("createdAt", "desc")
      .get();

    const projects = projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
};

// Update
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();
    await db.collection("projects").doc(projectId).update(updateData);
    res.json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

// Delete
exports.handleDeleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    // Delete the project
    await db.collection("projects").doc(projectId).delete();

    // Remove the project from the user's projects array
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const updatedProjects = userData.projects.filter(
        (project) => project.projectId !== projectId
      );
      await userRef.update({ projects: updatedProjects });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
};
