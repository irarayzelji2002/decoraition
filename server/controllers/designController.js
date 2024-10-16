const { db, auth, clientAuth, clientDb } = require("../firebase");

// Create Design
exports.handleCreateDesign = async (req, res) => {
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
      createdAt: db.FieldValue.serverTimestamp(),
      modifiedAt: db.FieldValue.serverTimestamp(),
      designSettings: {
        generalAccessSetting: 0, //0 for Restricted, 1 for Anyone with the link
        generalAccessRole: 0, //0 for viewer, 1 for content manager, 2 for contributor)
        allowDownload: true,
        allowViewHistory: true,
        allowCopy: true,
        documentCopyByOwner: true,
        documentCopyByEditor: true,
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
        currency: "USD",
      },
      items: [],
    };

    const budgetRef = await db.collection("budgets").add(budgetData);
    const budgetId = budgetRef.id;
    createdDocuments.push({ collection: "budgets", id: budgetId });

    // Update design document with budgetId
    await designRef.update({ budgetId });

    // Update user's designs array
    await db
      .collection("users")
      .doc(userId)
      .update({
        designs: db.FieldValue.arrayUnion({ designId, role: 2 }), // 2 for owner role
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
exports.handleDeleteDesign = async (req, res) => {
  try {
    const { designId } = req.params;
    const { userId } = req.body;

    // Delete the design
    await db.collection("designs").doc(designId).delete();

    // Remove the design from the user's designs array
    await db
      .collection("users")
      .doc(userId)
      .update({
        designs: db.FieldValue.arrayRemove({ designId, role: 2 }),
      });

    // Remove the design from any projects it might be in
    const projectsSnapshot = await db
      .collection("projects")
      .where("designs", "array-contains", { designId })
      .get();

    const batch = db.batch();
    projectsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        designs: db.FieldValue.arrayRemove({ designId }),
      });
    });
    await batch.commit();

    res.status(200).json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(500).json({ message: "Error deleting design", error: error.message });
  }
};
