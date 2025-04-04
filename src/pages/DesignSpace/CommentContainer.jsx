import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  IconButton,
  Button,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  styled,
} from "@mui/material";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import {
  MoreVert as MoreVertIcon,
  UnfoldMoreRounded as UnfoldMoreRoundedIcon,
  UnfoldLessRounded as UnfoldLessRoundedIcon,
  ReplyRounded as ReplyRoundedIcon,
  CloseRounded as CloseRoundedIcon,
  SettingsBackupRestoreRounded as ReopenIcon,
} from "@mui/icons-material";
import { showToast, stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { iconButtonStyles, iconButtonStylesBrighter } from "../Homepage/DrawerComponent.jsx";
import { formatDateDetail, getUser } from "../Homepage/backend/HomepageActions.jsx";
import {
  addComment,
  editComment,
  changeCommentStatus,
  deleteComment,
  addReply,
  editReply,
  deleteReply,
} from "./backend/DesignActions.jsx";
import {
  CancelIconSmallGradient,
  DeleteIcon,
  EditIcon,
} from "../../components/svg/DefaultMenuIcons.jsx";
import { textFieldStyles, textFieldInputProps } from "./DesignSettings.jsx";
import { SaveIconSmallGradient, SendIconSmallGradient } from "./svg/AddImage.jsx";
import { CheckIconSmallGradient, MentionIconSmallGradient } from "./svg/AddColor.jsx";
import {
  dialogActionsStyles,
  dialogContentStyles,
  dialogStyles,
  dialogTitleStyles,
} from "../../components/RenameModal.jsx";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar.jsx";
import { set } from "lodash";

export const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
  "&:hover": {
    backgroundColor: "var(--iconBg2)",
  },
  "&:focus": {
    backgroundColor: "var(--iconBg2)",
  },
});

