import * as React from "react";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FormHelperText from "@mui/material/FormHelperText";
import { commonInputStyles } from "./Signup";

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
      <TextField
        id="outlined-adornment-password"
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        label="Password"
        sx={commonInputStyles}
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
                }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {helperText && <FormHelperText sx={{ color: "#ffffff" }}>{helperText}</FormHelperText>}
    </FormControl>
  );
}
