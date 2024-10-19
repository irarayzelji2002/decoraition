import React from "react";
import Avatar from "@mui/material/Avatar";
import { FaCheckCircle, FaEllipsisV, FaAt } from "react-icons/fa";

const CommentContainer = () => {
  return (
    <div className="comment-container">
      <div className="profile-section">
        <div className="profile-info">
          <Avatar
            sx={{
              height: 30,
              width: 30,
              borderRadius: "50%",
              marginRight: "10px",
              background: "var(--gradientButton)",
              border: "2px solid var(--brightFont)",
              color: "white", // Optional: to set the text color inside the avatar
            }}
          ></Avatar>
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

      <div className="reply-input">
        <FaAt className="at-symbol" />
        <input type="text" placeholder="Add a Reply" />
      </div>
    </div>
  );
};

export default CommentContainer;
