import React from "react";
import { Tabs, Tab, Select, MenuItem } from "@mui/material";
import CommentContainer from "./CommentContainer";
function CommentTabs({ activeTab, handleTabChange, status, handleStatusChange }) {
  return (
    <div className="comment-section">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        TabIndicatorProps={{
          style: {
            backgroundImage: "var(--gradientFont)", // Customize the indicator color
          },
        }}
      >
        <Tab
          className={`tabStyle ${activeTab === 0 ? "Mui-selected" : ""}`}
          label={<span style={{ fontWeight: "bold", textTransform: "none" }}>All Comments</span>}
        />
        <Tab
          className={`tabStyle ${activeTab === 1 ? "Mui-selected" : ""}`}
          label={<span style={{ fontWeight: "bold", textTransform: "none" }}>For You</span>}
        />
      </Tabs>

      <Select value={status} onChange={handleStatusChange} displayEmpty className="status-select">
        <MenuItem value="Open">Open</MenuItem>
        <MenuItem value="Resolved">Resolved</MenuItem>
      </Select>

      {activeTab === 0 && (
        <>
          <CommentContainer />
          <button className="add-comment-button">Add a comment</button>
        </>
      )}
      {activeTab === 1 && (
        <>
          <CommentContainer />
          <button className="add-comment-button">Add a comment</button>
        </>
      )}
    </div>
  );
}

export default CommentTabs;
