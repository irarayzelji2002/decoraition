import * as React from "react";
import { useEffect, useState } from "react";
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
import { createTheme, ThemeProvider } from "@mui/material/styles";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import { Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { GoogleIcon, FacebookIcon } from "../../components/CustomIcons";
import { db } from "../../../server/firebase"; // Import Firestore instance
import { Visibility, VisibilityOff } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

const defaultTheme = createTheme();

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

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/homepage");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const onLogin = async (e) => {
    e.preventDefault();
    const formErrors = handleValidation();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence); // Set persistence here
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success("You have been logged in", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          color: "var(--color-white)",
          backgroundColor: "var(--inputBg)",
        },
        progressStyle: {
          backgroundColor: "var(--brightFont)",
        },
      });
      setTimeout(() => navigate("/homepage"), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Login failed. Please try again.");
      setErrors({ general: "Login failed. Please try again." });
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence); // Set persistence for Google login
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Extract user information
      const displayName = user.displayName ? user.displayName.split(" ") : [];
      const firstName = displayName[0] || "";
      const lastName = displayName.slice(1).join(" ") || "";
      const email = user.email || "";
      const username = `${firstName}_${lastName}`.toLowerCase();

      // Save user info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        username,
      });

      toast.success("You have been logged in", {
        icon: <Person />,
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          color: "var(--color-white)",
          backgroundColor: "var(--inputBg)",
        },
        progressStyle: {
          backgroundColor: "var(--brightFont)",
        },
      });
      setTimeout(() => navigate("/homepage"), 1500);
    } catch (error) {
      console.error("Google login error", error);
      toast.error("Google login failed. Please try again.");
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <ToastContainer />
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
          <Box component="form" onSubmit={onLogin} noValidate sx={{ mt: 1 }}>
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
              error={!!errors.email}
              helperText={errors.email}
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
                        borderRadius: "4px",
                        "& .MuiSvgIcon-root": {
                          fontSize: 28,
                        },
                      }}
                    />
                  }
                  label="Remember me"
                  sx={{ color: "white" }}
                />
              </Grid>
              <Grid item xs>
                <Box display="flex" justifyContent="flex-end">
                  <Link
                    href="/forgot"
                    variant="body2"
                    sx={{
                      color: "var(--brightFont)",
                      textDecoration: "underline",
                      "&:hover": {
                        color: "var(--color-white)",
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
            onClick={handleGoogleLogin}
            startIcon={<GoogleIcon />}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              color: "var(--color-white)",
              backgroundColor: "transparent",
              border: "none",
              "&:hover": {
                background: "transparent", // Ensure background remains transparent

                color: "var(--color-white)", // Ensure color is transparent to reveal the gradient
              },
              "&:active": {
                backgroundColor: "transparent",
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
            onClick={() => alert("Login with Facebook")}
            startIcon={<FacebookIcon />}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              color: "var(--color-white)",
              backgroundColor: "transparent",
              border: "none",
              "&:hover": {
                background: "transparent", // Ensure background remains transparent

                color: "var(--color-white)", // Ensure color is transparent to reveal the gradient
              },
              "&:active": {
                backgroundColor: "transparent",
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
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "18px ",
          }}
        >
          Don&apos;t have an account?&nbsp;
          <Link href="/register" variant="body2" className="cancel-link">
            Sign Up
          </Link>
        </Typography>
      </Container>
    </ThemeProvider>
  );
}
