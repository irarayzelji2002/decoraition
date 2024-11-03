const { db, auth, clientAuth, clientDb } = require("../firebase");
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { doc, getDoc, arrayUnion } = require("firebase/firestore");
const { Resend } = require("resend");
const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);
const appURL = process.env.REACT_APP_URL;

// Create Design
exports.createDesign = async (req, res) => {
  const createdDocuments = [];
  try {
    const { userId, designName } = req.body;

    // Create design document
    const designData = {
      designName,
      owner: userId,
      editors: [],
      commenters: [],
      viewers: [],
      history: [],
      projectId: null,
      createdAt: new Date(),
      modifiedAt: new Date(),
      isCopied: false,
      isCopiedFrom: { designId: "", versionId: "" },
      designSettings: {
        generalAccessSetting: 0, //0 for Restricted, 1 for Anyone with the link
        generalAccessRole: 0, //0 for viewer, 1 for editor, 2 for commenter, 3 for owner
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

    // Create associated budget document
    const budgetData = {
      designId: designId,
      budget: {
        amount: 0,
        currency: "PHP", //default
      },
      items: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const budgetRef = await db.collection("budgets").add(budgetData);
    const budgetId = budgetRef.id;
    createdDocuments.push({ collection: "budgets", id: budgetId });

    // Update design document with budgetId
    await designRef.update({ budgetId });

    // Update user's designs array
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const updatedDesigns = userData.designs ? [...userData.designs] : [];
    updatedDesigns.push({ designId, role: 3 }); // 3 for owner
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    await userRef.update({
      designs: updatedDesigns,
    });

    res.status(200).json({
      id: designId,
      ...designData,
      link: `/design/${designId}`,
      budgetId,
    });
  } catch (error) {
    console.error("Error creating design:", error);

    // Rollback: delete all created documents
    for (const doc of createdDocuments) {
      try {
        await db.collection(doc.collection).doc(doc.id).delete();
        console.log(`Deleted ${doc.id} document from ${doc.collection} collection`);
      } catch (deleteError) {
        console.error(`Error deleting ${doc.collection} document ${doc.id}:`, deleteError);
      }
    }

    res.status(500).json({ message: "Error creating design", error: error.message });
  }
};

// Read
exports.fetchUserDesigns = async (req, res) => {
  try {
    const { userId } = req.params;
    const designsSnapshot = await db
      .collection("designs")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    const designs = designsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(designs);
  } catch (error) {
    console.error("Error fetching designs:", error);
    res.status(500).json({ error: "Failed to fetch designs" });
  }
};

// Update Name
exports.updateDesignName = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { designId } = req.params;
    const { name } = req.body;
    const designRef = db.collection("designs").doc(designId);

    // Store previous name for potential rollback
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const previousName = designDoc.data().designName;
    updatedDocuments.push({
      collection: "designs",
      id: designId,
      field: "designName",
      previousValue: previousName,
    });

    // Perform update
    await designRef.update({ designName: name, modifiedAt: new Date() });
    res.status(200).json({
      success: true,
      message: "Design name updated successfully",
      designName: name,
    });
  } catch (error) {
    console.error("Error updating design name:", error);

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

    res.status(500).json({ error: "Failed to update design name" });
  }
};

// Update Design Settings
exports.updateDesignSettings = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { designId } = req.params;
    const { designSettings } = req.body;

    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();

    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }

    // Store the previous settings before update
    const previousSettings = designDoc.data().designSettings;
    updatedDocuments.push({
      collection: "designs",
      id: designId,
      field: "designSettings",
      previousValue: previousSettings,
    });

    // Perform update
    await designRef.update({
      designSettings: designSettings,
      modifiedAt: new Date(),
    });

    res.status(200).json({
      message: "Design settings updated successfully",
      designSettings: designSettings,
    });
  } catch (error) {
    console.error("Error updating design settings:", error);

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

    res.status(500).json({ error: "Failed to update design settings" });
  }
};

