import React from "react";
import { Avatar, Box } from "@mui/material";
import { FaCheckCircle, FaEllipsisV, FaAt } from "react-icons/fa";
import { stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";

const CommentContainer = () => {
  const { user, userDoc } = useSharedProps();

  return (
    <div className="comment-container">
      <div className="profile-section">
        <div className="profile-info">
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--gradientButton)",
              borderRadius: "50%",
              padding: "2.5px",
              marginRight: "10px",
            }}
          >
            <Avatar
              src={""}
              sx={{
                height: 39,
                width: 39,
                borderRadius: "50%",
                border: "2.5px solid transparent",
                boxShadow: "0 0 0 2.5px var(--gradientButton)",
                "& .MuiAvatar-img": {
                  borderRadius: "50%",
                },
                ...stringAvatarColor(userDoc?.username),
              }}
              children={stringAvatarInitials(userDoc?.username)}
            />
          </Box>
          <div className="user-details">
            <span className="username">Juan Dela Cruz</span>
            <span style={{ fontSize: "0.7rem" }} className="date">
              June 17, 2024
            </span>
          </div>
        </div>
        <div className="profile-status">
          <FaCheckCircle className="check-mark" />
          <FaEllipsisV className="options-dots" />
        </div>
      </div>
      <p> I like the room design! Could we add some more table sheets?</p>
      <div className="reply-input">
        <FaAt className="at-symbol" />
        <input type="text" placeholder="Add a Reply" />
      </div>
    </div>
  );
};

export default CommentContainer;
