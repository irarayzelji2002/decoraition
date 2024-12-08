import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { showToast } from "../functions/utils";
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
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { textFieldInputProps } from "../pages/DesignSpace/DesignSettings";
import { CheckboxIcon, CheckboxCheckedIcon } from "./svg/SharedIcons";
import { gradientButtonStyles } from "../pages/DesignSpace/PromptBar";

const defaultTheme = createTheme();

export const commonInputStyles = {
  marginTop: "10px",
  marginBottom: "10px",
  input: { color: "var(--color-white)" },
  borderRadius: "10px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: 2, // border thickness
  },
  "& .MuiOutlinedInput-root": {
    borderColor: "var(--borderInput)",
    borderRadius: "10px",
    backgroundColor: "var(--nav-card-modal)",
    "& fieldset": {
      borderColor: "var(--borderInput)",
      borderRadius: "10px",
    },
    "&:hover fieldset": {
      borderColor: "var(--borderInput)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--borderInputBrighter)",
    },
  },
  "& .MuiFormHelperText-root": {
    color: "var(--color-quaternary)",
    marginLeft: 0,
  },
  "& .Mui-error": {
    color: "var(--color-quaternary) !important",
    "& fieldset": {
      borderColor: "var(--color-quaternary) !important",
      borderRadius: "10px",
    },
    "&:hover fieldset": {
      borderColor: "var(--color-quaternary) !important",
    },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const [passwordValidation, setPasswordValidation] = useState({
    valid: true,
    message: "",
    color: "",
  });

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    clearFieldError("password");

    // Only validate if password has length
    if (newPassword.length > 0) {
      const validation = isPasswordValid(newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ valid: true, message: "", color: "" });
    }

    // Update password match if confirm password exists
    if (confirmPassword.length > 0) {
      setPasswordMatch(newPassword === confirmPassword);
    }
  };

  // Modified confirm password change handler
  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    clearFieldError("confirmPassword");

    // Only check match if confirm password has length
    if (newConfirmPassword.length > 0) {
      setPasswordMatch(password === newConfirmPassword);
    } else {
      setPasswordMatch(null);
    }
  };

  // Remove only the specified field error
  const clearFieldError = (field) => {
    setErrors((prevErrors) => {
      if (prevErrors && prevErrors[field]) {
        const { [field]: _, ...remainingErrors } = prevErrors;
        return remainingErrors;
      }
      return prevErrors;
    });
  };

  const handleValidation = () => {
    let formErrors = {};

    if (!firstName.trim()) formErrors.firstName = "First name is required";
    else if (firstName.trim().length > 50)
      formErrors.firstName = "First name cannot exceed 50 characters";
    if (!lastName.trim()) formErrors.lastName = "Last name is required";
    else if (lastName.trim().length > 50)
      formErrors.lastName = "Last name cannot exceed 50 characters";
    if (!username.trim()) formErrors.username = "Username is required";
    else if (username.trim().length > 20)
      formErrors.username = "Username cannot exceed 20 characters";
    else if (/\s/.test(username.trim())) formErrors.username = "No spaces allowed";
    if (!email.trim()) formErrors.email = "Email is required";
    else if (email.trim().length > 254) formErrors.email = "Email cannot exceed 254 characters";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) formErrors.email = "Invalid email format";
    if (!password) {
      formErrors.password = "Password is required";
    } else if (password.length < 6) {
      formErrors.password = "Password must be at least 6 characters long";
    } else if (/^\s|\s$/.test(password)) {
      formErrors.password = "Password cannot start or end with spaces";
    } else if (!/[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) {
      formErrors.password = "Password must contain at least one special character";
    } else if (/[\t\n\r]/.test(password)) {
      formErrors.password = "Password cannot contain non-visible characters like tabs or newlines";
    }
    if (!confirmPassword) formErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) formErrors.confirmPassword = "Passwords do not match";
    if (!isChecked) formErrors.terms = "Please agree to the Privacy and Terms";

    return formErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formErrors = handleValidation();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post("/api/register", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      if (response.status === 200) {
        showToast(
          "success",
          "Registration successful! Please verify your email by clicking the link sent to your inbox.",
          6000
        );
        console.log(
          `register - userId and message: ${response.data?.userId}; ${response.data?.message}`
        );
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = (password) => {
    // Don't check if password is empty
    if (password.length === 0) return { valid: true, message: "" };
    if (password.length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters long",
        color: "var(--color-quaternary)",
      };
    }
    if (/^\s|\s$/.test(password)) {
      return {
        valid: false,
        message: "Password cannot start or end with spaces",
        color: "var(--color-quaternary)",
      };
    }
    if (!/[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one special character",
        color: "var(--color-quaternary)",
      };
    }
    if (/[\t\n\r]/.test(password)) {
      return {
        valid: false,
        message: "Password cannot contain non-visible characters like tabs or newlines",
        color: "var(--color-quaternary)",
      };
    }
    return { valid: true, message: "Password is valid", color: "var(--brightGreen)" };
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
            <span className="formLabels">
              First name
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              placeholder="Enter your first name"
              name="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError("firstName");
              }}
              error={!!errors.firstName}
              helperText={
                errors.firstName || (firstName.length >= 50 ? "Character limit reached!" : "")
              }
              InputProps={textFieldInputProps}
              inputProps={{ maxLength: 50 }}
              sx={{ ...commonInputStyles, marginBottom: "20px" }}
            />
            <span className="formLabels">
              Last name
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              placeholder="Enter your last name"
              name="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError("lastName");
              }}
              error={!!errors.lastName}
              helperText={
                errors.lastName || (lastName.length >= 50 ? "Character limit reached!" : "")
              }
              InputProps={textFieldInputProps}
              inputProps={{ maxLength: 50 }}
              sx={{ ...commonInputStyles, marginBottom: "20px" }}
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
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              error={!!errors.username}
              helperText={
                errors.username || (username.length >= 20 ? "Character limit reached!" : "")
              }
              InputProps={textFieldInputProps}
              inputProps={{ maxLength: 20 }}
              sx={{ ...commonInputStyles, marginBottom: "20px" }}
            />
            <span className="formLabels">
              Email address
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <TextField
              required
              fullWidth
              placeholder="Enter your email address"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              error={!!errors.email}
              helperText={errors.email || (email.length >= 255 ? "Character limit reached!" : "")}
              InputProps={textFieldInputProps}
              inputProps={{ maxLength: 255 }}
              sx={{ ...commonInputStyles, marginBottom: "20px" }}
            />

            <span className="formLabels">
              Password
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </span>
            <p style={{ color: "gray", fontSize: "12px", margin: 0 }}>
              At least 6 characters long, with 1 special character
            </p>
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              error={!!errors.password || (!passwordValidation.valid && password.length > 0)}
              helperText={
                errors.password ||
                (password.length >= 128
                  ? "Character limit reached!"
                  : password.length > 0
                  ? passwordValidation.message
                  : "")
              }
              FormHelperTextProps={{
                style: {
                  color: password.length > 0 ? passwordValidation.color : "var(--color-quaternary)",
                },
              }}
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
              inputProps={{ maxLength: 128 }}
              sx={{ ...commonInputStyles, marginBottom: "20px" }}
            />
            <span className="formLabels">
              Confirm password
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
              onChange={handleConfirmPasswordChange} // Update handler
              error={
                !!errors.confirmPassword || (passwordMatch === false && confirmPassword.length > 0)
              }
              helperText={
                errors.confirmPassword ||
                (confirmPassword.length >= 128
                  ? "Character limit reached!"
                  : confirmPassword.length > 0
                  ? passwordMatch === false
                    ? "Passwords do not match"
                    : passwordMatch === true
                    ? "Passwords match"
                    : ""
                  : "")
              }
              FormHelperTextProps={{
                style: {
                  color:
                    confirmPassword.length > 0
                      ? passwordMatch === false
                        ? "var(--color-quaternary)"
                        : "var(--brightGreen)"
                      : "var(--color-quaternary)",
                },
              }}
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
              inputProps={{ maxLength: 128 }}
              sx={{ ...commonInputStyles, marginBottom: "20px" }}
            />
            <TermsCheckbox
              isChecked={isChecked}
              setIsChecked={setIsChecked}
              errors={errors}
              clearFieldError={clearFieldError}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                ...gradientButtonStyles,
                marginTop: "24px !important",
                marginBottom: "16px !important",
                opacity: isSubmitting ? "0.5" : "1",
                cursor: isSubmitting ? "default" : "pointer",
                color: "var(--always-white)", // Ensure text color remains white
              }}
              disabled={isSubmitting}
            >
              Register
            </Button>
          </Box>
        </Box>
        <Grid container justifyContent="center" alignItems="center">
          <Grid item>
            <Typography variant="body2" sx={{ color: "var(--color-white)", marginRight: 1 }}>
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

const TermsCheckbox = ({ isChecked, setIsChecked, errors, clearFieldError }) => {
  const handleChange = (event) => {
    setIsChecked(event.target.checked);
    clearFieldError("terms");
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
        label={
          <label htmlFor="terms">
            I understand and agree with{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </label>
        }
        sx={{
          color: "var(--color-white)",
          "& .MuiTypography-root": {
            marginLeft: "5px",
          },
        }}
      />
      {errors?.terms && (
        <div className="error-text" style={{ textAlign: "left", width: "100%", marginTop: "5px" }}>
          {errors.terms}
        </div>
      )}
    </div>
  );
};