// Get Design History/Versions' Data
exports.getDesignVersionDetails = async (req, res) => {
  try {
    const { designId } = req.params;

    // Get the design document
    const designDoc = await db.collection("designs").doc(designId).get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }

    const designData = designDoc.data();
    const versionDetails = [];

    // Get details for each version in history
    for (const versionId of designData.history) {
      const versionDoc = await db.collection("designVersions").doc(versionId).get();
      if (versionDoc.exists) {
        const versionData = versionDoc.data();
        versionDetails.push({
          id: versionId,
          ...versionData,
          imagesLink: versionData.images?.map((img) => img.link) || [],
        });
      }
    }

    res.status(200).json({ versionDetails });
  } catch (error) {
    console.error("Error getting design version details:", error);
    res.status(500).json({ error: "Failed to get design version details" });
  }
};

// Restore Design Version
exports.restoreDesignVersion = async (req, res) => {
  try {
    const { designId, versionId } = req.params;

    // Get the design document & version to restore
    const designDoc = await db.collection("designs").doc(designId).get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const versionDoc = await db.collection("designVersions").doc(versionId).get();
    if (!versionDoc.exists) {
      return res.status(404).json({ error: "Design version not found" });
    }

    // Create new version document with empty field
    const newVersionData = {
      description: versionDoc.data().description,
      images: [],
      createdAt: new Date(),
      copiedDesigns: [],
      isRestored: true,
      isRestoredFrom: { designId, versionId },
    };
    const newVersionRef = await db.collection("designVersions").add(newVersionData);
    const newVersionId = newVersionRef.id;

    // Get current history array and append new version then update design document
    const currentHistory = designDoc.data().history || [];
    const updatedHistory = [...currentHistory, newVersionId];
    await db.collection("designs").doc(designId).update({
      history: updatedHistory,
      modifiedAt: new Date(),
    });

    // Copy data from original version to new version
    await newVersionRef.update({
      images: versionDoc.data().images,
    });

    res.status(200).json({
      success: true,
      message: "Design version restored successfully",
      versionId: newVersionId,
    });
  } catch (error) {
    console.error("Error restoring design version:", error);
    res.status(500).json({ error: "Failed to restore design version" });
  }
};

