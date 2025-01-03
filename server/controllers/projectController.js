const { db, auth, clientAuth, clientDb } = require("../firebase");
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { doc, getDoc, arrayUnion } = require("firebase/firestore");
const { createNotification } = require("./notificationController");
const { Resend } = require("resend");
const axios = require("axios");
const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);
const appURL = process.env.REACT_APP_URL;

const getPHCurrency = () => {
  let currency = {
    countryISO: "PH",
    currencyCode: "PHP",
    currencyName: "Philippines",
    currencySymbol: "₱",
    flagEmoji: "🇵🇭",
  };
  return currency;
};

// Create Project
exports.createProject = async (req, res) => {
  const updatedDocuments = [];
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
    updatedDocuments.push({
      ref: userRef,
      data: { projects: userDoc.data().projects },
      collection: "users",
      id: userRef.id,
    });
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

    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
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

exports.createDesignProject = async (req, res) => {
  const updatedDocuments = [];
  const createdDocuments = [];
  const updatedUserDocs = [];
  try {
    const { projectId } = req.params;
    const { userId, designName } = req.body;

    // Verify the existence of the project
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: "Project not found" });
    }
    // Check user role in design
    const allowAction = isContributorProject(projectDoc, userId);
    if (!allowAction) {
      return res
        .status(403)
        .json({ error: "User does not have permission to create a design for this project" });
    }

    // Combine all editor-level collaborators from project
    const projectData = projectDoc.data();
    const editors = [
      ...new Set([
        ...(projectData?.managers || []),
        ...(projectData?.contentManagers || []),
        ...(projectData?.contributors || []),
      ]),
    ].filter((id) => id !== userId);

    // Create design document
    const designData = {
      designName,
      owner: userId,
      editors: editors,
      commenters: [],
      viewers: projectData?.viewers || [],
      history: [],
      projectId: projectId,
      createdAt: new Date(),
      modifiedAt: new Date(),
      isCopied: false,
      isCopiedFrom: { designId: "", versionId: "" },
      designSettings: {
        generalAccessSetting: projectData?.projectSettings?.generalAccessSetting || 0, //0 for Restricted, 1 for Anyone with the link
        generalAccessRole: projectData?.projectSettings?.generalAccessRole || 0, //0 for viewer, 1 for editor, 2 for commenter, 3 for owner
        allowDownload: true,
        allowViewHistory: true,
        allowCopy: true,
        documentCopyByOwner: true,
        documentCopyByEditor: true,
        inactivityEnabled: true,
        inactivityDays: 30,
        deletionDays: 30,
        notifyDays: 7,
      },
    };

    const designRef = await db.collection("designs").add(designData);
    const designId = designRef.id;
    createdDocuments.push({ collection: "designs", id: designId });

    // Update the design document with the link field
    await designRef.update({
      link: `/design/${designId}`,
    });

    // Update project's designs
    const previousDesigns = projectDoc.data().designs || [];
    updatedDocuments.push({
      collection: "projects",
      id: projectId,
      field: "designs",
      previousValue: previousDesigns,
    });
    await projectRef.update({ designs: [...previousDesigns, designId], modifiedAt: new Date() });

    // Track user documents before updates
    // Owner
    const ownerRef = db.collection("users").doc(userId);
    const ownerDoc = await ownerRef.get();
    if (ownerDoc.exists) {
      updatedUserDocs.push({
        ref: ownerRef,
        previousDesigns: ownerDoc.data().designs || [],
      });
    }
    // Editors
    for (const editorId of editors) {
      const editorRef = db.collection("users").doc(editorId);
      const editorDoc = await editorRef.get();
      if (editorDoc.exists) {
        updatedUserDocs.push({
          ref: editorRef,
          previousDesigns: editorDoc.data().designs || [],
        });
      }
    }
    // Viewers
    for (const viewerId of projectData.viewers || []) {
      const viewerRef = db.collection("users").doc(viewerId);
      const viewerDoc = await viewerRef.get();
      if (viewerDoc.exists) {
        updatedUserDocs.push({
          ref: viewerRef,
          previousDesigns: viewerDoc.data().designs || [],
        });
      }
    }

    // Proceed with batch updates
    const batch = db.batch();
    try {
      // Owner update
      if (ownerDoc.exists) {
        const ownerDesigns = ownerDoc.data().designs || [];
        batch.update(ownerRef, {
          designs: [...ownerDesigns, { designId, role: 3 }],
        });
      }
      // Editor updates
      for (const editorId of editors) {
        const editorRef = db.collection("users").doc(editorId);
        const editorDoc = await editorRef.get();
        if (editorDoc.exists) {
          const editorDesigns = editorDoc.data().designs || [];
          batch.update(editorRef, {
            designs: [...editorDesigns, { designId, role: 1 }],
          });
        }
      }
      // Viewer updates
      for (const viewerId of projectData.viewers || []) {
        const viewerRef = db.collection("users").doc(viewerId);
        const viewerDoc = await viewerRef.get();
        if (viewerDoc.exists) {
          const viewerDesigns = viewerDoc.data().designs || [];
          batch.update(viewerRef, {
            designs: [...viewerDesigns, { designId, role: 0 }],
          });
        }
      }
      await batch.commit();
    } catch (batchError) {
      console.error("Error in batch update:", batchError);
    }

    res.status(200).json({
      id: designId,
      ...designData,
      link: `/design/${designId}`,
    });
  } catch (error) {
    console.error("Error creating design for the project:", error);

    // Rollback user document updates
    const userRollbackBatch = db.batch();
    try {
      for (const userDoc of updatedUserDocs) {
        userRollbackBatch.update(userDoc.ref, {
          designs: userDoc.previousDesigns,
        });
      }
      await userRollbackBatch.commit();
      console.log("Successfully rolled back user document updates");
    } catch (rollbackError) {
      console.error("Error rolling back user documents:", rollbackError);
    }

    // Rollback project updates
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

    // Delete created design document
    for (const doc of createdDocuments) {
      try {
        await db.collection(doc.collection).doc(doc.id).delete();
        console.log(`Deleted ${doc.id} document from ${doc.collection} collection`);
      } catch (deleteError) {
        console.error(`Error deleting ${doc.collection} document ${doc.id}:`, deleteError);
      }
    }

    res.status(500).json({ error: error.message });
  }
};

