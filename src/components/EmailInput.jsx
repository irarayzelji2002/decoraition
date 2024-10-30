import React, { useState } from "react";
import { Chip, TextField, Box, InputAdornment, Divider } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { AddCollaborators } from "../pages/DesignSpace/svg/AddImage";

const EmailInput = () => {
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      const email = event.target.value.trim();
      if (email && validateEmail(email)) {
        setEmails([...emails, email]);
        setInputValue("");
      }
    }
  };

  const handleDelete = (email) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box display="flex" justifyContent="start" alignItems="center">
        <AddCollaborators />
        <input // Input field at the top
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter email"
          style={{
            backgroundColor: "transparent",
            color: "var(--color-white)",
            border: "none",
            outline: "none",
          }}
          // Add margin-bottom for spacing
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginLeft: "16px" }}>
        {emails.map((email, index) => (
          <Chip
            key={index}
            label={email}
            onDelete={() => handleDelete(email)}
            sx={{
              height: 24,
              margin: 0.5,
              backgroundColor: "var(--budgetCard)",
              color: "var(--color-white)",
              "&:hover": {
                backgroundColor: "var(--color-tertiary)",
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default EmailInput;
