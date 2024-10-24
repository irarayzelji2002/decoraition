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