const CommentContainer = ({
  comment,
  commentId,
  design,
  optionsState,
  setOptionsState = () => {},
  selectedId = "",
  setSelectedId = () => {},
  activeComment,
  setActiveComment = () => {},
  isReply = false,
  isReplyToReply = false,
  replyTo,
  setReplyTo,
  rootComment = null,
  isOwnerEditorCommenter,
  changeMode,
}) => {
  const { designId } = useParams();
  const { user, users, userDoc, notificationUpdate } = useSharedProps();

  // Root comment states for display
  const [commenterUserId, setCommenterUserId] = useState("");
  const [username, setUsername] = useState("");
  const [date, setDate] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [mentions, setMentions] = useState([]);
  const [status, setStatus] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [replyCount, setReplyCount] = useState(0);
  const [replyLatestDate, setReplyLatestDate] = useState("");
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);

  // General mention select
  const [openMentionOptions, setOpenMentionOptions] = useState(false);
  const [mentionOptions, setMentionOptions] = useState([]);
  const [originalMentionOptions, setOriginalMentionOptions] = useState([]);
  const [mentionOptionClicked, setMentionOptionClicked] = useState(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(-1);
  const [selectedReplyMentionIndex, setSelectedReplyMentionIndex] = useState(-1);
  const mentionOptionsRef = useRef(null);
  const mentionOptionsReplyRef = useRef(null);

  // Editing comment/reply states
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [updatedCommentContent, setUpdatedCommentContent] = useState("");
  const [updatedMentions, setUpdatedMentions] = useState([]);
  const [isSaveBtnDisabled, setIsSaveBtnDisabled] = useState(false);

  // Add Reply states
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyMentions, setReplyMentions] = useState([]);
  const [rootCommentRoot, setRootCommentRoot] = useState(null);
  const [isSendBtnDisabled, setIsSendBtnDisabled] = useState(false);

  // errors.addComment for adding comment
  // errors.editComment for editing comment
  // errors.addReply for replying comment
  // errors.editReply for editing reply to a comment
  const [errors, setErrors] = useState({});
  const [isDeleteBtnDisabled, setIsDeleteBtnDisabled] = useState(false);
  const [isCheckBtnDisabled, setIsCheckBtnDisabled] = useState(false);

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const dropdownRef = useRef(null);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const textFieldRef = useRef(null);
  const textFieldInputRef = useRef(null);
  const [isSingleLineReply, setIsSingleLineReply] = useState(true);
  const textFieldReplyRef = useRef(null);
  const textFieldReplyInputRef = useRef(null);

  // Check the height of the textarea to determine if it's a single line
  useEffect(() => {
    if (textFieldRef.current) {
      const lineHeight = 83;
      const contentHeight = textFieldRef.current.scrollHeight;
      setIsSingleLine(contentHeight <= lineHeight);
      console.log("contentHeight", contentHeight);
      console.log("<=lineHeight", lineHeight);
    }
    if (textFieldReplyRef.current) {
      const lineHeight = 83;
      const contentHeight = textFieldReplyRef.current.scrollHeight;
      setIsSingleLineReply(contentHeight <= lineHeight);
    }
  }, [updatedCommentContent, replyContent]);

  const getUserData = async () => {
    const userDoc = users.find((user) => user.id === comment.userId);
    if (userDoc) {
      setUsername(userDoc.username);
      setProfilePic(userDoc.profilePic);
    } else console.error("User not found for comment");
  };

  useEffect(() => {
    if (!comment) return;
    getUserData();
    setCommenterUserId(comment.userId);
    setCommentContent(comment.message);
    setUpdatedCommentContent(comment.message);
    setMentions(comment.mentions);
    setStatus(!isReply ? comment.status : rootComment.status);
    setUpdatedMentions(comment.mentions);
    setDate(formatDateDetail(comment.createdAt));
    setReplyCount(comment.replies?.length || 0);
    if (!isReply) setRootCommentRoot(comment);
    else setRootCommentRoot(rootComment);

    // Calculate latest reply date
    if (comment.replies?.length > 0) {
      if (isReply && rootComment) {
        // For replies, find referenced replies from root comment
        const referencedReplies = comment.replies
          .map((replyId) =>
            rootComment.replies.find((r) =>
              typeof replyId === "string" ? r.replyId === replyId : r.replyId === replyId.replyId
            )
          )
          .filter(Boolean);

        console.log("referencedReplies isReply && rootComment", referencedReplies);
        if (referencedReplies.length > 0) {
          const latestDate = referencedReplies.reduce((latest, reply) => {
            const replyTime = reply.createdAt.seconds * 1000 + reply.createdAt.nanoseconds / 1e6;
            const latestTime = latest.seconds * 1000 + latest.nanoseconds / 1e6;
            return replyTime > latestTime ? reply.createdAt : latest;
          }, referencedReplies[0].createdAt);
          setReplyLatestDate(formatDateDetail(latestDate));
        }
      } else {
        // For root comments, only consider direct replies
        const directReplies = comment.replies.filter(
          (reply) => !comment.replies.some((r) => r.replies?.includes(reply.replyId))
        );

        console.log("directReplies", directReplies);
        if (directReplies.length > 0) {
          const latestDate = directReplies.reduce((latest, reply) => {
            const replyTime = reply.createdAt.seconds * 1000 + reply.createdAt.nanoseconds / 1e6;
            const latestTime = latest.seconds * 1000 + latest.nanoseconds / 1e6;
            return replyTime > latestTime ? reply.createdAt : latest;
          }, directReplies[0].createdAt);
          setReplyLatestDate(formatDateDetail(latestDate));
        }
      }
    } else {
      setReplyLatestDate("");
    }
  }, [comment, rootComment]);

  const getUserRole = (userId, design) => {
    // console.log(`userId: ${userId}`);
    // console.log("design", design);
    if (!userId || !design) return "";
    if (userId === design.owner) return "Owner";
    if (design.editors?.includes(userId)) return "Editor";
    if (design.commenters?.includes(userId)) return "Commenter";
    return "";
  };

  const openCollaboratorsSelect = (commentContent, setCommentContent) => {
    // Check if content is empty or last character is not @
    if (!commentContent.endsWith("@")) {
      // If last character is not a space, add a space before @
      const needsSpace = commentContent.length > 0 && !commentContent.endsWith(" ");
      setCommentContent((prev) => `${prev}${needsSpace ? " " : ""}@`);
    }
    setOpenMentionOptions(true);
  };

  useEffect(() => {
    if (!openMentionOptions) {
      setSelectedMentionIndex(-1);
      setSelectedReplyMentionIndex(-1);
    }
  }, [openMentionOptions]);

  useEffect(() => {
    const handleMentionOptionClick = (content, setContent, mentions, setMentions, user, ref) => {
      if (!ref?.current) {
        console.error("TextField ref not found");
        return;
      }

      let cursorPosition = ref.current.selectionStart;
      if (!cursorPosition) cursorPosition = content.length;

      let textBeforeCursor = content.substring(0, cursorPosition);
      const textAfterCursor = content.substring(cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        // Find the incomplete username portion (from @ to next space or cursor)
        const textFromAt = textBeforeCursor.substring(lastAtIndex);
        const nextSpaceIndex = textFromAt.indexOf(" ");
        const incompleteUsername =
          nextSpaceIndex !== -1 ? textFromAt.substring(0, nextSpaceIndex) : textFromAt;

        // Find where the incomplete username ends in the full text
        const beforeMention = content.substring(0, lastAtIndex);
        const afterMention = content.substring(lastAtIndex + incompleteUsername.length);

        // Check if space is needed before mention
        const needsSpaceBefore =
          lastAtIndex > 0 && beforeMention.charAt(beforeMention.length - 1) !== " ";
        const spaceBefore = needsSpaceBefore ? " " : "";

        // Check if space is needed after mention
        const needsSpaceAfter = afterMention.charAt(0) !== " ";
        const spaceAfter = needsSpaceAfter ? " " : "";

        const newContent = `${beforeMention}${spaceBefore}@${user.username}${spaceAfter}${afterMention}`;
        setContent(newContent);

        if (!mentions.includes(user.id)) {
          setMentions([...mentions, user.id]);
        }
      }
      setOpenMentionOptions(false);
      setMentionOptionClicked(null);
    };

    let content, setContent, mentions, setMentions, user, ref;
    console.log("inside useeffect");
    if (!mentionOptionClicked) return;
    else user = mentionOptionClicked;
    console.log("textFieldReplyInputRef.current", textFieldReplyInputRef.current);
    console.log("isAddingReply", isAddingReply);
    if (textFieldInputRef.current && isEditingComment) {
      content = updatedCommentContent;
      setContent = setUpdatedCommentContent;
      mentions = updatedMentions;
      setMentions = setUpdatedMentions;
      ref = textFieldInputRef;
      handleMentionOptionClick(content, setContent, mentions, setMentions, user, ref);
    } else if (textFieldReplyInputRef.current && isAddingReply) {
      content = replyContent;
      setContent = setReplyContent;
      mentions = replyMentions;
      setMentions = setReplyMentions;
      ref = textFieldReplyInputRef;
      handleMentionOptionClick(content, setContent, mentions, setMentions, user, ref);
    }
  }, [mentionOptionClicked]);

  useEffect(() => {
    console.log("clicked test");
  }, [mentionOptionClicked]);

  useEffect(() => {
    console.log(
      `commentCont - isReply: ${isReply}, status: ${status}, isOwnerEditorCommenter: ${isOwnerEditorCommenter}, commenterUserId: ${commenterUserId}, userDoc.id: ${userDoc.id}, changeMode: ${changeMode}`
    );
    console.log(
      `commentCont - (Reply Btn)1 isReply && !status && isOwnerEditorCommenter: ${
        isReply && !status && isOwnerEditorCommenter
      }`
    );
    console.log(
      `commentCont - (Reply Btn)2 isReply && !status && isOwnerEditorCommenter && (changeMode === "Commenting" || changeMode === "Editing"): ${
        isReply &&
        !status &&
        isOwnerEditorCommenter &&
        (changeMode === "Commenting" || changeMode === "Editing")
      }`
    );
    console.log(
      `commentCont - (More Vert Btn)1 (commenterUserId === userDoc.id || (!isReply && status)) && isOwnerEditorCommenter: ${
        (commenterUserId === userDoc.id || (!isReply && status)) && isOwnerEditorCommenter
      }`
    );
    console.log(
      `commentCont - (More Vert Btn)2 (commenterUserId === userDoc.id || (!isReply && status)) && isOwnerEditorCommenter && (changeMode === "Commenting" || changeMode === "Editing"): ${
        (commenterUserId === userDoc.id || (!isReply && status)) &&
        isOwnerEditorCommenter &&
        (changeMode === "Commenting" || changeMode === "Editing")
      }`
    );
  }, [changeMode, commenterUserId, isOwnerEditorCommenter, isReply, status, userDoc.id]);

  // Get user details from collaborators list
  const getUserDetails = (username) => {
    if (!username || !users) return {};
    const user = users.find((u) => u.username === username);
    if (!user) return {};

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePic: user.profilePic,
      role: getUserRole(user.id, design),
    };
  };

  const calculateMatchScore = (user, searchText) => {
    const search = searchText.toLowerCase();
    const username = user.username.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();
    const fullName = `${firstName} ${lastName}`.toLowerCase();

    // Exact matches get highest priority
    if (username === search) return 100;
    if (fullName === search) return 95;
    if (firstName === search) return 90;
    if (lastName === search) return 85;

    // Starts with gets second priority
    if (username.startsWith(search)) return 80;
    if (fullName.startsWith(search)) return 75;
    if (firstName.startsWith(search)) return 70;
    if (lastName.startsWith(search)) return 65;

    // Contains gets lowest priority
    if (username?.includes(search)) return 60;
    if (fullName?.includes(search)) return 55;
    if (firstName?.includes(search)) return 50;
    if (lastName?.includes(search)) return 45;
    return 0;
  };

  useEffect(() => {
    if (design && users) {
      const filterAndSortUsers = () => {
        // First, filter users based on access settings
        let filteredUsers =
          design.designSettings.generalAccessSetting === 0
            ? users.filter(
                (user) =>
                  design.owner === user.id ||
                  design.editors?.includes(user.id) ||
                  design.commenters?.includes(user.id)
              )
            : users;

        // Map and add role and index information
        const usersWithRoleAndIndex = filteredUsers.map((user) => ({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePic: user.profilePic,
          role: getUserRole(user.id, design),
          index:
            user.id === design.owner
              ? 0
              : design.editors.indexOf(user.id) !== -1
              ? design.editors.indexOf(user.id)
              : design.commenters.indexOf(user.id),
        }));

        // Sort by role priority and index
        return usersWithRoleAndIndex.sort((a, b) => {
          const roleOrder = { Owner: 0, Editor: 1, Commenter: 2 };
          if (roleOrder[a.role] !== roleOrder[b.role]) {
            return roleOrder[a.role] - roleOrder[b.role];
          }
          return a.index - b.index;
        });
      };

      const sortedUsers = filterAndSortUsers();
      setMentionOptions(sortedUsers);
      setOriginalMentionOptions(sortedUsers); // Store original sorted list for reference
    }
  }, [design, users]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOptionsState({
          showOptions: false,
          selectedId: null,
        });
      }
      if (
        (mentionOptionsRef.current && !mentionOptionsRef.current.contains(event.target)) ||
        (mentionOptionsReplyRef.current && !mentionOptionsReplyRef.current.contains(event.target))
      ) {
        setOpenMentionOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("updated comment:", updatedCommentContent);
  }, [updatedCommentContent]);

  useEffect(() => {
    console.log("updated mentions:", updatedMentions);
  }, [updatedMentions]);

  useEffect(() => {
    console.log("reply content:", replyContent);
  }, [replyContent]);

  useEffect(() => {
    console.log("reply mentions:", replyMentions);
  }, [replyMentions]);

  useEffect(() => {
    console.log("optionsState:", optionsState);
  }, [optionsState]);

  const toggleOptions = (id) => {
    setOptionsState((prev) => {
      if (prev.selectedId === id) {
        // If clicking same comment, just close the menu
        return { showOptions: false, selectedId: null };
      } else {
        // If clicking different comment, open menu for new comment
        return { showOptions: true, selectedId: id };
      }
    });
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsRepliesExpanded((prev) => !prev);
  };

  const setEditingState = () => {
    setIsEditingComment(true);
    if (!isReply) toggleOptions(commentId);
    else toggleOptions(comment.replyId);
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    if (!isReply) toggleOptions(commentId);
    else toggleOptions(comment.replyId);
  };

  const handleCancelEditComment = () => {
    setUpdatedCommentContent(commentContent);
    setUpdatedMentions(mentions);
    setIsEditingComment(false);
    setOpenMentionOptions(false);
    if (!isReply) clearFieldError("editComment");
    else clearFieldError("editReply");
  };

  useEffect(() => {
    if (!isEditingComment) return;
    if (textFieldInputRef?.current && document.activeElement !== textFieldInputRef.current)
      textFieldInputRef?.current?.focus();
    setIsAddingReply(false);
  }, [isEditingComment]);

  useEffect(() => {
    if (!isAddingReply) return;
    if (textFieldReplyInputRef?.current) textFieldReplyInputRef?.current?.focus();
    handleCancelEditComment();
  }, [isAddingReply]);

  // Remove only the specified field error
  const clearFieldError = (field) => {
    setErrors((prevErrors) => {
      if (prevErrors && prevErrors[field]) {
        const { [field]: _, ...remainingErrors } = prevErrors;
        return remainingErrors;
      }
      return prevErrors;
    });
  };

  const validateMentions = (mentions) => {
    let nonExistentUsers = [];
    if (mentions.length > 0) {
      mentions.forEach((mention) => {
        const user = users.find((user) => user.id === mention);
        if (!user) nonExistentUsers.push(mention);
      });
    }
    return nonExistentUsers;
  };

  // Comment database functions
  const handleChangeCommentStatus = async () => {
    setIsCheckBtnDisabled(true);
    try {
      // Call changeCommentStatus
      const result = await changeCommentStatus(designId, commentId, !status, user, userDoc);
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      showToast("success", result.message);
    } finally {
      setIsCheckBtnDisabled(false);
    }
  };

  const handleEditComment = async () => {
    // Validation
    const nonExistentUsers = validateMentions(updatedMentions);
    if (nonExistentUsers.length > 0) {
      setErrors((prev) => ({
        ...prev,
        editComment: `${nonExistentUsers.length} mentioned user${
          nonExistentUsers.length > 0 && "s"
        } not found`,
      }));
      return;
    } else if (!updatedCommentContent && updatedMentions.length === 0) {
      setErrors((prev) => ({ ...prev, editComment: "Commment is required" }));
      return;
    } else if (updatedCommentContent === commentContent) {
      setErrors((prev) => ({ ...prev, editComment: "Commment is same as currrent comment" }));
      return;
    }

    setIsSaveBtnDisabled(true);
    try {
      // Call editComment
      const result = await editComment(
        designId,
        commentId,
        updatedCommentContent,
        updatedMentions,
        user,
        userDoc
      );
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      setIsEditingComment(false);
      showToast("success", result.message);
    } finally {
      setIsSaveBtnDisabled(false);
    }
  };

  const handleDeleteComment = async () => {
    setIsDeleteBtnDisabled(true);
    try {
      // Call deleteComment
      const result = await deleteComment(
        designId,
        commentId, // parent commentId
        user,
        userDoc
      );
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      setIsDeleteModalOpen(false);
      showToast("success", result.message);
    } finally {
      setIsDeleteBtnDisabled(false);
    }
  };

  // Reply database functions
  const handleAddReply = async () => {
    // Validation
    const nonExistentUsers = validateMentions(replyMentions);
    if (nonExistentUsers.length > 0) {
      setErrors((prev) => ({
        ...prev,
        editReply: `${nonExistentUsers.length} mentioned user${
          nonExistentUsers.length > 0 && "s"
        } not found`,
      }));
      return;
    } else if (!replyContent && replyMentions.length === 0) {
      setErrors((prev) => ({ ...prev, addReply: "Reply is required" }));
      return;
    }

    setIsSendBtnDisabled(true);
    try {
      // Call addReply
      const result = await addReply(
        designId,
        commentId, // parent commentId
        replyContent,
        replyMentions,
        replyTo,
        user,
        userDoc
      );
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      setIsAddingReply(false);
      setReplyContent("");
      setReplyMentions([]);
      setReplyTo(null);
      showToast("success", result.message);
    } finally {
      setIsSendBtnDisabled(false);
    }
  };

  const handleEditReply = async () => {
    // Validation
    const nonExistentUsers = validateMentions(updatedMentions);
    if (nonExistentUsers.length > 0) {
      setErrors((prev) => ({
        ...prev,
        editReply: `${nonExistentUsers.length} mentioned user${
          nonExistentUsers.length > 0 && "s"
        } not found`,
      }));
      return;
    } else if (!updatedCommentContent && updatedMentions.length === 0) {
      setErrors((prev) => ({ ...prev, editReply: "Reply is required" }));
      return;
    } else if (updatedCommentContent === commentContent) {
      setErrors((prev) => ({ ...prev, editReply: "Reply is same as currrent comment" }));
      return;
    }

    setIsSaveBtnDisabled(true);
    try {
      // Call editReply
      const result = await editReply(
        designId,
        commentId, // parent commentId
        comment.replyId, // replyId
        updatedCommentContent,
        updatedMentions,
        user,
        userDoc
      );
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      setIsEditingComment(false);
      showToast("success", result.message);
    } finally {
      setIsSaveBtnDisabled(false);
    }
  };

  const handleDeleteReply = async () => {
    setIsDeleteBtnDisabled(true);
    try {
      // Call deleteReply
      const result = await deleteReply(
        designId,
        commentId, // parent commentId
        comment.replyId, // replyId
        user,
        userDoc
      );
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      setIsDeleteModalOpen(false);
      showToast("success", result.message);
    } finally {
      setIsDeleteBtnDisabled(false);
    }
  };

  // Notification highlight
  const highlightComment = (commentId, isReply = false) => {
    console.log("notif (comment cont) - highlighting comment:", {
      commentId,
      isReply,
      rootCommentRoot,
      comment,
    });

    if (isReply) {
      const parentComment = rootCommentRoot;
      console.log("notif (comment cont) - parent comment:", parentComment);

      if (parentComment) {
        // Find initial reply
        let currentReplyId = commentId;
        const replyChain = [];

        // Build chain using replyId instead of the full reply object
        const findReply = (replies, replyId) => replies.find((r) => r.replyId === replyId);
        let replyId = currentReplyId;

        console.log("notif (comment cont) - building reply chain for:", currentReplyId);

        while (replyId) {
          const reply = findReply(parentComment.replies, replyId);
          console.log("notif (comment cont) - found reply:", reply);
          if (!reply) break;
          replyChain.push(reply.replyId);
          replyId = reply.replyTo?.replyId || null;
        }

        console.log("notif (comment cont) - complete reply chain:", replyChain);

        // Expand the parent comment
        setIsRepliesExpanded(true);
        console.log("notif (comment cont) - expanded replies");

        // Wait for expansion before highlighting
        setTimeout(() => {
          // For replies, use replyId instead of just commentId
          const replyElement = document.getElementById(`reply-${commentId}`);
          console.log("notif (comment cont) - attempting to find reply element:", replyElement);

          if (replyElement) {
            replyElement.scrollIntoView({ behavior: "smooth" });
            replyElement.classList.add("highlight-animation");
            setTimeout(() => {
              replyElement.classList.remove("highlight-animation");
            }, 3000);
          } else {
            console.log("notif (comment cont) - reply element not found in DOM, retrying in 500ms");
            setTimeout(() => {
              const retryElement = document.getElementById(`reply-${commentId}`);
              console.log("notif (comment cont) - retry found reply element:", retryElement);
              if (retryElement) {
                retryElement.scrollIntoView({ behavior: "smooth" });
                retryElement.classList.add("highlight-animation");
                setTimeout(() => {
                  retryElement.classList.remove("highlight-animation");
                }, 3000);
              }
            }, 500);
          }
        }, 300);
      }
    } else {
      console.log("notif (comment cont) - highlighting root comment:", commentId);
      const commentElement = document.getElementById(`comment-${commentId}`);
      console.log("notif (comment cont) - found comment element:", commentElement);

      if (commentElement) {
        commentElement.scrollIntoView({ behavior: "smooth" });
        commentElement.classList.add("highlight-animation");
        setTimeout(() => {
          commentElement.classList.remove("highlight-animation");
        }, 3000);
      } else {
        console.log("notif (comment cont) - comment element not found in DOM, retrying in 500ms");
        setTimeout(() => {
          const retryElement = document.getElementById(`comment-${commentId}`);
          console.log("notif (comment cont) - retry found comment element:", retryElement);
          if (retryElement) {
            retryElement.scrollIntoView({ behavior: "smooth" });
            retryElement.classList.add("highlight-animation");
            setTimeout(() => {
              retryElement.classList.remove("highlight-animation");
            }, 3000);
          }
        }, 500);
      }
    }
  };

  useEffect(() => {
    const handleNotificationActions = async () => {
      console.log("notif (comment cont) - handleNotificationActions called - comment:", comment);
      if (!comment) return;

      const pendingActions = localStorage.getItem("pendingNotificationActions");
      console.log("notif (comment cont) - pendingActions from localStorage:", pendingActions);

      if (pendingActions) {
        try {
          const parsedActions = JSON.parse(pendingActions);
          console.log("notif (comment cont) - parsed pendingActions:", parsedActions);

          const { actions, references, timestamp, completed, type, title } = parsedActions;

          const uniqueCompleted = completed.reduce((acc, current) => {
            const x = acc.find((item) => item.index === current.index);
            if (!x) return acc.concat([current]);
            return acc;
          }, []);

          for (const [index, action] of actions.entries()) {
            console.log("notif (comment cont) - Processing action:", action, "at index:", index);

            const isAlreadyCompleted = uniqueCompleted.some((c) => c.index === index);
            if (isAlreadyCompleted) {
              console.log(`notif (comment cont) - Action at index ${index} already completed`);
              continue;
            }

            const previousActionsCompleted =
              uniqueCompleted.filter((c) => c.index < index).length === index;
            console.log(
              "notif (comment cont) - previousActionsCompleted:",
              previousActionsCompleted
            );

            if (action === "Highlight comment" && previousActionsCompleted) {
              const isReply = title?.toLowerCase().includes("reply");
              const commentId = isReply ? references?.replyId : references?.commentId;
              highlightComment(commentId, isReply);
              uniqueCompleted.push({ action, index, timestamp });
              localStorage.setItem(
                "pendingNotificationActions",
                JSON.stringify({
                  actions,
                  references,
                  timestamp,
                  completed: uniqueCompleted,
                  type,
                  title,
                })
              );
            }

            if (index === actions.length - 1 && uniqueCompleted.length === actions.length) {
              console.log(
                "notif (comment cont) - Removing pendingNotificationActions from localStorage"
              );
              localStorage.removeItem("pendingNotificationActions");
            }
          }
        } catch (error) {
          console.error("Error processing notification actions:", error);
        }
      }
    };

    handleNotificationActions();
  }, [comment, commentId, notificationUpdate]);

  return (
    <>
      <div
        className={`comment-container 
          ${activeComment === commentId ? "active" : ""}
          ${isReply ? "reply" : ""}
          ${isReplyToReply ? "reply-to-reply" : ""}`}
        id={isReply ? `reply-${comment.replyId}` : `comment-${commentId}`}
        onClick={() => setActiveComment(commentId)}
      >
        <div className="profile-section">
          <div className="profile-info">
            <Box
              sx={{
                width: 39,
                height: 39,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--gradientButton)",
                borderRadius: "50%",
                padding: "3px",
                marginRight: "10px",
                cursor: "auto",
              }}
            >
              <Avatar
                src={profilePic ? profilePic : ""}
                sx={{
                  height: 39,
                  width: 39,
                  borderRadius: "50%",
                  boxShadow: "0 0 0 3px var(--gradientButton)",
                  "& .MuiAvatar-img": {
                    borderRadius: "50%",
                  },
                  ...stringAvatarColor(username),
                }}
                children={stringAvatarInitials(username)}
              />
            </Box>
            <div className="user-details">
              <span className="username" onClick={(e) => e.stopPropagation()}>
                {username}
              </span>
              <span
                style={{ fontSize: "0.7rem" }}
                className="date"
                onClick={(e) => e.stopPropagation()}
              >
                {date}
              </span>
            </div>
          </div>
          <div className="profile-status">
            {!isReply &&
              !status &&
              isOwnerEditorCommenter &&
              (changeMode === "Commenting" || changeMode === "Editing") && (
                <IconButton
                  sx={{
                    ...iconButtonStylesBrighter,
                    padding: "8px",
                    marginRight: "-1px",
                    width: "38px",
                    opacity: isCheckBtnDisabled ? "0.5 !important" : "1 !important",
                    cursor: isCheckBtnDisabled ? "default !important" : "pointer !important",
                  }}
                  disabled={isCheckBtnDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatus((prev) => !prev);
                    handleChangeCommentStatus();
                  }}
                >
                  <CheckIconSmallGradient />
                </IconButton>
              )}
            {isReply &&
              !status &&
              isOwnerEditorCommenter &&
              (changeMode === "Commenting" || changeMode === "Editing") && (
                <IconButton
                  sx={{
                    ...iconButtonStylesBrighter,
                    padding: "3.5px",
                    marginRight: "-1px",
                    width: "38px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyTo({ username, date, replyId: comment.replyId, commentId });
                    if (textFieldReplyRef.current) textFieldReplyRef.current.focus();
                  }}
                >
                  <ReplyRoundedIcon sx={{ fontSize: "1.9rem", color: "var(--color-white)" }} />
                </IconButton>
              )}
            {((!isReply && comment.replies?.length > 0) ||
              (isReply && comment.replies?.length > 0)) && (
              <IconButton
                sx={{
                  ...iconButtonStylesBrighter,
                  padding: 0,
                  height: "38px",
                  width: "38px",
                  marginRight: commenterUserId === userDoc.id ? "-8px" : "0px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandClick(e);
                }}
              >
                {!isRepliesExpanded ? (
                  <UnfoldMoreRoundedIcon
                    sx={{
                      fontSize: "1.9rem",
                      color: "var(--color-white)",
                      transform: "scale(0.9)",
                    }}
                  />
                ) : (
                  <UnfoldLessRoundedIcon
                    sx={{
                      fontSize: "1.9rem",
                      color: "var(--color-white)",
                      transform: "scale(0.9)",
                    }}
                  />
                )}
              </IconButton>
            )}
            {(commenterUserId === userDoc.id || (!isReply && status)) &&
              isOwnerEditorCommenter &&
              (changeMode === "Commenting" || changeMode === "Editing") && (
                <div>
                  <IconButton
                    sx={{ ...iconButtonStylesBrighter, padding: 0, height: "38px", width: "38px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOptions(isReply ? comment.replyId : commentId);
                    }}
                  >
                    <MoreVertIcon
                      sx={{
                        fontSize: "1.9rem",
                        color: "var(--color-white)",
                        transform: "scale(0.9)",
                      }}
                    />
                  </IconButton>
                  {optionsState.showOptions &&
                    optionsState.selectedId === (isReply ? comment.replyId : commentId) && (
                      <div
                        ref={dropdownRef}
                        className="dropdown-menu comment"
                        style={{
                          position: "absolute",
                          top: "0",
                          marginTop: "10px",
                        }}
                      >
                        {commenterUserId === userDoc.id && (
                          <>
                            {/* Can edit only open comments */}
                            {!status && (
                              <CustomMenuItem
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingState();
                                }}
                              >
                                <ListItemIcon>
                                  <EditIcon className="icon" />
                                </ListItemIcon>
                                <ListItemText primary="Edit" sx={{ color: "var(--color-white)" }} />
                              </CustomMenuItem>
                            )}
                            <CustomMenuItem
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal();
                              }}
                            >
                              <ListItemIcon>
                                <DeleteIcon className="icon" />
                              </ListItemIcon>
                              <ListItemText primary="Delete" sx={{ color: "var(--color-white)" }} />
                            </CustomMenuItem>
                          </>
                        )}
                        {/* false for open, true for resolved */}
                        {!isReply && status && (
                          <CustomMenuItem
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatus((prev) => !prev);
                              handleChangeCommentStatus();
                            }}
                          >
                            <ListItemIcon>
                              <ReopenIcon className="icon" sx={{ color: "var(--color-white)" }} />
                            </ListItemIcon>
                            <ListItemText primary="Reopen" sx={{ color: "var(--color-white)" }} />
                          </CustomMenuItem>
                        )}
                      </div>
                    )}
                </div>
              )}
          </div>
        </div>
        <div
          style={{
            cursor: "auto",
            textAlign: "justify",
            textJustify: "inter-word",
            margin: "16px 0px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {!isEditingComment ? (
            <div>
              {commentContent.split(/(@\w+\s|@\w+$)/).map((part, index) => {
                if (part.match(/^@\w+(\s|$)/)) {
                  const username = part.trim().substring(1);
                  const userId = users.find((opt) => opt.username === username)?.id;
                  const isValidMention = mentions?.includes(userId);

                  return isValidMention ? (
                    <CustomTooltip
                      key={index}
                      title={<UserInfoTooltip username={username} {...getUserDetails(username)} />}
                      arrow
                    >
                      <span
                        style={{
                          color: "var(--brightFont)",
                          fontWeight: "bold",
                          "&:hover": {
                            color: "var(--brightFontHover)",
                          },
                        }}
                      >
                        {part}
                      </span>
                    </CustomTooltip>
                  ) : (
                    <span key={index}>{part}</span>
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </div>
          ) : (
            isOwnerEditorCommenter &&
            (changeMode === "Commenting" || changeMode === "Editing") && (
              <>
                <TextField
                  label=""
                  type="text"
                  multiline
                  ref={textFieldRef}
                  inputRef={textFieldInputRef}
                  placeholder="Comment or mention someone"
                  value={updatedCommentContent}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const cursorPosition = e.target.selectionStart;
                    setUpdatedCommentContent(newValue);

                    // Clear errors
                    clearFieldError("editComment");
                    clearFieldError("editReply");

                    // Get text before cursor and find the last @ before cursor
                    const textBeforeCursor = newValue.substring(0, cursorPosition);
                    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

                    if (lastAtIndex !== -1) {
                      // Get text between @ and cursor
                      const textBetweenAtAndCursor = textBeforeCursor.slice(lastAtIndex + 1);
                      // Check if there's a space between @ and cursor
                      if (textBetweenAtAndCursor.startsWith(" ")) {
                        setOpenMentionOptions(false);
                        return;
                      }

                      // Get text after @ until next space or cursor
                      const searchText = textBetweenAtAndCursor.split(/\s/)[0];

                      // Check if there's any text between @ and next space/cursor
                      if (searchText) {
                        const filtered = mentionOptions
                          .map((user) => ({
                            ...user,
                            score: calculateMatchScore(user, searchText),
                          }))
                          .filter((user) => user.score > 0)
                          .sort((a, b) => b.score - a.score);
                        setOpenMentionOptions(filtered.length > 0);
                        setMentionOptions(filtered);
                      } else {
                        setOpenMentionOptions(true);
                        setMentionOptions(originalMentionOptions);
                      }
                    } else {
                      setOpenMentionOptions(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "@") {
                      setOpenMentionOptions(true);
                      setMentionOptions(originalMentionOptions);
                    } else if (e.key === "Backspace") {
                      const cursorPosition = e.target.selectionStart;
                      const textBeforeCursor = updatedCommentContent.substring(0, cursorPosition);
                      const mentionMatch = textBeforeCursor.match(/@(\w+)$/);

                      if (mentionMatch) {
                        const username = mentionMatch[1];
                        const userId = users.find((opt) => opt.username === username)?.id;
                        if (userId && updatedMentions?.includes(userId)) {
                          setUpdatedMentions((prev) => prev.filter((id) => id !== userId));
                          setOpenMentionOptions(true);
                        }
                      }
                    }

                    // Arrow key navigation
                    if (openMentionOptions && mentionOptions.length > 0 && isEditingComment) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedMentionIndex((prev) =>
                          prev < mentionOptions.length - 1 ? prev + 1 : prev
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
                      } else if (e.key === "Enter" && selectedMentionIndex >= 0) {
                        e.preventDefault();
                        setMentionOptionClicked(mentionOptions[selectedMentionIndex]);
                        setSelectedMentionIndex(-1);
                      }
                    }
                  }}
                  disabled={!isEditingComment}
                  fullWidth
                  margin="normal"
                  helperText={!isReply ? errors?.editComment : errors?.editReply}
                  minRows={1}
                  sx={{
                    ...textFieldStyles,
                    margin: 0,
                    backgroundColor: "transparent",
                    "& .MuiOutlinedInput-root": {
                      ...textFieldStyles["& .MuiOutlinedInput-root"],
                      backgroundColor: "transparent",
                      padding: "15px",
                      paddingBottom: isSingleLine ? "15px" : "45px",
                      paddingRight: isSingleLine ? "125px" : "15px",
                      "& textarea": {
                        scrollbarWidth: "thin",
                        color: "var(--color-white)",
                        minHeight: "0px",
                        "& .mention": {
                          color: "var(--brightFont)",
                          fontWeight: "bold",
                        },
                        "&::-webkit-scrollbar": {
                          width: "8px",
                        },
                      },
                      "& fieldset": {
                        borderColor: `${
                          selectedId === commentId
                            ? "var(--borderInputBrighter)"
                            : "var(--borderInput)"
                        }`,
                        borderWidth: "2px",
                      },
                      "&:hover fieldset": {
                        borderColor: `${
                          selectedId === commentId
                            ? "var(--borderInputBrighter)"
                            : "var(--borderInput)"
                        }`,
                        borderWidth: "2px",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: `${
                          selectedId === commentId
                            ? "var(--borderInputBrighter2)"
                            : "var(--borderInputBrighter)"
                        }`,
                        borderWidth: "2px",
                      },
                    },
                    "& input": {
                      color: "var(--color-white)",
                      padding: "15px",
                    },
                    "& .MuiFormHelperText-root": {
                      color: "var(--color-quaternary)",
                      marginLeft: 0,
                    },
                    "& .Mui-disabled": {
                      WebkitTextFillColor: "inherit !important",
                      opacity: 1,
                    },
                    "& .MuiInputAdornment-root": {
                      alignSelf: "flex-end",
                      marginBottom: "8px",
                    },
                    "@media (max-width: 560px)": {
                      "& input": {
                        padding: "15px",
                      },
                    },
                  }}
                  InputProps={{
                    style: { color: "var(--color-white)" },
                    endAdornment: (
                      <InputAdornment
                        position="end"
                        sx={{
                          position: "absolute",
                          bottom: isSingleLine ? "18px" : "15px",
                          right: "5px",
                        }}
                      >
                        {isEditingComment && (
                          <>
                            <IconButton
                              onClick={() => {
                                openCollaboratorsSelect(
                                  updatedCommentContent,
                                  setUpdatedCommentContent
                                );
                                textFieldInputRef?.current?.focus();
                              }}
                              sx={{ ...iconButtonStylesBrighter, padding: "10.5px" }}
                            >
                              <MentionIconSmallGradient />
                            </IconButton>
                            {isEditingComment && (
                              <IconButton
                                onClick={handleCancelEditComment}
                                sx={{ ...iconButtonStylesBrighter, padding: "10.5px" }}
                              >
                                <CancelIconSmallGradient />
                              </IconButton>
                            )}
                            <IconButton
                              onClick={!isReply ? handleEditComment : handleEditReply}
                              sx={{
                                ...iconButtonStylesBrighter,
                                padding: "9.5px",
                                opacity: isSaveBtnDisabled ? "0.5 !important" : "1 !important",
                                cursor: isSaveBtnDisabled
                                  ? "default !important"
                                  : "pointer !important",
                              }}
                              disabled={isSaveBtnDisabled}
                            >
                              <SaveIconSmallGradient sx={{ color: "#FF894D" }} />
                            </IconButton>
                          </>
                        )}
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ maxLength: 1000 }}
                />
                {openMentionOptions && mentionOptions.length > 0 && isEditingComment && (
                  <Paper
                    ref={mentionOptionsRef}
                    sx={{
                      position: "absolute",
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflow: "auto",
                      width: "calc(100% - 60px)",
                      left: "30px",
                      backgroundColor: "var(--iconBg)",
                      boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
                      borderRadius: "10px",
                    }}
                  >
                    {mentionOptions.slice(0, 5).map((user, index) => (
                      <CustomMenuItem
                        key={user.id}
                        onClick={() => setMentionOptionClicked(user)}
                        selected={index === selectedMentionIndex}
                      >
                        <UserInfoTooltip {...user} />
                      </CustomMenuItem>
                    ))}
                  </Paper>
                )}
                {updatedMentions.length > 0 && (
                  <div className="editingMentionsCont">
                    <span className="editingMentionsText">Mentions:</span>
                    {updatedMentions.map((mention, index) => {
                      const userId = mention;
                      const username = users.find((user) => user.id === userId)?.username;
                      return (
                        <CustomTooltip
                          key={index}
                          title={
                            <UserInfoTooltip username={username} {...getUserDetails(username)} />
                          }
                          arrow
                        >
                          <span className="editingMentionsUsername">@{username}</span>
                        </CustomTooltip>
                      );
                    })}
                  </div>
                )}
              </>
            )
          )}
        </div>
        {!isRepliesExpanded ? (
          replyCount > 0 && (
            <div className="replies-details">
              <span style={{ cursor: "auto" }} onClick={(e) => e.stopPropagation()}>
                {replyCount === 1 ? "1 reply" : replyCount > 1 && `${replyCount} replies`}
              </span>
              <span className="gradient-bullet"></span>
              <span style={{ cursor: "auto" }} onClick={(e) => e.stopPropagation()}>
                {replyLatestDate}
              </span>
            </div>
          )
        ) : (
          <div className={`replies-container ${isReplyToReply ? "nested" : ""}`}>
            {comment.replies?.map((replyId) => {
              if (!isReply) {
                // For root comments, only show direct replies
                const replyObj = replyId; // replyId is already the reply object
                const isDirectReply = !comment.replies.some((r) =>
                  r.replies?.includes(replyObj?.replyId)
                );

                return (
                  isDirectReply &&
                  replyObj && (
                    <CommentContainer
                      key={replyObj.replyId}
                      commentId={comment.id}
                      comment={replyObj}
                      isReply={true}
                      isReplyToReply={false}
                      design={design}
                      optionsState={optionsState}
                      setOptionsState={setOptionsState}
                      selectedId={selectedId}
                      setSelectedId={setSelectedId}
                      activeComment={activeComment}
                      setActiveComment={setActiveComment}
                      replyTo={replyTo}
                      setReplyTo={setReplyTo}
                      rootComment={rootCommentRoot}
                      isOwnerEditorCommenter={isOwnerEditorCommenter}
                      changeMode={changeMode}
                    />
                  )
                );
              } else {
                // For replies, show referenced replies from root comment
                const replyObj = rootComment.replies.find((r) => r.replyId === replyId);
                return (
                  replyObj && (
                    <CommentContainer
                      key={replyObj.replyId}
                      commentId={rootComment.id}
                      comment={replyObj}
                      isReply={true}
                      isReplyToReply={true}
                      design={design}
                      optionsState={optionsState}
                      setOptionsState={setOptionsState}
                      selectedId={selectedId}
                      setSelectedId={setSelectedId}
                      activeComment={activeComment}
                      setActiveComment={setActiveComment}
                      replyTo={replyTo}
                      setReplyTo={setReplyTo}
                      rootComment={rootCommentRoot}
                      isOwnerEditorCommenter={isOwnerEditorCommenter}
                      changeMode={changeMode}
                    />
                  )
                );
              }
            })}
          </div>
        )}
        {/* Reply input field */}
        {(isRepliesExpanded || replyCount === 0) &&
          !isReply &&
          !status &&
          isOwnerEditorCommenter &&
          (changeMode === "Commenting" || changeMode === "Editing") && (
            <>
              <div style={{ marginTop: "10px" }}>
                {replyTo && (
                  <div>
                    <span style={{ color: "var(--greyText)", fontSize: "0.875rem" }}>
                      Replying to {replyTo.username}'s reply {replyTo.date?.includes("at") && "at"}{" "}
                      {replyTo.date.replace(" at ", ", ")}
                    </span>
                    <IconButton
                      size="small"
                      sx={{
                        ...iconButtonStylesBrighter,
                        padding: 0,
                        marginLeft: "10px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyTo(null);
                      }}
                    >
                      <CloseRoundedIcon
                        sx={{
                          fontSize: "1.9rem",
                          color: "var(--greyText)",
                          transform: "scale(0.7)",
                        }}
                      />
                    </IconButton>
                  </div>
                )}
                <TextField
                  label=""
                  type="text"
                  ref={textFieldReplyRef}
                  inputRef={textFieldReplyInputRef}
                  fullWidth
                  multiline
                  placeholder="Add a reply"
                  value={replyContent}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const cursorPosition = e.target.selectionStart;
                    setReplyContent(newValue);

                    // Clear errors
                    clearFieldError("addReply");

                    // Get text before cursor and find the last @ before cursor
                    const textBeforeCursor = newValue.substring(0, cursorPosition);
                    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

                    if (lastAtIndex !== -1) {
                      // Get text between @ and cursor
                      const textBetweenAtAndCursor = textBeforeCursor.slice(lastAtIndex + 1);
                      // Check if there's a space between @ and cursor
                      if (textBetweenAtAndCursor.startsWith(" ")) {
                        setOpenMentionOptions(false);
                        return;
                      }

                      // Get text after @ until next space or cursor
                      const searchText = textBetweenAtAndCursor.split(/\s/)[0];

                      // Check if there's any text between @ and next space/cursor
                      if (searchText) {
                        const filtered = mentionOptions
                          .map((user) => ({
                            ...user,
                            score: calculateMatchScore(user, searchText),
                          }))
                          .filter((user) => user.score > 0)
                          .sort((a, b) => b.score - a.score);
                        setOpenMentionOptions(filtered.length > 0);
                        setMentionOptions(filtered);
                      } else {
                        setOpenMentionOptions(true);
                        setMentionOptions(originalMentionOptions);
                      }
                    } else {
                      setOpenMentionOptions(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "@") {
                      setOpenMentionOptions(true);
                      setMentionOptions(originalMentionOptions);
                    } else if (e.key === "Backspace") {
                      const cursorPosition = e.target.selectionStart;
                      const textBeforeCursor = replyContent.substring(0, cursorPosition);
                      const mentionMatch = textBeforeCursor.match(/@(\w+)$/);

                      if (mentionMatch) {
                        const username = mentionMatch[1];
                        const userId = users.find((opt) => opt.username === username)?.id;
                        if (userId && replyMentions?.includes(userId)) {
                          setReplyMentions((prev) => prev.filter((id) => id !== userId));
                          setOpenMentionOptions(true);
                        }
                      }
                    }

                    // Arrow key navigation
                    if (openMentionOptions && mentionOptions.length > 0 && isAddingReply) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedReplyMentionIndex((prev) =>
                          prev < mentionOptions.length - 1 ? prev + 1 : prev
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedReplyMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
                      } else if (e.key === "Enter" && selectedReplyMentionIndex >= 0) {
                        e.preventDefault();
                        setMentionOptionClicked(mentionOptions[selectedReplyMentionIndex]);
                        setSelectedReplyMentionIndex(-1);
                      }
                    }
                  }}
                  onClick={() => setIsAddingReply(true)}
                  margin="normal"
                  helperText={errors?.addReply}
                  minRows={1}
                  sx={{
                    ...textFieldStyles,
                    margin: 0,
                    backgroundColor: "transparent",
                    "& .MuiOutlinedInput-root": {
                      ...textFieldStyles["& .MuiOutlinedInput-root"],
                      backgroundColor: "transparent",
                      padding: "15px",
                      paddingBottom: isSingleLineReply ? "15px" : "45px",
                      paddingRight: isSingleLineReply ? "90px" : "15px",
                      "& textarea": {
                        scrollbarWidth: "thin",
                        color: "var(--color-white)",
                        minHeight: "0px",
                        "& .mention": {
                          color: "var(--brightFont)",
                          fontWeight: "bold",
                        },
                        "&::-webkit-scrollbar": {
                          width: "8px",
                        },
                      },
                      "& fieldset": {
                        borderColor: `${
                          selectedId === commentId
                            ? "var(--borderInputBrighter)"
                            : "var(--borderInput)"
                        }`,
                        borderWidth: "2px",
                      },
                      "&:hover fieldset": {
                        borderColor: `${
                          selectedId === commentId
                            ? "var(--borderInputBrighter)"
                            : "var(--borderInput)"
                        }`,
                        borderWidth: "2px",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: `${
                          selectedId === commentId
                            ? "var(--borderInputBrighter2)"
                            : "var(--borderInputBrighter)"
                        }`,
                        borderWidth: "2px",
                      },
                    },
                    "& input": {
                      color: "var(--color-white)",
                      padding: "15px",
                    },
                    "& .MuiFormHelperText-root": {
                      color: "var(--color-quaternary)",
                      marginLeft: 0,
                    },
                    "& .Mui-disabled": {
                      WebkitTextFillColor: "inherit !important",
                      opacity: 1,
                    },
                    "& .MuiInputAdornment-root": {
                      alignSelf: "flex-end",
                      marginBottom: "8px",
                    },
                    "@media (max-width: 560px)": {
                      "& input": {
                        padding: "15px",
                      },
                    },
                  }}
                  InputProps={{
                    style: { color: "var(--color-white)" },
                    endAdornment: (
                      <InputAdornment
                        position="end"
                        sx={{
                          position: "absolute",
                          bottom: isSingleLineReply ? "17px" : "15px",
                          right: "5px",
                        }}
                      >
                        <IconButton
                          onClick={() => {
                            setIsAddingReply(true);
                            openCollaboratorsSelect(replyContent, setReplyContent);
                          }}
                          sx={{ ...iconButtonStylesBrighter, padding: "10.5px" }}
                        >
                          <MentionIconSmallGradient />
                        </IconButton>
                        <IconButton
                          onClick={handleAddReply}
                          sx={{
                            ...iconButtonStylesBrighter,
                            padding: "9.5px",
                            opacity: isSendBtnDisabled ? "0.5 !important" : "1 !important",
                            cursor: isSendBtnDisabled ? "default !important" : "pointer !important",
                          }}
                          disabled={isSendBtnDisabled}
                        >
                          <SendIconSmallGradient sx={{ color: "#FF894D" }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ maxLength: 1000 }}
                />
                {openMentionOptions && mentionOptions.length > 0 && isAddingReply && (
                  <Paper
                    ref={mentionOptionsReplyRef}
                    sx={{
                      position: "absolute",
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflow: "auto",
                      width: "calc(100% - 60px)",
                      left: "30px",
                      backgroundColor: "var(--iconBg)",
                      boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
                      borderRadius: "10px",
                    }}
                  >
                    {mentionOptions.slice(0, 5).map((user, index) => (
                      <CustomMenuItem
                        key={user.id}
                        onClick={(e) => {
                          console.log("clciked");
                          console.log("user", user);
                          setMentionOptionClicked(user);
                        }}
                        selected={index === selectedReplyMentionIndex}
                      >
                        <UserInfoTooltip {...user} />
                      </CustomMenuItem>
                    ))}
                  </Paper>
                )}
                {replyMentions.length > 0 && (
                  <div className="editingMentionsCont">
                    <span className="editingMentionsText">Mentions:</span>
                    {replyMentions.map((mention, index) => {
                      const userId = mention;
                      const username = users.find((user) => user.id === userId)?.username;
                      return (
                        <CustomTooltip
                          key={index}
                          title={
                            <UserInfoTooltip username={username} {...getUserDetails(username)} />
                          }
                          arrow
                        >
                          <span className="editingMentionsUsername">@{username}</span>
                        </CustomTooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
      </div>
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          handleDelete={!isReply ? handleDeleteComment : handleDeleteReply}
          isReply={isReply}
          date={date}
          isDeleteBtnDisabled={isDeleteBtnDisabled}
        />
      )}
    </>
  );
};

export default CommentContainer;

// Selection mentions menu item and user tooltip
export const UserInfoTooltip = ({ username, firstName, lastName, role, profilePic }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "5px",
    }}
  >
    <Box
      sx={{
        width: 39,
        height: 39,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--gradientButton)",
        borderRadius: "50%",
        padding: "3px",
        marginRight: "10px",
        cursor: "auto",
      }}
    >
      <Avatar
        src={profilePic}
        sx={{
          width: 39,
          height: 39,
          borderRadius: "50%",
          boxShadow: "0 0 0 3px var(--gradientButton)",
          "& .MuiAvatar-img": {
            borderRadius: "50%",
          },
          ...stringAvatarColor(username),
        }}
        children={stringAvatarInitials(username)}
      />
    </Box>
    <Box sx={{ flexGrow: "1", minWidth: 0 }}>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.875rem",
          fontWeight: "bold",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >{`${firstName} ${lastName}`}</Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        @{username}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {role && `${role}`}
      </Typography>
    </Box>
  </Box>
);

// Delete confirmation modal
const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  handleDelete,
  isReply,
  date,
  isDeleteBtnDisabled,
}) => {
  const onSubmit = () => {
    handleDelete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} sx={dialogStyles}>
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
          Delete {!isReply ? "comment" : "reply"}
        </Typography>
        <IconButton
          onClick={onClose}
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
        <Typography variant="body1" sx={{ marginBottom: "10px", textAlign: "center" }}>
          Are you sure you want to delete your {!isReply ? "comment" : "reply"}{" "}
          {date?.includes("at") && "at"} {date.replace(" at ", ", ")}?
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{
            ...gradientButtonStyles,
            opacity: isDeleteBtnDisabled ? "0.5" : "1",
            cursor: isDeleteBtnDisabled ? "default" : "pointer",
            "&:hover": {
              backgroundImage: !isDeleteBtnDisabled && "var(--gradientButtonHover)",
            },
          }}
          disabled={isDeleteBtnDisabled}
        >
          Yes
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const CustomTooltip = styled(
  React.forwardRef(({ className, ...props }, ref) => (
    <Tooltip
      {...props}
      ref={ref}
      classes={{ popper: className }}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -6],
              },
            },
          ],
        },
      }}
    />
  ))
)(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: "var(--iconBg)",
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "var(--iconBg)",
    color: "var(--color-white)",
    maxWidth: 220,
    borderRadius: "10px",
    boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
    border: "1px solid var(--table-stroke)",
  },
}));
