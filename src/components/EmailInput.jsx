import React, { useState, useEffect, useRef } from "react";
import {
  Chip,
  TextField,
  Box,
  InputAdornment,
  Divider,
  Typography,
  Paper,
  styled,
  MenuItem,
  tooltipClasses,
  Tooltip,
  Avatar,
} from "@mui/material";
import { AddCollaborators } from "../pages/DesignSpace/svg/AddImage";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { useSharedProps } from "../contexts/SharedPropsContext";
import { stringAvatarColor, stringAvatarInitials } from "../functions/utils";

const EmailInput = ({ emails, setEmails, error, setError }) => {
  const { users } = useSharedProps();
  const [inputValue, setInputValue] = useState("");
  const [originalUserOptions, setOriginalUserOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [openUserOptions, setOpenUserOptions] = useState(false);
  const [userOptionClicked, setUserOptionClicked] = useState(null);
  const userOptionsRef = useRef(null);

  useEffect(() => {
    const filteredUsers = users.filter(
      (user) => user?.email && user?.username && user?.firstName && user?.lastName
    );
    setUserOptions(filteredUsers);
    setOriginalUserOptions(filteredUsers);
  }, []);

  useEffect(() => {
    let user;
    if (!userOptionClicked) return;
    else user = userOptionClicked;

    const email = user?.email;
    if (email && validateEmail(email)) {
      // Check if email already exists (case-insensitive)
      const isDuplicate = emails.some((existingEmail) => existingEmail.toLowerCase() === email);

      if (isDuplicate) {
        setError("Email already added");
      } else {
        setEmails([...emails, email]);
        setInputValue("");
      }
      setOpenUserOptions(false);
    }
  }, [userOptionClicked]);

  const calculateMatchScore = (user, searchText) => {
    const search = searchText.toLowerCase();
    const email = user?.email.toLowerCase();
    const username = user?.username.toLowerCase();
    const firstName = user?.firstName.toLowerCase();
    const lastName = user?.lastName.toLowerCase();
    // Exact matches get highest priority
    if (email === search) return 100;
    if (username === search) return 95;
    if (firstName === search) return 90;
    if (lastName === search) return 85;
    // Starts with gets second priority
    if (email.startsWith(search)) return 80;
    if (username.startsWith(search)) return 75;
    if (firstName.startsWith(search)) return 70;
    if (lastName.startsWith(search)) return 65;
    // Contains gets lowest priority
    if (email?.includes(search)) return 60;
    if (username?.includes(search)) return 55;
    if (firstName?.includes(search)) return 50;
    if (lastName?.includes(search)) return 45;
    return 0;
  };

  const filterUserOptions = (input) => {
    if (input) {
      console.log("email - input", input);
      const filtered = userOptions
        .map((user) => ({
          ...user,
          score: calculateMatchScore(user, input),
        }))
        .filter((user) => user.score > 0)
        .sort((a, b) => b.score - a.score);
      setOpenUserOptions(filtered.length > 0);
      setUserOptions(filtered);
      console.log("email - filtered.length > 0", filtered.length > 0);
      console.log("email - filtered", filtered);
    } else {
      console.log("email - !input", input);
      setOpenUserOptions(false);
      setUserOptions(originalUserOptions);
    }
  };

  const getUserDetails = (email) => {
    if (!email || !users) return {};
    const user = users.find((u) => u.email === email);
    if (!user) return {};

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePic: user.profilePic,
      email: user.email,
    };
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      const email = event.target.value.trim().toLowerCase(); // Convert to lowercase
      if (email && validateEmail(email) && validUser(email)) {
        // Check if email already exists (case-insensitive)
        const isDuplicate = emails.some((existingEmail) => existingEmail.toLowerCase() === email);

        if (isDuplicate) {
          setError("Email already added");
        } else {
          setEmails([...emails, email]);
          setInputValue("");
        }
      }
      if (event.key === ",") {
        event.preventDefault();
      }
    } else {
      filterUserOptions(inputValue.trim());
    }
    if (error) setError("");
  };

  const handleDelete = (email) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const validateEmail = (email) => {
    email = email.toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validUser = (email) => {
    return originalUserOptions.some((user) => user.email === email);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box display="flex" justifyContent="start" alignItems="center">
        <AddCollaborators />
        <input // Input field at the top
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter email addresses"
          style={{
            backgroundColor: "transparent",
            color: "var(--color-white)",
            border: "none",
            outline: "none",
            fontSize: "1rem",
          }}
          // Add margin-bottom for spacing
        />
      </Box>
      {openUserOptions && userOptions.length > 0 && (
        <Paper
          ref={userOptionsRef}
          sx={{
            position: "absolute",
            zIndex: 1000,
            maxHeight: "295px",
            overflow: "auto",
            width: "100%",
            left: "30px",
            backgroundColor: "var(--iconBg)",
            boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
            borderRadius: "10px",
            marginLeft: "-30px",
          }}
        >
          {userOptions.slice(0, 5).map((user) => (
            <CustomMenuItem
              key={user.id}
              onClick={(e) => {
                console.log("clciked");
                console.log("user", user);
                setUserOptionClicked(user);
              }}
            >
              <UserInfoTooltip {...user} />
            </CustomMenuItem>
          ))}
        </Paper>
      )}
      {emails.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, margin: "0px 16px 16px 16px" }}>
          {emails.map((email, index) => (
            <CustomTooltip
              key={index}
              title={<UserInfoTooltip email={email} {...getUserDetails(email)} />}
              arrow
            >
              <Chip
                key={index}
                label={email}
                onDelete={() => handleDelete(email)}
                deleteIcon={
                  <CancelRoundedIcon
                    sx={{ color: "var(--color-white) !important", opacity: "0.3" }}
                  />
                }
                sx={{
                  margin: 0.5,
                  backgroundColor: "var(--budgetCard)",
                  color: "var(--color-white)",
                  "&:hover": {
                    backgroundColor: "var(--iconBgHover)",
                  },
                }}
              />
            </CustomTooltip>
          ))}
        </Box>
      )}
      {error && (
        <Typography
          variant="caption"
          sx={{
            margin: "5px 20px 10px 63px",
            display: "flex",
            justifyContent: "flex-start",
            color: "var(--errorText)",
            fontSize: "0.875em",
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default EmailInput;

// Selection users menu item and user tooltip
const UserInfoTooltip = ({ username, firstName, lastName, email, profilePic }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "start",
      p: "5px",
      flexGrow: "1",
    }}
  >
    <Box
      sx={{
        width: 39,
        height: 39,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--gradientButton)",
        borderRadius: "50%",
        padding: "3px",
        marginRight: "10px",
        cursor: "auto",
      }}
    >
      <Avatar
        src={profilePic}
        sx={{
          width: 39,
          height: 39,
          borderRadius: "50%",
          boxShadow: "0 0 0 3px var(--gradientButton)",
          "& .MuiAvatar-img": {
            borderRadius: "50%",
          },
          ...stringAvatarColor(username),
        }}
        children={stringAvatarInitials(username)}
      />
    </Box>
    <Box sx={{ flexGrow: "1" }}>
      <Typography
        sx={{ color: "var(--color-white)", fontSize: "0.875rem", fontWeight: "bold" }}
      >{`${firstName} ${lastName}`}</Typography>
      <Typography sx={{ color: "var(--color-white)", fontSize: "0.7rem" }}>@{username}</Typography>
      <Typography sx={{ color: "var(--color-white)", fontSize: "0.7rem" }}>{email}</Typography>
    </Box>
  </Box>
);

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
    slotProps={{
      popper: {
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, -6],
            },
          },
        ],
      },
    }}
  />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: "var(--iconBg)",
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "var(--iconBg)",
    color: "var(--color-white)",
    maxWidth: 220,
    borderRadius: "10px",
    boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
    border: "1px solid var(--table-stroke)",
  },
}));

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.3rem !important",
  paddingTop: "6px",
  paddingBottom: "6px",
  "&:hover": {
    backgroundColor: "var(--iconBg2)",
  },
  "&:focus": {
    backgroundColor: "var(--iconBg2)",
  },
});
