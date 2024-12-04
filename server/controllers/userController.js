const { db, auth, clientAuth, clientDb, storage } = require("../firebase");
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { doc, getDoc } = require("firebase/firestore");

const { Resend } = require("resend");
const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);
const jwt = require("jsonwebtoken");

// const crypto = require("crypto");
// const secret = crypto.randomBytes(32).toString("hex");
// console.log("secret", secret);

// Create User
exports.createUser = async (req, res) => {
  let createdUserDoc = null;
  let firebaseUserId = null;
  try {
    const { firstName, lastName, username, email, password, userId } = req.body;
    let { profilePic, connectedAccount } = req.body;

    // Check if email already exists
    const existingUser = await db.collection("users").where("email", "==", email).get();
    if (!existingUser.empty) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Check if email already exists
    const existingUsername = await db.collection("users").where("username", "==", username).get();
    if (!existingUsername.empty) {
      return res.status(400).json({ message: "Username already in use" });
    }

    // Create user in Firebase Authentication
    // 0 for Google, 1 for Facebook
    if (connectedAccount === 0 || connectedAccount === 1) {
      // For Google OAuth
      firebaseUserId = userId;
    } else {
      // For email/password registration
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      firebaseUserId = userCredential.user.uid;
      connectedAccount = null;
      profilePic = null;
    }

    // Create user document in Firestore
    const userData = {
      firstName,
      lastName,
      username,
      email: email.toLowerCase(),
      theme: 0, //0 for dark mode (default), 1 for light mode
      connectedAccount, //0 for Google, 1 for Facebook, null
      profilePic,
      notifSettings: {
        allowNotif: true,
        deleteNotif: true,
        deleteNotifAfter: 15, // in days
        timeForCalEventReminder: "0800", //"0000" to "2359"
        mentionedInComment: true,
        newCommentReplyAsOwner: true,
        newCommentReplyAsCollab: false,
        commentStatusChangeAsOwner: true,
        commentStatusChangeAsCollab: false,
        calEventReminder: true,
        renamedDesign: true,
        inactiveDesign: false,
        deletedDesign: false,
        changeRoleInDesign: false,
        renamedProject: true,
        inactiveProject: false,
        deletedProject: false,
        changeRoleInProject: false,
      },
      layoutSettings: {
        designsListHome: 0, //0 for tiled view, 1 for list view
        projectsListHome: 0,
        designsListDesigns: 0,
        projectsListProjects: 0,
        timeline: 0,
      },
      lastUsedSettings: {
        colorPalette: null,
        numberOfImages: 1,
      },
      colorPalettes: [],
      otp: null,
      isVerified: connectedAccount === 0 || connectedAccount === 1 ? true : false,
      lockout: {
        count: 0,
        attemptAt: null,
      },
      projects: [],
      designs: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    await db.collection("users").doc(firebaseUserId).set(userData);
    createdUserDoc = true;

    if (!(connectedAccount === 0 || connectedAccount === 1)) {
      // Send verification email
      // Generate verification token
      const verificationToken = jwt.sign(
        { email: email.toLowerCase(), userId: firebaseUserId },
        process.env.REACT_APP_JWT_SECRET,
        { expiresIn: "1m" } // change to 24h on prod
      );

      // Send verification email
      const verificationLink = `${process.env.REACT_APP_URL}/verify-email/${verificationToken}`;
      await sendEmail(
        email,
        "DecorAItion Email Verification",
        `<p>Hi ${username}! Please verify your email by clicking this link: <a href="${verificationLink}">Verify Email</a></p>
      <p>This link will expire in 1 minute.</p>` // change to 24 hours on prod
      );
    }

    res.status(200).json({ message: "User created successfully", userId });
  } catch (error) {
    console.error("Error creating user:", error);
    const { userId } = req.body;
    let { connectedAccount } = req.body;
    if (connectedAccount === 0 || connectedAccount === 1) {
      firebaseUserId = userId;
    }

    // Implement rollback in reverse order
    if (createdUserDoc) {
      try {
        await db.collection("users").doc(firebaseUserId).delete();
        console.log("Rolled back: Deleted Firestore document");
      } catch (deleteFirestoreError) {
        console.error("Error during Firestore rollback:", deleteFirestoreError);
      }
    }

    if (firebaseUserId) {
      try {
        await auth.deleteUser(firebaseUserId);
        console.log("Rolled back: Deleted Firebase Auth user");
      } catch (deleteAuthError) {
        console.error("Error during Auth rollback:", deleteAuthError);
      }
    }

    res.status(500).json({
      error: "Failed to create user",
      message: error.message,
    });
  }
};

// Confirm email verification
exports.confirmEmailVerification = async (req, res) => {
  const { token } = req.params;
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REACT_APP_JWT_SECRET);
    } catch (error) {
      console.log("Token verification error:", error);
      return res.status(401).json({
        success: false,
        expired: true,
        message: "Invalid or expired token. Please register again.",
      });
    }
    const { email } = decoded;

    const userDoc = await db.collection("users").where("email", "==", email).get();
    if (userDoc.empty) {
      return res.status(404).json({ success: false, expired: null, message: "User not found" });
    }

    await db.collection("users").doc(userDoc.docs[0].id).update({
      isVerified: true,
      modifiedAt: new Date(),
    });

    res.status(200).json({ success: true, expired: false, message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ success: false, expired: null, message: "Failed to verify email" });
  }
};

