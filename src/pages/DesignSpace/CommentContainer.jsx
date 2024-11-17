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
} from "@mui/icons-material";
import { showToast, stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { iconButtonStyles, iconButtonStylesBrighter } from "../Homepage/DrawerComponent.jsx";
import { formatDateDetail, getUser } from "../Homepage/backend/HomepageActions.jsx";
import {
  addComment,
  editComment,
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

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
  "&:hover": {
    backgroundColor: "var(--iconBg)",
  },
  "&:focus": {
    backgroundColor: "var(--iconBg)",
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
  replyTo,
  setReplyTo,
}) => {
  const { designId } = useParams();
  const { user, users, userDoc } = useSharedProps();

  // Root comment states for display
  const [commenterUserId, setCommenterUserId] = useState("");
  const [username, setUsername] = useState("");
  const [date, setDate] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [mentions, setMentions] = useState([]);
  const [profilePic, setProfilePic] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyCount, setReplyCount] = useState(0);
  const [replyLatestDate, setReplyLatestDate] = useState("");

  // General mention select
  const [openMentionOptions, setOpenMentionOptions] = useState(false);
  const [mentionOptions, setMentionOptions] = useState([]);
  const [originalMentionOptions, setOriginalMentionOptions] = useState([]);
  const [mentionOptionClicked, setMentionOptionClicked] = useState(null);

  // Editing comment states
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [updatedCommentContent, setUpdatedCommentContent] = useState("");
  const [updatedMentions, setUpdatedMentions] = useState([]);

  // Reply states
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyMentions, setReplyMentions] = useState([]);
  const [replyToRoot, setReplyToRoot] = useState(null);

  // errors.addComment for adding comment
  // errors.editComment for editing comment
  // errors.addReply for replying comment
  // errors.editReply for editing reply to a comment
  const [errors, setErrors] = useState({});

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
    const result = await getUser(comment.userId);
    if (result.success) {
      const userDoc = result.user;
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
    setUpdatedMentions(comment.mentions);
    setDate(formatDateDetail(comment.createdAt));
    setReplyCount(comment.replies?.length || 0);
    setReplyLatestDate(
      comment.replies?.length > 0
        ? formatDateDetail(
            comment.replies.reduce((latest, reply) => {
              const replyTime = reply.createdAt.seconds * 1000 + reply.createdAt.nanoseconds / 1e6;
              const latestTime = latest.seconds * 1000 + latest.nanoseconds / 1e6;
              return replyTime > latestTime ? reply.createdAt : latest;
            }, comment.replies[0].createdAt)
          )
        : ""
    );
  }, [comment]);

  const getUserRole = (userId, design) => {
    // console.log(`userId: ${userId}`);
    // console.log("design", design);
    if (!userId || !design) return "";
    if (userId === design.owner) return "Owner";
    if (design.editors.includes(userId)) return "Editor";
    if (design.commenters.includes(userId)) return "Commenter";
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
    const handleMentionOptionClick = (content, setContent, user, ref) => {
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

        if (!updatedMentions.includes(user.id)) {
          setUpdatedMentions([...updatedMentions, user.id]);
        }
      }
      setOpenMentionOptions(false);
      setMentionOptionClicked(null);
    };

    let content, setContent, user, ref;
    console.log("inside useeffect");
    if (!mentionOptionClicked) return;
    else user = mentionOptionClicked;
    console.log("textFieldReplyInputRef.current", textFieldReplyInputRef.current);
    console.log("isAddingReply", isAddingReply);
    if (textFieldInputRef.current && isEditingComment) {
      content = updatedCommentContent;
      setContent = setUpdatedCommentContent;
      ref = textFieldInputRef;
      handleMentionOptionClick(content, setContent, user, ref);
    } else if (textFieldReplyInputRef.current && isAddingReply) {
      content = replyContent;
      setContent = setReplyContent;
      ref = textFieldReplyInputRef;
      handleMentionOptionClick(content, setContent, user, ref);
    }
  }, [mentionOptionClicked]);

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
    // Exact matches get highest priority
    if (username === search) return 100;
    if (firstName === search) return 90;
    if (lastName === search) return 80;
    // Starts with gets second priority
    if (username.startsWith(search)) return 70;
    if (firstName.startsWith(search)) return 60;
    if (lastName.startsWith(search)) return 50;
    // Contains gets lowest priority
    if (username.includes(search)) return 40;
    if (firstName.includes(search)) return 30;
    if (lastName.includes(search)) return 20;
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
                  design.editors.includes(user.id) ||
                  design.commenters.includes(user.id)
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
    console.log("reply to rooot:", replyToRoot);
  }, [replyToRoot]);

  const toggleOptions = (id) => {
    setOptionsState((prev) => ({
      showOptions: prev.selectedId !== id || !prev.showOptions,
      selectedId: prev.selectedId !== id || !prev.showOptions ? id : null,
    }));
  };

  const setEditingState = () => {
    setIsEditingComment(true);
    toggleOptions(commentId);
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    toggleOptions(commentId);
  };

  const handleCancelEditComment = () => {
    setUpdatedCommentContent(commentContent);
    setUpdatedMentions(mentions);
    setIsEditingComment(false);
  };

  const handleAddComment = async () => {};

  const handleEditComment = async () => {
    const result = await editComment(
      designId,
      commentId,
      updatedCommentContent,
      updatedMentions,
      user,
      userDoc
    );
    if (!result.success) {
      if (
        result.message === "Comment is required" ||
        result.message === "Mentioned user not found" ||
        result.message === "Mentioned users not found"
      )
        setErrors((prev) => ({ ...prev, editComment: result.message }));
      else showToast("error", result.message);
      return;
    }
    setIsEditingComment(false);
    showToast("success", result.message);
  };

  const handleDeleteComment = async () => {};

  const handleResolveComment = async () => {};

  const handleReopenComment = async () => {};

  const handleAddReply = async () => {};

  const handleEditReply = async () => {};

  const handleDeleteReply = async () => {};

  return (
    <>
      <div
        className={`comment-container ${activeComment === commentId && "active"} ${
          isReply && "reply"
        }`}
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
            {!isReply && !comment?.status && (
              <IconButton
                sx={{
                  ...iconButtonStylesBrighter,
                  padding: "8px",
                  marginRight: "-1px",
                  width: "38px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleResolveComment();
                }}
              >
                <CheckIconSmallGradient />
              </IconButton>
            )}
            {isReply && (
              <IconButton
                sx={{
                  ...iconButtonStylesBrighter,
                  padding: "3.5px",
                  marginRight: "-1px",
                  width: "38px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyTo({ username, date, replyId: comment.id, commentId });
                  if (textFieldReplyRef.current) textFieldReplyRef.current.focus();
                }}
              >
                <ReplyRoundedIcon sx={{ fontSize: "1.9rem", color: "var(--color-white)" }} />
              </IconButton>
            )}
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
                setIsExpanded((prev) => !prev);
              }}
            >
              {!isExpanded ? (
                <UnfoldMoreRoundedIcon
                  sx={{ fontSize: "1.9rem", color: "var(--color-white)", transform: "scale(0.9)" }}
                />
              ) : (
                <UnfoldLessRoundedIcon
                  sx={{ fontSize: "1.9rem", color: "var(--color-white)", transform: "scale(0.9)" }}
                />
              )}
            </IconButton>
            {commenterUserId === userDoc.id && (
              <>
                <IconButton
                  sx={{ ...iconButtonStylesBrighter, padding: 0, height: "38px", width: "38px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOptions(commentId);
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
                {optionsState.showOptions && optionsState.selectedId === comment.id && (
                  <div
                    ref={dropdownRef}
                    className="dropdown-menu comment"
                    style={{
                      position: "absolute",
                      top: "0",
                      marginTop: "10px",
                    }}
                    onClick={() => toggleOptions(commentId)}
                  >
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
                    {/* false for open, true for resolved */}
                    {!isReply && comment.status && (
                      <CustomMenuItem
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReopenComment();
                        }}
                      >
                        <ListItemIcon>
                          <DeleteIcon className="icon" />
                        </ListItemIcon>
                        <ListItemText primary="Delete" sx={{ color: "var(--color-white)" }} />
                      </CustomMenuItem>
                    )}
                  </div>
                )}
              </>
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
                  const isValidMention = mentions.includes(userId);

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
                    if (userId && updatedMentions.includes(userId)) {
                      setUpdatedMentions((prev) => prev.filter((id) => id !== userId));
                      setOpenMentionOptions(true);
                    }
                  }
                }
              }}
              disabled={!isEditingComment}
              fullWidth
              margin="normal"
              helperText={isReply ? errors?.editComment : errors?.editReply}
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
                      selectedId === commentId ? "var(--borderInputBrighter)" : "var(--borderInput)"
                    }`,
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: `${
                      selectedId === commentId ? "var(--borderInputBrighter)" : "var(--borderInput)"
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
                          onClick={() =>
                            openCollaboratorsSelect(updatedCommentContent, setUpdatedCommentContent)
                          }
                          sx={{ ...iconButtonStyles, padding: "10.5px" }}
                        >
                          <MentionIconSmallGradient />
                        </IconButton>
                        {isEditingComment && (
                          <IconButton
                            onClick={handleCancelEditComment}
                            sx={{ ...iconButtonStyles, padding: "10.5px" }}
                          >
                            <CancelIconSmallGradient />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={!isReply ? handleEditComment : handleEditReply}
                          sx={{ ...iconButtonStyles, padding: "9.5px" }}
                        >
                          <SaveIconSmallGradient sx={{ color: "#FF894D" }} />
                        </IconButton>
                      </>
                    )}
                  </InputAdornment>
                ),
              }}
            />
          )}
          {openMentionOptions && mentionOptions.length > 0 && isEditingComment && (
            <Paper
              sx={{
                position: "absolute",
                zIndex: 1000,
                maxHeight: "200px",
                overflow: "auto",
                width: "calc(100% - 30px)",
                left: "15px",
                backgroundColor: "var(--nav-card-modal)",
              }}
            >
              {mentionOptions.slice(0, 5).map((user) => (
                <MenuItem key={user.id} onClick={() => setMentionOptionClicked(user)}>
                  <UserInfoTooltip {...user} />
                </MenuItem>
              ))}
            </Paper>
          )}
        </div>
        {!isExpanded ? (
          <div className="replies-details">
            <span style={{ cursor: "auto", minWidth: "60px" }} onClick={(e) => e.stopPropagation()}>
              {replyCount === 0
                ? "No replies"
                : replyCount === 1
                ? "1 reply"
                : replyCount > 1 && `${replyCount} replies`}
            </span>
            {replyCount > 0 && <span className="gradient-bullet"></span>}
            <span style={{ cursor: "auto" }} onClick={(e) => e.stopPropagation()}>
              {replyLatestDate}
            </span>
          </div>
        ) : (
          <>
            {/* Display existing replies */}
            {comment.replies?.map((reply) => (
              <div key={reply.replyId} className="reply-container">
                <CommentContainer
                  comment={{
                    id: reply.replyId,
                    userId: reply.userId,
                    message: reply.message,
                    mentions: reply.mentions,
                    createdAt: reply.createdAt,
                    modifiedAt: reply.modifiedAt,
                  }}
                  commentId={comment.id}
                  design={design}
                  optionsState={optionsState}
                  setOptionsState={setOptionsState}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  activeComment={activeComment}
                  setActiveComment={setActiveComment}
                  isReply={true}
                  replyTo={replyToRoot}
                  setReplyTo={setReplyToRoot}
                />
              </div>
            ))}
          </>
        )}
        {/* Reply input field */}
        {isExpanded && !isReply && (
          <>
            <div style={{ marginTop: "10px" }}>
              {replyToRoot && (
                <div>
                  <span style={{ color: "var(--greyText)", fontSize: "0.875rem" }}>
                    Replying to {replyToRoot.username}'s reply{" "}
                    {replyToRoot.date.includes("at") && "at"}{" "}
                    {replyToRoot.date.replace(" at ", ", ")}
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
                      setReplyToRoot(null);
                    }}
                  >
                    <CloseRoundedIcon
                      sx={{ fontSize: "1.9rem", color: "var(--greyText)", transform: "scale(0.7)" }}
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
                      if (userId && replyMentions.includes(userId)) {
                        setReplyMentions((prev) => prev.filter((id) => id !== userId));
                        setOpenMentionOptions(true);
                      }
                    }
                  }
                }}
                onFocus={() => setIsAddingReply(true)}
                onBlur={() => setIsAddingReply(false)}
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
                        onClick={() => openCollaboratorsSelect(replyContent, setReplyContent)}
                        sx={{ ...iconButtonStyles, padding: "10.5px" }}
                      >
                        <MentionIconSmallGradient />
                      </IconButton>
                      <IconButton
                        onClick={handleAddReply}
                        sx={{ ...iconButtonStyles, padding: "9.5px" }}
                      >
                        <SendIconSmallGradient sx={{ color: "#FF894D" }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            {openMentionOptions && mentionOptions.length > 0 && isAddingReply && (
              <Paper
                sx={{
                  position: "absolute",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflow: "auto",
                  width: "calc(100% - 30px)",
                  left: "15px",
                  backgroundColor: "var(--nav-card-modal)",
                }}
              >
                {mentionOptions.slice(0, 5).map((user) => (
                  <MenuItem key={user.id} onClick={() => setMentionOptionClicked(user)}>
                    <UserInfoTooltip {...user} />
                  </MenuItem>
                ))}
              </Paper>
            )}
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
        />
      )}
    </>
  );
};

export default CommentContainer;

// Selection mentions menu item and user tooltip
const UserInfoTooltip = ({ username, firstName, lastName, role, profilePic }) => (
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
    <Box>
      <Typography
        sx={{ color: "var(--color-white)", fontSize: "0.875rem", fontWeight: "bold" }}
      >{`${firstName} ${lastName}`}</Typography>
      <Typography sx={{ color: "var(--color-white)", fontSize: "0.7rem" }}>@{username}</Typography>
      <Typography sx={{ color: "var(--color-white)", fontSize: "0.7rem" }}>
        {role && `${role}`}
      </Typography>
    </Box>
  </Box>
);

// Delete confirmation modal
const ConfirmDeleteModal = ({ isOpen, onClose, handleDelete, isReply, date }) => {
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
          {date.includes("at") && "at"} {date.replace(" at ", ", ")}?
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth variant="contained" onClick={onSubmit} sx={gradientButtonStyles}>
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

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip
    {...props}
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
))(({ theme }) => ({
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
