const { db, auth } = require("../firebase");

exports.createNotification = async (
  userId,
  type,
  title,
  content,
  notifBy,
  navigateTo,
  actions,
  references
) => {
  const notificationRef = db.collection("notifications").doc();
  const notificationData = {
    userId,
    type,
    title,
    content,
    isReadInApp: false,
    notifBy,
    navigateTo,
    actions,
    references,
    createdAt: new Date(),
  };
  await notificationRef.set(notificationData);
};

const createNotification = async (
  userId,
  type,
  title,
  content,
  notifBy,
  navigateTo,
  actions,
  references
) => {
  const notificationRef = db.collection("notifications").doc();
  const notificationData = {
    userId,
    type,
    title,
    content,
    isReadInApp: false,
    notifBy,
    navigateTo,
    actions,
    references,
    createdAt: new Date(),
  };
  await notificationRef.set(notificationData);
};

exports.sendCommentNotifications = async (
  designId,
  designDoc,
  commentUserId,
  mentions = [],
  isReply,
  commentId,
  replyId = null
) => {
  const designOwner = designDoc.data().owner;
  const editors = designDoc.data().editors || [];
  const commenters = designDoc.data().commenters || [];

  // Get user settings
  const userSettingsPromises = [
    db.collection("users").doc(designOwner).get(),
    ...editors.map((id) => db.collection("users").doc(id).get()),
    ...commenters.map((id) => db.collection("users").doc(id).get()),
    ...mentions.map((id) => db.collection("users").doc(id).get()),
  ];

  const userDocs = await Promise.all(userSettingsPromises);
  const userSettings = userDocs.reduce((acc, doc) => {
    if (doc.exists) acc[doc.id] = doc.data().notifSettings;
    return acc;
  }, {});

  // Process notifications based on settings
  for (const [userId, settings] of Object.entries(userSettings)) {
    // Skip if user triggered the action or notifications are disabled
    if (!settings.allowNotif || userId === commentUserId) continue;

    if (mentions.includes(userId) && settings.mentionedInComment) {
      await createNotification(
        userId,
        "mention",
        "Mentioned in Comment",
        `You were mentioned in a comment on design "${designDoc.data().designName}"`,
        commentUserId,
        `/design/${designId}`,
        ["Show comment tab", "Hide drawers", "Set comment type and for", "Highlight comment"],
        !isReply ? { commentId } : { commentId, replyId }
      );
    }

    if (userId === designOwner && settings.newCommentReplyAsOwner) {
      await createNotification(
        userId,
        "comment",
        `New ${!isReply ? "Comment" : "Reply"} on Your Design`,
        `A new ${!isReply ? "comment" : "reply"} was added to your design "${
          designDoc.data().designName
        }"`,
        commentUserId,
        `/design/${designId}`,
        ["Show comment tab", "Hide drawers", "Set comment type and for", "Highlight comment"],
        !isReply ? { commentId } : { commentId, replyId }
      );
    }

    if (
      (editors.includes(userId) || commenters.includes(userId)) &&
      settings.newCommentReplyAsCollab
    ) {
      await createNotification(
        userId,
        "comment",
        `New ${!isReply ? "Comment" : "Reply"} on Collaborated Design`,
        `A new ${!isReply ? "comment" : "reply"} was added to design "${
          designDoc.data().designName
        }"`,
        commentUserId,
        `/design/${designId}`,
        ["Show comment tab", "Hide drawers", "Set comment type and for", "Highlight comment"],
        !isReply ? { commentId } : { commentId, replyId }
      );
    }
  }
};

exports.changeNotifStatus = async (req, res) => {
  const updatedDocuments = [];
  let newStatus = true;
  try {
    const { notifId } = req.params;
    const { userId, status } = req.body;
    newStatus = !status;
    const notifRef = await db.collection("notifications").doc(notifId);
    const notifDoc = await notifRef.get();
    if (!notifDoc.exists) {
      return res.status(404).json({ error: "Notification not found" });
    }

    updatedDocuments.push({
      ref: notifRef,
      data: notifDoc.data(),
      collection: "notifications",
      id: notifRef.id,
    });
    const message = newStatus ? "Notification marked as read" : "Notification marked as unread";
    await notifRef.update({ isReadInApp: newStatus });
    res.json({ success: true, message: message, isReadInApp: newStatus });
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
    res
      .status(500)
      .json({ error: `Failed to mark notiifcation as ${newStatus ? "read" : "unread"}` });
  }
};

exports.markAllAsRead = async (req, res) => {
  const updatedDocuments = [];
  let newStatus = true;
  try {
    const { userId } = req.body;

    const notificationsRef = db.collection("notifications");
    const unreadNotifs = await notificationsRef
      .where("userId", "==", userId)
      .where("isReadInApp", "==", false)
      .get();
    const batch = db.batch();
    unreadNotifs.docs.forEach((doc) => {
      batch.update(doc.ref, { isReadInApp: true });
    });
    await batch.commit();

    res.json({
      success: true,
      message: "All notifications marked as read",
      isReadInApp: newStatus,
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
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

exports.deleteNotif = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { notifId } = req.params;
    const notifRef = await db.collection("notifications").doc(notifId);
    const notifDoc = await notifRef.get();
    if (!notifDoc.exists) {
      return res.status(404).json({ error: "Notification not found" });
    }
    updatedDocuments.push({
      ref: notifRef,
      data: notifDoc.data(),
      collection: "notifications",
      id: notifRef.id,
    });
    await db.collection("notifications").doc(notifId).delete();
    res.status(200).json({ success: true, message: "Notification deleted successfully" });
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
    res.status(500).json({ error: "Failed to delete notiifcation" });
  }
};

// OLD CODE
// Read
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notificationsSnapshot = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    const notifications = notificationsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Update
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await db.collection("notifications").doc(notificationId).update({ read: true });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// Delete
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await db.collection("notifications").doc(notificationId).delete();
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};