// Check if email exists and is verified
exports.checkEmailVerification = async (req, res) => {
  try {
    const { email } = req.params;
    const userDocs = await db.collection("users").where("email", "==", email).get();

    if (userDocs.empty) {
      return res.status(200).json({ exists: false });
    }

    const userDoc = userDocs.docs[0];
    const userData = userDoc.data();

    // Check if isVerified field exists
    if (userData.isVerified === undefined) {
      // If field doesn't exist, update document with isVerified: true
      await db.collection("users").doc(userDoc.id).update({
        isVerified: true,
        modifiedAt: new Date(),
      });

      return res.status(200).json({
        exists: true,
        isVerified: true,
      });
    }

    // If field exists, return its value
    res.status(200).json({
      exists: true,
      isVerified: userData.isVerified,
    });
  } catch (error) {
    console.error("Error checking email verification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete unverified user
exports.deleteUnverifiedUser = async (req, res) => {
  try {
    const { token } = req.params;
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REACT_APP_JWT_SECRET);
      // If token is valid, proceed with deletion using decoded.userId
      await auth.deleteUser(decoded.userId);
      await db.collection("users").doc(decoded.userId).delete();
      return res.status(200).json({ message: "Unverified user deleted successfully" });
    } catch (tokenError) {
      console.log("Token verification error:", tokenError);
      // Token is expired, try to find and delete user by email
      try {
        // Try to extract email from expired token without verification
        const decodedWithoutVerification = jwt.decode(token);
        if (!decodedWithoutVerification || !decodedWithoutVerification.email) {
          return res.status(401).json({
            message: "Invalid token structure. Unable to delete user.",
          });
        }

        // Find user by email
        const email = decodedWithoutVerification.email;
        const userDoc = await db.collection("users").where("email", "==", email).get();
        if (userDoc.empty) {
          return res.status(404).json({ message: "User not found" });
        }
        const userId = userDoc.docs[0].id;

        // Delete from Firebase Auth and users collection
        await auth.deleteUser(userId);
        await db.collection("users").doc(userId).delete();
        console.log(`Unverified user deleted successfully, userId: ${userId}, email: ${email}`);

        return res.status(200).json({
          message: "Unverified user deleted successfully using email lookup",
        });
      } catch (deleteError) {
        console.error("Error during user deletion:", deleteError);
        return res.status(500).json({
          message: "Failed to delete unverified user after token expiration",
        });
      }
    }
  } catch (error) {
    console.error("Error in deleteUnverifiedUser:", error);
    return res.status(500).json({ message: "Failed to delete unverified user" });
  }
};

// Check lockout status on login
exports.checkLockoutStatus = async (req, res) => {
  try {
    const { email } = req.params;
    const userSnapshot = await db.collection("users").where("email", "==", email).get();
    if (userSnapshot.empty) {
      return res.status(200).json({ isLocked: false });
    }
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Initialize lockout field if it doesn't exist
    if (!userData.lockout) {
      await db
        .collection("users")
        .doc(userDoc.id)
        .update({
          lockout: { count: 0, attemptAt: null },
        });
      return res.status(200).json({ isLocked: false });
    }

    const { count, attemptAt } = userData.lockout;

    // If there are attempts and a timestamp exists
    if (attemptAt) {
      const lockoutTime = 1 * 60 * 1000; //  1 * 60 * 1000 for testing, 15 * 60 * 1000 for prod (minutes in milliseconds)
      const now = new Date();
      const timeSinceLastAttempt = now - attemptAt.toDate();

      // If it's been more than 15 minutes since last attempt
      if (timeSinceLastAttempt >= lockoutTime) {
        // Reset the lockout regardless of count
        await db.collection("users").doc(userDoc.id).update({
          "lockout.count": 0,
          "lockout.attemptAt": null,
        });
        return res.status(200).json({ isLocked: false });
      }

      // Only check for lockout if within time window
      if (count >= 5) {
        const remainingTime = Math.ceil((lockoutTime - timeSinceLastAttempt) / 60000);
        return res.status(200).json({ isLocked: true, remainingMinutes: remainingTime });
      }
    }

    return res.status(200).json({ isLocked: false });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Failed to check lockout status" });
  }
};

// Updating failed attempt count and time/reset lockout on login
exports.updateFailedAttempts = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { email } = req.params;
    const { reset } = req.body;
    const existingUser = await db.collection("users").where("email", "==", email).get();
    if (existingUser.empty) {
      return res.status(400).json({ error: "Can't find user" });
    }
    const userFound = existingUser.docs[0];
    const userData = userFound.data();
    const userId = userFound.id;
    const userRef = db.collection("users").doc(userId);
    console.log("userId", userId);

    if (!reset) {
      // Check if there's an existing lockout with timestamp
      if (userData.lockout?.attemptAt) {
        const lockoutTime = 1 * 60 * 1000; // 1 minute for testing (change to 15 * 60 * 1000 for production)
        const now = new Date();
        const timeSinceLastAttempt = now - userData.lockout.attemptAt.toDate();

        // If time has expired, treat this as the first attempt
        if (timeSinceLastAttempt >= lockoutTime) {
          updatedDocuments.push({
            collection: "users",
            id: userId,
            field: "lockout",
            previousValue: userData.lockout,
          });
          await userRef.update({
            lockout: {
              count: 1,
              attemptAt: new Date(),
            },
          });
          return res.status(200).json({ isLocked: false, attemptsLeft: 5 });
        }
      }

      const currentCount = (userData.lockout?.count || 0) + 1;
      updatedDocuments.push({
        collection: "users",
        id: userId,
        field: "lockout",
        previousValue: userData.lockout,
      });
      await userRef.update({
        lockout: {
          count: currentCount,
          attemptAt: new Date(),
        },
      });
      if (currentCount >= 6) {
        return res.status(200).json({ isLocked: true, remainingMinutes: 1 }); // Change to 15 for production
      }
      return res.status(200).json({ isLocked: false, attemptsLeft: 6 - currentCount });
    } else {
      updatedDocuments.push({
        collection: "users",
        id: userId,
        field: "lockout",
        previousValue: userData.lockout,
      });
      await userRef.update({
        lockout: {
          count: 0,
          attemptAt: null,
        },
      });
      return res.status(200).json({ isLocked: false });
    }
  } catch (error) {
    console.error("Error fetching user:", error);

    // Rollback updates to existing documents
    for (const doc of updatedDocuments) {
      try {
        await db
          .collection(doc.collection)
          .doc(doc.id)
          .update({
            [doc.field]: doc.previousValue,
          });
        console.log(`Rolled back ${doc.field} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }

    return res.status(500).json({ error: "Failed to check lockout status" });
  }
};

// Read User
exports.fetchUserData = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the requesting user matches the userId
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error("Error fetching user data: ", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

// Read Other User
exports.getOtherUserData = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = { id: userDoc.id, ...userDoc.data() };
    return res.status(200).json({ user: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Login with Google/Facebook
exports.loginUserOAuth = async (req, res) => {
  try {
    const { user, connectedAccount } = req.body;

    // Check if the user exists in the 'users' collection
    const userDocRef = db.collection("users").doc(user.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    if (userDoc.exists) {
      // User exists, fetch their data
      if (userData.connectedAccount === null && userData.connectedAccount !== connectedAccount) {
        const updatedAt = new Date();
        await userDocRef.update({ connectedAccount: connectedAccount, updatedAt: updatedAt });
      }

      // Add the document ID (user.uid) to userData
      const userDataWithId = {
        ...userData,
        connectedAccount: connectedAccount,
        id: user.uid,
      };

      res.status(200).json({
        message: "Login successful",
        userData: userDataWithId,
      });
    } else {
      // User doesn't exist in Firestore yet
      res.status(200).json({
        message: "No account yet",
        userData: null,
      });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(401).json({ error: "Login failed", message: error.message });
  }
};

const sendEmail = async (to, subject, body) => {
  try {
    // "decoraition@gmail.com" or "no-reply@decoraition.org"
    const response = await resend.emails.send({
      from: "no-reply@decoraition.org",
      to,
      subject,
      html: body,
    });

    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Send OTP if email exists
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userDoc = await db.collection("users").where("email", "==", email).get();
    if (userDoc.empty) {
      return res.status(404).json({ message: "Email not found" });
    }
    const userData = userDoc.docs[0].data();
    const userId = userDoc.docs[0].id;

    // check if connected account
    const connectedAccount = userData.connectedAccount;
    if (connectedAccount !== null) {
      let provider = "linked";
      if (connectedAccount === 0) provider = "Google";
      else if (connectedAccount === 1) provider = "Facebook";
      return res.status(404).json({
        message: `Email is using a ${provider} account, login with your ${provider} account.`,
      });
    }

    const username = userData.username;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.collection("users").doc(userId).update({ otp });

    // Send email with OTP using resend
    await sendEmail(
      email,
      "DecorAItion Forgot Password OTP",
      `<p>Hi ${username}! Here is your OTP: ${otp}. It will expire in 5 minutes.</p>`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const userDoc = await db.collection("users").where("email", "==", email).get();
    if (userDoc.empty) {
      return res.status(404).json({ message: "User not found" });
    }
    const userData = userDoc.docs[0].data();
    if (userData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    // Remove OTP from user document
    await db.collection("users").doc(userDoc.docs[0].id).update({ otp: null });
    const token = jwt.sign({ email }, process.env.REACT_APP_JWT_SECRET, { expiresIn: "15m" }); //1m for testing
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Resend & Update OTP
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const userDoc = await db.collection("users").where("email", "==", email).get();
    if (userDoc.empty) {
      return res.status(404).json({ message: "User not found" });
    }
    const username = userDoc.docs[0].username;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.collection("users").doc(userDoc.docs[0].id).update({ otp });

    // Send email with new OTP using resend
    await sendEmail(
      email,
      "DecorAItion Forgot Password OTP",
      `<p>Hi ${username}! Here is your OTP: ${otp}. It will expire in 5 minutes.</p>`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error in resendOTP:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear OTP if time expires
exports.expireOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const userDoc = await db.collection("users").where("email", "==", email).get();
    if (!userDoc.empty) {
      await db.collection("users").doc(userDoc.docs[0].id).update({ otp: null });
    }
    console.log(`OTP cleared for ${email} (${userDoc.docs[0].id})`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error in expireOTP:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { email, newPassword, token } = req.body;
  try {
    try {
      jwt.verify(token, process.env.REACT_APP_JWT_SECRET);
    } catch (error) {
      console.log("Token verification error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await auth.getUserByEmail(email);

    // Check if new password matches old password by trying to sign in with the new password
    try {
      await signInWithEmailAndPassword(clientAuth, email, newPassword);
      // If successful, it means the new password is the same as the old one
      return res
        .status(400)
        .json({ message: "New password cannot be the same as your old password" });
    } catch (signInError) {
      // If sign-in fails, it means the new password is different from the old one, proceed with password update
      await auth.updateUser(user.uid, { password: newPassword });
      res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to change password" });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  const { userId, newPassword } = req.body;
  try {
    await auth.updateUser(userId, { password: newPassword });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to change password" });
  }
};

// Update Profile Picture
exports.updateProfilePic = async (req, res) => {
  const userId = req.body.userId;
  const file = req.file;
  const updatedAt = new Date();

  if (!file || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Access file metadata
  const fileName = file.originalname;
  const fileSize = file.size;
  const fileType = file.mimetype;
  console.log(`File Name: ${fileName}; File Size: ${fileSize}; File Type: ${fileType}`);

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    // Check if there's an existing profile picture then extract the file path from URL, check if exists before deleting
    if (userData && userData.profilePic) {
      const oldFileUrl = userData.profilePic;
      const oldFilePath = oldFileUrl.split("/o/")[1].split("?")[0];
      const oldFileRef = ref(storage, decodeURIComponent(oldFilePath));
      try {
        await getDownloadURL(oldFileRef);
        try {
          await deleteObject(oldFileRef);
          console.log("Old profile picture deleted successfully");
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
        }
      } catch (error) {
        console.log("Old profile picture doesn't exist or is inaccessible");
      }
    }

    // Upload new file
    const storageRef = ref(storage, `profilePic/${userId}`);
    const snapshot = await uploadBytes(storageRef, file.buffer, {
      contentType: file.mimetype,
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update user document
    await userDocRef.update({ profilePic: downloadURL, updatedAt: updatedAt });

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePic: downloadURL,
      updatedAt: updatedAt,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
};

// Remove profile picture
exports.removeProfilePic = async (req, res) => {
  const userId = req.body.userId;
  const updatedAt = new Date();

  if (!userId) {
    return res.status(400).json({ error: "User ID missing" });
  }

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    // Check if there's an existing profile picture then extract the file path from URL, check if exists before deleting
    if (userData && userData.profilePic) {
      const oldFileUrl = userData.profilePic;
      const oldFilePath = oldFileUrl.split("/o/")[1].split("?")[0];
      const oldFileRef = ref(storage, decodeURIComponent(oldFilePath));
      try {
        await getDownloadURL(oldFileRef);
        try {
          await deleteObject(oldFileRef);
          console.log("Old profile picture deleted successfully");
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
        }
      } catch (error) {
        console.log("Old profile picture doesn't exist or is inaccessible");
      }
    }

    // Update user document
    await userDocRef.update({ profilePic: null, updatedAt: updatedAt });

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePic: null,
      updatedAt: updatedAt,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
};

// Update User Field (theme, email)
exports.updateUserField = async (req, res) => {
  const { userId, field, value } = req.body;

  if (!userId || !field || value === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = {};
    const updatedAt = new Date();
    updateData.updatedAt = updatedAt;

    switch (field) {
      case "theme":
        updateData[field] = value;
        break;

      case "email":
        if (userDoc.data().email !== value) {
          try {
            await auth.updateUser(userId, { email: value });
            updateData.email = value;
          } catch (error) {
            console.error("Error updating auth user email:", error);
            return res.status(500).json({ error: "Failed to update email" });
          }
        }
        break;

      default:
        return res.status(400).json({ error: "Invalid field" });
    }

    await userDocRef.update(updateData);
    res
      .status(200)
      .json({ message: `${field} updated successfully`, [field]: value, updatedAt: updatedAt });
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
    console.log(error.code);
    res.status(500).json({ error: `Failed to update ${field}` });
  }
};

exports.checkExistingEmail = async (req, res) => {
  const { userId, email } = req.params;
  if (!userId || email === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userDoc.data().email !== email) {
      try {
        const existingUser = await auth.getUserByEmail(email);
        if (existingUser && existingUser.uid !== userId) {
          return res.status(400).json({ error: "Email already exists" });
        }
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          return res.status(200).json({ success: true, message: "Email is available" });
        } else {
          throw error;
        }
      }
    }

    return res.status(200).json({ success: true, message: "Email is available" });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ error: "Failed to check email" });
  }
};

exports.checkExistingEmailForReg = async (req, res) => {
  const { email } = req.params;
  if (email === undefined) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    try {
      const existingUser = await db.collection("users").where("email", "==", email).get();
      if (existingUser.size > 0) {
        return res.status(400).json({ error: "Email already exists" });
      } else {
        return res.status(200).json({ success: true, message: "Email is available" });
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ error: "Failed to check email" });
  }
};

// Update User Field (firstName, lastName, and username)
exports.updateUserDetails = async (req, res) => {
  const { userId, firstName, lastName, username } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("got user doc");
    const updateData = {};
    updateData.updatedAt = new Date();

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (username !== undefined) updateData.username = username;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    await userDocRef.update(updateData);
    res.status(200).json({ message: "Profile updated successfully", updatedFields: updateData });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

exports.checkExistingUsername = async (req, res) => {
  const { userId, username } = req.params;

  if (!userId || username === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    try {
      const usernameExists = await db.collection("users").where("username", "==", username).get();
      const filteredDocs = usernameExists.docs.filter((doc) => doc.id !== userId);
      if (filteredDocs.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
      } else if (filteredDocs.length === 0) {
        return res.status(200).json({ success: true, message: "Username is available" });
      }
    } catch (error) {
      throw error;
    }

    res.status(200).json({ message: "Username available" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

exports.checkExistingUsernameForReg = async (req, res) => {
  const { username } = req.params;

  if (username === undefined) {
    return res.status(400).json({ error: "Missing username" });
  }

  try {
    try {
      const usernameExists = await db.collection("users").where("username", "==", username).get();
      if (usernameExists.size > 0) {
        return res.status(400).json({ error: "Username already exists" });
      } else {
        return res.status(200).json({ success: true, message: "Username is available" });
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

// Link/Unlink Account
exports.updateConnectedAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { connectedAccount, oldConnectedAccount } = req.body;
    const updatedAt = new Date();

    // Ensure the authenticated user matches the userId
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let message = "";
    const userRecord = await auth.getUser(userId);
    if (connectedAccount === null) {
      // Unlink all providers except password
      const providersToUnlink = [];
      const providers = userRecord.providerData;

      for (const provider of providers) {
        if (provider.providerId !== "password") {
          providersToUnlink.push(provider.providerId);
        }
      }

      if (providersToUnlink.length > 0) {
        try {
          await auth.updateUser(userId, {
            providersToUnlink: providersToUnlink,
          });
        } catch (error) {
          console.error("Error unlinking providers:", error);
        }
      }

      if (oldConnectedAccount === 0) message = "Google account unlinked successfully.";
      else if (oldConnectedAccount === 1) message = "Facebook account unlinked successfully.";
    } else if (!(connectedAccount === 0 || connectedAccount === 1)) {
      console.error("Error: connected account is not 0, 1, null");
      res.status(400).json({ error: "Failed to update connected account" });
    } else {
      if (connectedAccount === 0) message = "Google account linked successfully.";
      else if (connectedAccount === 1) message = "Facebook account linked successfully.";
    }
    await db
      .collection("users")
      .doc(userId)
      .update({ connectedAccount: connectedAccount, updatedAt: updatedAt });

    res.status(200).json({
      message: message,
      connectedAccount: connectedAccount,
      updatedAt: updatedAt,
    });
  } catch (error) {
    console.error("Error updating connected account:", error);
    res.status(500).json({ error: "Failed to update connected account" });
  }
};

exports.cleanupUnusedAuthUsers = async (req, res) => {
  try {
    // Get all users from Firebase Authentication
    const listUsersResult = await auth.listUsers();
    const authUserIds = listUsersResult.users.map((user) => user.uid);
    // Get all user document IDs from Firestore
    const usersSnapshot = await db.collection("users").get();
    const firestoreUserIds = usersSnapshot.docs.map((doc) => doc.id);
    // Identify unused user IDs
    const unusedUserIds = authUserIds.filter((uid) => !firestoreUserIds.includes(uid));
    // Delete unused users
    for (const uid of unusedUserIds) {
      await auth.deleteUser(uid);
      console.log(`Deleted user: ${uid}`);
    }
    res.status(200).json({ message: "Unused authentication users have been cleaned up." });
  } catch (error) {
    console.error("Error cleaning up unused users:", error);
    res.status(500).json({ error: "Failed to clean up unused authentication users" });
  }
};

// Update User Notification Settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { userId, notifSettings } = req.body;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedAt = new Date();
    await userRef.update({
      notifSettings: notifSettings,
      updatedAt: updatedAt,
    });

    res.status(200).json({
      message: "Notification settings updated successfully",
      notifSettings: notifSettings,
      updatedAt: updatedAt,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res
      .status(500)
      .json({ error: "Failed to update notification settings", details: error.message });
  }
};

exports.updateLayoutSettings = async (req, res) => {
  try {
    const { userId } = req.body;
    const settingToUpdate = Object.keys(req.body)[1];
    const newValue = req.body[settingToUpdate];

    await db
      .collection("users")
      .doc(userId)
      .update({
        [`layoutSettings.${settingToUpdate}`]: newValue,
      });

    res.status(200).json({ message: "Layout setting updated successfully" });
  } catch (error) {
    console.error("Error updating layout setting:", error);
    res.status(500).json({ message: "Error updating layout setting", error: error.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const { userId, theme } = req.body;
    if (!userId || theme === undefined) {
      return res.status(400).json({ message: "Missing userId or theme" });
    }
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    await userRef.update({ theme });
    res.status(200).json({ message: "Theme updated successfully" });
  } catch (error) {
    console.error("Error updating theme:", error);
    res.status(500).json({ message: "Error updating theme", error: error.toString() });
  }
};

exports.getUsername = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const username = userDoc.data().username;
    return res.status(200).json({ username: username });
  } catch (error) {
    console.error("Error fetching username:", error);
    return res.status(500).json({ error: "Failed to fetch username" });
  }
};

exports.getUsernames = async (req, res) => {
  const { userIds } = req.body;
  try {
    // Add validation
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: "Invalid userIds format",
        received: userIds,
      });
    }

    const usernames = [];

    for (const userId of userIds) {
      const userDocRef = db.collection("users").doc(userId);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        usernames.push(userDoc.data().username);
      } else {
        // usernames.push("Unknown");
      }
    }

    return res.status(200).json({ usernames });
  } catch (error) {
    console.error("Error fetching usernames:", error.message);
    return res.status(500).json({ error: "Failed to fetch usernames" });
  }
};

exports.addColorPalette = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { userId, colorPalette } = req.body;
    if (!userId || !colorPalette || !colorPalette.paletteName || !colorPalette.colors) {
      return res.status(400).json({ message: "Missing required color palette data" });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousColorPalettes = userDoc.data().colorPalettes || [];

    // Create new color palette with ID, add to colorPalettes array
    const newPalette = {
      colorPaletteId: db.collection("_").doc().id,
      paletteName: colorPalette.paletteName,
      colors: colorPalette.colors,
    };
    const updatedColorPalettes = [...previousColorPalettes, newPalette];
    await userRef.update({
      colorPalettes: updatedColorPalettes,
    });

    updatedDocuments.push({
      collection: "users",
      id: userId,
      field: "colorPalettes",
      previousValue: previousColorPalettes,
    });

    res.status(200).json({
      message: "Color palette added successfully",
      colorPalette: newPalette,
    });
  } catch (error) {
    console.error("Error adding color palette:", error);

    // Rollback updates to existing documents
    for (const doc of updatedDocuments) {
      try {
        await db
          .collection(doc.collection)
          .doc(doc.id)
          .update({
            [doc.field]: doc.previousValue,
          });
        console.log(`Rolled back ${doc.field} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }

    res.status(500).json({ message: "Error adding color palette", error: error.toString() });
  }
};

exports.updateColorPalette = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { userId, colorPalette } = req.body;

    if (
      !userId ||
      !colorPalette ||
      !colorPalette.colorPaletteId ||
      !colorPalette.paletteName ||
      !colorPalette.colors
    ) {
      return res.status(400).json({ message: "Missing required color palette data" });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousColorPalettes = userDoc.data().colorPalettes || [];

    // Find index of palette to update
    const paletteIndex = previousColorPalettes.findIndex(
      (p) => p.colorPaletteId === colorPalette.colorPaletteId
    );

    if (paletteIndex === -1) {
      return res.status(404).json({ message: "Color palette not found" });
    }

    // Create updated color palettes array and update user document
    const updatedColorPalettes = [...previousColorPalettes];
    updatedColorPalettes[paletteIndex] = {
      colorPaletteId: colorPalette.colorPaletteId,
      paletteName: colorPalette.paletteName,
      colors: colorPalette.colors,
    };
    await userRef.update({
      colorPalettes: updatedColorPalettes,
    });

    updatedDocuments.push({
      collection: "users",
      id: userId,
      field: "colorPalettes",
      previousValue: previousColorPalettes,
    });

    res.status(200).json({
      message: "Color palette updated successfully",
      colorPalette: updatedColorPalettes[paletteIndex],
    });
  } catch (error) {
    console.error("Error updating color palette:", error);

    // Rollback updates to existing documents
    for (const doc of updatedDocuments) {
      try {
        await db
          .collection(doc.collection)
          .doc(doc.id)
          .update({
            [doc.field]: doc.previousValue,
          });
        console.log(`Rolled back ${doc.field} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }

    res.status(500).json({ message: "Error updating color palette", error: error.toString() });
  }
};

exports.deleteColorPalette = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { userId, colorPalette } = req.body;

    if (!userId || !colorPalette || !colorPalette.colorPaletteId) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousColorPalettes = userDoc.data().colorPalettes || [];

    // Filter out the palette to delete
    const updatedColorPalettes = previousColorPalettes.filter(
      (p) => p.colorPaletteId !== colorPalette.colorPaletteId
    );

    // If no palette was removed, it didn't exist
    if (updatedColorPalettes.length === previousColorPalettes.length) {
      return res.status(404).json({ message: "Color palette not found" });
    }

    // Update user document
    await userRef.update({
      colorPalettes: updatedColorPalettes,
    });

    updatedDocuments.push({
      collection: "users",
      id: userId,
      field: "colorPalettes",
      previousValue: previousColorPalettes,
    });

    res.status(200).json({
      message: "Color palette deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting color palette:", error);

    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await db
          .collection(doc.collection)
          .doc(doc.id)
          .update({
            [doc.field]: doc.previousValue,
          });
        console.log(`Rolled back ${doc.field} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }

    res.status(500).json({ message: "Error deleting color palette", error: error.toString() });
  }
};
