import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import "../../css/forgotPass.css";
import { useState } from "react"; // Import your forgot password function
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { commonInputStyles } from "../../components/Signup";
import { textFieldInputProps } from "../DesignSpace/DesignSettings";
import { gradientButtonStyles } from "../DesignSpace/PromptBar";

export default function ForgotPass1() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isContinueBtnDisabled, setIsContinueBtnDisabled] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);

    // Email validation
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Invalid email format");
      return;
    }

    // Call endpoint to check if email exists before sending otp & redorect to otp page
    setIsContinueBtnDisabled(true);
    try {
      const response = await axios.post("/api/forgot-password", { email });
      if (response.data.success) {
        setEmailError("");
        navigate("/otp", { state: { email } });
      }
    } catch (error) {
      setEmailError(error.response.data.message || "An error occurred");
    } finally {
      setIsContinueBtnDisabled(false);
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
          alignItems: "center",
        }}
      >
        <h2
          style={{
            marginLeft: "10px",
            textAlign: "center",
            margin: "0px 20px 30px 20px",
            fontSize: "1.8rem",
          }}
        >
          Enter your email address
        </h2>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <span className="formLabels">Email address</span>
          <TextField
            required
            fullWidth
            placeholder="Enter your email address"
            name="email"
            autoComplete="email"
            autoFocus
            id="email-address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            sx={commonInputStyles}
            inputProps={textFieldInputProps}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              ...gradientButtonStyles,
              mt: "24px !important",
              mb: "16px !important",
              opacity: isContinueBtnDisabled ? "0.5" : "1",
              cursor: isContinueBtnDisabled ? "default" : "pointer",
              "&:hover": {
                backgroundImage: !isContinueBtnDisabled && "var(--gradientButtonHover)",
              },
            }}
            disabled={isContinueBtnDisabled}
          >
            Continue
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
