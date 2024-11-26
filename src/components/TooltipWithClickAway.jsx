import React from "react";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import CustomTooltip from "./CustomTooltip.jsx";
import { IconButton } from "@mui/material";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent.jsx";

const TooltipWithClickAway = ({
  open,
  setOpen,
  tooltipClickLocked,
  setTooltipClickLocked,
  title,
  children,
  className,
}) => {
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <CustomTooltip
        title={title}
        placement="bottom"
        PopperProps={{
          modifiers: [
            {
              name: "preventOverflow",
              options: {
                boundary: window,
                altAxis: true,
                padding: 8,
              },
            },
            {
              name: "flip",
              options: {
                fallbackPlacements: ["bottom", "left"],
              },
            },
          ],
        }}
        onClose={() => setOpen(false)}
        open={open}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        arrow
      >
        <IconButton
          sx={{
            ...iconButtonStyles,
            height: "40px",
            width: "40px",
            "&:hover": {
              backgroundColor: "var(--iconButtonHover)",
            },
            "& .MuiTouchRipple-root span": {
              backgroundColor: "var(--iconButtonActive)",
            },
          }}
          onClick={() => {
            if (tooltipClickLocked) {
              setOpen(false);
              setTooltipClickLocked(false);
            } else {
              setOpen(true);
              setTooltipClickLocked(true);
            }
          }}
          className={className}
          onMouseEnter={() => {
            if (!tooltipClickLocked) setOpen(true);
          }}
          onMouseLeave={() => {
            if (!tooltipClickLocked) setOpen(false);
          }}
        >
          {children}
        </IconButton>
      </CustomTooltip>
    </ClickAwayListener>
  );
};

export default TooltipWithClickAway;
