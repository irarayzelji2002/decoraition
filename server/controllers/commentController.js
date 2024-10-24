const { db, auth } = require("../firebase");

// Create
exports.createComment = async (req, res) => {
  try {
    const { designVersionImageId, userId, message, mentions } = req.body;
    const commentRef = db.collection("comments").doc();
    const commentData = {
      designVersionImageId,
      userId,
      message,
      mentions,
      status: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
      replies: [],
    };
    await commentRef.set(commentData);
    res.status(201).json({ id: commentRef.id, ...commentData });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// Read
exports.getComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const commentDoc = await db.collection("comments").doc(commentId).get();
    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.json({ id: commentDoc.id, ...commentDoc.data() });
  } catch (error) {
    console.error("Error fetching comment:", error);
    res.status(500).json({ error: "Failed to fetch comment" });
  }
};

// Update
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const updateData = req.body;
    updateData.modifiedAt = new Date();
    await db.collection("comments").doc(commentId).update(updateData);
    res.json({ message: "Comment updated successfully" });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
};

// Delete
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    await db.collection("comments").doc(commentId).delete();
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};