exports.fetchProjectDesigns = async (req, res) => {
  try {
    const { projectId } = req.params;

    const designsSnapshot = await db
      .collection("designs")
      .where("projectId", "==", projectId)
      .orderBy("createdAt", "desc")
      .get();

    const designs = designsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(designs);
  } catch (error) {
    console.error("Error fetching designs:", error);
    res.status(500).json({ message: "Error fetching designs", error: error.message });
  }
};

// Read
exports.fetchUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const projectsSnapshot = await db
      .collection("projects")
      .where("managers", "in", userId)
      .orderBy("createdAt", "desc")
      .get();

    const projects = projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
};

// Get role name
const getRoleNameProject = (role) => {
  switch (role) {
    case 0:
      return "Viewer";
    case 1:
      return "Content Manager";
    case 2:
      return "Contributor";
    case 3:
      return "Manager";
    default:
      return "";
  }
};

// Check if user is manage (manage), manager not in generalAccessRole
const isManagerProject = (projectDoc, userId) => {
  const projectData = projectDoc.data();
  const isManager = projectData.managers.includes(userId);
  return isManager;
};

// Check if user is manager or content manager in project (crud, but not change access/delete project)
const isContentManagerProject = (projectDoc, userId) => {
  const projectData = projectDoc.data();
  if (projectData.projectSettings.generalAccessSetting === 0) {
    // Restricted Access
    const isManager = projectData.managers.includes(userId);
    const isContentManager = projectData.contentManagers.includes(userId);
    return isManager || isContentManager;
  } else {
    // Anyone with the link
    if (projectData.projectSettings.generalAccessRole === 2) return true;
    const isManager = projectData.managers.includes(userId);
    const isContentManager = projectData.contentManagers.includes(userId);
    return isManager || isContentManager;
  }
};

// Check if user is manager, content manager, contributor (add, edit)
const isContributorProject = (projectDoc, userId) => {
  const projectData = projectDoc.data();
  if (projectData.projectSettings.generalAccessSetting === 0) {
    // Restricted Access
    const isManager = projectData.managers.includes(userId);
    const isContentManager = projectData.contentManagers.includes(userId);
    const isContributor = projectData.contributors.includes(userId);
    return isManager || isContentManager || isContributor;
  } else {
    // Anyone with the link
    if (
      projectData.projectSettings.generalAccessRole === 1 ||
      projectData.projectSettings.generalAccessRole === 2
    )
      return true;
    const isManager = projectData.managers.includes(userId);
    const isContentManager = projectData.contentManagers.includes(userId);
    const isContributor = projectData.contributors.includes(userId);
    return isManager || isContentManager || isContributor;
  }
};

