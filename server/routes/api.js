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
router.get("/confirm-email-verification/:token", userController.confirmEmailVerification);
router.get("/check-email-verification/:email", userController.checkEmailVerification);
router.delete("/delete-unverified-user/:token", userController.deleteUnverifiedUser);
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
router.post("/user/add-color-palette", authenticateUser, userController.addColorPalette);
router.put("/user/update-color-palette", authenticateUser, userController.updateColorPalette);
router.put("/user/delete-color-palette", authenticateUser, userController.deleteColorPalette);
router.get("/user/get-other-user-data/:userId", userController.getOtherUserData);
router.get("/user/check-lockout-status/:email", userController.checkLockoutStatus);
router.put("/user/update-failed-attempt/:email", userController.updateFailedAttempts);

// Design routes
router.get("/design/:userId", authenticateUser, designController.fetchUserDesigns);
router.post("/design/create", authenticateUser, designController.createDesign);
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
  "/design/budget/create-default-budget",
  authenticateUser,
  budgetController.createDefaultBudget
);
router.get(
  "/design/budget/check/:designVersionId",
  authenticateUser,
  budgetController.checkBudgetExists
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
router.put(
  "/design/:designId/design-version/:designVersionId/update-desc",
  authenticateUser,
  designController.updateDesignVersionImageDescription
);
router.post(
  "/design/:designId/design-version/create-design-version",
  authenticateUser,
  designController.createDesignVersion
);
router.post(
  "/design/:designId/design-version/:designVersionId/update-sam-masks",
  authenticateUser,
  designController.updateDesignVersionSamMask
);
router.post(
  "/design/:designId/design-version/:designVersionId/update-combined-mask",
  authenticateUser,
  designController.updateDesignVersionCombinedMask
);
router.put(
  "/design/:designId/update-project",
  authenticateUser,
  designController.updateDesignProjectId
);
router.post("/design/:designId/delete", authenticateUser, designController.deleteDesign);
router.post("/design/:designId/trash", authenticateUser, designController.moveDesignToTrash);
router.post(
  "/design/:designId/restoreFromTrash",
  authenticateUser,
  designController.restoreDesignFromTrash
);

// Comment routes
router.post(
  "/design/:designId/comment/add-comment",
  authenticateUser,
  commentController.addComment
);
router.put(
  "/design/:designId/comment/:commentId/edit-comment",
  authenticateUser,
  commentController.editComment
);
router.put(
  "/design/:designId/comment/:commentId/edit-comment-status",
  authenticateUser,
  commentController.changeCommentStatus
);
router.post(
  "/design/:designId/comment/:commentId/delete-comment",
  authenticateUser,
  commentController.deleteComment
);
router.put(
  "/design/:designId/comment/:commentId/add-reply",
  authenticateUser,
  commentController.addReply
);
router.put(
  "/design/:designId/comment/:commentId/edit-reply",
  authenticateUser,
  commentController.editReply
);
router.post(
  "/design/:designId/comment/:commentId/delete-reply",
  authenticateUser,
  commentController.deleteReply
);

// Project routes
// router.get("/project/:userId", authenticateUser, projectController.fetchUserProjects);
router.post("/project/create", authenticateUser, projectController.createProject);
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
router.post(
  "/project/:projectId/create-design",
  authenticateUser,
  projectController.createDesignProject
);
router.get("/project/:projectId/designs", authenticateUser, projectController.fetchProjectDesigns);
router.get("/project/:projectId/pins", authenticateUser, planMapController.getPins);
router.post("/project/:projectId/pins/order", authenticateUser, planMapController.savePinOrder);
router.post("/project/:projectId/deletePin", authenticateUser, planMapController.deletePin);
router.put("/project/:projectId/pin/:pinId", authenticateUser, planMapController.updatePin);
router.post("/project/:projectId/share", authenticateUser, projectController.shareProject);
router.post(
  "/project/:projectId/change-access",
  authenticateUser,
  projectController.changeAccessProject
);
router.get("/project/:projectId/planImage", authenticateUser, planMapController.getPlanImage);
router.post(
  "/project/:projectId/planImage",
  authenticateUser,
  upload.single("file"),
  planMapController.handlePlanImageUpload
);
router.post("/project/:projectId/add-pin", authenticateUser, planMapController.createPin);
router.put(
  "/project/:projectId/import-design",
  authenticateUser,
  projectController.importDesignToProject
);
router.put(
  "/project/:projectId/remove-design",
  authenticateUser,
  projectController.removeDesignFromProject
);
router.put(
  "/project/:projectBudgetId/update-budget",
  authenticateUser,
  projectBudgetController.updateProjectBudget
);
router.post("/project/:projectId/delete", authenticateUser, projectController.deleteProject);
router.post("/project/:projectId/trash", authenticateUser, projectController.moveProjectToTrash);
router.post(
  "/project/:projectId/restoreFromTrash",
  authenticateUser,
  projectController.restoreProjectFromTrash
);

// Network check
router.get("/health-check", (req, res) => {
  res.status(200).send("OK");
});

// Timeline routes
router.post("/timeline/:timelineId/add-event", authenticateUser, timelineController.createEvent);
router.get("/timeline/:timelineId/events", authenticateUser, timelineController.getEvents);
router.get("/project/:projectId/timelineId", authenticateUser, timelineController.fetchTimelineId); // New route to fetch timeline
router.get("/timeline/event/:taskId", authenticateUser, timelineController.getEventDetails);
router.put("/timeline/event/:taskId", authenticateUser, timelineController.updateEvent);
router.post("/timeline/:timelineId/delete-event", authenticateUser, timelineController.deleteEvent);

// Notification routes
router.put(
  "/notification/mark-all-as-read",
  authenticateUser,
  notificationController.markAllAsRead
);
router.put(
  "/notification/:notifId/change-notif-status",
  authenticateUser,
  notificationController.changeNotifStatus
);
router.post(
  "/notification/:notifId/delete-notif",
  authenticateUser,
  notificationController.deleteNotif
);

module.exports = router;
