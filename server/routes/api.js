const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");
const designController = require("../controllers/designController");

const commentController = require("../controllers/commentController");
const notificationController = require("../controllers/notificationController");
const projectBudgetController = require("../controllers/projectBudgetController");
const budgetController = require("../controllers/budgetController");
const planMapController = require("../controllers/planMapController");
const timelineController = require("../controllers/timelineController");
const { auth } = require("../firebase");
const { upload } = require("../uploadConfig");

const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// User routes
router.post("/register", userController.createUser);
router.post("/login-with-oauth", userController.loginUserOAuth);
router.get("/check-existing-email/:email", userController.checkExistingEmailForReg);
router.get("/check-existing-username/:username", userController.checkExistingUsernameForReg);
router.post("/forgot-password", userController.forgotPassword);
router.put("/verify-otp", userController.verifyOTP);
router.put("/resend-otp", userController.resendOTP);
router.put("/expire-otp", userController.expireOTP);
router.put("/change-password", userController.changePassword);
router.get("/user/:userId", authenticateUser, userController.fetchUserData);
router.put(
  "/user/profile-pic",
  authenticateUser,
  upload.single("file"),
  userController.updateProfilePic
);
router.put("/user/remove-profile-pic", authenticateUser, userController.removeProfilePic);
router.put("/user/update-field", authenticateUser, userController.updateUserField);
router.get("/user/check-existing-email/:userId/:email", userController.checkExistingEmail);
router.get("/user/check-existing-username/:userId/:username", userController.checkExistingUsername);
router.put("/user/user-details", authenticateUser, userController.updateUserDetails);
router.put(
  "/user/connected-account/:userId",
  authenticateUser,
  userController.updateConnectedAccount
);
router.put(
  "/user/update-notifications",
  authenticateUser,
  userController.updateNotificationSettings
);
router.put("/user/update-password", authenticateUser, userController.updatePassword);
router.put("/user/layout-settings", authenticateUser, userController.updateLayoutSettings);
router.put("/user/theme", authenticateUser, userController.updateTheme);
router.delete(
  "/cleanup-unused-auth-users",
  authenticateUser,
  userController.cleanupUnusedAuthUsers
);
router.get("/user/get-username/:userId", userController.getUsername);
router.post("/user/get-usernames", userController.getUsernames);

// Design routes
router.get("/design/:userId", authenticateUser, designController.fetchUserDesigns);
router.post("/design/create", authenticateUser, designController.createDesign);
router.post("/design/delete/:designId", authenticateUser, designController.deleteDesign);
router.put("/design/:designId/update-name", authenticateUser, designController.updateDesignName);
router.put(
  "/design/:designId/update-settings",
  authenticateUser,
  designController.updateDesignSettings
);
router.put(
  "/design/budget/:budgetId/update-budget",
  authenticateUser,
  budgetController.updateBudget
);
router.post(
  "/design/item/add-item",
  authenticateUser,
  upload.single("file"),
  budgetController.addItem
);
router.put(
  "/design/item/:itemId/update-item",
  authenticateUser,
  upload.single("file"),
  budgetController.updateItem
);
router.put(
  "/design/item/:itemId/update-item-included-in-total",
  authenticateUser,
  budgetController.updateItemIncludedInTotal
);
router.post("/design/item/:itemId/delete-item", authenticateUser, budgetController.deleteItem);
router.get(
  "/design/:designId/version-details",
  authenticateUser,
  designController.getDesignVersionDetails
);
router.post(
  "/design/:designId/restore/:versionId",
  authenticateUser,
  designController.restoreDesignVersion
);
router.post("/design/:designId/copy/:versionId", authenticateUser, designController.copyDesign);
router.post("/design/:designId/share", authenticateUser, designController.shareDesign);
router.post(
  "/design/:designId/change-access",
  authenticateUser,
  designController.changeAccessDesign
);

// Project routes
router.get("/project/:userId", authenticateUser, projectController.fetchUserProjects);
router.post("/project/create", authenticateUser, projectController.createProject);
router.post("/project/delete/:projectId", authenticateUser, projectController.deleteProject);
router.put(
  "/project/:projectId/update-name",
  authenticateUser,
  projectController.updateProjectName
);
router.put(
  "/project/:projectId/update-settings",
  authenticateUser,
  projectController.updateProjectSettings
);

module.exports = router;
