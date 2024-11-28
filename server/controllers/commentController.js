const { db, auth } = require("../firebase");
const notifController = require("./notificationController");

// Check if user is owner, editor, commenter (commenting)
const isOwnerEditorCommenterDesign = (designDoc, userId) => {
  const designData = designDoc.data();
  if (designData.designSettings.generalAccessSetting === 0) {
    // Restricted Access
    const isOwner = designData.owner === userId;
    const isEditor = designData.editors.includes(userId);
    const isCommenter = designData.commenters.includes(userId);
    return isOwner || isEditor || isCommenter;
  } else {
    // Anyone with the link
    if (
      designData.designSettings.generalAccessRole === 2 ||
      designData.designSettings.generalAccessRole === 1
    )
      return true;
    const isOwner = designData.owner === userId;
    const isEditor = designData.editors.includes(userId);
    const isCommenter = designData.commenters.includes(userId);
    return isOwner || isEditor || isCommenter;
  }
};

exports.addComment = async (req, res) => {
  const updatedDocuments = [];
  const createdDocuments = [];
  try {
    const { designId } = req.params;
    const { userId, designVersionImageId, location, message, mentions } = req.body;

    // 1. Get design and validate access
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const allowAction = isOwnerEditorCommenterDesign(designDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to add a comment" });
    }

    // 2. Get designVersion and validate image
    const designVersionRef = db
      .collection("designVersions")
      .doc(designDoc.data().history.slice(-1)[0]);
    const designVersionDoc = await designVersionRef.get();
    if (!designVersionDoc.exists) {
      return res.status(404).json({ error: "Design version not found" });
    }

    // 3. Create comment
    const commentRef = db.collection("comments").doc();
    const commentData = {
      designVersionImageId,
      location,
      userId,
      message,
      mentions: mentions || [],
      status: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
      replies: [],
    };

    // 4. Update designVersion image comments array
    const images = designVersionDoc.data().images;
    const imageIndex = images.findIndex((img) => img.imageId === designVersionImageId);
    if (imageIndex === -1) {
      return res.status(404).json({ error: "Image not found" });
    }
    images[imageIndex].comments = [...(images[imageIndex].comments || []), commentRef.id];

    // 5. Execute updates in order
    updatedDocuments.push({
      ref: designVersionRef,
      data: { images: designVersionDoc.data().images },
      collection: "designVersions",
      id: designVersionRef.id,
    });
    await designVersionRef.update({ images });

    await commentRef.set(commentData);
    createdDocuments.push({
      ref: commentRef,
      data: commentData,
      collection: "comments",
      id: commentRef.id,
    });

    // Notification
    try {
      await notifController.sendCommentNotifications(
        designId,
        designDoc,
        userId,
        mentions,
        false, // isReply
        commentRef.id,
        null // replyId
      );
    } catch (notifError) {
      console.log("Notification error (non-critical):", notifError.message);
    }

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comment: { id: commentRef.id, ...commentData },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    // Rollback
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    for (const doc of createdDocuments) {
      try {
        await doc.ref.delete();
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    res.status(500).json({ error: "Failed to add comment" });
  }
};

exports.editComment = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { designId, commentId } = req.params;
    const { userId, message, mentions } = req.body;

    // Get design and validate access
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const allowAction = isOwnerEditorCommenterDesign(designDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to edit a comment" });
    }

    // 1. Get and validate comment
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (commentDoc.data().userId !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this comment" });
    }

    // 2. Update comment
    const updateData = {
      message,
      mentions: mentions || [],
      modifiedAt: new Date(),
    };

    updatedDocuments.push({
      ref: commentRef,
      data: commentDoc.data(),
      collection: "comments",
      id: commentRef.id,
    });
    await commentRef.update(updateData);

    res.status(200).json({
      success: true,
      message: "Comment edited successfully",
      comment: { id: commentId, ...updateData },
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    res.status(500).json({ error: "Failed to edit comment" });
  }
};

exports.changeCommentStatus = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { designId, commentId } = req.params;
    const { userId, status } = req.body;

    // Get design and validate access
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const allowAction = isOwnerEditorCommenterDesign(designDoc, userId);
    if (!allowAction) {
      return res
        .status(403)
        .json({ error: "User does not have permission to change status of this comment" });
    }

    // 1. Get and validate comment
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // 2. Update status
    updatedDocuments.push({
      ref: commentRef,
      data: commentDoc.data(),
      collection: "comments",
      id: commentRef.id,
    });
    await commentRef.update({ status });

    // Notification
    try {
      const designOwner = designDoc.data().owner;
      const editors = designDoc.data().editors || [];
      const commenters = designDoc.data().commenters || [];

      const userDocs = await Promise.all([
        db.collection("users").doc(designOwner).get(),
        ...editors.map((id) => db.collection("users").doc(id).get()),
        ...commenters.map((id) => db.collection("users").doc(id).get()),
      ]);

      for (const userDoc of userDocs) {
        if (!userDoc.exists || !userDoc.data().notifSettings.allowNotif) continue;
        const settings = userDoc.data().notifSettings;
        const isOwner = userDoc.id === designOwner;
        const isCollaborator = editors.includes(userDoc.id) || commenters.includes(userDoc.id);
        if (isOwner && settings.commentStatusChangeAsOwner && userId !== designOwner) {
          await notifController.createNotification(
            userDoc.id,
            "comment",
            `Comment ${status ? "Resolved" : "Reopened"}`,
            `A comment on your design "${designDoc.data().designName}" was ${
              status ? "resolved" : "reopened"
            }`,
            req.body.userId, // notifBy
            `/design/${designId}`,
            ["Show comment tab", "Set comment type and for", "Highlight comment"],
            { commentId }
          );
        } else if (
          isCollaborator &&
          settings.commentStatusChangeAsCollab &&
          !editors.includes(userId) &&
          !commenters.includes(userId)
        ) {
          await notifController.createNotification(
            userDoc.id,
            "comment",
            `Comment ${status ? "Resolved" : "Reopened"}`,
            `A comment on design "${designDoc.data().designName}" was ${
              status ? "resolved" : "reopened"
            }`,
            req.body.userId, // notifBy
            `/design/${designId}`,
            ["Show comment tab", "Set comment type and for", "Highlight comment"],
            { commentId }
          );
        }
      }
    } catch (notifError) {
      console.log("Notification error (non-critical):", notifError.message);
    }

    res.status(200).json({
      success: true,
      message: "Comment status changed successfully",
      status,
    });
  } catch (error) {
    console.error("Error changing comment status:", error);
    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    res.status(500).json({ error: "Failed to change comment status" });
  }
};

