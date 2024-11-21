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

export default function ForgotPass1() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

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
    try {
      const response = await axios.post("/api/forgot-password", { email });
      if (response.data.success) {
        setEmailError("");
        navigate("/otp", { state: { email } });
      }
    } catch (error) {
      setEmailError(error.response.data.message || "An error occurred");
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
              mt: 3,
              mb: 2,
              backgroundImage: "linear-gradient(90deg, #f89a47, #f15f3e, #ec2073);",
              borderRadius: "20px",
              textTransform: "none",
              fontWeight: "bold",
              "&:hover": {
                backgroundImage: "var(--gradientButtonHover)",
              },
            }}
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
