import React, { useState, useEffect, useRef } from "react";
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
  styled,
} from "@mui/material";
import { FaCheckCircle, FaEllipsisV, FaAt } from "react-icons/fa";
import {
  CheckRounded as CheckRoundedicon,
  MoreVert as MoreVertIcon,
  UnfoldMoreRounded as UnfoldMoreRoundedIcon,
  UnfoldLessRounded as UnfoldLessRoundedIcon,
  AlternateEmailRounded as AlternateEmailRoundedIcon,
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
import { SaveIconSmallGradient } from "./svg/AddImage.jsx";
import { CheckIconSmallGradient, MentionIconSmallGradient } from "./svg/AddColor.jsx";

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
  optionsState,
  setOptionsState = () => {},
  selectedId = "",
  setSelectedId = () => {},
}) => {
  const { designId } = useParams();
  const { user, userDoc } = useSharedProps();

  // Root comment states for display
  const [commentId, setCommentId] = useState("");
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

  // Editing comment states
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [updatedCommentContent, setUpdatedCommentContent] = useState("");
  const [updatedMentions, setUpdatedMentions] = useState([]);

  // errors.addComment for adding comment
  // errors.editComment for editing comment
  // errors.addReply for replying comment
  // errors.editReply for editing reply to a comment
  const [errors, setErrors] = useState({});

  // Modal states
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] = useState(false);
  const [isDeleteReplyModalOpen, setIsDeleteReplyModalOpen] = useState(false);

  const dropdownRef = useRef(null);

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
    setCommentId(comment.id);
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
    setIsDeleteCommentModalOpen(true);
    toggleOptions(commentId);
  };

  const handleCancelEditComment = () => {
    setUpdatedCommentContent(commentContent);
    setUpdatedMentions(mentions);
    setIsEditingComment(false);
  };

  const openCollaboratorsSelect = () => {
    setOpenMentionOptions(true);
    // if design.designSettings.generalAccessSetting === 0 (restricted), collaborators are design.owner/ design.editors/ design.commenters (design.viewers excluded)
    // if deisgn.designSettings.generalAccessSetting === 1 (anyone with link), collaborators are all users in users collection
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

  const handleAddReply = async () => {};

  const handleEditReply = async () => {};

  const handleDeleteReply = async () => {};

  return (
    <div
      className={`comment-container ${selectedId === commentId && "active"}`}
      onClick={() => {
        console.log("parent clicked");
        setSelectedId(commentId);
      }}
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
          <IconButton
            sx={{ ...iconButtonStylesBrighter, padding: "8px", marginRight: "-1px" }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("child clicked");
            }}
          >
            <CheckIconSmallGradient />
          </IconButton>
          <IconButton
            sx={{
              ...iconButtonStylesBrighter,
              padding: 0,
              height: "38px",
              width: "38px",
              marginRight: "-8px",
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
                  sx={{ fontSize: "1.9rem", color: "var(--color-white)", transform: "scale(0.9)" }}
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <p
        style={{ cursor: "auto", textAlign: "justify", textJustify: "inter-word" }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isEditingComment ? (
          commentContent
        ) : (
          <TextField
            label=""
            type="text"
            multiline
            placeholder="Comment or mention someone"
            value={updatedCommentContent}
            onChange={(e) => setUpdatedCommentContent(e.target.value)}
            disabled={!isEditingComment}
            fullWidth
            margin="normal"
            helperText={errors?.editComment}
            sx={{
              ...textFieldStyles,
              margin: 0,
              backgroundColor: "transparent",
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                backgroundColor: "transparent",
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
              "@media (max-width: 560px)": {
                "& input": {
                  padding: "15px",
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isEditingComment && (
                    <>
                      <IconButton
                        onClick={openCollaboratorsSelect}
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
                        onClick={handleEditComment}
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
      </p>
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
        <div className="reply-input">
          <FaAt className="at-symbol" />
          <input type="text" placeholder="Add a Reply" />
        </div>
      )}
    </div>
  );
};

export default CommentContainer;
