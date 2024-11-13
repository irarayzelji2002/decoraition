import "../../css/registerModal.css";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Input as BaseInput } from "@mui/base/Input";
import { Box, styled } from "@mui/system";
import Button from "@mui/material/Button";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function OTP({ separator, length, value, onChange }) {
  const inputRefs = React.useRef(new Array(length).fill(null));

  const focusInput = (targetIndex) => {
    const targetInput = inputRefs.current[targetIndex];
    targetInput.focus();
  };

  const selectInput = (targetIndex) => {
    const targetInput = inputRefs.current[targetIndex];
    targetInput.select();
  };

  const handleKeyDown = (event, currentIndex) => {
    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
      case " ":
        event.preventDefault();
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (currentIndex > 0) {
          focusInput(currentIndex - 1);
          selectInput(currentIndex - 1);
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if (currentIndex < length - 1) {
          focusInput(currentIndex + 1);
          selectInput(currentIndex + 1);
        }
        break;
      case "Delete":
        event.preventDefault();
        onChange((prevOtp) => {
          const otp = prevOtp.slice(0, currentIndex) + prevOtp.slice(currentIndex + 1);
          return otp;
        });

        break;
      case "Backspace":
        event.preventDefault();
        if (currentIndex > 0) {
          focusInput(currentIndex - 1);
          selectInput(currentIndex - 1);
        }

        onChange((prevOtp) => {
          const otp = prevOtp.slice(0, currentIndex) + prevOtp.slice(currentIndex + 1);
          return otp;
        });
        break;

      default:
        break;
    }
  };

  const handleChange = (event, currentIndex) => {
    const currentValue = event.target.value;
    let indexToEnter = 0;

    while (indexToEnter <= currentIndex) {
      if (inputRefs.current[indexToEnter].value && indexToEnter < currentIndex) {
        indexToEnter += 1;
      } else {
        break;
      }
    }
    onChange((prev) => {
      const otpArray = prev.split("");
      const lastValue = currentValue[currentValue.length - 1];
      otpArray[indexToEnter] = lastValue;
      return otpArray.join("");
    });
    if (currentValue !== "") {
      if (currentIndex < length - 1) {
        focusInput(currentIndex + 1);
      }
    }
  };

  const handleClick = (event, currentIndex) => {
    selectInput(currentIndex);
  };

  const handlePaste = (event, currentIndex) => {
    event.preventDefault();
    const clipboardData = event.clipboardData;

    // Check if there is text data in the clipboard
    if (clipboardData.types.includes("text/plain")) {
      let pastedText = clipboardData.getData("text/plain");
      pastedText = pastedText.substring(0, length).trim();
      let indexToEnter = 0;

      while (indexToEnter <= currentIndex) {
        if (inputRefs.current[indexToEnter].value && indexToEnter < currentIndex) {
          indexToEnter += 1;
        } else {
          break;
        }
      }

      const otpArray = value.split("");

      for (let i = indexToEnter; i < length; i += 1) {
        const lastValue = pastedText[i - indexToEnter] ?? " ";
        otpArray[i] = lastValue;
      }

      onChange(otpArray.join(""));
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {new Array(length).fill(null).map((_, index) => (
        <React.Fragment key={index}>
          <BaseInput
            slots={{
              input: InputElement,
            }}
            aria-label={`Digit ${index + 1} of OTP`}
            slotProps={{
              input: {
                ref: (ele) => {
                  inputRefs.current[index] = ele;
                },
                onKeyDown: (event) => handleKeyDown(event, index),
                onChange: (event) => handleChange(event, index),
                onClick: (event) => handleClick(event, index),
                onPaste: (event) => handlePaste(event, index),
                value: value[index] ?? "",
              },
            }}
          />
          {index === length - 1 ? null : separator}
        </React.Fragment>
      ))}
    </Box>
  );
}

OTP.propTypes = {
  length: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  separator: PropTypes.node,
  value: PropTypes.string.isRequired,
};

export function OTPInput() {
  const [otp, setOtp] = React.useState("");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <OTP separator={<span>-</span>} value={otp} onChange={setOtp} length={6} />
    </Box>
  );
}

const blue = {
  100: "#DAECFF",
  200: "#80BFFF",
  400: "#3399FF",
  500: "#007FFF",
  600: "#0072E5",
  700: "#0059B2",
};

const grey = {
  50: "#F3F6F9",
  100: "#E5EAF2",
  200: "#DAE2ED",
  300: "#C7D0DD",
  400: "#B0B8C4",
  500: "#9DA8B7",
  600: "#6B7A90",
  700: "#434D5B",
  800: "#303740",
  900: "#1C2025",
};

const InputElement = styled("input")(
  ({ theme }) => `
  width: 40px;
  font-family: 'Inter', sans-serif;
  font-size: 1.3rem;
  font-weight: 400;
  line-height: 1.5;
  padding: 13px 0px;
  border-radius: 8px;
  text-align: center;
  color: var(--color-white);
  background: var(--nav-card-modal);
  border: 2px solid var(--borderInput);
  box-shadow: none;
  &:hover {
    border-color: var(--borderInputBrighter);
  }
  &:focus {
    border-color: var(--borderInputBrighter);
    box-shadow: none;
  }
  &:focus-visible {
    outline: 0;
  }
`
);

export default function OneTP() {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleExpiredOTP = async () => {
    try {
      await axios.put("/api/expire-otp", { email });
    } catch (error) {
      console.error("Failed to expire OTP:", error);
    }
    setError("");
  };

  const handleVerify = async () => {
    try {
      const response = await axios.put("/api/verify-otp", { email, otp });
      if (response.data.success) {
        const token = response.data.token;
        navigate("/change", { state: { email, token } });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResend = async () => {
    try {
      await axios.put("/api/resend-otp", { email });
      setTimeLeft(300); // Reset the time to 5 minutes
    } catch (error) {
      setError("Failed to resend OTP");
    }
    setError("");
  };

  useEffect(() => {
    if (timeLeft === 0) {
      handleExpiredOTP(); // Expire OTP if the timer hits zero
    }
  }, [timeLeft]);

  return (
    <div className="bg">
      <div className="headtext">
        <h1 className="h1-otp">One-Time-Password</h1>
      </div>
      <div className="modal-bg">
        <center>
          <h2
            style={{
              marginLeft: "10px",
              textAlign: "center",
              margin: "30px 20px 30px 20px",
              fontSize: "1.8rem",
            }}
          >
            Verify your account
          </h2>
          <h5 style={{ fontWeight: "400" }}>Enter the OTP code sent to {email}</h5>
          {error && <p>{error}</p>}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <OTP value={otp} onChange={setOtp} length={6} />
          </Box>
          <h5 style={{ fontWeight: "400", marginBottom: "-8px" }}>
            Didn’t receive the OTP code?
            {timeLeft > 0 && <span> Resend code in</span>}
          </h5>
          {timeLeft > 0 ? (
            <div style={{ color: "var(--color-info-grey)", fontSize: "0.875rem" }}>
              {Math.floor(timeLeft / 60)} minutes {(timeLeft % 60).toString().padStart(2, "0")}{" "}
              seconds
            </div>
          ) : (
            <div
              style={{
                cursor: "pointer",
                textDecoration: "underline",
                textDecorationColor: "var(--orangeButton)",
                fontSize: "0.875rem",
              }}
            >
              <div className="cancel-link orange" onClick={handleResend}>
                Resend Code
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="signIn"
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
            onClick={handleVerify}
          >
            Verify
          </Button>
        </center>
      </div>
    </div>
  );
}