// Check if user is manager, content manager, contributor, viewer (viewing)
const isCollaboratorProject = (projectDoc, userId) => {
  const projectData = projectDoc.data();
  if (projectData.projectSettings.generalAccessSetting === 0) {
    // Restricted Access
    const isManager = projectData.managers.includes(userId);
    const isContentManager = projectData.contentManagers.includes(userId);
    const isContributor = projectData.contributors.includes(userId);
    const isViewer = projectData.viewers.includes(userId);
    return isManager || isContentManager || isContributor || isViewer;
  } else {
    // Anyone with the link
    if (
      projectData.projectSettings.generalAccessRole === 0 ||
      projectData.projectSettings.generalAccessRole === 1 ||
      projectData.projectSettings.generalAccessRole === 2
    )
      return true;
    const isManager = projectData.managers.includes(userId);
    const isContentManager = projectData.contentManagers.includes(userId);
    const isContributor = projectData.contributors.includes(userId);
    const isViewer = projectData.viewers.includes(userId);
    return isManager || isContentManager || isContributor || isViewer;
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
      ref: projectRef,
      data: { projectName: previousName },
      collection: "budgets",
      id: projectRef.id,
    });

    // Perform update
    await projectRef.update({ projectName: name, modifiedAt: new Date() });

    // Notification
    try {
      // Get user settings for all users who need to be notified
      const project = projectDoc.data();
      const usersToNotify = [
        ...project.managers,
        ...project.contentManagers,
        ...project.contributors,
        ...project.viewers,
      ].filter((userId) => userId !== req.body.userId);
      const userSettingsPromises = usersToNotify.map((userId) =>
        db.collection("users").doc(userId).get()
      );
      const userDocs = await Promise.all(userSettingsPromises);
      for (const userDoc of userDocs) {
        if (!userDoc.exists) continue;
        const userId = userDoc.id;
        const settings = userDoc.data().notifSettings;
        // Skip if it's the current user or if notifications are disabled
        if (userId === req.body.userId || !settings?.allowNotif || !settings?.renamedDesign)
          continue;
        // Send notification
        await createNotification(
          userId,
          "project-update",
          "Project Renamed",
          `The project "${previousName}" has been renamed to "${name}"`,
          req.body.userId,
          `/project/${projectId}`,
          ["Highlight project name"],
          { projectId }
        );
      }
    } catch (notifError) {
      console.log("Notification error (non-critical):", notifError.message);
    }

    res.status(200).json({
      success: true,
      message: "Project name updated successfully",
      projectName: name,
    });
  } catch (error) {
    console.error("Error updating project name:", error);

    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
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
    console.log("updateProjectSettings - previousStates - ", previousStates);
    console.log("updateProjectSettings - data - ", {
      projectSettings,
      timelineSettings,
      planMapSettings,
      budgetSettings,
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
    console.log("updateProjectSettings - updated");

    res.status(200).json({
      message: "Project settings updated successfully",
      data: {
        projectSettings,
        timelineSettings,
        planMapSettings,
        budgetSettings,
        modifiedAt: new Date(),
      },
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

const sendEmail = async (to, subject, body) => {
  try {
    // "decoraition@gmail.com" or "no-reply@decoraition.org"
    const response = await resend.emails.send({
      from: "no-reply@decoraition.org",
      to,
      subject,
      html: body,
    });

    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

const sendEmailBcc = async (to, bcc, subject, body) => {
  try {
    // "decoraition@gmail.com" or "no-reply@decoraition.org"
    const response = await resend.emails.send({
      from: "no-reply@decoraition.org",
      to,
      bcc,
      subject,
      html: body,
    });

    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

exports.shareProject = async (req, res) => {
  const updatedDocuments = [];

  try {
    const { projectId } = req.params;
    const { userId, emails, role, message, notifyPeople } = req.body;
    console.log("sharedata - ", { projectId, userId, emails, role, message, notifyPeople });

    const getRoleField = (role) => {
      switch (role) {
        case 1:
          return "contributors";
        case 2:
          return "contentManagers";
        case 3:
          return "managers";
        case 0:
          return "viewers";
        default:
          return null;
      }
    };

    // Get the project document
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }
    const projectData = projectDoc.data();
    // Check user role in project
    const allowAction = isManagerProject(projectDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to share project" });
    }

    // Get user data for email notification
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userDoc.data();
    const userUsername = userData.username || `${userData.firstName} ${userData.lastName}`;
    const userEmail = userData.email;

    // Process each email
    const batch = db.batch();
    const userEmails = [];
    const nonUserEmails = [];
    const usersToAdd = {
      managers: [],
      contentManagers: [],
      contributors: [],
      viewers: [],
    };

    for (const email of emails) {
      const userSnapshot = await db.collection("users").where("email", "==", email).get();

      if (!userSnapshot.empty) {
        // User exists
        const userData = userSnapshot.docs[0].data();
        const collaboratorId = userSnapshot.docs[0].id;
        userEmails.push({
          email,
          username: userData.username || `${userData.firstName} ${userData.lastName}`,
        });

        // Update user's projects array
        const userRef = db.collection("users").doc(collaboratorId);
        const userDoc = await userRef.get();
        const currentProjects = userDoc.data().projects || [];
        const newProject = { projectId, role };

        if (!currentProjects.some((project) => project.projectId === projectId)) {
          updatedDocuments.push({
            collection: "users",
            id: collaboratorId,
            field: "projects",
            previousValue: currentProjects,
          });
          batch.update(userRef, {
            projects: [...currentProjects, newProject],
          });
        }

        // Add to appropriate role array in project
        const roleField = getRoleField(role);
        if (roleField) {
          const currentRoleArray = projectData[roleField] || [];
          if (!currentRoleArray.includes(collaboratorId)) {
            usersToAdd[roleField].push(collaboratorId);
          }
        }
      }
    }

    // Update project document with all users at once
    Object.entries(usersToAdd).forEach(([roleField, userIds]) => {
      if (userIds.length > 0) {
        const currentRoleArray = projectData[roleField] || [];
        const newRoleArray = [...new Set([...currentRoleArray, ...userIds])];
        updatedDocuments.push({
          collection: "projects",
          id: projectId,
          field: roleField,
          previousValue: currentRoleArray,
        });
        batch.update(projectRef, {
          [roleField]: newRoleArray,
        });
      }
    });

    // Commit all updates
    await batch.commit();
    console.log("sharedata - updatedDocuments - ", updatedDocuments);

    // Send emails if notifyPeople is true
    if (notifyPeople) {
      const emailBody = `<p>You have been added as a <strong>${getRoleNameProject(
        role
      )}</strong> in this project.</p>
        <p>You can access the project here: <a href="${appURL}/project/${projectId}">${
        projectData.projectName
      }</a></p>
        ${message && `<p>Message from ${userUsername} (${userEmail}):</p><p>${message}</p>`}`;

      await sendEmailBcc(
        userEmail, // primary recipient
        [...userEmails.map((ue) => ue.email), ...nonUserEmails], // BCC recipients
        "DecorAItion - Project Shared with You",
        emailBody
      );
    }

    // Notification
    // Send notifications to all newly added users
    try {
      if (notifyPeople) {
        for (const [roleField, userIds] of Object.entries(usersToAdd)) {
          for (const userId of userIds) {
            try {
              await createNotification(
                userId,
                "project-update",
                "New Project Shared",
                `You have been given ${getRoleNameProject(role)} access to the project "${
                  projectData.projectName
                }"`,
                req.body.userId, //notifBy
                `/project/${projectId}`,
                ["Open view collaborators modal", "Highlight user id"],
                { projectId, userId }
              );
            } catch (notifError) {
              console.error("Error sending notification to user:", userId, notifError);
            }
          }
        }
      }
    } catch (notifError) {
      console.error("Notification error (non-critical):", notifError);
    }

    res.status(200).json({
      success: true,
      message: "Project shared successfully",
    });
  } catch (error) {
    console.error("Error sharing project:", error);

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

    res.status(500).json({
      success: false,
      error: "Failed to share project",
    });
  }
};

exports.changeAccessProject = async (req, res) => {
  const updatedDocuments = [];

  try {
    const { projectId } = req.params;
    const { userId, initEmailsWithRole, emailsWithRole, generalAccessSetting, generalAccessRole } =
      req.body;
    console.log("changeAccessProject - ", {
      projectId,
      userId,
      initEmailsWithRole,
      emailsWithRole,
      generalAccessSetting,
      generalAccessRole,
    });

    // Get project document
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }
    const projectData = projectDoc.data();
    // Check user role in project
    const allowAction = isManagerProject(projectDoc, userId);
    if (!allowAction) {
      return res
        .status(403)
        .json({ error: "User does not have permission to update collaborators' access" });
    }

    // Get all users by email
    const usersSnapshot = await db
      .collection("users")
      .where(
        "email",
        "in",
        initEmailsWithRole.map((e) => e.email.toLowerCase())
      )
      .get();

    const usersByEmail = {};
    usersSnapshot.forEach((doc) => {
      usersByEmail[doc.data().email.toLowerCase()] = {
        id: doc.id,
        ...doc.data(),
      };
    });

    // Update parent documents (users) first
    for (const initUser of initEmailsWithRole) {
      const lowerEmail = initUser.email.toLowerCase();
      const user = usersByEmail[lowerEmail];
      if (!user) continue;

      const userRef = db.collection("users").doc(user.id);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Update user's projects array
      const userProjects = userData.projects || [];
      const projectIndex = userProjects.findIndex((d) => d.projectId === projectId);
      // Check if user is in emailsWithRole
      const updatedUser = emailsWithRole.find((e) => e.email.toLowerCase() === lowerEmail);
      if (!updatedUser) {
        // Remove access if user is not in emailsWithRole
        if (projectIndex >= 0) {
          userProjects.splice(projectIndex, 1);
          updatedDocuments.push({
            ref: userRef,
            field: "projects",
            previousValue: userData.projects,
          });
          await userRef.update({ projects: userProjects });
        }
      } else if (updatedUser.role !== initUser.role) {
        // Update role if it changed
        if (projectIndex >= 0) {
          userProjects[projectIndex].role = updatedUser.role;
          updatedDocuments.push({
            ref: userRef,
            field: "projects",
            previousValue: userData.projects,
          });
          await userRef.update({ projects: userProjects });
        }
      }
    }

    // Update project document (child)
    const contributors = [...(projectData.contributors || [])];
    const contentManagers = [...(projectData.contentManagers || [])];
    const managers = [...(projectData.managers || [])];
    const viewers = [...(projectData.viewers || [])];

    // Remove users from their previous roles and add to new roles
    for (const initUser of initEmailsWithRole) {
      const lowerEmail = initUser.email.toLowerCase();
      const user = usersByEmail[lowerEmail];
      if (!user) continue;

      // Remove from previous role array
      switch (initUser.role) {
        case 1:
          const contributorIndex = contributors.indexOf(user.id);
          if (contributorIndex > -1) contributors.splice(contributorIndex, 1);
          break;
        case 2:
          const contentManagerIndex = contentManagers.indexOf(user.id);
          if (contentManagerIndex > -1) contentManagers.splice(contentManagerIndex, 1);
          break;
        case 3:
          const managerIndex = managers.indexOf(user.id);
          if (managerIndex > -1) managers.splice(managerIndex, 1);
          break;
        case 0:
          const viewerIndex = viewers.indexOf(user.id);
          if (viewerIndex > -1) viewers.splice(viewerIndex, 1);
          break;
        default:
          break;
      }

      // Add to new role array if user is in emailsWithRole
      const updatedUser = emailsWithRole.find((e) => e.email.toLowerCase() === lowerEmail);
      if (updatedUser) {
        switch (updatedUser.role) {
          case 1:
            if (!contributors.includes(user.id)) contributors.push(user.id);
            break;
          case 2:
            if (!contentManagers.includes(user.id)) contentManagers.push(user.id);
            break;
          case 3:
            if (!managers.includes(user.id)) managers.push(user.id);
            break;
          case 0:
            if (!viewers.includes(user.id)) viewers.push(user.id);
            break;
          default:
            break;
        }
      }
    }

    // Prepare the update object
    const updateObject = {
      contributors,
      contentManagers,
      managers,
      viewers,
      modifiedAt: new Date(),
    };

    // Add project settings update if they've changed
    if (typeof generalAccessSetting !== "undefined" || typeof generalAccessRole !== "undefined") {
      updateObject.projectSettings = {
        ...projectData.projectSettings,
        ...(typeof generalAccessSetting !== "undefined" && { generalAccessSetting }),
        ...(typeof generalAccessRole !== "undefined" && { generalAccessRole }),
      };
    }

    const previousProjectSettings = {
      ...projectData.projectSettings,
    };
    updatedDocuments.push({
      ref: projectRef,
      previousValue: {
        contributors: projectData.contributors,
        contentManagers: projectData.contentManagers,
        managers: projectData.managers,
        viewers: projectData.viewers,
        projectSettings: previousProjectSettings,
      },
    });
    await projectRef.update(updateObject);
    console.log("changeAccessProject - updatedDocuments - ", updatedDocuments);

    // Send notifications
    try {
      // 1. Get user settings for all users who need to be notified
      const userSettingsPromises = initEmailsWithRole.map((user) =>
        db.collection("users").doc(user.userId).get()
      );
      const userDocs = await Promise.all(userSettingsPromises);
      const userSettings = userDocs.reduce((acc, doc) => {
        if (doc.exists) acc[doc.id] = doc.data().notifSettings;
        return acc;
      }, {});

      // 2. Find users whose roles actually changed
      const usersWithChangedRoles = emailsWithRole.filter((user) => {
        const initUser = initEmailsWithRole.find((init) => init.userId === user.userId);
        return !initUser || initUser.role !== user.role;
      });

      // 3. Find users who had their access removed
      const removedUsers = initEmailsWithRole.filter(
        (initUser) => !emailsWithRole.some((user) => user.userId === initUser.userId)
      );

      // 4. Send notifications to users with changed roles
      for (const user of usersWithChangedRoles) {
        // Skip if it's the current user or if notifications are disabled
        if (
          user.userId === req.body.userId ||
          !userSettings[user.userId]?.allowNotif ||
          !userSettings[user.userId]?.changeRoleInProject
        ) {
          continue;
        }

        await createNotification(
          user.userId,
          "project-update",
          "Project Role Updated",
          `Your role in the project "${projectData.projectName}" has been changed to ${user.roleLabel}`,
          req.body.userId,
          `/project/${projectId}`,
          ["Open view collaborators modal", "Highlight user id"],
          { projectId, userId: user.userId }
        );
      }

      // 5. Send notifications to users who had access removed
      for (const user of removedUsers) {
        // Skip if it's the current user or if notifications are disabled
        if (
          user.userId === req.body.userId ||
          !userSettings[user.userId]?.allowNotif ||
          !userSettings[user.userId]?.changeRoleInProject
        ) {
          continue;
        }

        await createNotification(
          user.userId,
          "project-update",
          "Project Access Removed",
          `Your access to the project "${projectData.projectName}" has been removed`,
          req.body.userId,
          `/project/${projectId}`,
          [],
          { projectId }
        );
      }
    } catch (notifError) {
      console.error("Notification error (non-critical):", notifError);
    }

    res.status(200).json({
      success: true,
      message: "Project access changed",
    });
  } catch (error) {
    console.error("Error updating project:", error);

    // Rollback updates
    for (const update of updatedDocuments) {
      try {
        if (update.field) {
          await update.ref.update({ [update.field]: update.previousValue });
        } else {
          await update.ref.update(update.previousValue);
        }
      } catch (rollbackError) {
        console.error("Error rolling back update:", rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to change access of project collaborators",
    });
  }
};

exports.importDesignToProject = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { projectId } = req.params;
    const { userId, designId } = req.body;

    // Verify the existence of the project
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: "Project not found" });
    }
    // Check user role in design
    const allowAction = isContributorProject(projectDoc, userId);
    if (!allowAction) {
      return res
        .status(403)
        .json({ error: "User does not have permission to import a design for this project" });
    }

    // Get the design document
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }

    // Update design's projectId
    const previousProjectId = designDoc.data().projectId || [];
    updatedDocuments.push({
      collection: "designs",
      id: designId,
      field: "projectId",
      previousValue: previousProjectId || null,
    });
    await designDoc.ref.update({
      projectId,
      modifiedAt: new Date(),
    });

    // Update the project's designs field
    const previousDesigns = projectDoc.data().designs || [];
    updatedDocuments.push({
      collection: "projects",
      id: projectId,
      field: "designs",
      previousValue: previousDesigns,
    });
    await projectRef.update({
      designs: [...previousDesigns, designId],
      modifiedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Design imported to project",
    });
  } catch (error) {
    console.error("Error importing design to project:", error);

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

    res.status(500).json({
      success: false,
      error: "Failed to import design to project",
    });
  }
};

exports.removeDesignFromProject = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { projectId } = req.params;
    const { userId, designId } = req.body;

    // Verify the existence of the project
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: "Project not found" });
    }
    // Check user role in project
    const allowAction = isContentManagerProject(projectDoc, userId);
    if (!allowAction) {
      return res
        .status(403)
        .json({ error: "User does not have permission to remove design from this project" });
    }

    // Get the design document
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }

    // Update design's projectId
    const previousProjectId = designDoc.data().projectId || [];
    updatedDocuments.push({
      collection: "designs",
      id: designId,
      field: "projectId",
      previousValue: previousProjectId || null,
    });
    await designDoc.ref.update({
      projectId: null,
      modifiedAt: new Date(),
    });

    // Update the project's designs field
    const previousDesigns = projectDoc.data().designs || [];
    updatedDocuments.push({
      collection: "projects",
      id: projectId,
      field: "designs",
      previousValue: previousDesigns,
    });
    const newDesigns = previousDesigns.filter((id) => id !== designId);
    await projectRef.update({
      designs: newDesigns,
      modifiedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Design removed from project",
    });
  } catch (error) {
    console.error("Error removing design from project:", error);

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

    res.status(500).json({
      success: false,
      error: "Failed to remove design from project",
    });
  }
};

