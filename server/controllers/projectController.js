const { db, auth, clientAuth, clientDb } = require("../firebase");
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { doc, getDoc, arrayUnion } = require("firebase/firestore");

// Create Project
exports.createProject = async (req, res) => {
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
        generalAccessRole: 0, //0 for viewer, 1 for contributor, 2 for content manager, 3 for manager
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
      createdAt: new Date(),
      modifiedAt: new Date(),
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
      createdAt: new Date(),
      modifiedAt: new Date(),
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
      createdAt: new Date(),
      modifiedAt: new Date(),
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
    updatedProjects.push({ projectId, role: 3 });
    if (!userDoc.exists) {
      throw new Error("User not found"); //  for manager
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

// Update Name
exports.updateProjectName = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { projectId } = req.params;
    const { name } = req.body;
    const projectRef = db.collection("projects").doc(projectId);

    // Store previous name for potential rollback
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }
    const previousName = projectDoc.data().projectName;
    updatedDocuments.push({
      collection: "projects",
      id: projectId,
      field: "projectName",
      previousValue: previousName,
    });

    // Perform update
    await projectRef.update({ projectName: name, modifiedAt: new Date() });
    res.status(200).json({
      success: true,
      message: "Project name updated successfully",
      projectName: name,
    });
  } catch (error) {
    console.error("Error updating project name:", error);

    // Rollback updates to existing documents
    for (const doc of updatedDocuments) {
      try {
        await db
          .collection(doc.collection)
          .doc(doc.id)
          .update({
            [doc.field]: doc.previousValue,
          });
        console.log(`Rolled back ${doc.field} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }

    res.status(500).json({ error: "Failed to update project name" });
  }
};

// Update Project Settings
exports.updateProjectSettings = async (req, res) => {
  const previousStates = [];
  try {
    const { projectId } = req.params;
    const {
      projectSettings,
      timelineId,
      timelineSettings,
      planMapId,
      planMapSettings,
      projectBudgetId,
      budgetSettings,
      userId,
    } = req.body;

    // Store previous states before updates
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }
    previousStates.push({
      ref: projectRef,
      data: projectDoc.data(),
      type: "project",
    });

    const timelineRef = db.collection("timelines").doc(timelineId);
    const timelineDoc = await timelineRef.get();
    if (!timelineDoc.exists) {
      return res.status(404).json({ error: "Timeline not found" });
    }
    previousStates.push({
      ref: timelineRef,
      data: timelineDoc.data(),
      type: "timeline",
    });

    const planMapRef = db.collection("planMaps").doc(planMapId);
    const planMapDoc = await planMapRef.get();
    if (!planMapDoc.exists) {
      return res.status(404).json({ error: "Plan map not found" });
    }
    previousStates.push({
      ref: planMapRef,
      data: planMapDoc.data(),
      type: "planMap",
    });

    const projectBudgetRef = db.collection("projectBudgets").doc(projectBudgetId);
    const projectBudgetDoc = await projectBudgetRef.get();
    if (!projectBudgetDoc.exists) {
      return res.status(404).json({ error: "ProjectBudget not found" });
    }
    previousStates.push({
      ref: projectBudgetRef,
      data: projectBudgetDoc.data(),
      type: "projectBudget",
    });

    // Perform updates
    await Promise.all([
      projectRef.update({
        projectSettings,
        modifiedAt: new Date(),
      }),
      timelineRef.update({
        timelineSettings,
        modifiedAt: new Date(),
      }),
      planMapRef.update({
        planMapSettings,
        modifiedAt: new Date(),
      }),
      projectBudgetRef.update({
        budgetSettings,
        modifiedAt: new Date(),
      }),
    ]);

    res.status(200).json({
      message: "Project settings updated successfully",
      projectSettings,
    });
  } catch (error) {
    console.error("Error updating project settings:", error);

    // Rollback all changes
    try {
      await Promise.all(
        previousStates.map(async (state) => {
          await state.ref.update({
            [`${state.type}Settings`]: state.data[`${state.type}Settings`],
            modifiedAt: state.data.modifiedAt,
          });
          console.log(`Rolled back ${state.type} settings`);
        })
      );
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }

    res.status(500).json({ error: "Failed to update project settings" });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  const deletedDocuments = [];
  const updatedDocuments = [];
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    // Get project data first to check existence
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }
    const projectData = projectDoc.data();

    // 1. Update parent documents first (users, designs)
    // Update user's project array
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const previousProjects = [...userData.projects];
      const updatedProjects = previousProjects.filter((project) => project.projectId !== projectId);
      await userRef.update({ projects: updatedProjects });
      updatedDocuments.push({
        ref: userRef,
        field: "projects",
        previousValue: previousProjects,
        newValue: updatedProjects,
      });
    }

    // Update designs that reference this project
    const designsRef = db.collection("designs");
    const designsWithProject = await designsRef.where("projectId", "==", projectId).get();

    for (const designDoc of designsWithProject.docs) {
      const previousData = designDoc.data();
      await designDoc.ref.update({ projectId: null });
      updatedDocuments.push({
        ref: designDoc.ref,
        field: "projectId",
        previousValue: previousData.projectId,
        newValue: null,
      });
    }

    // 2. Delete project first (to trigger listeners)
    await projectRef.delete();
    deletedDocuments.push({
      ref: projectRef,
      data: projectData,
    });

    // 3. Delete associated documents in correct order
    // Delete projectBudget
    if (projectData.projectBudgetId) {
      const projectBudgetRef = db.collection("projectBudgets").doc(projectData.projectBudgetId);
      const projectBudgetDoc = await projectBudgetRef.get();
      if (projectBudgetDoc.exists) {
        const projectBudgetData = projectBudgetDoc.data();
        await projectBudgetRef.delete();
        deletedDocuments.push({
          ref: projectBudgetRef,
          data: projectBudgetData,
        });
      }
    }

    // Delete planMap first, then its pins
    if (projectData.planMapId) {
      const planMapRef = db.collection("planMaps").doc(projectData.planMapId);
      const planMapDoc = await planMapRef.get();
      if (planMapDoc.exists) {
        const planMapData = planMapDoc.data();

        // Delete planMap first to trigger listeners
        await planMapRef.delete();
        deletedDocuments.push({
          ref: planMapRef,
          data: planMapData,
        });

        // Then delete associated pins
        const pinsToDelete = planMapData.pins || [];
        for (const pinId of pinsToDelete) {
          const pinRef = db.collection("pins").doc(pinId);
          const pinDoc = await pinRef.get();
          if (pinDoc.exists) {
            const pinData = pinDoc.data();
            await pinRef.delete();
            deletedDocuments.push({
              ref: pinRef,
              data: pinData,
            });
          }
        }
      }
    }

    // Delete timeline first, then its events
    if (projectData.timelineId) {
      const timelineRef = db.collection("timelines").doc(projectData.timelineId);
      const timelineDoc = await timelineRef.get();
      if (timelineDoc.exists) {
        const timelineData = timelineDoc.data();

        // Delete timeline first to trigger listeners
        await timelineRef.delete();
        deletedDocuments.push({
          ref: timelineRef,
          data: timelineData,
        });

        // Then delete associated events
        const eventsToDelete = timelineData.events || [];
        for (const eventId of eventsToDelete) {
          const eventRef = db.collection("events").doc(eventId);
          const eventDoc = await eventRef.get();
          if (eventDoc.exists) {
            const eventData = eventDoc.data();
            await eventRef.delete();
            deletedDocuments.push({
              ref: eventRef,
              data: eventData,
            });
          }
        }
      }
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);

    // Rollback updates first
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update({ [doc.field]: doc.previousValue });
        console.log(`Rolled back update for ${doc.ref.path}`);
      } catch (rollbackError) {
        console.error(`Error rolling back update for ${doc.ref.path}:`, rollbackError);
      }
    }

    // Then restore deleted documents
    for (const doc of deletedDocuments) {
      try {
        await doc.ref.set(doc.data);
        console.log(`Restored deleted document ${doc.ref.path}`);
      } catch (rollbackError) {
        console.error(`Error restoring document ${doc.ref.path}:`, rollbackError);
      }
    }

    res.status(500).json({ message: "Failed to delete project" });
  }
};
