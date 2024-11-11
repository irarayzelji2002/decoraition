import React, { useState, useEffect, useRef } from "react";
import { Avatar, Box } from "@mui/material";
import { FaCheckCircle, FaEllipsisH, FaCircle } from "react-icons/fa";
import { stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

function Notif() {
  const { user, userDoc } = useSharedProps();
  const [showOptions, setShowOptions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  const toggleOptions = (e) => {
    const rect = e.target.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom, left: rect.left });
    setShowOptions((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <div className="notif-box">
        <div className="profile-section">
          <div className="profile-info">
            <FaCircle
              style={{
                marginRight: "4px",
                color: "red",
              }}
            />

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
                src={userDoc?.profilePic ? userDoc?.profilePic : ""}
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
              <span className="username"></span>
              <span style={{ fontSize: "0.7rem" }} className="date">
                <strong> Jakob</strong> made a comment on your post
              </span>
              <span style={{ fontSize: "0.7rem" }} className="date">
                <strong>-</strong> "I like the design!"
              </span>
            </div>
          </div>
          <div
            className="profile-status"
            style={{
              marginLeft: "4px",
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "0.5rem" }} className="date">
              <strong>15h</strong>
            </span>
            <FaEllipsisH
              className="options-dots"
              onClick={(e) => {
                e.stopPropagation(); // Prevent the div click event
                toggleOptions(e); // Toggle the options menu
              }}
            />
            {showOptions && (
              <div
                className="dropdown-menu"
                style={{ top: menuPosition.top, left: menuPosition.left - 200 }}
                ref={dropdownRef}
              >
                <div className="dropdown-item">
                  <OpenInNewIcon style={{ fontSize: 20 }} className="icon" />
                  Open
                </div>
                <div className="dropdown-item">
                  <CheckCircleOutlineOutlinedIcon style={{ fontSize: 20 }} className="icon" />
                  Resolve
                </div>
              </div>
            )}
          </div>
        </div>

        <div className=""></div>
      </div>
    </div>
  );
}

export default Notif;
