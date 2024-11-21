import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Typography,
  Paper,
} from "@mui/material";
import { showToast, stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { iconButtonStylesBrighter } from "../Homepage/DrawerComponent.jsx";
import { addComment } from "./backend/DesignActions.jsx";
import { textFieldStyles } from "./DesignSettings.jsx";
import { MentionIconSmallGradient, SelectedComment, UnselectedComment } from "./svg/AddColor.jsx";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar.jsx";
import { CustomMenuItem, CustomTooltip, UserInfoTooltip } from "./CommentContainer.jsx";

function AddCommentContainer({
  design,
  isAddingComment,
  setIsAddingComment,
  isPinpointing,
  setIsPinpointing,
  pinpointLocation,
  setPinpointLocation,
  pinpointSelectedImage,
  setPinpointSelectedImage,
  applyMinHeight,
  setSelectedImage,
}) {
  const { designId } = useParams();
  const { user, users, userDoc } = useSharedProps();

  // Comment value states
  const [commentContent, setCommentContent] = useState("");
  const [mentions, setMentions] = useState([]);
  const [error, setError] = useState("");

  // General mention select
  const [openMentionOptions, setOpenMentionOptions] = useState(false);
  const [mentionOptions, setMentionOptions] = useState([]);
  const [originalMentionOptions, setOriginalMentionOptions] = useState([]);
  const [mentionOptionClicked, setMentionOptionClicked] = useState(null);
  const mentionOptionsRef = useRef(null);

  const dropdownRef = useRef(null);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const textFieldRef = useRef(null);
  const textFieldInputRef = useRef(null);

  // Check the height of the textarea to determine if it's a single line
  useEffect(() => {
    if (textFieldRef.current) {
      const lineHeight = 83;
      const contentHeight = textFieldRef.current.scrollHeight;
      setIsSingleLine(contentHeight <= lineHeight);
      console.log("contentHeight", contentHeight);
      console.log("<=lineHeight", lineHeight);
    }
  }, [commentContent]);

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

    let content, setContent, passedMentions, passedSetMentions, user, ref;
    console.log("inside useeffect");
    if (!mentionOptionClicked) return;
    else user = mentionOptionClicked;
    console.log("textFieldInputRef.current", textFieldInputRef.current);
    if (textFieldInputRef.current) {
      content = commentContent;
      setContent = setCommentContent;
      passedMentions = mentions;
      passedSetMentions = setMentions;
      ref = textFieldInputRef;
      handleMentionOptionClick(content, setContent, passedMentions, passedSetMentions, user, ref);
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
    if (username?.includes(search)) return 40;
    if (firstName?.includes(search)) return 30;
    if (lastName?.includes(search)) return 20;
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
      if (mentionOptionsRef.current && !mentionOptionsRef.current.contains(event.target)) {
        setOpenMentionOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("comment:", commentContent);
  }, [commentContent]);

  useEffect(() => {
    console.log("mentions:", mentions);
  }, [mentions]);

  const handleCancelAddComment = () => {
    handleCancelPinpoint();
    setCommentContent(commentContent);
    setMentions(mentions);
    setIsAddingComment(false);
    setOpenMentionOptions(false);
  };

  const handleCancelPinpoint = () => {
    if (isPinpointing) {
      setIsPinpointing(false);
      setPinpointLocation(null);
      setPinpointSelectedImage(null);
    }
  };

  useEffect(() => {
    if (!isAddingComment) {
      setIsPinpointing(false);
      return;
    }
    if (textFieldInputRef?.current) textFieldInputRef?.current?.focus();
    setIsPinpointing(true);
    // handleCancelAddComment();
  }, [isAddingComment]);

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

  const handleAddComment = async () => {
    // Validation
    const nonExistentUsers = validateMentions(mentions);
    if (nonExistentUsers.length > 0) {
      setError(
        `${nonExistentUsers.length} mentioned user${nonExistentUsers.length > 0 && "s"} not found`
      );
      return;
    } else if (!commentContent && mentions.length === 0) {
      setError("Comment is required");
      return;
    } else if (!pinpointSelectedImage || !pinpointLocation) {
      showToast("error", "Please pinpoint which location in the image you're commenting on.");
      return;
    }

    // Call addComment
    const result = await addComment(
      designId,
      pinpointSelectedImage.imageId, //designVersionImageId
      pinpointLocation,
      commentContent,
      mentions,
      user,
      userDoc
    );
    if (!result.success) {
      if (result.message !== "Comment is required") showToast("error", result.message);
      return;
    }
    setIsAddingComment(false);
    handleCancelPinpoint();
    setSelectedImage(null);
    showToast("success", result.message);
  };

  return (
    <div>
      <Box
        sx={{ minHeight: applyMinHeight ? "calc(100vh - 259px)" : "688px" }}
        className="transitionMinHeight"
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.1rem",
            fontFamily: '"Inter", sans-serif !important',
            margin: "16px 0px",
            textAlign: "center",
          }}
        >
          Adding comment
        </Typography>
        <div className="comment-container add-comment" style={{ cursor: "auto" }}>
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
                  src={userDoc?.profilePic ? userDoc.profilePic : ""}
                  sx={{
                    height: 39,
                    width: 39,
                    borderRadius: "50%",
                    boxShadow: "0 0 0 3px var(--gradientButton)",
                    "& .MuiAvatar-img": {
                      borderRadius: "50%",
                    },
                    ...stringAvatarColor(userDoc?.username),
                  }}
                  children={stringAvatarInitials(userDoc?.username)}
                />
              </Box>
              <div className="user-details">
                <span className="username" onClick={(e) => e.stopPropagation()}>
                  {userDoc?.username}
                </span>
              </div>
            </div>
            <div className="profile-status">
              <Button
                sx={{
                  ...iconButtonStylesBrighter,
                  padding: "8px 15px",
                  marginRight: "5px",
                  width: "auto",
                  textTransform: "none",
                  borderRadius: "20px",
                  backgroundColor: "transparent",
                  cursor: "auto",
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                  //   backgroundColor: isPinpointing ? "var(--iconBgHover)" : "transparent",
                }}
                // onClick={() => setIsPinpointing((prev) => !prev)}
              >
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    color: "transparent",
                    backgroundImage: "var(--gradientFont)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    marginRight: "10px",
                  }}
                >
                  Pinpoint
                </Typography>
                <SelectedComment />
              </Button>
            </div>
          </div>
          <div style={{ marginTop: "10px" }}>
            <TextField
              label=""
              type="text"
              ref={textFieldRef}
              inputRef={textFieldInputRef}
              fullWidth
              multiline
              placeholder="Comment or mention someone"
              value={commentContent}
              onChange={(e) => {
                const newValue = e.target.value;
                const cursorPosition = e.target.selectionStart;
                setCommentContent(newValue);
                setError("");

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
                  const textBeforeCursor = commentContent.substring(0, cursorPosition);
                  const mentionMatch = textBeforeCursor.match(/@(\w+)$/);

                  if (mentionMatch) {
                    const username = mentionMatch[1];
                    const userId = users.find((opt) => opt.username === username)?.id;
                    if (userId && mentions?.includes(userId)) {
                      setMentions((prev) => prev.filter((id) => id !== userId));
                      setOpenMentionOptions(true);
                    }
                  }
                }
              }}
              onClick={() => setIsAddingComment(true)}
              margin="normal"
              helperText={error}
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
                  paddingRight: isSingleLine ? "50px" : "15px",
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
                    borderColor: "var(--borderInput)",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--borderInput)",
                    borderWidth: "2px",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--borderInputBrighter)",
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
                    <IconButton
                      onClick={() => {
                        setIsAddingComment(true);
                        openCollaboratorsSelect(commentContent, setCommentContent);
                      }}
                      sx={{ ...iconButtonStylesBrighter, padding: "10.5px" }}
                    >
                      <MentionIconSmallGradient />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {openMentionOptions && mentionOptions.length > 0 && isAddingComment && (
              <Paper
                ref={mentionOptionsRef}
                sx={{
                  position: "absolute",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflow: "auto",
                  width: " calc(100% - 74px)",
                  left: "45px",
                  backgroundColor: "var(--iconBg)",
                  boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
                  borderRadius: "10px",
                }}
              >
                {mentionOptions.slice(0, 5).map((user) => (
                  <CustomMenuItem
                    key={user.id}
                    onClick={(e) => {
                      console.log("clciked");
                      console.log("user", user);
                      setMentionOptionClicked(user);
                    }}
                  >
                    <UserInfoTooltip {...user} />
                  </CustomMenuItem>
                ))}
              </Paper>
            )}
            {mentions.length > 0 && (
              <div className="editingMentionsCont">
                <span className="editingMentionsText">Mentions:</span>
                {mentions.map((mention, index) => {
                  const userId = mention;
                  const username = users.find((user) => user.id === userId)?.username;
                  return (
                    <CustomTooltip
                      key={index}
                      title={<UserInfoTooltip username={username} {...getUserDetails(username)} />}
                      arrow
                    >
                      <span className="editingMentionsUsername">@{username}</span>
                    </CustomTooltip>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Box>
      <Box sx={{ display: "flex", gap: "20px", padding: "0px 15px" }}>
        {/* Add comment button */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => handleAddComment()}
          sx={{ ...gradientButtonStyles }}
          // mt: 3, mb: 2
        >
          Add comment
        </Button>
        {/* Cancel button */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => handleCancelAddComment()}
          sx={{ ...outlinedButtonStyles }}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          Cancel
        </Button>
      </Box>
    </div>
  );
}

export default AddCommentContainer;
