import React, { useState, useEffect, useRef } from "react";
import Avatar from "@mui/material/Avatar";
import { FaCheckCircle, FaEllipsisH, FaCircle } from "react-icons/fa";

function Notif() {
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
            <Avatar
              sx={{
                height: 40,
                width: 40,
                borderRadius: "50%",
                marginRight: "10px",
                background: "var(--gradientButton)",
                border: "2px solid var(--brightFont)",
                color: "white", // Optional: to set the text color inside the avatar
              }}
            ></Avatar>
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
                <div className="dropdown-item">Open</div>
                <div className="dropdown-item">Resolve</div>
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
