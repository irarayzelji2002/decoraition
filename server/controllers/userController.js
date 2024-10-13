const { db, auth } = require("../firebaseConfig");

exports.fetchUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userDoc.data();
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleLogout = async (req, res) => {
  try {
    await auth.signOut();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleSettings = async (req, res) => {
  try {
    await auth.signOut();
    res.json({ message: "Logged out and redirected to settings" });
  } catch (error) {
    console.error("Error handling settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
