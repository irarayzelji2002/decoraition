const { db, auth } = require("../firebase");

exports.createNotification = async (userId, type, title, content) => {
  const notificationRef = db.collection("notifications").doc();
  const notificationData = {
    userId,
    type,
    title,
    content,
    isReadInApp: false,
    createdAt: new Date(),
  };
  await notificationRef.set(notificationData);
};

const createNotification = async (userId, type, title, content) => {
  const notificationRef = db.collection("notifications").doc();
  const notificationData = {
    userId,
    type,
    title,
    content,
    isReadInApp: false,
    createdAt: new Date(),
  };
  await notificationRef.set(notificationData);
};

exports.sendCommentNotifications = async (designDoc, commentUserId, action, mentions = []) => {
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
        `You were mentioned in a comment on design "${designDoc.data().designName}"`
      );
    }

    if (userId === designOwner && settings.newCommentReplyAsOwner) {
      await createNotification(
        userId,
        "comment",
        "New Comment on Your Design",
        `A new comment was added to your design "${designDoc.data().designName}"`
      );
    }

    if (
      (editors.includes(userId) || commenters.includes(userId)) &&
      settings.newCommentReplyAsCollab
    ) {
      await createNotification(
        userId,
        "comment",
        "New Comment on Collaborated Design",
        `A new comment was added to design "${designDoc.data().designName}"`
      );
    }
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
