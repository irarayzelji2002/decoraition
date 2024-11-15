import React from "react";
import { Avatar, Box, IconButton, Button } from "@mui/material";
import { FaCheckCircle, FaEllipsisV, FaAt } from "react-icons/fa";
import { CheckRounded as CheckRoundedicon, MoreVert as MoreVertIcon } from "@mui/icons-material";
import { stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { iconButtonStylesBrighter } from "../Homepage/DrawerComponent.jsx";

const CommentContainer = ({
  commemtId,
  username,
  date,
  comment,
  hasTextBox = false,
  replyCount = 0,
  replyLatestDate,
  setActiveComment,
}) => {
  const { user, userDoc } = useSharedProps();

  return (
    <div
      className="comment-container"
      onClick={() => {
        console.log("parent clicked");
        setActiveComment(commemtId);
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
              src={userDoc?.profilePic ? userDoc?.profilePic : ""}
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
            sx={{ ...iconButtonStylesBrighter, padding: "6.2px" }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("child clicked");
            }}
          >
            <CheckRoundedicon sx={{ color: "var(--comment-capsule)", transform: "scale(1.2)" }} />
          </IconButton>
          <IconButton
            sx={{ ...iconButtonStylesBrighter, padding: "3px" }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("child2 clicked");
            }}
          >
            <MoreVertIcon
              sx={{ fontSize: "1.9rem", color: "var(--color-white)", transform: "scale(0.9)" }}
            />
          </IconButton>
        </div>
      </div>
      <p style={{ cursor: "auto" }} onClick={(e) => e.stopPropagation()}>
        {comment}
      </p>
      {hasTextBox ? (
        <div className="replies-details">
          <span
            style={{ cursor: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >{`${replyCount} replies`}</span>
          <span className="gradient-bullet"></span>
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
