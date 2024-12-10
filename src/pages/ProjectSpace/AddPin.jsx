import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../css/addItem.css";
import "../../css/budget.css";
import TopBar from "../../components/TopBar";
import Select from "@mui/material/Select";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useNavigate } from "react-router-dom";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import ColorizeIcon from "@mui/icons-material/Colorize";
import { Modal } from "@mui/material";
import { ChromePicker } from "react-color";
import Button from "@mui/material/Button";
import { DeleteIcon } from "../../components/svg/DefaultMenuIcons";
import ImageFrame from "../../components/ImageFrame";
import {
  fetchProjectDesigns,
  addPinToDatabase,
  updatePinInDatabase,
} from "./backend/ProjectDetails";
import deepEqual from "deep-equal";
import { showToast } from "../../functions/utils";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "./Project";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { gradientButtonStyles } from "../DesignSpace/PromptBar";

function AddPin({ EditMode }) {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
  const projectId = location.state?.projectId;
  const CurrentPin = (location.state?.totalPins || 0) + 1;
  const navigate = useNavigate();
  const { user, userDoc, projects, userProjects } = useSharedProps();

  const [owner, setOwner] = React.useState("");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [pins, setPins] = useState([]);
  const [designs, setDesigns] = useState([]);
  const pinToEdit = location.state?.pinToEdit || null;
  const [loadingProject, setLoadingProject] = useState(true);
  const [project, setProject] = useState({});
  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [isAddPinBtnDisabled, setIsAddPinBtnDisabled] = useState(false);

  // Get project
  useEffect(() => {
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
        setLoadingProject(false);
      } else if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        console.log("current project:", fetchedProject);
      }
    }
    setLoadingProject(false);
  }, [projectId, projects, userProjects]);

  // Initialize access rights
  useEffect(() => {
    if (!project?.projectSettings || !userDoc?.id) return;
    // Check if user has any access
    const hasAccess = isCollaboratorProject(project, userDoc.id);
    if (!hasAccess) {
      showToast("error", "You don't have access to this portion of the project.");
      navigate("/planMap/" + projectId);
      return;
    }
    // If they have access, proceed with setting roles
    setIsManager(isManagerProject(project, userDoc.id));
    setIsManagerContentManager(isManagerContentManagerProject(project, userDoc.id));
    setIsManagerContentManagerContributor(
      isManagerContentManagerContributorProject(project, userDoc.id)
    );
    setIsCollaborator(isCollaboratorProject(project, userDoc.id));

    // Check if none of the manager roles are true
    if (
      isManagerProject(project, userDoc.id) ||
      isManagerContentManagerProject(project, userDoc.id) ||
      isManagerContentManagerContributorProject(project, userDoc.id)
    ) {
    } else {
      showToast("error", "You don't have access to this portion of the project.");
      navigate("/planMap/" + projectId);
      return;
    }
  }, [project, userDoc, navigate, projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDesigns(projectId, setDesigns);
      if (pinToEdit) {
        setPins([pinToEdit]);
        setSelectedColor(pinToEdit.color);
        setOwner(pinToEdit.designId);
      } else {
        addPin();
      }
    }
  }, [projectId, pinToEdit]);

  const handleColorChange = (color) => {
    setSelectedColor(color.hex); // Update the selected color
    setPins((prevPins) => {
      const updatedPins = [...prevPins];
      const currentPinIndex = updatedPins.length - 1;
      if (currentPinIndex >= 0) {
        updatedPins[currentPinIndex].color = color.hex;
      }
      return updatedPins;
    });
  };

  const [modalOpen, setModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
  const addPin = async () => {
    const newPin = {
      id: CurrentPin,
      location: { x: 10, y: -20 },
      color: selectedColor,
      order: CurrentPin,
      designName: designs.find((design) => design.id === owner)?.designName || "",
    };
    setPins([newPin]);
  };

  const handleSavePin = async () => {
    setIsAddPinBtnDisabled(true);
    try {
      const currentPin = pins[pins.length - 1];
      if (currentPin) {
        const pinData = {
          designId: owner,
          // designName: currentPin.designName,
          location: { x: currentPin.location.x, y: currentPin.location.y },
          color: currentPin.color,
          // Remove order property when updating
          ...(pinToEdit ? {} : { order: currentPin.id }),
        };
        if (pinToEdit) {
          await updatePinInDatabase(projectId, pinToEdit.id, pinData);
        } else {
          await addPinToDatabase(projectId, pinData, userDoc, user);
        }
        navigate(`/planMap/${projectId}`);
      }
    } finally {
      setIsAddPinBtnDisabled(false);
    }
  };

  return (
    <>
      <TopBar state={"Add Pin"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div className="sectionPins" style={{ background: "none", paddingTop: "104px" }}>
        <div className="budgetSpaceImg">
          <ImageFrame
            src="/img/transparent-image.png"
            alt=""
            projectId={projectId}
            pins={pins}
            setPins={setPins}
            color={selectedColor}
          />
        </div>
        <div className="budgetSpaceImg">
          <div style={{ width: "100%" }}>
            {" "}
            <label style={{ marginLeft: "12px" }}>Pin number: {CurrentPin}</label>
            <br />
            <br />
            <label style={{ marginLeft: "12px" }}>Associated Design</label>
            <br />
            <FormControl sx={formControlStyles}>
              <Select
                labelId="owner-select-label"
                id="owner-select"
                label="Owner"
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  const selectedDesign = designs.find((design) => design.id === e.target.value);
                  if (selectedDesign) {
                    setPins((prevPins) => {
                      const updatedPins = [...prevPins];
                      const currentPinIndex = updatedPins.length - 1;
                      if (currentPinIndex >= 0) {
                        updatedPins[currentPinIndex].designName = selectedDesign.designName;
                      }
                      return updatedPins;
                    });
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      "& .MuiMenu-list": {
                        padding: 0, // Remove padding from the ul element
                      },
                    },
                  },
                }}
                IconComponent={(props) => (
                  <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
                )}
                className="custom-select"
              >
                <MenuItem value="" sx={menuItemStyles}>
                  <em>&nbsp;</em>
                </MenuItem>
                {designs.map((design) => (
                  <MenuItem key={design.id} sx={menuItemStyles} value={design.id}>
                    {design.designName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <br />
            <label style={{ marginLeft: "12px" }}>Pin Color</label>
            <div className="color-picker" onClick={handleOpenModal}>
              <div className="color-circle" style={{ backgroundColor: selectedColor }}></div>
              <span className="color-text">Select a color</span>
              <IconButton className="color-dropper">
                <ColorizeIcon sx={{ color: "var(--color-white)" }} />
              </IconButton>
            </div>
            <Modal open={modalOpen} onClose={handleCloseModal}>
              <div className="modalColor" style={{ width: "50%" }}>
                <ChromePicker
                  disableAlpha
                  color={selectedColor}
                  onChange={handleColorChange}
                  styles={{
                    default: {
                      picker: {
                        background: "transparent",
                        borderRadius: "10px",
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0)",
                        marginTop: "20px",
                        width: "auto",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: "500",
                      },
                      saturation: {
                        borderRadius: "10px",
                      },
                      hue: {
                        borderRadius: "10px",
                      },
                      input: {
                        backgroundImage: "var(--gradientButton)",
                      },
                      swatch: {
                        borderRadius: "10px",
                      },
                      active: {
                        borderRadius: "10px",
                      },
                    },
                  }}
                />
                <div className="rightBeside">
                  <Button
                    onClick={handleCloseModal}
                    fullWidth
                    variant="contained"
                    className="confirm-button"
                  >
                    Save Color
                  </Button>

                  <IconButton aria-label="delete">
                    <DeleteIcon
                      style={{
                        color: "var(--color-white)",
                      }}
                    />
                  </IconButton>
                </div>
              </div>
            </Modal>
            <Button
              // className="add-item-btn"
              // style={{ width: "100%", margin: "8px", maxWidth: "600px" }}
              variant="contained"
              onClick={handleSavePin}
              sx={{
                ...gradientButtonStyles,
                maxWidth: "235px",
                opacity: isAddPinBtnDisabled ? "0.5" : "1",
                cursor: isAddPinBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isAddPinBtnDisabled && "var(--gradientButtonHover)",
                },
              }}
              disabled={isAddPinBtnDisabled}
            >
              Add Pin
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddPin;

const formControlStyles = {
  m: 1,
  minWidth: 200,
  maxWidth: 600, // Set the maximum width to 400px
  backgroundColor: "transparent",
  color: "var(--color-white)",
  width: "100%",
  borderRadius: "8px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var( --borderInput)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--bright-grey) !important",
  },
  "& .MuiSvgIcon-root": {
    color: "var(--color-white)", // Set the arrow color to white
  },
};

const menuItemStyles = {
  color: "var(--color-white)",
  backgroundColor: "var(--dropdown)",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: "var(--dropdownHover)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--dropdownSelected)",
    color: "#d1d1d1",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownHover)",
  },
};
