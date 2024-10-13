import * as React from "react";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FormHelperText from "@mui/material/FormHelperText";

export default function Password({ value, onChange, error, helperText, label }) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <FormControl
      sx={{ width: "100%", marginTop: "10px", marginBottom: "10px" }}
      variant="outlined"
      error={error}
    >
      <InputLabel
        htmlFor="outlined-adornment-password"
        sx={{
          color: "var(--borderInput)", // Default label color
          "&.Mui-focused": {
            color: "var(--borderInput)", // Label color when focused
          },
        }}
      >
        {label || "Password"}
      </InputLabel>
      <OutlinedInput
        id="outlined-adornment-password"
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
              sx={{ color: "var(--color-white)" }} // Make the visibility icons white
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        label="Password"
        sx={{
          color: "var(--color-white)",
          borderRadius: "5px", // Input text color
          backgroundColor: "#3E3C47",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--borderInput)", // Outline color
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--borderInput)", // Outline color on hover
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--borderInput)", // Outline color when focused
          },
        }}
      />
      {helperText && <FormHelperText sx={{ color: "#ffffff" }}>{helperText}</FormHelperText>}
    </FormControl>
  );
}
