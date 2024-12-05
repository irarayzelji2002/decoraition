import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import axios from "axios";
import {
  handleSetError,
  getHasError,
  getErrMessage,
  stringAvatarColor,
  stringAvatarInitials,
  showToast,
  capitalizeFieldName,
} from "../../functions/utils";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  getAuth,
  linkWithPopup,
  linkWithCredential,
} from "firebase/auth";
import {
  Tabs,
  Tab,
  Avatar,
  Button,
  IconButton,
  TextField,
  Box,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
} from "@mui/material";

import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  CloseRounded as CloseRoundedIcon,
  Link as LinkIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import Link from "@mui/material/Link";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "../../components/RenameModal";

import { GoogleIcon, FacebookIconWhite } from "../../components/CustomIcons";
import Notifications from "./Notifications";
import TopBar from "../../components/TopBar";
import "../../css/settings.css";
import EditableInput from "./EditableInput";
import EditableInputThree from "./EditableInputThree";
import EditablePassInput from "./EditablePassInput";
import LongToggleInput from "./LongToggleInput";
import { textFieldStyles } from "../DesignSpace/DesignSettings";

function Settings() {
  const { user, userDoc } = useSharedProps();
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;

  const [selectedTab, setSelectedTab] = useState("Account");
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLinkAccountModalOpen, setIsLinkAccountModalOpen] = useState(false);
  const [isGoogleBtnDisabled, setIsGoogleBtnDisabled] = useState(false);
  const [isFacebookBtnDisabled, setIsFacebookBtnDisabled] = useState(false);
  const [isUnlinkAccountModalOpen, setIsUnlinkAccountModalOpen] = useState(false);
  const [isUnlinkBtnDisabled, setIsUnlinkBtnDisabled] = useState(false);
  const [isChangeProfileModalOpen, setIsChangeProfileModalOpen] = useState(false);
  const [isSavePhotoBtnDisabled, setIsSavePhotoBtnDisabled] = useState(false);
  const [isRemoveProfileModalOpen, setIsRemoveProfileModalOpen] = useState(false);
  const [isRemoveProfileBtnDisabled, setIsRemoveProfileBtnDisabled] = useState(false);

  const [firstName, setFirstName] = useState(userDoc.firstName ?? "");
  const [lastName, setLastName] = useState(userDoc.lastName ?? "");
  const [username, setUsername] = useState(userDoc.username ?? "");
  const [email, setEmail] = useState(userDoc.email ?? "");
  const [theme, setTheme] = useState(userDoc.theme ?? 0);
  const [connectedAccount, setConnectedAccount] = useState(userDoc.connectedAccount ?? null);
  const [profilePic, setProfilePic] = useState(userDoc.profilePic ?? null);
  const [profilePicPreview, setProfilePicPreview] = useState(userDoc.profilePic ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState("");
  const [otp, setOtp] = useState(0);
  const [unlinkPassword, setUnlinkPassword] = useState("");
  const [unlinkConfirmPassword, setUnlinkConfirmPassword] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    valid: true,
    message: "",
    color: "",
  });
  const [passwordMatch, setPasswordMatch] = useState(null);

  useEffect(() => {
    if (userDoc) {
      setFirstName(userDoc.firstName ?? "");
      setLastName(userDoc.lastName ?? "");
      setUsername(userDoc.username ?? "");
      setEmail(userDoc.email ?? "");
      setTheme(userDoc.theme ?? 0);
      setConnectedAccount(userDoc.connectedAccount ?? null);
      setProfilePic(userDoc.profilePic ?? null);
      setProfilePicPreview(userDoc.profilePic ?? "");
    }
  }, [userDoc]);

  const initUserDetailsErr = [
    { field: "firstName", hasError: false, errMessage: "" },
    { field: "lastName", hasError: false, errMessage: "" },
    { field: "username", hasError: false, errMessage: "" },
    { field: "all", hasError: false, errMessage: "" },
  ];

  const initEmailErr = [{ field: "email", hasError: false, errMessage: "" }];

  const initPassErr = [
    { field: "otp", hasError: false, errMessage: "" },
    { field: "oldPassword", hasError: false, errMessage: "" },
    { field: "newPassword", hasError: false, errMessage: "" },
    { field: "confirmNewPassword", hasError: false, errMessage: "" },
    { field: "all", hasError: false, errMessage: "" },
  ];

  const initUnlinkErr = [
    { field: "password", hasError: false, errMessage: "" },
    { field: "confirmPassword", hasError: false, errMessage: "" },
    { field: "all", hasError: false, errMessage: "" },
  ];

  const [userDetailsErr, setUserDetailsErr] = useState(initUserDetailsErr);
  const [emailErr, setEmailErr] = useState(initEmailErr);
  const [passErr, setPassErr] = useState(initPassErr);
  const [unlinkErr, setUnlinkErr] = useState(initUnlinkErr);

  const handleTabChange = useCallback((tab) => setSelectedTab(tab), []);

  const handleReset = (field) => {
    if (field === "email") {
      setEmail(userDoc.email);
    } else if (field === "firstName") {
      setFirstName(userDoc.firstName);
    } else if (field === "lastName") {
      setLastName(userDoc.lastName);
    } else if (field === "username") {
      setUsername(userDoc.username);
    } else if (field === "theme") {
      setTheme(userDoc.theme);
    } else if (field === "connectedAccount") {
      setConnectedAccount(userDoc.connectedAccount);
    } else if (field === "profilePic") {
      setProfilePic(userDoc.profilePic);
    } else if (field === "newPassword") {
      setNewPassword("");
      setConfirmNewPassword("");
      setOtp(0);
    } else if (field === "otp") {
      setOtp(0);
    }
  };

  const handleThreeInputsChange = (index, value) => {
    const maxLengths = [50, 50, 20];
    if (value.length <= maxLengths[index]) {
      switch (index) {
        case 0:
          setFirstName(value);
          break;
        case 1:
          setLastName(value);
          break;
        case 2:
          setUsername(value);
          break;
        default:
          break;
      }
    }
  };

  const handleSaveThreeInputs = async (values) => {
    const maxLengths = [50, 50, 20];
    const tempErrors = initUserDetailsErr;

    values.forEach((value, index) => {
      if (value.length > maxLengths[index]) {
        tempErrors[index].hasError = true;
        tempErrors[index].errMessage = `Character limit of ${maxLengths[index]} reached`;
      }
    });

    const trimmedFirstName = values[0].trim();
    const trimmedLastName = values[1].trim();
    const trimmedUsername = values[2].trim();
    setFirstName(trimmedFirstName);
    setLastName(trimmedLastName);
    setUsername(trimmedUsername);

    if (trimmedFirstName === "") {
      tempErrors.find((field) => field.field === "firstName").hasError = true;
      tempErrors.find((field) => field.field === "firstName").errMessage = "This field is required";
    }
    if (trimmedLastName === "") {
      tempErrors.find((field) => field.field === "lastName").hasError = true;
      tempErrors.find((field) => field.field === "lastName").errMessage = "This field is required";
    }
    if (trimmedUsername === "") {
      tempErrors.find((field) => field.field === "username").hasError = true;
      tempErrors.find((field) => field.field === "username").errMessage = "This field is required";
    } else if (/\s/.test(trimmedUsername)) {
      tempErrors.find((field) => field.field === "username").hasError = true;
      tempErrors.find((field) => field.field === "username").errMessage = "No spaces allowed";
    } else {
      const usernameExists = await checkExistingUsername(userDoc.id, trimmedUsername);
      if (usernameExists) {
        tempErrors.find((field) => field.field === "username").hasError = true;
        tempErrors.find((field) => field.field === "username").errMessage =
          "Username already exists";
      }
    }
    if (
      trimmedFirstName === userDoc.firstName &&
      trimmedLastName === userDoc.lastName &&
      trimmedUsername === userDoc.username
    ) {
      tempErrors.find((field) => field.field === "all").hasError = true;
      tempErrors.find((field) => field.field === "all").errMessage = "Nothing has changed";
    }

    setUserDetailsErr(tempErrors);
    const hasError = tempErrors.some((field) => field.hasError);
    if (hasError) {
      return false;
    }
    const success = await handleUpdateUserDetails({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      username: trimmedUsername,
    });
    setUserDetailsErr(initUserDetailsErr);
    return success;
  };

  const handleChangeProfileModalClose = () => {
    setIsChangeProfileModalOpen(false);
    setProfilePicPreview(userDoc.profilePic ?? null);
    setSelectedFile(null);
  };

  const checkExistingUsername = async (userId, username) => {
    try {
      const response = await axios.get(`/api/user/check-existing-username/${userId}/${username}`);
      if (response.status === 200) {
        console.log(response.data.message);
        return false;
      } else {
        console.error("Unexpected response:", response);
        return true;
      }
    } catch (error) {
      console.error("Checking username:", error);
      if (error.response) {
        console.error("Error response data:", error?.response?.data?.error);
      }
      return true;
    }
  };

  // Update firstName, lastName, and username
  const handleUpdateUserDetails = async (updatedFields) => {
    try {
      console.log("updatedFields passed: ", updatedFields);
      const response = await axios.put(
        "/api/user/user-details",
        {
          userId: userDoc.id,
          ...updatedFields,
        },
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (response.status === 200) {
        showToast("success", "Profile updated successfully");
        return true;
        // setUser({ ...user, ...updatedFields });
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error?.response?.data?.error) {
        const tempErrors = userDetailsErr;
        tempErrors.find((field) => field.field === "username").hasError = true;
        tempErrors.find((field) => field.field === "username").errMessage =
          "This field is required";
        setUserDetailsErr(tempErrors);
        console.log("tempErrors", tempErrors);
      } else {
        showToast("error", error?.response?.data?.error || "Failed to update user profile");
      }
      return false;
    }
  };

  // Update theme or email
  const handleSave = async (field, value) => {
    console.log(`${field}: ${value}`);
    if (field === "email") {
      const trimmedEmail = value.trim();
      console.log("trimmedEmail", trimmedEmail);
      setEmail(trimmedEmail);
      const tempErrors = initEmailErr;
      if (trimmedEmail === "") {
        tempErrors.find((field) => field.field === "email").hasError = true;
        tempErrors.find((field) => field.field === "email").errMessage = "This field is required";
      } else if (trimmedEmail === userDoc.email) {
        tempErrors.find((field) => field.field === "email").hasError = true;
        tempErrors.find((field) => field.field === "email").errMessage = "Email did not change.";
      } else {
        const emailExists = await checkExistingEmail(userDoc.id, trimmedEmail);
        if (emailExists) {
          tempErrors.find((field) => field.field === "email").hasError = true;
          tempErrors.find((field) => field.field === "email").errMessage = "Email already exists";
        }
      }
      setEmailErr(tempErrors);
      const hasError = tempErrors.some((field) => field.hasError);
      if (hasError) {
        return false;
      }
      // Proceed with updating email
      const success = await handleUpdateField("email", trimmedEmail);
      setEmailErr(initEmailErr);
      return success;
    } else if (field === "theme") {
      const success = await handleUpdateField("theme", value);
      return success;
    }
  };

  const checkExistingEmail = async (userId, email) => {
    try {
      const response = await axios.get(`/api/user/check-existing-email/${userId}/${email}`);
      if (response.status === 200) {
        console.log(response.data.message);
        return false;
      } else {
        console.error("Unexpected response:", response);
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      return true;
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      const response = await axios.put(
        "/api/user/update-field",
        {
          userId: userDoc.id,
          field,
          value,
        },
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (response.status === 200) {
        const fieldName = capitalizeFieldName(field);
        if (field === "theme") {
          setTheme(value);
          showToast("success", ` ${fieldName} changed to ${value === 0 ? "dark" : "white"} mode`);
        } else {
          showToast("success", `${fieldName} updated successfully`);
        }
        return true;
        // setUser({ ...user, [field]: value });
      } else {
        throw new Error("Failed to update user field");
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      showToast("error", `${error.response?.data?.error || `Failed to update ${field}`}`);
      return false;
    }
  };

  // Update profilePic
  const handleChangePhotoClick = () => {
    setIsChangeProfileModalOpen(true);
    console.log("profilePic", profilePic);
  };

  const handleUploadPhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Image validation
      let message = "";
      const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!acceptedTypes?.includes(file.type)) {
        message = "Please upload an image file of png, jpg, jpeg, gif, or webp type";
        showToast("error", message);
      } else {
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
          message = "Image size must be less than 2MB";
          showToast("error", message);
        }
      }

      if (message !== "") return;

      setSelectedFile(file); // Set the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result); // Set the avatar preview
      };
      reader.readAsDataURL(file);
      console.log("File uploaded:", file);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) {
      showToast("error", "Please select a file first");
      return;
    }

    setIsSavePhotoBtnDisabled(true);
    try {
      const formData = new FormData();
      formData.append("userId", userDoc.id);
      formData.append("file", selectedFile);
      console.log(formData);
      const response = await axios.put("/api/user/profile-pic", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (response.status === 200) {
        showToast("success", "Profile picture updated successfully");
        setSelectedFile(null);
        setIsChangeProfileModalOpen(false);
        // setProfilePic(userDoc.profilePic ?? "");
        // setProfilePicPreview(userDoc.profilePic ?? "");
        // setUser({ ...user, profilePic: response.data.profilePic });
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      showToast("error", "Failed to update profile picture");
    } finally {
      setIsSavePhotoBtnDisabled(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsRemoveProfileBtnDisabled(true);
    try {
      const response = await axios.put(
        "/api/user/remove-profile-pic",
        { userId: userDoc.id },
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (response.status === 200) {
        showToast("success", "Profile picture removed");
        setSelectedFile(null);
        setIsRemoveProfileModalOpen(false);
        // setProfilePic(userDoc.profilePic ?? "");
        // setProfilePicPreview(userDoc.profilePic ?? "");
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      showToast("error", "Failed to remove profile picture");
    } finally {
      setIsRemoveProfileBtnDisabled(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 0 ? 1 : 0;
    // setTheme(newTheme);
    handleSave("theme", newTheme);
  };

  // Update connectedAccount
  const openlinkAccountModal = () => {
    if (!(connectedAccount === 0 || connectedAccount === 1)) {
      setIsLinkAccountModalOpen(true); //connect to Google/Facebook
    } else {
      reAuthenticateUser();
    }
  };

  const reAuthenticateUser = async () => {
    setIsUnlinkBtnDisabled(true);
    let reAuthUser;
    let providerId = null;
    let providerName = "";

    if (connectedAccount === 0) {
      providerId = "google.com";
      providerName = "Google";
    } else if (connectedAccount === 1) {
      providerId = "facebook.com";
      providerName = "Facebook";
    }

    try {
      if (!user) {
        showToast("error", "User not authenticated");
        return;
      }

      // Reauthenticate the user
      if (connectedAccount === 0) {
        const provider = new GoogleAuthProvider();
        const result = await reauthenticateWithPopup(user, provider);
        reAuthUser = result.user;
        console.log("reached");
      } else if (connectedAccount === 1) {
        const provider = new FacebookAuthProvider();
        const result = await reauthenticateWithPopup(user, provider);
        reAuthUser = result.user;
      }
      console.log("reached out");
      if (!reAuthUser) {
        showToast("error", "Reauthentication failed");
        return;
      }

      // Check if there's a email/password account
      const userPassProviderData = user.providerData.find((p) => p.providerId === "password");
      if (!userPassProviderData) {
        setIsUnlinkAccountModalOpen(true);
      } else {
        handleUnlink(false, providerName);
      }
    } catch (error) {
      console.error("Failed to reauthenticate user.", error.code);
      console.error(error.message);
      if (error.code === "auth/user-mismatch") {
        showToast(
          "error",
          `Please select the correct ${providerName} account linked to this account`
        );
        // if user doesn't exist, it created an auth user without a user document, so this will clean up the auth user
        cleanupUnusedAuthUsers();
      }
    } finally {
      setIsUnlinkBtnDisabled(false);
    }
  };

  const cleanupUnusedAuthUsers = async () => {
    try {
      const response = await axios.delete("/api/cleanup-unused-auth-users", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });
      console.log(response.data.message);
    } catch (error) {
      console.error("Error cleaning up unused auth users:", error);
    }
  };

  const handleUnlink = async (newPassAccount, providerName) => {
    try {
      if (newPassAccount) {
        // Password validation
        const tempErrors = initUnlinkErr;
        if (!unlinkPassword) {
          tempErrors.find((field) => field.field === "password").hasError = true;
          tempErrors.find((field) => field.field === "password").errMessage =
            "This field is required";
        }
        if (!unlinkConfirmPassword) {
          tempErrors.find((field) => field.field === "confirmPassword").hasError = true;
          tempErrors.find((field) => field.field === "confirmPassword").errMessage =
            "This field is required";
        } else if (unlinkPassword !== unlinkConfirmPassword) {
          tempErrors.find((field) => field.field === "confirmPassword").hasError = true;
          tempErrors.find((field) => field.field === "confirmPassword").errMessage =
            "Password and confirm password do not match";
        }
        const hasError = tempErrors.some((field) => field.hasError);
        console.log("tempErrors", tempErrors);
        console.log("hasError", hasError);
        if (hasError) {
          setUnlinkErr(tempErrors);
          return;
        }

        // Create email/password account and handle potential errors
        try {
          const credential = EmailAuthProvider.credential(user.email, unlinkPassword);
          await linkWithCredential(user, credential);
          console.log("Email/Password account linked successfully");
        } catch (error) {
          console.error("Error linking email/password account:", error);
          console.log("Error Code:", error.code);
          if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            tempErrors.find((field) => field.field === "password").hasError = true;
            tempErrors.find((field) => field.field === "password").errMessage =
              "Incorrect password";
            setUnlinkErr(tempErrors);
            return;
          } else {
            showToast("error", `Failed to unlink ${providerName} account. Please try again.`);
            return;
          }
        }
      }

      // After linking email/password, proceed with unlinking Google/Facebook account
      const success = await handleConnectedAccountChange(null);
      if (success) {
        await user.reload();
        setUnlinkPassword("");
        setUnlinkConfirmPassword("");
        setIsUnlinkAccountModalOpen(false);
        setUnlinkErr(initEmailErr);
      }
    } catch (error) {
      console.error("Error unlinking account:", error);
      console.log("Error Code:", error.code);
      showToast("error", `Failed to unlink ${providerName} account. Please try again.`);
    }
  };

  // Remove only the specified field error
  const clearFieldError = (field, setErrors) => {
    setErrors((prevErrors) => {
      if (prevErrors && prevErrors[field]) {
        const { [field]: _, ...remainingErrors } = prevErrors;
        return remainingErrors;
      }
      return prevErrors;
    });
  };

  const handleUnlinkPasswordChange = (e) => {
    const newPassword = e.target.value;
    setUnlinkPassword(newPassword);
    clearFieldError("password", setUnlinkErr);

    // Only validate if password has length
    if (newPassword.length > 0) {
      const validation = isPasswordValid(newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ valid: true, message: "", color: "" });
    }

    // Update password match if confirm password exists
    if (unlinkConfirmPassword.length > 0) {
      setPasswordMatch(newPassword === unlinkConfirmPassword);
    }
  };

  const handleUnlinkConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setUnlinkConfirmPassword(newConfirmPassword);
    clearFieldError("confirmPassword", setUnlinkErr);

    // Only check match if confirm password has length
    if (newConfirmPassword.length > 0) {
      setPasswordMatch(unlinkPassword === newConfirmPassword);
    } else {
      setPasswordMatch(null);
    }
  };

  const isPasswordValid = (password) => {
    // Don't check if password is empty
    if (password.length === 0) return { valid: true, message: "" };
    if (password.length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters long",
        color: "var(--color-quaternary)",
      };
    }
    if (/^\s|\s$/.test(password)) {
      return {
        valid: false,
        message: "Password cannot start or end with spaces",
        color: "var(--color-quaternary)",
      };
    }
    if (!/[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one special character",
        color: "var(--color-quaternary)",
      };
    }
    if (/[\t\n\r]/.test(password)) {
      return {
        valid: false,
        message: "Password cannot contain non-visible characters like tabs or newlines",
        color: "var(--color-quaternary)",
      };
    }
    return { valid: true, message: "Password is valid", color: "var(--brightGreen)" };
  };

  const handleUnlinkAccountModalClose = () => {
    setIsUnlinkAccountModalOpen(false);
    setUnlinkPassword("");
    setUnlinkConfirmPassword("");
    setPasswordValidation({ valid: true, message: "", color: "" });
    setPasswordMatch(null);
    setUnlinkErr(initUnlinkErr);
  };

  const handleLinkAccount = async (provider) => {
    try {
      let newConnectedAccount = null;
      let acctProvider = null;
      let result;
      try {
        // Clean up auth user that doesn't have a user document
        cleanupUnusedAuthUsers();
        if (provider === "google") {
          setIsGoogleBtnDisabled(true);
          acctProvider = new GoogleAuthProvider();
          result = await linkWithPopup(user, acctProvider);
          newConnectedAccount = 0;
        } else if (provider === "facebook") {
          setIsFacebookBtnDisabled(true);
          acctProvider = new FacebookAuthProvider();
          result = await linkWithPopup(user, acctProvider);
          newConnectedAccount = 1;
          console.log("result", result);
          console.log("result.user", result.user);
        }
      } catch (error) {
        if (error.code === "auth/credential-already-in-use") {
          //if user selected is not in users collection (user.uid is doc id of users collection), delete the auth user and retry
          showToast(
            "error",
            `${capitalizeFieldName(
              provider
            )} account already used by another account. Please select another ${capitalizeFieldName(
              provider
            )} account`
          );
        }
        return;
      }
      if (result?.user) {
        console.log("Account linked updating db:", result.user);
        handleConnectedAccountChange(newConnectedAccount);
      } else {
        console.log("No account was linked.");
        return;
      }
    } catch (error) {
      console.error("Error unlinking account:", error);
      showToast("error", "Failed to link account.");
    } finally {
      setIsGoogleBtnDisabled(false);
      setIsFacebookBtnDisabled(false);
    }
  };

  const handleConnectedAccountChange = async (value) => {
    const previousValue = connectedAccount;
    try {
      const response = await axios.put(
        `/api/user/connected-account/${userDoc.id}`,
        { connectedAccount: value, oldConnectedAccount: userDoc.connectedAccount },
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (response.status === 200) {
        showToast("success", response?.data?.message || "Account updated successfully");
        setIsLinkAccountModalOpen(false);
        setIsUnlinkAccountModalOpen(false);
        setConnectedAccount(value);
        return true;
        // setUser({ ...user, connectedAccount: value });
      }
    } catch (error) {
      console.error("Error updating connected account:", error);
      showToast("error", error.response?.data?.error || "Failed to update account");
      setConnectedAccount(previousValue);
      return false;
    }
  };

  // Password change
  const handlePasswordChange = (index, value) => {
    if (index === 0) {
      setOldPassword(value);
    } else if (index === 1) {
      setNewPassword(value);
    } else if (index === 2) {
      setConfirmNewPassword(value);
    }
  };

  const handlePasswordSave = async (values) => {
    setOldPassword(values[0]);
    setNewPassword(values[1]);
    setConfirmNewPassword(values[2]);

    const tempErrors = initPassErr;
    console.log("oldPassword", oldPassword);
    console.log("newPassword", newPassword);
    console.log("confirmNewPassword", confirmNewPassword);
    console.log("oldPassword", values[0]);
    console.log("newPassword", values[1]);
    console.log("confirmNewPassword", values[2]);
    if (!oldPassword) {
      tempErrors.find((field) => field.field === "oldPassword").hasError = true;
      tempErrors.find((field) => field.field === "oldPassword").errMessage =
        "This field is required";
    } else {
      try {
        // Reauthenticate the user
        const credential = EmailAuthProvider.credential(user.email, oldPassword);
        await reauthenticateWithCredential(user, credential);

        if (oldPassword === newPassword) {
          tempErrors.find((field) => field.field === "newPassword").hasError = true;
          tempErrors.find((field) => field.field === "newPassword").errMessage =
            "Cannot be the same passsword";
        }
      } catch (error) {
        console.error("Error reauthenticating account:", error);
        tempErrors.find((field) => field.field === "oldPassword").hasError = true;
        tempErrors.find((field) => field.field === "oldPassword").errMessage = "Incorrect password";
      }
    }
    if (!newPassword) {
      tempErrors.find((field) => field.field === "newPassword").hasError = true;
      tempErrors.find((field) => field.field === "newPassword").errMessage =
        "This field is required";
    }
    if (!confirmNewPassword) {
      tempErrors.find((field) => field.field === "confirmNewPassword").hasError = true;
      tempErrors.find((field) => field.field === "confirmNewPassword").errMessage =
        "This field is required";
    } else if (newPassword !== confirmNewPassword) {
      tempErrors.find((field) => field.field === "confirmNewPassword").hasError = true;
      tempErrors.find((field) => field.field === "confirmNewPassword").errMessage =
        "New password and confirm new password does not match";
    }
    setPassErr(tempErrors);

    const hasError = tempErrors.some((field) => field.hasError);
    console.log("tempErrors", tempErrors);
    console.log("hasError", hasError);
    if (hasError) {
      return false;
    }
    // Proceed with updating password
    const success = await handleUpdatePassword({
      newPassword: values[1],
      confirmNewPassword: values[2],
    });
    setPassErr(initPassErr);
    return success;
  };

  const handleUpdatePassword = async (passwordData) => {
    try {
      // Call your API endpoint to update the password
      const response = await axios.put(
        "/api/user/update-password",
        {
          userId: userDoc.id,
          ...passwordData,
        },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );

      if (response.status === 200) {
        // Password updated successfully
        showToast("success", "Password updated successfully");
        return true;
      } else {
        // Handle error
        showToast("error", "Failed to update password");
        return false;
      }
    } catch (error) {
      console.error("Error updating password:", error);
      showToast("error", "An error occurred while updating password");
      return false;
    }
  };

  const handleSwitchToAccountTab = () => {
    setSelectedTab("Account");
  };

  return (
    <>
      <TopBar state="Account Settings" navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          paddingTop: "90px",
          paddingLeft: "15px",
          paddingRight: "15px",
          borderBottom: "1px solid var(--inputBg)",
        }}
      >
        {["Account", "Notification"].map((tab) => (
          <Typography
            key={tab}
            onClick={() => handleTabChange(tab)}
            sx={{
              fontSize: 18,
              fontWeight: "bold",
              textTransform: "none",
              cursor: "pointer",
              padding: 1,
              paddingTop: 2,
              paddingBottom: 2,
              marginBottom: "1px",
              position: "relative",
              width: "20%",
              minWidth: "125px",
              textAlign: "center",

              // Apply gradient border bottom if active
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "-2px",
                height: "4px",
                background: selectedTab === tab ? "var(--gradientFont)" : "transparent",
                borderRadius: "0px",
              },

              color: selectedTab === tab ? "transparent" : "var(--color-white)",
              backgroundImage: selectedTab === tab ? "var(--gradientFont)" : "none",
              backgroundClip: selectedTab === tab ? "text" : "unset",
              WebkitBackgroundClip: selectedTab === tab ? "text" : "unset",

              "&:focus, &:active": {
                outline: "none",
                backgroundColor: "transparent",
              },

              "@media (max-width: 350px)": {
                justifyContent: "center",
              },
            }}
          >
            {tab}
          </Typography>
        ))}
      </Box>
      <div className={`settings-container ${selectedTab === "Notification" && "notification"}`}>
        {/* App Bar for Tabs */}

        {/* Account Tab Content */}
        {selectedTab === "Account" && (
          <Box
            mt={4}
            className="tab-content"
            sx={{
              minWidth: "100%",
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              margin: 0,
            }}
          >
            <div className="avatar-container" style={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 155,
                  height: 155,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--gradientButton)",
                  borderRadius: "50%",
                  padding: "6px",
                }}
              >
                <Avatar
                  alt=""
                  src={profilePic ?? ""}
                  sx={{
                    width: 156,
                    height: 156,
                    fontSize: "4rem",
                    boxShadow: "0 0 0 5px var(--gradientButton)",
                    "& .MuiAvatar-img": {
                      borderRadius: "50%",
                    },
                    ...stringAvatarColor(userDoc?.username),
                  }}
                  children={stringAvatarInitials(userDoc?.username)}
                />
              </Box>

              {/* Button Container */}
              <div className="avatarButtonCont">
                {/* Change Photo Button */}
                <Button
                  variant="contained"
                  className="change-photo-btn"
                  onClick={handleChangePhotoClick}
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    fontWeight: "bold",
                    width: "150px",
                    "&:hover": {
                      background: "var(--gradientButtonHover)",
                    },
                  }}
                >
                  {profilePic ? "Change photo" : "Upload photo"}
                </Button>

                {/* Remove Photo Button */}
                {profilePic && (
                  <Button
                    onClick={() => setIsRemoveProfileModalOpen(true)}
                    sx={{
                      background: "transparent",
                      border: "2px solid transparent",
                      borderRadius: "20px",
                      backgroundImage: "var(--lightGradient), var(--gradientButton)",
                      backgroundOrigin: "border-box",
                      backgroundClip: "padding-box, border-box",
                      fontWeight: "bold",
                      textTransform: "none",
                      width: "150px",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundImage =
                        "var(--lightGradient), var(--gradientButtonHover)")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundImage =
                        "var(--lightGradient), var(--gradientButton)")
                    }
                  >
                    Remove photo
                  </Button>
                )}
              </div>
            </div>

            {/* Additional Fields */}
            <div className="inputFieldThree top">
              <EditableInputThree
                labels={["First name", "Last name", "Username"]}
                values={[firstName, lastName, username]}
                origValues={[userDoc.firstName, userDoc.lastName, userDoc.username]}
                onChange={handleThreeInputsChange}
                onSave={handleSaveThreeInputs}
                errors={userDetailsErr}
                initErrors={initUserDetailsErr}
                setErrors={setUserDetailsErr}
              />
            </div>
            <div className="inputField oneLine">
              <EditableInput
                label="Email address"
                value={email}
                onChange={(value) => setEmail(value)}
                onSave={(value) => handleSave("email", value)}
                onReset={handleReset}
                errors={emailErr}
                initErrors={initEmailErr}
                setErrors={setEmailErr}
                isEditable={connectedAccount == null ? true : false}
              />
            </div>
            <div className="inputFieldThree password">
              <label className="inputLabel">Password</label>
              <EditablePassInput
                labels={["Old password", "New password", "Confirm new password", "Password"]}
                values={[oldPassword, newPassword, confirmNewPassword]}
                onChange={handlePasswordChange}
                onSave={handlePasswordSave}
                errors={passErr}
                initErrors={initPassErr}
                setErrors={setPassErr}
                isEditable={connectedAccount == null ? true : false}
              />
            </div>
            <div className="inputField">
              <LongToggleInput
                label="Linked account"
                value={connectedAccount}
                onToggle={openlinkAccountModal}
                isConnectedAccount={true}
              />
            </div>
            <div className="inputField">
              <LongToggleInput
                label="Theme"
                value={theme}
                onToggle={handleThemeToggle}
                isConnectedAccount={false}
              />
            </div>
          </Box>
        )}

        {/* Notification Tab Content */}
        {selectedTab === "Notification" && (
          <Box mt={4} className="notification-settings">
            <Notifications onCancel={handleSwitchToAccountTab} />
          </Box>
        )}
      </div>{" "}
      {isLinkAccountModalOpen && (
        <Dialog
          open={isLinkAccountModalOpen}
          onClose={() => setIsLinkAccountModalOpen(false)}
          sx={dialogStyles}
        >
          <DialogTitle sx={dialogTitleStyles}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1.15rem",
                flexGrow: 1,
                maxWidth: "80%",
                whiteSpace: "normal",
              }}
            >
              Link account
            </Typography>
            <IconButton
              onClick={() => setIsLinkAccountModalOpen(false)}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{ ...dialogContentStyles, alignItems: "center", marginBottom: "20px" }}
          >
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={() => handleLinkAccount("google")}
              sx={{
                marginBottom: "10px",
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: "bold",
                width: "250px",
                display: "flex",
                opacity: isGoogleBtnDisabled ? "0.5" : "1",
                cursor: isGoogleBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  background: !isGoogleBtnDisabled && "var(--color-white-hover)",
                },
                color: "var(--color-black)",
                background: "var(--always-white)",
                "&.Mui-disabled": {
                  opacity: 0.5,
                  color: "var(--color-black)",
                  background: "var(--always-white)",
                },
                "@media (max-width: 385px)": {
                  width: "215px",
                },
              }}
              disabled={isGoogleBtnDisabled}
            >
              Connect with Google
            </Button>
            <Button
              variant="contained"
              startIcon={<FacebookIconWhite />}
              onClick={() => handleLinkAccount("facebook")}
              sx={{
                marginBottom: "10px",
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: "bold",
                width: "250px",
                display: "flex",
                opacity: isFacebookBtnDisabled ? "0.5" : "1",
                cursor: isFacebookBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  background: !isFacebookBtnDisabled && "var(--color-blue-hover)",
                },
                color: "var(--always-white)",
                background: "var(--color-blue)",
                "&.Mui-disabled": {
                  opacity: 0.5,
                  color: "var(--always-white)",
                  background: "var(--color-blue)",
                },
                "@media (max-width: 385px)": {
                  width: "215px",
                },
              }}
              disabled={isFacebookBtnDisabled}
            >
              <div style={{ marginTop: "2px" }}>Connect with Facebook</div>
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setIsLinkAccountModalOpen(false)}
              sx={{
                ...outlinedButtonStyles,
                width: "250px",
                padding: "4px 16px",
                marginTop: "3px !important",
                "@media (max-width: 385px)": {
                  width: "215px",
                },
              }}
              onMouseOver={(e) =>
                (e.target.style.backgroundImage =
                  "var(--lightGradient), var(--gradientButtonHover)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
              }
            >
              Cancel
            </Button>
          </DialogContent>
        </Dialog>
      )}
      {isUnlinkAccountModalOpen && (
        <Dialog
          open={isUnlinkAccountModalOpen}
          onClose={handleUnlinkAccountModalClose}
          sx={dialogStyles}
        >
          <DialogTitle sx={dialogTitleStyles}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1.15rem",
                flexGrow: 1,
                maxWidth: "80%",
                whiteSpace: "normal",
              }}
            >
              Unlink connected account
            </Typography>
            <IconButton
              onClick={handleUnlinkAccountModalClose}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={dialogContentStyles}>
            <Typography variant="body1" sx={{ textAlign: "center", marginBottom: "15px" }}>
              Enter your new password to unlink your account.
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "10px" }}>
              Password
            </Typography>
            <p style={{ color: "gray", fontSize: "12px", margin: 0 }}>
              At least 6 characters long, with 1 special character
            </p>
            <TextField
              placeholder="Password"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={unlinkPassword}
              onChange={handleUnlinkPasswordChange}
              error={
                !!unlinkErr.find((e) => e.field === "password")?.hasError ||
                (!passwordValidation.valid && unlinkPassword.length > 0)
              }
              helperText={
                unlinkErr.find((e) => e.field === "password")?.errMessage ||
                (unlinkPassword.length >= 50
                  ? "Character limit reached!"
                  : unlinkPassword.length > 0
                  ? passwordValidation.message
                  : "")
              }
              FormHelperTextProps={{
                style: {
                  color:
                    unlinkPassword.length > 0
                      ? passwordValidation.color
                      : "var(--color-quaternary)",
                },
              }}
              variant="outlined"
              fullWidth
              sx={{
                ...textFieldStyles,
                marginBottom: "15px",
                "& .MuiOutlinedInput-root": {
                  ...textFieldStyles["& .MuiOutlinedInput-root"],
                  padding: "15px",
                },
              }}
              InputProps={{
                style: { color: "var(--color-white)" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      sx={{
                        color: "var(--color-grey)",
                        marginRight: "-9px",
                      }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body1" sx={{ marginBottom: "10px" }}>
              Confirm password
            </Typography>
            <TextField
              placeholder="Confirm password"
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={unlinkConfirmPassword}
              onChange={handleUnlinkConfirmPasswordChange}
              error={
                !!unlinkErr.find((e) => e.field === "confirmPassword")?.hasError ||
                (passwordMatch === false && unlinkConfirmPassword.length > 0)
              }
              helperText={
                unlinkErr.find((e) => e.field === "confirmPassword")?.errMessage ||
                (unlinkConfirmPassword.length >= 50
                  ? "Character limit reached!"
                  : unlinkConfirmPassword.length > 0
                  ? passwordMatch === false
                    ? "Passwords do not match"
                    : passwordMatch === true
                    ? "Passwords match"
                    : ""
                  : "")
              }
              FormHelperTextProps={{
                style: {
                  color:
                    unlinkConfirmPassword.length > 0
                      ? passwordMatch === false
                        ? "var(--color-quaternary)"
                        : "var(--brightGreen)"
                      : "var(--color-quaternary)",
                },
              }}
              variant="outlined"
              fullWidth
              sx={{
                ...textFieldStyles,
                marginBottom: "15px",
                "& .MuiOutlinedInput-root": {
                  ...textFieldStyles["& .MuiOutlinedInput-root"],
                  padding: "15px",
                },
              }}
              InputProps={{
                style: { color: "var(--color-white)" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      sx={{
                        color: "var(--color-grey)",
                        marginRight: "-9px",
                      }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions sx={dialogActionsStyles}>
            <Button
              fullWidth
              variant="contained"
              className="change-photo-btn"
              onClick={() => handleUnlink(true, connectedAccount === 0 ? "Google" : "Facebook")}
              sx={{
                ...gradientButtonStyles,
                opacity: isUnlinkBtnDisabled ? "0.5" : "1",
                cursor: isUnlinkBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isUnlinkBtnDisabled && "var(--gradientButtonHover)",
                },
              }}
              disabled={isUnlinkBtnDisabled}
            >
              Unlink {connectedAccount === 0 ? "Google" : "Facebook"} Account
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              className="save-photo-btn"
              onClick={handleUnlinkAccountModalClose}
              sx={outlinedButtonStyles}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {isChangeProfileModalOpen && (
        <Dialog
          open={isChangeProfileModalOpen}
          onClose={handleChangeProfileModalClose}
          sx={dialogStyles}
        >
          <DialogTitle sx={dialogTitleStyles}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1.15rem",
                flexGrow: 1,
                maxWidth: "80%",
                whiteSpace: "normal",
              }}
            >
              Change profile picture
            </Typography>
            <IconButton
              onClick={handleChangeProfileModalClose}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ ...dialogContentStyles, marginTop: 0, alignItems: "center" }}>
            <Box
              sx={{
                width: 155,
                height: 155,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--gradientButton)",
                borderRadius: "50%",
                padding: "5px",
                margin: "30px",
              }}
            >
              <Avatar
                alt=""
                src={profilePicPreview || ""}
                sx={{
                  width: 156,
                  height: 156,
                  fontSize: "4rem",
                  boxShadow: "0 0 0 5px var(--gradientButton)",
                  ...stringAvatarColor(userDoc?.username),
                }}
                children={stringAvatarInitials(userDoc?.username)}
              />
            </Box>
            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </DialogContent>
          <DialogActions
            sx={{
              ...dialogActionsStyles,
              paddingBottom: "5px",
              flexDirection: "column",
              width: "70%",
              margin: "auto",
              marginBottom: "20px",
            }}
          >
            <Button
              variant="contained"
              className="change-photo-btn"
              onClick={handleUploadPhotoClick}
              sx={{ ...gradientButtonStyles, width: "100%" }}
            >
              {profilePic ? "Change photo" : "Upload photo"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              className="save-photo-btn"
              onClick={handleSavePhoto}
              sx={{
                ...outlinedButtonStyles,
                width: "100%",
                opacity: isSavePhotoBtnDisabled ? "0.5" : "1",
                cursor: isSavePhotoBtnDisabled ? "default" : "pointer",
              }}
              onMouseOver={(e) =>
                (e.target.style.backgroundImage = !isSavePhotoBtnDisabled
                  ? "var(--lightGradient), var(--gradientButtonHover)"
                  : "var(--lightGradient), var(--gradientButton)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
              }
              disabled={isSavePhotoBtnDisabled}
            >
              Save photo
            </Button>
            <Link
              onClick={handleChangeProfileModalClose}
              variant="body2"
              sx={{
                color: "var(--brightFont)",
                fontWeight: "bold",
                textDecoration: "underline",
                "&:hover": {
                  color: "var(--brightFontHover)",
                  cursor: "pointer",
                  textDecoration: "underline",
                },
              }}
            >
              Cancel
            </Link>
          </DialogActions>
        </Dialog>
      )}
      {isRemoveProfileModalOpen && (
        <Dialog
          open={isRemoveProfileModalOpen}
          onClose={() => setIsRemoveProfileModalOpen(false)}
          sx={dialogStyles}
        >
          <DialogTitle sx={dialogTitleStyles}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1.15rem",
                flexGrow: 1,
                maxWidth: "80%",
                whiteSpace: "normal",
              }}
            >
              Remove profile picture
            </Typography>
            <IconButton
              onClick={() => setIsRemoveProfileModalOpen(false)}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={dialogContentStyles}>
            <Typography variant="body1" sx={{ color: "var(--color-white)", textAlign: "center" }}>
              Are you sure you want to remove your profile picture?
            </Typography>
          </DialogContent>
          <DialogActions sx={dialogActionsStyles}>
            <Button
              fullWidth
              variant="contained"
              className="change-photo-btn"
              onClick={handleRemovePhoto}
              sx={{
                ...gradientButtonStyles,
                opacity: isRemoveProfileBtnDisabled ? "0.5" : "1",
                cursor: isRemoveProfileBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isRemoveProfileBtnDisabled && "var(--gradientButtonHover)",
                },
              }}
              disabled={isRemoveProfileBtnDisabled}
            >
              Yes
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              className="save-photo-btn"
              onClick={() => setIsRemoveProfileModalOpen(false)}
              sx={outlinedButtonStyles}
              onMouseOver={(e) =>
                (e.target.style.backgroundImage =
                  "var(--lightGradient), var(--gradientButtonHover)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
              }
            >
              No
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default Settings;
