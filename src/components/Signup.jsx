import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { showToast } from "../functions/utils";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Link from "@mui/material/Link";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const defaultTheme = createTheme();

const commonInputStyles = {
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
};

const buttonStyles = {
  mt: 3,
  mb: 2,
  backgroundImage: "var(--gradientButton)",
  "&:hover": {
    backgroundImage: "var(--gradientButtonHover)",
  },
};
const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleValidation = () => {
    let formErrors = {};

    if (!firstName) formErrors.firstName = "First name is required";
    if (!lastName) formErrors.lastName = "Last name is required";
    if (!username) formErrors.username = "Username is required";
    if (!email) formErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) formErrors.email = "Invalid email format";
    if (!password) formErrors.password = "Password is required";
    else if (password.length < 6)
      formErrors.password = "Password must be at least 6 characters long";
    else if (!/[!@#$%^&*]/.test(password))
      formErrors.password = "Password must contain at least 1 special character";
    if (!confirmPassword) formErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) formErrors.confirmPassword = "Passwords do not match";
    if (!isChecked) formErrors.terms = "You must agree to the terms and conditions";

    return formErrors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formErrors = handleValidation();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const response = await axios.post("/api/register", {
        firstName,
        lastName,
        username,
        email,
        password,
      });
      if (response.status === 200) {
        showToast("success", "Registration successful!");
        navigate("/login");
      } else {
        showToast("error", "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errMessage = error.response?.data?.message;
      if (errMessage === "Username already in use") {
        formErrors.username = "Username already in use";
        setErrors(formErrors);
      } else if (errMessage === "Email already in use") {
        formErrors.email = "Email already in use";
        setErrors(formErrors);
      } else {
        showToast("error", errMessage || "An error occurred during registration");
      }
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
          <Box component="form" onSubmit={handleRegister} noValidate sx={{ mt: 1 }}>
            <span className="formLabels">
              First Name
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              placeholder="Enter your first name"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={!!errors.firstName}
              helperText={errors.firstName}
              sx={commonInputStyles}
            />
            <span className="formLabels">
              Last Name
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              placeholder="Enter your last name"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={!!errors.lastName}
              helperText={errors.lastName}
              sx={commonInputStyles}
            />
            <span className="formLabels">
              Username
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              placeholder="Enter your username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              sx={commonInputStyles}
            />
            <span className="formLabels">
              Email Address
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              placeholder="Enter your email address"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              sx={commonInputStyles}
            />
            <p style={{ color: "gray", fontSize: "12px" }}>
              At least 6 characters long, with 1 special character
            </p>
            <span className="formLabels">
              Password
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      sx={{
                        color: "var(--color-white)",
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={commonInputStyles}
            />
            <span className="formLabels">
              Confirm Password
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              id="confirm-password"
              name="confirmPassword" // Ensure correct name attribute
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword} // Changed from password to confirmPassword
              onChange={(e) => setConfirmPassword(e.target.value)} // Update handler
              error={!!errors.confirmPassword} // Updated error reference
              helperText={errors.confirmPassword} // Updated helper text reference
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      sx={{
                        color: "var(--color-white)",
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={commonInputStyles}
            />{" "}
            <TermsCheckbox isChecked={isChecked} setIsChecked={setIsChecked} errors={errors} />
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

const TermsCheckbox = ({ isChecked, setIsChecked, errors }) => {
  const handleChange = (event) => {
    setIsChecked(event.target.checked);
  };

  return (
    <div className="terms-checkbox">
      <FormControlLabel
        control={
          <Checkbox
            checked={isChecked}
            onChange={handleChange}
            sx={{
              color: "var(--color-white)",
              "&.Mui-checked": {
                color: "var(--brightFont)",
              },
              borderRadius: "4px",
              "& .MuiSvgIcon-root": {
                fontSize: 28,
              },
            }}
          />
        }
        label={
          <label htmlFor="terms">
            I understand and agree with{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy & Policy
            </a>
            .
          </label>
        }
      />
      {errors?.terms && <p className="error-text">{errors.terms}</p>}
    </div>
  );
};
