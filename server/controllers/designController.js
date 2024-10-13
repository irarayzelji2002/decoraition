const { db } = require("../firebaseConfig");

exports.fetchDesigns = async (req, res) => {
  try {
    const { userId } = req.params;
    const designsSnapshot = await db
      .collection("designs")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const designs = designsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(designs);
  } catch (error) {
    console.error("Error fetching designs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleCreateDesign = async (req, res) => {
  try {
    const { userId, designName } = req.body;
    const newDesignRef = db.collection("designs").doc();
    const designData = {
      userId,
      designName,
      createdAt: new Date(),
      // Add other design fields as needed
    };
    await newDesignRef.set(designData);
    res.json({ id: newDesignRef.id, ...designData });
  } catch (error) {
    console.error("Error creating design:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleDeleteDesign = async (req, res) => {
  try {
    const { designId } = req.params;
    await db.collection("designs").doc(designId).delete();
    res.json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
