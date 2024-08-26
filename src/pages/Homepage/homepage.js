import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import "../../css/homepage.css";

function Homepage() {
  return (
    <div>
      <SearchAppBar></SearchAppBar>

      <div className="header">
        <img
          style={{
            height: "100px",
            paddingTop: "18px",
            marginRight: "14px",
          }}
          src="/img/Logo-Colored.png"
          alt="logo"
        />
        <h1 className="navName">DecorAItion</h1>
      </div>
      <div className="action-buttons">
        <button className="design-button">Create a design</button>
        <button className="project-button">Create a project</button>
      </div>

      <section className="recent-section">
        <div className="recent-designs">
          <h2>Recent Designs</h2>
          <div className="no-content">
            <img src="/img/design-placeholder.png" alt="No designs yet" />
            <p>No designs yet. Start creating.</p>
          </div>
          <button className="floating-button">+</button>
        </div>

        <div className="recent-projects">
          <h2>Recent Projects</h2>
          <div className="no-content">
            <img src="/img/design-placeholder.png" alt="No projects yet" />
            <p>No projects yet. Start creating.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Homepage;

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

export function SearchAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" sx={{ zIndex: 1200 }}>
        <Toolbar sx={{ backgroundColor: "#1E1D21" }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2, backgroundColor: "transparent" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
            className="navName"
          >
            <img
              style={{
                height: "28px",
                paddingTop: "18px",
              }}
              src="/img/Logo-Colored.png"
              alt="logo"
            />
          </Typography>
          <Search
            sx={{
              backgroundColor: "rgb(27, 27, 27)",
              width: "92% !important",
            }}
          >
            <SearchIconWrapper>
              <SearchIcon sx={{ color: "whitesmoke !important" }} />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
              sx={{
                backgroundColor: "#4B4A4B",
                borderRadius: "24px",
                "&:hover": { bgcolor: "transparent", borderRadius: "24px" },
              }}
            />
          </Search>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
