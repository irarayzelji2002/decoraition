const { db, auth, clientAuth, clientDb } = require("../firebase");
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { doc, getDoc, arrayUnion } = require("firebase/firestore");

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
      designSettings: {
        generalAccessSetting: 0, //0 for Restricted, 1 for Anyone with the link
        generalAccessRole: 0, //0 for viewer, 1 for editor, 2 for owner)
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
    updatedDesigns.push({ designId, role: 2 }); // 2 for owner
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
  try {
    const { designId } = req.params;
    const { name } = req.body;
    const designRef = db.collection("designs").doc(designId);
    await designRef.update({ designName: name, modifiedAt: new Date() });
    res.status(200).json({
      success: true,
      message: "Design name updated successfully",
      designName: name,
    });
  } catch (error) {
    console.error("Error updating design name:", error);
    res.status(500).json({ error: "Failed to update design name" });
  }
};

// Update Design Settings
exports.updateDesignSettings = async (req, res) => {
  try {
    const { designId } = req.params;
    const { designSettings } = req.body;

    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();

    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }

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
          createdAt: versionData.createdAt,
          images: versionData.images?.map((img) => img.link) || [],
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

// Delete
exports.deleteDesign = async (req, res) => {
  try {
    const { designId } = req.params;
    const { userId } = req.body;

    // Delete the design
    await db.collection("designs").doc(designId).delete();

    // Remove the design from the user's designs array
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const updatedDesigns = userData.designs.filter((design) => design.designId !== designId);
      await userRef.update({ designs: updatedDesigns });
    }

    // Remove the design from any projects it might be in
    const projectsSnapshot = await db
      .collection("projects")
      .where("designs", "array-contains", { designId })
      .get();

    const batch = db.batch();
    projectsSnapshot.docs.forEach((doc) => {
      const projectData = doc.data();
      const updatedDesigns = projectData.designs.filter((design) => design.designId !== designId);
      batch.update(doc.ref, { designs: updatedDesigns });
    });
    await batch.commit();

    res.status(200).json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(500).json({ message: "Error deleting design", error: error.message });
  }
};
