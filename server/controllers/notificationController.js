const { db, auth } = require("../firebase");

// Create
exports.createNotification = async (req, res) => {
  try {
    const { userId, message, type, relatedId } = req.body;
    const notificationRef = db.collection("notifications").doc();
    const notificationData = {
      userId,
      message,
      type,
      relatedId,
      createdAt: new Date(),
      read: false,
    };
    await notificationRef.set(notificationData);
    res.status(201).json({ id: notificationRef.id, ...notificationData });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

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
