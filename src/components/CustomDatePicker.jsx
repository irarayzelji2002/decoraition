import React, { useRef } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { IconButton, InputAdornment } from "@mui/material";
import dayjs from "dayjs";
import { textFieldStyles, textFieldInputProps } from "../pages/DesignSpace/DesignSettings";
import { CalendarInputIcon } from "./svg/SharedIcons";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";

export default function CustomDatePicker({
  defaultValue,
  minDate = defaultValue,
  value,
  onChange,
  error,
  id,
  name,
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        defaultValue={defaultValue}
        disablePast
        minDate={minDate}
        views={["year", "month", "day"]}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        slots={{
          openPickerIcon: CalendarInputIcon,
          switchViewIcon: KeyboardArrowDownRoundedIcon,
        }}
        slotProps={{
          textField: {
            variant: "outlined",
            helperText: error,
            InputProps: textFieldInputProps,
            sx: {
              ...textFieldStyles,
              marginTop: "10px",
              width: "100%",
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                backgroundColor: "transparent",
              },
            },
          },
          popper: {
            sx: {
              "& .MuiPaper-root": {
                backgroundColor: "var(--nav-card-modal)",
                borderRadius: "10px",
                color: "var(--color-white)",
              },
              "& .Mui-selected": {
                background: "var(--gradientButton)",
                backgroundColor: "var(--brightFont)",
                color: "var(--always-white)",
                "&:hover": {
                  background: "var(--gradientButtonHover)",
                  backgroundColor: "var(--brightFont)",
                },
              },
              "& .Mui-disabled": {
                opacity: 0.5,
                color: "var(--greyText) !important",
                cursor: "default !important",
              },
              "& .MuiButtonBase-root": {
                outline: "none",
                "&:focus-visible": {
                  outline: "none",
                },
              },
              // Calendar header styles
              "& .MuiPickersCalendarHeader-root": {
                color: "var(--color-white)",
                "& .MuiPickersCalendarHeader-label": {
                  color: "var(--color-white)",
                },
                "& .MuiIconButton-root": {
                  color: "var(--color-white)",
                },
              },
              // Month view styles
              "& .MuiMonthCalendar-root": {
                backgroundColor: "var(--nav-card-modal)",
                "& .MuiPickersMonth-root": {
                  color: "var(--color-white)",
                },
                "& .MuiPickersMonth-monthButton": {
                  color: "var(--color-white)",
                  WebkitTapHighlightColor: "transparent",
                  "&:hover": {
                    backgroundColor: "var(--iconButtonHover2)",
                  },
                  "& .MuiTouchRipple-root span": {
                    backgroundColor: "var(--iconButtonActive2) !important",
                  },
                  "&.Mui-selected": {
                    background: "var(--gradientButtonHover)",
                    backgroundColor: "var(--brightFont)",
                    color: "var(--always-white)",
                  },
                },
              },
              // Year view styles
              "& .MuiYearCalendar-root": {
                backgroundColor: "var(--nav-card-modal)",
                "& .MuiPickersYear-root": {
                  color: "var(--color-white)",
                },
                "& .MuiPickersYear-yearButton": {
                  color: "var(--color-white)",
                  WebkitTapHighlightColor: "transparent",
                  "&:hover": {
                    backgroundColor: "var(--iconButtonHover2)",
                  },
                  "& .MuiTouchRipple-root span": {
                    backgroundColor: "var(--iconButtonActive2) !important",
                  },
                  "&.Mui-selected": {
                    background: "var(--gradientButtonHover)",
                    backgroundColor: "var(--brightFont)",
                    color: "var(--always-white)",
                  },
                },
              },
              // Day calendar styles
              "& .MuiDayCalendar-weekDayLabel": {
                color: "var(--color-white)",
                fontWeight: "bold",
              },
              "& .MuiPickersDay-root": {
                color: "var(--color-white)",
                WebkitTapHighlightColor: "transparent",
                "&:hover": {
                  backgroundColor: "var(--iconButtonHover2)",
                },
                "& .MuiTouchRipple-root span": {
                  backgroundColor: "var(--iconButtonActive2) !important",
                },
                "&.Mui-selected": {
                  background: "var(--gradientButton)",
                  backgroundColor: "var(--brightFont)",
                  color: "var(--always-white)",
                  "&:hover": {
                    background: "var(--gradientButtonHover)",
                    backgroundColor: "var(--brightFont)",
                  },
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                  color: "var(--greyText) !important",
                  cursor: "default !important",
                },
                "&.MuiPickersDay-today": {
                  background: "var(--lightGradient), var(--gradientButton)",
                  border: "2px solid transparent",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                },
              },
            },
          },
          inputAdornment: {
            sx: {
              marginRight: "5px",
              "& .MuiIconButton-root": {
                ...iconButtonStyles,
                padding: "12px",
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}
