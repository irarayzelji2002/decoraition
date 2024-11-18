const { db, auth } = require("../firebase");

exports.addComment = async (req, res) => {
  const updatedDocuments = [];
  const createdDocuemnts = [];
  try {
    // Update to Db
    const commentData = {};
    res
      .status(200)
      .json({ success: true, message: "Comment added successfully", comment: commentData });
  } catch (error) {
    console.error("Error adding comment:", error);
    // Rollback in order above
    res.status(500).json({ error: "Failed to add comment" });
  }
};

exports.editComment = async (req, res) => {
  const updatedDocuments = [];
  try {
    // Update to Db
    const commentData = {};
    res
      .status(200)
      .json({ success: true, message: "Comment edited successfully", comment: commentData });
  } catch (error) {
    console.error("Error editing comment:", error);
    // Rollback in order above
    res.status(500).json({ error: "Failed to edit comment" });
  }
};

exports.changeCommentStatus = async (req, res) => {
  const updatedDocuments = [];
  try {
    // Update to Db
    const status = false;
    res.status(200).json({
      success: true,
      message: "Comment status changed successfully",
      status,
    });
  } catch (error) {
    console.error("Error changing comment status:", error);
    // Rollback in order above
    res.status(500).json({ error: "Failed to change comment status" });
  }
};

exports.deleteComment = async (req, res) => {
  const updatedDocuments = [];
  const deletedDocuments = [];
  try {
    // Update to Db
    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment status:", error);
    // Rollback in order above
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

exports.addReply = async (req, res) => {
  const updatedDocuments = [];
  try {
    // Update to Db
    const commentData = {};
    res
      .status(200)
      .json({ success: true, message: "Reply edited successfully", comment: commentData });
  } catch (error) {
    console.error("Error editing reply:", error);
    // Rollback in order above
    res.status(500).json({ error: "Failed to edit reply" });
  }
};

exports.editReply = async (req, res) => {
  const updatedDocuments = [];
  try {
    // Update to Db
    const commentData = {};
    res
      .status(200)
      .json({ success: true, message: "Reply edited successfully", comment: commentData });
  } catch (error) {
    console.error("Error editing reply:", error);
    // Rollback in order above
    res.status(500).json({ error: "Failed to edit reply" });
  }
};

exports.deleteReply = async (req, res) => {
  const updatedDocuments = [];
  try {
    // Update to Db
    const commentData = {};
    res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
      comment: commentData,
    });
  } catch (error) {
    console.error("Error deleting reply status:", error);
    // Rollback in order above
    res.status(500).json({ error: "Failed to delete reply" });
  }
};

// OLD CODE (IGNORE)
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
    res.status(200).json({ id: commentRef.id, ...commentData });
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