// Move project to trash
exports.moveProjectToTrash = async (req, res) => {
  const batch = db.batch();
  const previousStates = [];

  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    // Get project document
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check user role in project
    const allowAction = isManagerProject(projectDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to delete project" });
    }

    const projectData = projectDoc.data();
    // Store original state
    previousStates.push({
      ref: projectRef,
      data: projectData,
      type: "project",
    });

    // Create document in deletedProjects with same ID
    const deletedProjectRef = db.collection("deletedProjects").doc(projectId);
    const deletedProjectData = {
      ...projectData,
      modifiedAt: new Date(),
      deletedAt: new Date(),
    };
    batch.set(deletedProjectRef, deletedProjectData);

    // Get all collaborators
    const collaborators = new Set([
      ...(projectData.managers || []),
      ...(projectData.contentManagers || []),
      ...(projectData.contributors || []),
      ...(projectData.viewers || []),
    ]);

    // Update each collaborator's document
    for (const collaboratorId of collaborators) {
      const userRef = db.collection("users").doc(collaboratorId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        previousStates.push({
          ref: userRef,
          data: userData,
          type: "user",
        });

        // Update user's arrays
        const updatedProjects = (userData.projects || []).filter(
          (project) => project.projectId !== projectId
        );
        const updatedDeletedProjects = [...(userData.deletedProjects || []), projectId];

        batch.update(userRef, {
          projects: updatedProjects,
          deletedProjects: updatedDeletedProjects,
        });
      }
    }

    // Delete original project
    batch.delete(projectRef);

    // Commit all changes
    await batch.commit();

    res.status(200).json({
      success: true,
      message: "Project moved to trash successfully",
    });
  } catch (error) {
    console.error("Error moving project to trash:", error);

    // Rollback using previous states
    try {
      const rollbackBatch = db.batch();
      for (const state of previousStates) {
        if (state.type === "project") {
          rollbackBatch.set(state.ref, state.data);
        } else if (state.type === "user") {
          rollbackBatch.update(state.ref, state.data);
        }
      }
      await rollbackBatch.commit();
      console.log("Rollback completed successfully");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError.meessage);
    }

    res.status(500).json({ error: "Failed to move project to trash" });
  }
};

