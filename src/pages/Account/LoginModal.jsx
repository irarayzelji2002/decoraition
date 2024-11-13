import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { parseFullName } from "parse-full-name";
import { showToast, capitalizeFieldName } from "../../functions/utils";
import { GoogleIcon, FacebookIcon } from "../../components/CustomIcons";
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { handleLogout } from "../Homepage/backend/HomepageFunctions";
import { textFieldInputProps } from "../DesignSpace/DesignSettings";
import { commonInputStyles } from "../../components/Signup";
import { CheckboxIcon, CheckboxCheckedIcon } from "../../components/svg/SharedIcons";

export default function LoginModal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleValidation = () => {
    let formErrors = {};
    if (!email) {
      formErrors.email = "Email is required";
    }
    if (!password) {
      formErrors.password = "Password is required";
    }
    return formErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formErrors = handleValidation();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.error("No user document found!");
        handleLogout(navigate);
        return;
      }
      const userDataNoId = userDoc.data();
      const userData = {
        ...userDataNoId,
        id: user.uid,
      };
      showToast("success", "Login successful!");
      setTimeout(() => navigate("/homepage", { state: { userData } }), 1000);
    } catch (error) {
      console.error("Login error:", error);
      console.log(error.message);
      showToast("error", "Login failed. Please try again.");
      setErrors({ general: "Login failed. Please try again." });
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      let acctProvider;
      let connectedAccount;
      if (provider === "google") {
        acctProvider = new GoogleAuthProvider();
        connectedAccount = 0;
      } else if (provider === "facebook") {
        acctProvider = new FacebookAuthProvider();
        connectedAccount = 1;
      }

      const result = await signInWithPopup(auth, acctProvider);
      const user = result.user;

      // Check if user exists
      try {
        const response = await axios.post("/api/login-with-oauth", { user, connectedAccount });

        if (response.status === 200) {
          const { userData } = response.data;
          if (userData) {
            // User exists, complete login
            showToast("success", `Successfully logged in with ${capitalizeFieldName(provider)}!`);
            setTimeout(() => navigate("/homepage", { state: { userData } }), 1000);
            return;
          }
          // If userData is null, continue to create a new account
        } else {
          console.error(response.data.message);
          return;
        }
      } catch (error) {
        console.error("Login error:", error);
        showToast("error", "An error occurred.");
        return;
      }

      // If we reach here, the user doesn't exist, so we create a new account
      if (!user || !user.uid || !user.displayName || !user.email || !user.photoURL) {
        throw new Error("Incomplete user data received");
      }

      const { first: firstName, last: lastName } = parseFullName(user.displayName);
      const userData = {
        firstName: firstName,
        lastName: lastName,
        username: user.email.split("@")[0],
        email: user.email,
        connectedAccount: provider === "google" ? 0 : provider === "facebook" ? 1 : null, // Google or Facebook
        profilePic: user.photoURL,
        userId: user.uid,
      };

      // Check if email and username exist
      const emailExists = await checkExistingEmail(user.email);
      if (emailExists) {
        showToast("error", `Email "${user.email}" already in use by another account.`);
        cleanupUnusedAuthUsers(user);
        return;
      }
      const usernameExists = await checkExistingUsername(user.email);
      if (usernameExists) {
        showToast(
          "error",
          `Username "${user.email.split("@")[0]}" already in use by another account`
        );
        cleanupUnusedAuthUsers(user);
        return;
      }

      // Call API to create new user
      const createResponse = await axios.post("/api/register", userData);

      if (createResponse.status === 200) {
        showToast("success", `Successfully signed up with ${capitalizeFieldName(provider)}!`);
        setTimeout(() => navigate("/homepage"), 1000);
      } else {
        throw new Error("Failed to create user");
      }
    } catch (error) {
      console.error("Google login/signup error:", error);
      showToast("error", "Google login/signup failed. Please try again.");
    }
  };

  const cleanupUnusedAuthUsers = async (user) => {
    try {
      const response = await axios.delete("/api/cleanup-unused-auth-users", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });
      console.log(response.data.message);
    } catch (error) {
      console.error("Error cleaning up unused auth users:", error);
    }
  };

  const checkExistingEmail = async (email) => {
    try {
      const response = await axios.get(`/api/check-existing-email/${email}`);
      if (response.status === 200) {
        console.log(response.data.message);
        return false;
      } else {
        console.error("Unexpected response:", response);
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      return true;
    }
  };

  const checkExistingUsername = async (userId, username) => {
    try {
      const response = await axios.get(`/api/check-existing-username/${username}`);
      if (response.status === 200) {
        console.log(response.data.message);
        return false;
      } else {
        console.error("Unexpected response:", response);
        return true;
      }
    } catch (error) {
      console.error("Checking username:", error);
      if (error.response) {
        console.error("Error response data:", error?.response?.data?.error);
      }
      return true;
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
          width: "100%",
        }}
      >
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
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
            error={!!errors.email}
            helperText={errors.email}
            sx={{ ...commonInputStyles, marginBottom: "20px" }}
            inputProps={textFieldInputProps}
          />

          <span className="formLabels">Password</span>
          <TextField
            required
            fullWidth
            label="" // or simply omit this line
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              style: { color: "var(--color-white)" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    sx={{
                      color: "var(--color-grey)",
                      marginRight: "-9px",
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ ...commonInputStyles, marginBottom: "15px" }}
          />

          {errors.general && (
            <Typography color="error" variant="body2">
              {errors.general}
            </Typography>
          )}

          <Grid container alignItems="center">
            <Grid item>
              <FormControlLabel
                control={
                  <Checkbox
                    value="remember"
                    sx={{
                      color: "var(--color-white)",
                      "&.Mui-checked": {
                        color: "var(--brightFont)",
                      },
                      borderRadius: "50%",
                      "& .MuiSvgIcon-root": {
                        fontSize: 28,
                      },
                      "&:hover": {
                        backgroundColor: "var(--iconButtonHover)",
                      },
                      "&:active": {
                        backgroundColor: "var(--iconButtonActive)",
                      },
                    }}
                    icon={<CheckboxIcon />}
                    checkedIcon={<CheckboxCheckedIcon />}
                  />
                }
                label="Remember me"
                sx={{
                  color: "var(--color-white)",
                  "& .MuiTypography-root": {
                    marginLeft: "3px",
                  },
                }}
              />
            </Grid>
            <Grid item xs>
              <Box display="flex" justifyContent="flex-end">
                <Link
                  href="/forgot"
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: "var(--brightFont)",
                    textDecoration: "underline",
                    "&:hover": {
                      color: "var(--brightFontHover)",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              backgroundImage: "var(--gradientButton)",
              borderRadius: "20px",
              textTransform: "none",
              fontWeight: "bold",
              "&:hover": {
                backgroundImage: "var(--gradientButtonHover)",
              },
            }}
          >
            Login
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
        }}
      >
        <Button
          type="button"
          fullWidth
          onClick={() => handleOAuthLogin("google")}
          startIcon={<GoogleIcon />}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            color: "var(--color-white)",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "20px",
            marginBottom: "5px",
            "&:hover": {
              background: "transparent",
              color: "var(--color-white)",
              backgroundColor: "var(--iconButtonHover)",
            },
            "&:active": {
              backgroundColor: "var(--iconButtonHoverActive)",
              boxShadow: "none",
            },
            "&:focus": {
              outline: "none",
              boxShadow: "none",
            },
            maxWidth: "400px",
          }}
        >
          Login with Google&nbsp;&nbsp;&nbsp;&nbsp;
        </Button>
        <Button
          type="button"
          fullWidth
          onClick={() => handleOAuthLogin("facebook")}
          startIcon={<FacebookIcon />}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            color: "var(--color-white)",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "20px",
            marginBottom: "5px",
            "&:hover": {
              background: "transparent",
              color: "var(--color-white)",
              backgroundColor: "var(--iconButtonHover)",
            },
            "&:active": {
              backgroundColor: "var(--iconButtonHoverActive)",
              boxShadow: "none",
            },
            "&:focus": {
              outline: "none",
              boxShadow: "none",
            },
            maxWidth: "400px",
            marginTop: "-12px",
          }}
        >
          Login with Facebook
        </Button>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "15px ",
        }}
      >
        Don&apos;t have an account?&nbsp;
        <Link href="/register" variant="body2" className="cancel-link">
          Sign Up
        </Link>
      </Typography>
    </Container>
  );
}
