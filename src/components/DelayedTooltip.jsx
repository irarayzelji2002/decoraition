import React, { useState, useRef } from "react";
import Tooltip from "@mui/material/Tooltip";

function DelayedTooltip({ title = "", children, delay = 1000 }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const handleTooltipOpen = () => {
    timer.current = setTimeout(() => {
      setOpen(true);
    }, delay);
  };

  const handleTooltipClose = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <Tooltip
      open={open}
      title={title}
      onMouseEnter={handleTooltipOpen}
      onMouseLeave={handleTooltipClose}
      onBlur={handleTooltipClose}
      onClick={handleTooltipClose}
    >
      {children}
    </Tooltip>
  );
}
export default DelayedTooltip;
