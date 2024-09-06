import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Password from "./PassInput";
import { GoogleIcon, FacebookIcon } from "./CustomIcons";
import Link from "@mui/material/Link";

const defaultTheme = createTheme();

const commonInputStyles = {
  input: { color: "white", backgroundColor: "#3E3C47", borderRadius: "24px" },
  label: { color: "white" },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "white",
      borderRadius: "24px",
    },
    "&:hover fieldset": {
      borderColor: "white",
      borderRadius: "24px",
    },
    "&.Mui-focused fieldset": {
      borderColor: "white",
      borderRadius: "24px",
    },
  },
  "& .MuiFormHelperText-root": {
    color: "white",
  },
};

const buttonStyles = {
  mt: 3,
  mb: 2,
  backgroundImage: "linear-gradient(20deg, #faa653, #f04f59)",
};

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});
  const [userInfo, setUserInfo] = useState(null);

  const handleValidation = () => {
    let formErrors = {};

    if (!fname) formErrors.fname = "First name is required";
    if (!lname) formErrors.lname = "Last name is required";
    if (!username) formErrors.username = "Username is required";
    if (!email) formErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      formErrors.email = "Invalid email format";
    if (!password) formErrors.password = "Password is required";
    else if (password.length < 6)
      formErrors.password = "Password must be at least 6 characters long";
    else if (!/[!@#$%^&*]/.test(password))
      formErrors.password =
        "Password must contain at least 1 special character";
    if (!confirmPassword)
      formErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      formErrors.confirmPassword = "Passwords do not match";

    return formErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const formErrors = handleValidation();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fname,
        lname,
        username,
        email,
      });

      console.log(user);
      navigate("/login");
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);

      setErrors({
        email:
          errorCode === "auth/email-already-in-use"
            ? "Email already in use"
            : "",
        password:
          errorCode === "auth/weak-password" ? "Password is too weak" : "",
      });
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Extract user information
      const displayName = user.displayName ? user.displayName.split(" ") : [];
      const firstName = displayName[0] || "";
      const lastName = displayName.slice(1).join(" ") || "";
      const email = user.email || "";
      const username = `${firstName}_${lastName}`.toLowerCase();

      // Set user info
      setUserInfo({ firstName, lastName, email, username });

      // Save user info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fname,
        lname,
        email,
        username,
      });

      navigate("/homepage");
      console.log("Google login successful", {
        firstName,
        lastName,
        email,
        username,
      });
    } catch (error) {
      console.error("Google login error", error);
      setErrors({ general: "Google login failed. Please try again." });
    }
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
          <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="fname"
              label="First Name"
              name="fname"
              autoFocus
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              error={!!errors.fname}
              helperText={errors.fname}
              sx={commonInputStyles}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lname"
              label="Last Name"
              name="lname"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              error={!!errors.lname}
              helperText={errors.lname}
              sx={commonInputStyles}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              sx={commonInputStyles}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              sx={commonInputStyles}
            />
            <p
              style={{
                color: "gray",
                fontSize: "12px",
                marginBottom: "-8px",
              }}
            >
              At least 6 characters long, with 1 special character
            </p>
            <Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              sx={commonInputStyles}
            />
            <Password
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={commonInputStyles}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                ...buttonStyles,
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Register
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
        ></Box>
        <Grid container justifyContent="center" alignItems="center">
          <Grid item>
            <Typography variant="body2" sx={{ color: "white", marginRight: 1 }}>
              Already have an account?
            </Typography>
          </Grid>
          <Grid item>
            <Link href="/login" variant="body2" className="cancel-link">
              Login
            </Link>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Signup;