// Restore project from trash
exports.restoreProjectFromTrash = async (req, res) => {
  const batch = db.batch();
  const previousStates = [];

  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    // Get deleted project document
    const deletedProjectRef = db.collection("deletedProjects").doc(projectId);
    const deletedProjectDoc = await deletedProjectRef.get();
    if (!deletedProjectDoc.exists) {
      return res.status(404).json({ error: "Deleted project not found" });
    }

    // Check user role in project
    const allowAction = isManagerProject(deletedProjectDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to restore project" });
    }

    const projectData = deletedProjectDoc.data();
    // Store original state
    previousStates.push({
      ref: deletedProjectRef,
      data: projectData,
      type: "deletedProject",
    });

    // Create document in projects collection with same ID
    const projectRef = db.collection("projects").doc(projectId);
    const restoredProjectData = {
      ...projectData,
      deletedAt: null,
      modifiedAt: new Date(),
    };
    batch.set(projectRef, restoredProjectData);

    // Get all collaborators
    const collaborators = new Set([
      ...(projectData.managers || []),
      ...(projectData.contentManagers || []),
      ...(projectData.contributors || []),
      ...(projectData.viewers || []),
    ]);

    // Update each collaborator's document
    for (const collaboratorId of collaborators) {
      const userRef = db.collection("users").doc(collaboratorId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        previousStates.push({
          ref: userRef,
          data: userData,
          type: "user",
        });

        // Update user's arrays
        const updatedDeletedProjects = (userData.deletedProjects || []).filter(
          (id) => id !== projectId
        );

        // Determine user's role in the project
        let role = 0; // default viewer
        if (projectData.managers?.includes(collaboratorId)) role = 3; // manager
        else if (projectData.contentManagers?.includes(collaboratorId)) role = 2; // content manager
        else if (projectData.contributors?.includes(collaboratorId)) role = 1; // contributor

        const updatedProjects = [...(userData.projects || []), { projectId, role }];

        batch.update(userRef, {
          projects: updatedProjects,
          deletedProjects: updatedDeletedProjects,
        });
      }
    }

    // Delete from deletedProjects
    batch.delete(deletedProjectRef);

    // Commit all changes
    await batch.commit();

    res.status(200).json({
      success: true,
      message: "Project restored from trash",
    });
  } catch (error) {
    console.error("Error restoring project c:", error);

    // Rollback using previous states
    try {
      const rollbackBatch = db.batch();
      for (const state of previousStates) {
        if (state.type === "deletedProject") {
          rollbackBatch.set(state.ref, state.data);
        } else if (state.type === "user") {
          rollbackBatch.update(state.ref, state.data);
        }
      }
      await rollbackBatch.commit();
      console.log("Rollback completed successfully");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    res.status(500).json({ error: "Failed to restore project from trash" });
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
    const projectRef = db.collection("deletedProjects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Deleted project not found" });
    }
    const projectData = projectDoc.data();
    // Check user role in project
    const allowAction = isManagerProject(projectDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to delete project" });
    }

    // 1. Update parent documents first (users, designs)
    // Update user's project array
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const previousProjects = [...userData.projects];
      const updatedProjects = previousProjects.filter((project) => project.projectId !== projectId);
      updatedDocuments.push({
        ref: userRef,
        field: "projects",
        previousValue: previousProjects,
        newValue: updatedProjects,
      });
      await userRef.update({ projects: updatedProjects });
      console.log(`Successfully updated document: ${userRef.path}, field: projects`);
    }

    // Update designs that reference this project
    const designsRef = db.collection("designs");
    const designsWithProject = await designsRef.where("projectId", "==", projectId).get();

    for (const designDoc of designsWithProject.docs) {
      const previousData = designDoc.data();
      updatedDocuments.push({
        ref: designDoc.ref,
        field: "projectId",
        previousValue: previousData.projectId,
        newValue: null,
      });
      await designDoc.ref.update({ projectId: null });
      console.log(`Successfully updated document: ${designDoc.ref.path}, field: projectId`);
    }

    // 2. Delete project first (to trigger listeners)
    deletedDocuments.push({
      ref: projectRef,
      data: projectData,
    });
    await projectRef.delete();
    console.log(`Successfully deleted document: ${projectRef.path}`);

    // 3. Delete associated documents in correct order
    // Delete projectBudget
    if (projectData.projectBudgetId) {
      const projectBudgetRef = db.collection("projectBudgets").doc(projectData.projectBudgetId);
      const projectBudgetDoc = await projectBudgetRef.get();
      if (projectBudgetDoc.exists) {
        const projectBudgetData = projectBudgetDoc.data();
        deletedDocuments.push({
          ref: projectBudgetRef,
          data: projectBudgetData,
        });
        await projectBudgetRef.delete();
        console.log(`Successfully deleted document: ${projectBudgetRef.path}`);
      }
    }

    // Delete planMap first, then its pins
    if (projectData.planMapId) {
      const planMapRef = db.collection("planMaps").doc(projectData.planMapId);
      const planMapDoc = await planMapRef.get();
      if (planMapDoc.exists) {
        const planMapData = planMapDoc.data();

        // Delete planMap first to trigger listeners
        deletedDocuments.push({
          ref: planMapRef,
          data: planMapData,
        });
        await planMapRef.delete();
        console.log(`Successfully deleted document: ${planMapRef.path}`);

        // Then delete associated pins
        const pinsToDelete = planMapData.pins || [];
        for (const pinId of pinsToDelete) {
          const pinRef = db.collection("pins").doc(pinId);
          const pinDoc = await pinRef.get();
          if (pinDoc.exists) {
            const pinData = pinDoc.data();
            deletedDocuments.push({
              ref: pinRef,
              data: pinData,
            });
            await pinRef.delete();
            console.log(`Successfully deleted document: ${pinRef.path}`);
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
        deletedDocuments.push({
          ref: timelineRef,
          data: timelineData,
        });
        await timelineRef.delete();
        console.log(`Successfully deleted document: ${timelineRef.path}`);

        // Then delete associated events
        const eventsToDelete = timelineData.events || [];
        for (const eventId of eventsToDelete) {
          const eventRef = db.collection("events").doc(eventId);
          const eventDoc = await eventRef.get();
          if (eventDoc.exists) {
            const eventData = eventDoc.data();
            deletedDocuments.push({
              ref: eventRef,
              data: eventData,
            });
            await eventRef.delete();
            console.log(`Successfully deleted document: ${eventRef.path}`);
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