exports.deleteComment = async (req, res) => {
  const updatedDocuments = [];
  const deletedDocuments = [];
  try {
    const { designId, commentId } = req.params;
    const { userId } = req.body;

    // Get design and validate access
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const allowAction = isOwnerEditorCommenterDesign(designDoc, userId);
    if (!allowAction) {
      return res
        .status(403)
        .json({ error: "User does not have permission to delete this comment" });
    }

    // 1. Get and validate comment
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (commentDoc.data().userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    // 2. Get designVersion to update image comments array
    const designVersionRef = db
      .collection("designVersions")
      .doc(designDoc.data().history.slice(-1)[0]);
    const designVersionDoc = await designVersionRef.get();

    // 3. Remove comment from image comments array
    const images = designVersionDoc.data().images;
    const imageIndex = images.findIndex(
      (img) => img.imageId === commentDoc.data().designVersionImageId
    );
    images[imageIndex].comments = images[imageIndex].comments.filter((id) => id !== commentId);

    // 4. Execute updates in order
    updatedDocuments.push({
      ref: designVersionRef,
      data: { images: designVersionDoc.data().images },
      collection: "designVersions",
      id: designVersionRef.id,
    });
    await designVersionRef.update({ images });

    deletedDocuments.push({
      ref: commentRef,
      data: commentDoc.data(),
      collection: "comments",
      id: commentRef.id,
    });
    await commentRef.delete();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    // Rollback
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    for (const doc of deletedDocuments) {
      try {
        await doc.ref.set(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

exports.addReply = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { designId, commentId } = req.params;
    const { userId, message, mentions, replyTo } = req.body;

    // Get design and validate access
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const allowAction = isOwnerEditorCommenterDesign(designDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to add a reply" });
    }

    // Get and validate comment
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Create new reply object
    const replyId = db.collection("comments").doc().id;
    const replyData = {
      replyId,
      userId,
      message,
      mentions: mentions || [],
      createdAt: new Date(),
      modifiedAt: new Date(),
      replies: [],
    };

    // Get current replies array
    const currentReplies = commentDoc.data().replies || [];

    if (replyTo) {
      // If replying to another reply, find parent reply and Update parent reply's replies array
      const parentReplyIndex = currentReplies.findIndex(
        (reply) => reply.replyId === replyTo.replyId
      );
      if (parentReplyIndex === -1) {
        return res.status(404).json({ error: "Parent reply not found" });
      }

      // Update reply's replies field
      currentReplies[parentReplyIndex].replies = [
        ...(currentReplies[parentReplyIndex].replies || []),
        replyId,
      ];
    }

    // Add new reply to comment's replies array
    const updatedReplies = [...currentReplies, replyData];

    // Update comment
    updatedDocuments.push({
      ref: commentRef,
      data: commentDoc.data(),
      collection: "comments",
      id: commentRef.id,
    });
    await commentRef.update({ replies: updatedReplies });

    // Send notifications
    await notifController.sendCommentNotifications(
      designId,
      designDoc,
      userId,
      mentions,
      true, // isReply
      commentId,
      replyId
    );

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      reply: replyData,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    // Rollback
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    res.status(500).json({ error: "Failed to add reply" });
  }
};

exports.editReply = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { designId, commentId } = req.params;
    const { userId, replyId, message, mentions } = req.body;

    // Get design and validate access
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const allowAction = isOwnerEditorCommenterDesign(designDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to add a comment" });
    }

    // 1. Get and validate comment
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // 2. Find and update reply
    const currentReplies = commentDoc.data().replies || [];
    const replyIndex = currentReplies.findIndex((reply) => reply.replyId === replyId);
    if (replyIndex === -1) {
      return res.status(404).json({ error: "Reply not found" });
    }
    if (currentReplies[replyIndex].userId !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this reply" });
    }
    currentReplies[replyIndex].message = message;
    currentReplies[replyIndex].mentions = mentions;
    currentReplies[replyIndex].modifiedAt = new Date();

    // 3. Update comment
    updatedDocuments.push({
      ref: commentRef,
      data: commentDoc.data(),
      collection: "comments",
      id: commentRef.id,
    });
    await commentRef.update({ replies: currentReplies });

    res.status(200).json({
      success: true,
      message: "Reply edited successfully",
      reply: currentReplies[replyIndex],
    });
  } catch (error) {
    console.error("Error editing reply:", error);
    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    if (error.message === "Not authorized to edit this reply") {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to edit reply" });
    }
  }
};

exports.deleteReply = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { designId, commentId } = req.params;
    const { userId, replyId } = req.body;

    // Get design and validate access
    const designRef = db.collection("designs").doc(designId);
    const designDoc = await designRef.get();
    if (!designDoc.exists) {
      return res.status(404).json({ error: "Design not found" });
    }
    const allowAction = isOwnerEditorCommenterDesign(designDoc, userId);
    if (!allowAction) {
      return res.status(403).json({ error: "User does not have permission to add a comment" });
    }

    // 1. Get and validate comment
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // 2. Find and remove reply
    let replies = [...commentDoc.data().replies];

    // Remove replyId from parent replies arrays
    const removeFromParentReplies = (replyArray) => {
      for (let reply of replyArray) {
        if (reply.replies.includes(replyId)) {
          reply.replies = reply.replies.filter((id) => id !== replyId);
        }
      }
    };
    removeFromParentReplies(replies);

    // Remove reply itself
    const replyIndex = replies.findIndex((reply) => reply.replyId === replyId);
    if (replyIndex === -1) {
      return res.status(404).json({ error: "Reply not found" });
    }
    if (replies[replyIndex].userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this reply" });
    }
    replies.splice(replyIndex, 1);

    // 3. Update comment
    updatedDocuments.push({
      ref: commentRef,
      data: commentDoc.data(),
      collection: "comments",
      id: commentRef.id,
    });
    await commentRef.update({ replies });

    res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting reply:", error);
    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }
    res.status(500).json({ error: "Failed to delete reply" });
  }
};
