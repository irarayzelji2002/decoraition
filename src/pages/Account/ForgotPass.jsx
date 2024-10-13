import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import "../../css/forgotPass.css";
import { handleForgotPassword } from "../../firebase";
import { useState } from "react"; // Import your forgot password function

// TODO: remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function ForgotPass1() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Basic email validation
    if (!email) {
      setEmailError("Email is required.");
      return;
    }

    setEmailError(""); // Clear previous error if any

    // Call the forgot password function
    handleForgotPassword(email);
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
            alignItems: "center",
          }}
        >
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <span className="formLabels">Email Address</span>
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
              sx={{
                marginTop: "10px",
                marginBottom: "10px",
                backgroundColor: "var(--inputBg)",
                input: { color: "var(--color-white)" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "var(--borderInput)", // Border color when not focused
                    borderWidth: "2px", // Adjust the border thickness here
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--borderInput)", // Border color on hover
                    borderWidth: "2px", // Maintain the thickness on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--brightFont)", // Border color when focused
                    borderWidth: "2px", // Maintain the thickness on focus
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: "white",
                },
              }}
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
    </ThemeProvider>
  );
}