// Make a Copy of Design
exports.copyDesign = async (req, res) => {
  const createdDocuments = [];
  const updatedDocuments = [];
  try {
    const { designId, versionId } = req.params;
    const { userId, shareWithCollaborators } = req.body;

    // Get original design and version documents
    const origDesignDoc = await db.collection("designs").doc(designId).get();
    const origDesignData = origDesignDoc.data();
    if (!origDesignDoc.exists) {
      return res.status(404).json({ error: "Original design not found" });
    }

    // Get original budget document
    const origBudgetDoc = await db.collection("budgets").doc(origDesignData.budgetId).get();
    if (!origBudgetDoc.exists) {
      return res.status(404).json({ error: "Original budget not found" });
    }
    const origBudgetData = origBudgetDoc.data();

    // Step 1: Create empty design document first (following dependency order)
    const emptyDesignData = {
      designName: "",
      owner: "",
      editors: [],
      commenters: [],
      viewers: [],
      history: [],
      projectId: "",
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    const newDesignRef = await db.collection("designs").add(emptyDesignData);
    const newDesignId = newDesignRef.id;
    createdDocuments.push({ collection: "designs", id: newDesignId });

    // Step 2: Create empty budget document
    const emptyBudgetData = {
      designId: newDesignId,
      budget: { amount: 0, currency: "PHP" },
      items: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    const newBudgetRef = await db.collection("budgets").add(emptyBudgetData);
    const newBudgetId = newBudgetRef.id;
    createdDocuments.push({ collection: "budgets", id: newBudgetId });

    // Step 3: Create empty items (following dependency order)
    const newItemIds = [];
    for (const origItemId of origBudgetData.items) {
      const emptyItemRef = await db.collection("items").add({
        itemName: "",
        description: "",
        cost: { amount: 0, currency: "PHP" },
        quantity: 0,
        image: "",
        includedInTotal: true,
        createdAt: new Date(),
        modifiedAt: new Date(),
        budgetId: newBudgetId,
      });
      newItemIds.push(emptyItemRef.id);
      createdDocuments.push({ collection: "items", id: emptyItemRef.id });
    }

    // Step 4: Update user's designs array (parent collection update)
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    const userData = userDoc.data();
    const updatedDesigns = userData.designs ? [...userData.designs] : [];
    updatedDesigns.push({ designId: newDesignId, role: 2 }); // 2 for owner
    await userRef.update({ designs: updatedDesigns });
    updatedDocuments.push({
      collection: "users",
      id: userId,
      field: "designs",
      previousValue: userData.designs,
    });

    // Step 5: Update version's copiedDesigns array
    const versionRef = db.collection("designVersions").doc(versionId);
    const versionDoc = await versionRef.get();
    const previousCopiedDesigns = versionDoc.data().copiedDesigns || [];
    await versionRef.update({
      copiedDesigns: [...previousCopiedDesigns, newDesignId],
    });
    updatedDocuments.push({
      collection: "designVersions",
      id: versionId,
      field: "copiedDesigns",
      previousValue: previousCopiedDesigns,
    });

    // Step 6: Update design document with full data
    const fullDesignData = {
      designName: `Copy of ${origDesignData.designName}`,
      owner: userId,
      editors: shareWithCollaborators
        ? userId !== origDesignData.owner
          ? [...origDesignData.editors, userId]
          : origDesignData.editors
        : [],
      commenters: shareWithCollaborators ? origDesignData.commenters : [],
      viewers: shareWithCollaborators ? origDesignData.viewers : [],
      history: [versionId],
      projectId: "",
      budgetId: newBudgetId,
      link: `/design/${newDesignId}`,
      isCopied: true,
      isCopiedFrom: { designId, versionId },
      designSettings: shareWithCollaborators
        ? origDesignData.designSettings
        : {
            generalAccessSetting: 0,
            generalAccessRole: 0,
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
      modifiedAt: new Date(),
    };
    await newDesignRef.update(fullDesignData);

    // Step 7: Update budget document with full data
    await newBudgetRef.update({
      budget: origBudgetData.budget,
      items: newItemIds,
      modifiedAt: new Date(),
    });

    // Step 8: Update items with full data
    for (let i = 0; i < origBudgetData.items.length; i++) {
      const origItemDoc = await db.collection("items").doc(origBudgetData.items[i]).get();
      if (origItemDoc.exists) {
        const origItemData = origItemDoc.data();
        await db
          .collection("items")
          .doc(newItemIds[i])
          .update({
            ...origItemData,
            budgetId: newBudgetId,
            modifiedAt: new Date(),
          });
      }
    }

    res.status(200).json({
      success: true,
      message: "Design copied successfully",
      designId: newDesignId,
    });
  } catch (error) {
    console.error("Error copying design:", error);

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

    // Rollback created documents
    for (const doc of createdDocuments) {
      try {
        await db.collection(doc.collection).doc(doc.id).delete();
        console.log(`Deleted ${doc.id} document from ${doc.collection} collection`);
      } catch (deleteError) {
        console.error(`Error deleting ${doc.collection} document ${doc.id}:`, deleteError);
      }
    }

    res.status(500).json({ error: "Failed to copy design" });
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

exports.shareDesign = async (req, res) => {
  const updatedDocuments = [];
  const createdDocuments = [];

  try {
    const { designId } = req.params;
    const { userId, emails, role, message, notifyPeople } = req.body;

    const getRoleField = (role) => {
      switch (role) {
        case 1:
          return "editors";
        case 2:
          return "commenters";
        case 0:
          return "viewers";
        default:
          return null;
      }
    };

    // Get the design document
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const designData = designDoc.data();

    // Get owner data for email notification
    const ownerRef = db.collection("users").doc(designData.owner);
    const ownerDoc = await ownerRef.get();
    if (!ownerDoc.exists) {
      return res.status(404).json({ error: "Owner not found" });
    }
    const ownerData = ownerDoc.data();
    const ownerUsername = ownerData.username || `${ownerData.firstName} ${ownerData.lastName}`;
    const ownerEmail = ownerData.email;

    // Process each email
    const batch = db.batch();
    const userEmails = [];
    const nonUserEmails = [];

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

        // Update user's designs array
        const userRef = db.collection("users").doc(collaboratorId);
        const userDoc = await userRef.get();
        const currentDesigns = userDoc.data().designs || [];
        const newDesign = { designId, role };

        if (!currentDesigns.some((design) => design.designId === designId)) {
          batch.update(userRef, {
            designs: [...currentDesigns, newDesign],
          });
          updatedDocuments.push({
            collection: "users",
            id: collaboratorId,
            field: "designs",
            previousValue: currentDesigns,
          });
        }

        // Add to appropriate role array in design
        const roleField = getRoleField(role);
        if (roleField) {
          const currentRoleArray = designData[roleField] || [];
          if (!currentRoleArray.includes(collaboratorId)) {
            batch.update(designRef, {
              [roleField]: [...currentRoleArray, collaboratorId],
            });
            updatedDocuments.push({
              collection: "designs",
              id: designId,
              field: roleField,
              previousValue: currentRoleArray,
            });
          }
        }
      } else {
        // User doesn't exist - add to nonUserInvites
        nonUserEmails.push(email);
        const nonUserRef = db.collection("nonUserInvites").doc(email);
        const nonUserDoc = await nonUserRef.get();

        if (nonUserDoc.exists) {
          const currentDesigns = nonUserDoc.data().designs || [];
          const newDesign = { designId, role };

          if (!currentDesigns.some((design) => design.designId === designId)) {
            batch.update(nonUserRef, {
              designs: [...currentDesigns, newDesign],
            });
            updatedDocuments.push({
              collection: "nonUserInvites",
              id: email,
              field: "designs",
              previousValue: currentDesigns,
            });
          }
        } else {
          batch.set(nonUserRef, {
            email,
            designs: [{ designId, role }],
            projects: [],
          });
          createdDocuments.push({
            collection: "nonUserInvites",
            id: email,
          });
        }
      }
    }

    // Commit all updates
    await batch.commit();

    // Send emails if notifyPeople is true
    if (notifyPeople) {
      const emailBody = `<p>You have been added as a ${role} in this design.</p>
        <p>You can access the design here: <a href="${appURL}/design/${designId}">${
        designData.designName
      }</a></p>
        <p>Message from ${ownerUsername} (${ownerEmail}):</p>
        <p>${message || "No message provided"}</p>`;

      await sendEmailBcc(
        ownerEmail, // primary recipient
        [...userEmails.map((ue) => ue.email), ...nonUserEmails], // BCC recipients
        "DecorAItion - Design Shared with You",
        emailBody
      );
    }

    res.status(200).json({
      success: true,
      message: "Design shared successfully",
    });
  } catch (error) {
    console.error("Error sharing design:", error);

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

    // Rollback created documents
    for (const doc of createdDocuments) {
      try {
        await db.collection(doc.collection).doc(doc.id).delete();
        console.log(`Deleted ${doc.id} document from ${doc.collection} collection`);
      } catch (deleteError) {
        console.error(`Error deleting ${doc.collection} document ${doc.id}:`, deleteError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to share design",
    });
  }
};

exports.changeAccessDesign = async (req, res) => {
  const updatedDocuments = [];

  try {
    const { designId } = req.params;
    const { userId, initEmailsWithRole, emailsWithRole } = req.body;

    // Get design document
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();

    if (!designDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Design not found",
      });
    }

    const designData = designDoc.data();

    // Get all users by email
    const usersSnapshot = await db
      .collection("users")
      .where(
        "email",
        "in",
        emailsWithRole.map((e) => e.email.toLowerCase())
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
    for (const { email, role } of emailsWithRole) {
      const lowerEmail = email.toLowerCase();
      const user = usersByEmail[lowerEmail];
      if (!user) continue;

      const userRef = db.collection("users").doc(user.id);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Update user's designs array
      const userDesigns = userData.designs || [];
      const designIndex = userDesigns.findIndex((d) => d.designId === designId);

      if (designIndex >= 0) {
        userDesigns[designIndex].role = role;
      } else {
        userDesigns.push({ designId, role });
      }

      await userRef.update({ designs: userDesigns });
      updatedDocuments.push({
        ref: userRef,
        field: "designs",
        previousValue: userData.designs,
      });
    }

    // Update design document (child)
    const editors = [...(designData.editors || [])];
    const commenters = [...(designData.commenters || [])];
    const viewers = [...(designData.viewers || [])];

    // Remove users from their previous roles first
    for (const { email } of initEmailsWithRole) {
      const lowerEmail = email.toLowerCase();
      const user = usersByEmail[lowerEmail];
      if (!user) continue;

      const initRole = initEmailsWithRole.find((e) => e.email.toLowerCase() === lowerEmail)?.role;

      // Remove from previous role array
      switch (initRole) {
        case 1:
          const editorIndex = editors.indexOf(user.id);
          if (editorIndex > -1) editors.splice(editorIndex, 1);
          break;
        case 2:
          const commenterIndex = commenters.indexOf(user.id);
          if (commenterIndex > -1) commenters.splice(commenterIndex, 1);
          break;
        case 0:
          const viewerIndex = viewers.indexOf(user.id);
          if (viewerIndex > -1) viewers.splice(viewerIndex, 1);
          break;
        default:
          break;
      }
    }

    // Add users to their new roles
    for (const { email, role } of emailsWithRole) {
      const lowerEmail = email.toLowerCase();
      const user = usersByEmail[lowerEmail];
      if (!user) continue;

      // Add to new role array
      switch (role) {
        case 1:
          if (!editors.includes(user.id)) editors.push(user.id);
          break;
        case 2:
          if (!commenters.includes(user.id)) commenters.push(user.id);
          break;
        case 0:
          if (!viewers.includes(user.id)) viewers.push(user.id);
          break;
        default:
          break;
      }
    }

    await designRef.update({
      editors,
      commenters,
      viewers,
      modifiedAt: new Date(),
    });

    updatedDocuments.push({
      ref: designRef,
      previousValue: {
        editors: designData.editors,
        commenters: designData.commenters,
        viewers: designData.viewers,
      },
    });

    res.status(200).json({
      success: true,
      message: "Design collaborators' access changed",
    });
  } catch (error) {
    console.error("Error updating design:", error);

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
      error: "Failed to change access of design collaborators",
    });
  }
};

// Update
exports.updateDesign = async (req, res) => {
  try {
    const { designId } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();
    await db.collection("designs").doc(designId).update(updateData);
    res.json({ message: "Design updated successfully" });
  } catch (error) {
    console.error("Error updating design:", error);
    res.status(500).json({ error: "Failed to update design" });
  }
};

// Delete Design
exports.deleteDesign = async (req, res) => {
  const deletedDocuments = [];
  const updatedDocuments = [];
  try {
    const { designId } = req.params;
    const { userId } = req.body;

    // Get design data first to check existence
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const designData = designDoc.data();

    // 1. Update parent documents first (users, projects, designs)
    // Update user's designs array
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const previousDesigns = [...userData.designs];
      const updatedDesigns = previousDesigns.filter((design) => design.designId !== designId);
      await userRef.update({ designs: updatedDesigns });
      updatedDocuments.push({
        ref: userRef,
        field: "designs",
        previousValue: previousDesigns,
        newValue: updatedDesigns,
      });
    }

    // Update projects containing this design
    const projectsSnapshot = await db
      .collection("projects")
      .where("designs", "array-contains", { designId })
      .get();

    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      const previousDesigns = [...projectData.designs];
      const updatedDesigns = previousDesigns.filter((design) => design.designId !== designId);
      await projectDoc.ref.update({ designs: updatedDesigns });
      updatedDocuments.push({
        ref: projectDoc.ref,
        field: "designs",
        previousValue: previousDesigns,
        newValue: updatedDesigns,
      });
    }

    // Delete the design document first as it's also a parent
    await designRef.delete();
    deletedDocuments.push({
      ref: designRef,
      data: designData,
    });

    // 2. Handle pins and planMaps
    const pinsSnapshot = await db.collection("pins").where("designId", "==", designId).get();

    const pinIdsToDelete = pinsSnapshot.docs.map((doc) => doc.id);

    // Update planMaps FIRST before deleting pins
    const planMapsSnapshot = await db
      .collection("planMaps")
      .where("pins", "array-contains-any", pinIdsToDelete)
      .get();

    for (const planMapDoc of planMapsSnapshot.docs) {
      const planMapData = planMapDoc.data();
      const previousPins = [...planMapData.pins];
      const updatedPins = previousPins.filter((pinId) => !pinIdsToDelete.includes(pinId));
      await planMapDoc.ref.update({ pins: updatedPins });
      updatedDocuments.push({
        ref: planMapDoc.ref,
        field: "pins",
        previousValue: previousPins,
        newValue: updatedPins,
      });
    }

    // Then delete pins
    for (const pinDoc of pinsSnapshot.docs) {
      await pinDoc.ref.delete();
      deletedDocuments.push({
        ref: pinDoc.ref,
        data: pinDoc.data(),
      });
    }

    // 3. Handle budgets and projectBudgets
    if (designData.budgetId) {
      const budgetRef = db.collection("budgets").doc(designData.budgetId);
      const budgetDoc = await budgetRef.get();

      if (budgetDoc.exists) {
        const budgetData = budgetDoc.data();

        // Update projectBudgets FIRST before deleting budget
        const projectBudgetsSnapshot = await db
          .collection("projectBudgets")
          .where("budgets", "array-contains", designData.budgetId)
          .get();

        for (const projectBudgetDoc of projectBudgetsSnapshot.docs) {
          const projectBudgetData = projectBudgetDoc.data();
          const previousBudgets = [...projectBudgetData.budgets];
          const updatedBudgets = previousBudgets.filter(
            (budgetId) => budgetId !== designData.budgetId
          );
          await projectBudgetDoc.ref.update({ budgets: updatedBudgets });
          updatedDocuments.push({
            ref: projectBudgetDoc.ref,
            field: "budgets",
            previousValue: previousBudgets,
            newValue: updatedBudgets,
          });
        }

        // Delete items after updating projectBudgets
        for (const itemId of budgetData.items || []) {
          const itemRef = db.collection("items").doc(itemId);
          const itemDoc = await itemRef.get();
          if (itemDoc.exists) {
            await itemRef.delete();
            deletedDocuments.push({
              ref: itemRef,
              data: itemDoc.data(),
            });
          }
        }

        // Then delete budget
        await budgetRef.delete();
        deletedDocuments.push({
          ref: budgetRef,
          data: budgetData,
        });
      }
    }

    // 4. Delete designVersions and comments
    for (const versionId of designData.history || []) {
      const versionRef = db.collection("designVersions").doc(versionId);
      const versionDoc = await versionRef.get();
      if (versionDoc.exists) {
        const versionData = versionDoc.data();
        await versionRef.delete();
        deletedDocuments.push({
          ref: versionRef,
          data: versionData,
        });

        // Delete comments after design version is deleted
        if (versionData.images) {
          for (const image of versionData.images) {
            const commentsSnapshot = await db
              .collection("comments")
              .where("designVersionImageId", "==", image.imageId)
              .get();

            for (const commentDoc of commentsSnapshot.docs) {
              await commentDoc.ref.delete();
              deletedDocuments.push({
                ref: commentDoc.ref,
                data: commentDoc.data(),
              });
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Design and related documents deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteDesign:", error);

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

    res.status(500).json({
      success: false,
      error: "Failed to delete design and related documents",
      details: error.message,
    });
  }
};
