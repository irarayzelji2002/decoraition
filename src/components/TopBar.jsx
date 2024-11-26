import "../css/design.css";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

function TopBar({ state, navigateTo = "/", navigateFrom = "/", className = "" }) {
  const navigate = useNavigate();

  return (
    <div className={`itemHead ${className}`}>
      <IconButton
        onClick={() => navigate(navigateTo, { state: { navigateFrom: navigateFrom } })}
        style={{ color: "var(--color-white)", fontSize: "2.5rem" }}
      >
        <ArrowBackIosNewIcon />
      </IconButton>
      <div className="searchHead">
        <span className="searchHeadSpan">{state}</span>
      </div>
    </div>
  );
}

export default TopBar;
