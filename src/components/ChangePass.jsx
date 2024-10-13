import * as React from "react";
import { useSearchParams } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import Password from "./PassInput";
import { useState, useEffect } from "react";

const defaultTheme = createTheme();

export default function ChangePass() {
  const [searchParams] = useSearchParams();
  const actionCode = searchParams.get("oobCode");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Verify the password reset code
    verifyPasswordResetCode(auth, actionCode)
      .then((email) => {
        // Email verified, proceed to reset password
        console.log("Email verified:", email);
      })
      .catch((error) => {
        setError("Invalid or expired action code.");
        console.error("Error verifying code:", error);
      });
  }, [actionCode]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    confirmPasswordReset(auth, actionCode, newPassword)
      .then(() => {
        setSuccess("Password has been reset successfully.");
        navigate("/"); // Redirect to home page on success
      })
      .catch((error) => {
        setError("Failed to reset password.");
        console.error("Error resetting password:", error);
      });
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <p
              style={{
                color: "gray",
                fontSize: "12px",
              }}
            >
              At least 6 characters long, with 1 special character
            </p>
            <span className="formLabels">
              New Password
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <Password
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!error}
              helperText={error}
            />
            <span className="formLabels">
              Confirm New Password
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <Password
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!error}
              label="Confirm Password"
              helperText={error}
            />
            {success && <Typography color="primary">{success}</Typography>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                backgroundImage: "linear-gradient(90deg, #f89a47, #f15f3e, #ec2073);",
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Change Password
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
