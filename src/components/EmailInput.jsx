import React, { useState } from "react";
import { Chip, TextField, Box, InputAdornment, Divider, Typography } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { AddCollaborators } from "../pages/DesignSpace/svg/AddImage";

const EmailInput = ({ emails, setEmails, error, setError }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      const email = event.target.value.trim().toLowerCase(); // Convert to lowercase
      if (email && validateEmail(email)) {
        // Check if email already exists (case-insensitive)
        const isDuplicate = emails.some((existingEmail) => existingEmail.toLowerCase() === email);

        if (isDuplicate) {
          setError("Email already added");
        } else {
          setEmails([...emails, email]);
          setInputValue("");
        }
      }
      if (event.key === ",") {
        event.preventDefault();
      }
    }
    if (error) setError("");
  };

  const handleDelete = (email) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const validateEmail = (email) => {
    email = email.toLowerCase();
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
          placeholder="Enter email addresses"
          style={{
            backgroundColor: "transparent",
            color: "var(--color-white)",
            border: "none",
            outline: "none",
            fontSize: "1rem",
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
      {error && (
        <Typography
          variant="caption"
          sx={{
            margin: "5px 20px 10px 63px",
            display: "flex",
            justifyContent: "flex-start",
            color: "var(--errorText)",
            fontSize: "0.875em",
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default EmailInput;
