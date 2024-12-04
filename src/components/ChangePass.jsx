import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Password from "./PassInput";

import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { jwtDecode } from "jwt-decode";
import { showToast } from "../functions/utils";
import { Link, Grid } from "@mui/material";
import { gradientButtonStyles } from "../pages/DesignSpace/PromptBar";

function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
}

export default function ChangePass({ email, token }) {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState("");
  const [isChangePassBtnDisabled, setIsChangePassBtnDisabled] = useState(false);

  useEffect(() => {
    const checkTokenExpiration = () => {
      if (isTokenExpired(token)) {
        showToast("error", "Your session has expired. Please try again.");
        navigate("/forgot");
      }
    };
    checkTokenExpiration();
    const intervalId = setInterval(checkTokenExpiration, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [token, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    let formErrors = {};
    if (!newPassword) formErrors.newPassword = "Password is required";
    else {
      if (newPassword.length < 6)
        formErrors.newPassword = "Password must be at least 6 characters long";
      if (!/[!@#$%^&*]/.test(newPassword))
        formErrors.newPassword = "Password must contain at least 1 special character";
    }
    if (!confirmPassword) formErrors.confirmPassword = "Confirm password is required";
    else if (confirmPassword !== newPassword) formErrors.confirmPassword = "Passwords do not match";

    // Returning early if there are form errors
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return { formErrors, finalData: null };
    }

    try {
      setIsChangePassBtnDisabled(true);
      const response = await axios.put("/api/change-password", { email, newPassword, token });
      if (response.data.success) {
        showToast("success", "Password changed successfully");
        navigate("/login");
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message) {
        // Handle the case where new password matches old password
        setErrors({
          newPassword: error.response.data.message,
        });
      } else {
        showToast("error", error.response?.data?.message || "Failed to change password");
      }
    } finally {
      setIsChangePassBtnDisabled(false);
    }
  };

  return (
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
        <h2
          style={{
            marginLeft: "10px",
            textAlign: "center",
            margin: "0px 20px 20px 20px",
            fontSize: "1.8rem",
          }}
        >
          Change your password
        </h2>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <span className="formLabels">
            New password
            <span style={{ color: "var(--color-quaternary)" }}> *</span>
          </span>
          <p
            style={{
              color: "gray",
              fontSize: "12px",
              margin: 0,
            }}
          >
            At least 6 characters long, with 1 special character
          </p>
          <Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!errors.newPassword}
            label="Enter your new password"
            helperText={errors.newPassword}
          />
          <span className="formLabels">
            Confirm new password
            <span style={{ color: "var(--color-quaternary)" }}> *</span>
          </span>
          <Password
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            label="Confirm your new password"
            helperText={errors.confirmPassword}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              ...gradientButtonStyles,
              mt: "24px !important",
              mb: "16px !important",
              opacity: isChangePassBtnDisabled ? "0.5" : "1",
              cursor: isChangePassBtnDisabled ? "default" : "pointer",
              "&:hover": {
                backgroundImage: !isChangePassBtnDisabled && "var(--gradientButtonHover)",
              },
            }}
            disabled={isChangePassBtnDisabled}
          >
            Change Password
          </Button>
          <Grid container>
            <Grid item xs>
              <Link href="/login" variant="body2" className="cancel-link">
                Cancel
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
