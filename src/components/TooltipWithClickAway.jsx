import React from "react";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import CustomTooltip from "./CustomTooltip.jsx";

const TooltipWithClickAway = ({
  open,
  setOpen,
  tooltipClickLocked,
  setTooltipClickLocked,
  title,
  children,
  onMouseEnter,
  onMouseLeave,
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
        <div
          onClick={() => {
            if (tooltipClickLocked) {
              setOpen(false);
              setTooltipClickLocked(false);
            } else {
              setOpen(true);
              setTooltipClickLocked(true);
            }
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {children}
        </div>
      </CustomTooltip>
    </ClickAwayListener>
  );
};

export default TooltipWithClickAway;
