import React from "react";
import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const CustomTooltip = styled(
  React.forwardRef(({ className, ...props }, ref) => (
    <Tooltip
      {...props}
      ref={ref}
      classes={{ popper: className }}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [-8, -6],
              },
            },
          ],
        },
      }}
    />
  ))
)(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: "transparent",
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "var(--iconBg)",
    color: "var(--color-white)",
    maxWidth: "320px",
    width: "100%",
    borderRadius: "10px",
    boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
    border: "1px solid var(--table-stroke)",
    padding: "0",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    // transform: "translateX(-5px) !important",
  },
}));

export const DescriptionTooltip = ({ description = "" }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: "5px",
        textAlign: "justify",
        padding: "5px 10px",
        minWidth: "calc(320px - 40px)",
      }}
    >
      <Box>
        {description && (
          <Typography
            sx={{
              color: "var(--color-white)",
              fontSize: "0.875rem",
              fontWeight: "400",
              wordBreak: "break-word",
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CustomTooltip;
