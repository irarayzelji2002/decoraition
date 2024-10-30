import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Menu, styled } from "@mui/material";
import { formatDateDetailComma } from "../pages/Homepage/backend/HomepageActions";
import { fetchVersionDetails } from "../pages/DesignSpace/backend/DesignActions";
import { useSharedProps } from "../contexts/SharedPropsContext";
import { showToast } from "../functions/utils";
import { handleDownload } from "../functions/downloadHelpers";

const DownloadModal = ({ isOpen, onClose, isDesign, object }) => {
  // object is a design if isDesign is true else its a project object
  const { user } = useSharedProps();
  const sharedProps = useSharedProps();

  // Design states
  const [selectedDesignCategory, setSelectedDesignCategory] = useState("Design");
  const [selectedDesignVersionId, setSelectedDesignVersionId] = useState("");
  const [selectedDesignVersionDate, setSelectedDesignVersionDate] = useState("");
  const [versionDetails, setVersionDetails] = useState([]);
  const [designFileType, setDesignFileType] = useState(
    selectedDesignCategory === "Design" ? "PDF" : selectedDesignCategory === "Budget" ? "XLSX" : ""
  );

  // Project states
  const [selectedProjectCategory, setSelectedProjectCategory] = useState("Designs");
  const [projectFileType, setProjectFileType] = useState(
    selectedProjectCategory === "Designs" || selectedProjectCategory === "Plan Map"
      ? "PDF"
      : selectedProjectCategory === "Timeline" || selectedProjectCategory === "Budget"
      ? "XLSX"
      : ""
  );

  const [errors, setErrors] = useState({});
  const designFileTypes = ["PDF", "PNG", "JPG"];
  const tableFileTypes = ["XLSX", "CSV", "PDF"];
  // Deisgns and Plan Map are only in PDF
  const whichToDownloadDesign = ["Design", "Budget"];
  const whichToDownloadProject = ["Designs", "Timeline", "Plan Map", "Budget"];

  const handleClose = () => {
    onClose();
    setSelectedDesignVersionId("");
    setSelectedDesignVersionDate("");
    setVersionDetails([]);
    setDesignFileType(
      selectedDesignCategory === "Design"
        ? "PDF"
        : selectedDesignCategory === "Budget"
        ? "XLSX"
        : ""
    );
    setProjectFileType(
      selectedProjectCategory === "Designs" || selectedProjectCategory === "Plan Map"
        ? "PDF"
        : selectedProjectCategory === "Timeline" || selectedProjectCategory === "Budget"
        ? "XLSX"
        : ""
    );
  };

  const handleValidation = () => {
    let formErrors = {};
    if (isDesign) {
      if (!selectedDesignCategory) formErrors.category = "Please select a category";
      else {
        if (selectedDesignCategory === "Design" && !selectedDesignVersionId)
          formErrors.version = "Please select a version";
        if (
          (selectedDesignCategory === "Design" || selectedDesignCategory === "Budget") &&
          !designFileType
        )
          formErrors.fileType = "Please select a file type";
      }
    } else {
      if (!selectedProjectCategory) formErrors.category = "Please select a category";
      else {
        if (
          (selectedProjectCategory === "Timeline" || selectedProjectCategory === "Budget") &&
          !projectFileType
        )
          formErrors.fileType = "Please select a file type";
      }
    }
    return formErrors;
  };

  const onSubmit = async () => {
    const formErrors = handleValidation();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    if (isDesign) {
      const result = await handleDownload(
        object,
        selectedDesignCategory,
        selectedDesignVersionId,
        designFileType,
        sharedProps
      );
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      if (selectedDesignCategory === "Design")
        showToast(
          "success",
          `Design downloaded${
            selectedDesignVersionDate ? ` with version on ${selectedDesignVersionDate}` : ""
          }`
        );
      else if (selectedDesignCategory === "Budget")
        showToast("success", `Design Budget downloaded`);
    } else if (!isDesign) {
      const result = await handleDownload(
        object,
        selectedProjectCategory,
        "", // No version id for projects
        projectFileType,
        sharedProps
      );
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      showToast("success", `Project ${selectedProjectCategory} downloaded`);
    }
    handleClose();
  };

  useEffect(() => {
    const getVersionDetails = async () => {
      if (object?.history && object.history.length > 1) {
        const result = await fetchVersionDetails(object, user);
        if (!result.success) {
          console.error("Error:", result.message);
          setSelectedDesignVersionId("");
          setSelectedDesignVersionDate("");
          setVersionDetails([]);
          return;
        }
        setVersionDetails(result.versionDetails);
        const latestVersion = result.versionDetails[result.versionDetails.length - 1];
        if (latestVersion) {
          setSelectedDesignVersionId(latestVersion.id);
          setSelectedDesignVersionDate(formatDateDetailComma(latestVersion.createdAt));
        }
      }
    };

    if (isDesign) getVersionDetails();
  }, [object, user]);

  useEffect(() => {
    setErrors({});
  }, [selectedDesignCategory, selectedProjectCategory]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "var(--nav-card-modal)",
          borderRadius: "20px",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--color-grey)",
          fontWeight: "bold",
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            color: "var(--color-white)",
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        Download
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
          marginTop: "20px",
        }}
      >
        <Typography variant="body1" sx={{ marginBottom: "10px" }}>
          Choose which to download
        </Typography>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <FormControl sx={formControlStyles}>
            <InputLabel
              id="design-category-select-label"
              sx={{
                color: "var(--color-white)",
                "&.Mui-focused": {
                  color: "var(--color-white)", // Ensure label color remains white when focused
                },
                "&.MuiInputLabel-shrink": {
                  color: "var(--color-white)", // Ensure label color remains white when shrunk
                },
                "&.Mui-focused.MuiInputLabel-shrink": {
                  color: "var(--color-white)", // Ensure label color remains white when focused and shrunk
                },
              }}
            >
              Category
            </InputLabel>
            <Select
              labelId="design-category-select-label"
              id="design-category-select"
              value={isDesign ? selectedDesignCategory : selectedProjectCategory}
              label="Category"
              onChange={(e) =>
                isDesign
                  ? setSelectedDesignCategory(e.target.value)
                  : setSelectedProjectCategory(e.target.value)
              }
              MenuComponent={StyledMenu}
              MenuProps={{
                PaperProps: {
                  sx: {
                    "& .MuiMenu-list": {
                      padding: 0, // Remove padding from the ul element
                    },
                  },
                },
              }}
              sx={{
                color: "var(--color-white)",
                backgroundColor: "var(--nav-card-modal)",
                borderBottom: "1px solid #4a4a4d",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
                "&.Mui-focused": {
                  borderBottom: "1px solid var(--focusBorderColor)",
                  outline: "none",
                  boxShadow: "none",
                  color: "var(--color-grey)",
                },

                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--color-white)",
                },
              }}
            >
              {(isDesign ? whichToDownloadDesign : whichToDownloadProject).map((category) => (
                <MenuItem key={category} sx={menuItemStyles} value={category}>
                  <Typography variant="inherit">{category}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        {errors?.category && <div className="error-text">{errors?.category}</div>}
        {selectedDesignCategory === "Design" && (
          <>
            <Typography variant="body1" sx={{ marginBottom: "10px" }}>
              Version
            </Typography>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <FormControl sx={formControlStyles}>
                <InputLabel
                  id="date-modified-select-label"
                  sx={{
                    color: "var(--color-white)",
                    "&.Mui-focused": {
                      color: "var(--color-white)", // Ensure label color remains white when focused
                    },
                    "&.MuiInputLabel-shrink": {
                      color: "var(--color-white)", // Ensure label color remains white when shrunk
                    },
                    "&.Mui-focused.MuiInputLabel-shrink": {
                      color: "var(--color-white)", // Ensure label color remains white when focused and shrunk
                    },
                  }}
                >
                  Version
                </InputLabel>
                <Select
                  labelId="date-modified-select-label"
                  id="date-modified-select"
                  value={selectedDesignVersionId}
                  label="Version"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setSelectedDesignVersionId(selectedId);
                    // Find the matching version and set its formatted date
                    if (selectedId) {
                      const selectedVersion = versionDetails.find(
                        (version) => version.id === selectedId
                      );
                      if (selectedVersion) {
                        setSelectedDesignVersionDate(
                          formatDateDetailComma(selectedVersion.createdAt)
                        );
                      }
                    } else {
                      setSelectedDesignVersionDate("");
                    }
                  }}
                  MenuComponent={StyledMenu}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        "& .MuiMenu-list": {
                          padding: 0, // Remove padding from the ul element
                        },
                      },
                    },
                  }}
                  sx={{
                    color: "var(--color-white)",
                    backgroundColor: "var(--nav-card-modal)",
                    borderBottom: "1px solid #4a4a4d",
                    borderRadius: "8px",
                    transition: "background-color 0.3s ease",
                    "&.Mui-focused": {
                      borderBottom: "1px solid var(--focusBorderColor)",
                      outline: "none",
                      boxShadow: "none",
                      color: "var(--color-grey)",
                    },

                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-white)",
                    },
                  }}
                >
                  {/* <MenuItem value="" sx={menuItemStyles}>
                <em>None</em>
              </MenuItem>
              <MenuItem sx={menuItemStyles} value="versionId">
                <ListItemIcon>
                  <div className="select-image-preview">
                    <img src="" alt="" />
                  </div>
                </ListItemIcon>
                <Typography variant="inherit">December 25, 2021, 12:00 PM</Typography>
              </MenuItem> */}
                  {versionDetails.map((version) => (
                    <MenuItem key={version.id} sx={menuItemStyles} value={version.id}>
                      <div className="select-image-preview">
                        <img src={version.firstImage} alt="" />
                      </div>
                      <Typography variant="inherit">
                        {formatDateDetailComma(version.createdAt)}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {errors?.version && <div className="error-text">{errors?.version}</div>}
          </>
        )}
        {(isDesign &&
          (selectedDesignCategory === "Design" || selectedDesignCategory === "Budget")) ||
        (!isDesign &&
          (selectedProjectCategory === "Timeline" || selectedProjectCategory === "Budget")) ? (
          <>
            <Typography variant="body1" sx={{ marginBottom: "10px" }}>
              File type
            </Typography>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <FormControl sx={formControlStyles}>
                <InputLabel
                  id="file-type-select-label"
                  sx={{
                    color: "var(--color-white)",
                    "&.Mui-focused": {
                      color: "var(--color-white)", // Ensure label color remains white when focused
                    },
                    "&.MuiInputLabel-shrink": {
                      color: "var(--color-white)", // Ensure label color remains white when shrunk
                    },
                    "&.Mui-focused.MuiInputLabel-shrink": {
                      color: "var(--color-white)", // Ensure label color remains white when focused and shrunk
                    },
                  }}
                >
                  File type
                </InputLabel>
                <Select
                  labelId="file-type-select-label"
                  id="file-type-select"
                  value={isDesign ? designFileType : projectFileType}
                  label="File type"
                  onChange={(e) =>
                    isDesign
                      ? setDesignFileType(e.target.value)
                      : setProjectFileType(e.target.value)
                  }
                  MenuComponent={StyledMenu}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        "& .MuiMenu-list": {
                          padding: 0, // Remove padding from the ul element
                        },
                      },
                    },
                  }}
                  sx={{
                    color: "var(--color-white)",
                    backgroundColor: "var(--nav-card-modal)",
                    borderBottom: "1px solid #4a4a4d",
                    borderRadius: "8px",
                    transition: "background-color 0.3s ease",
                    "&.Mui-focused": {
                      borderBottom: "1px solid var(--focusBorderColor)",
                      outline: "none",
                      boxShadow: "none",
                      color: "var(--color-grey)",
                    },

                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-white)",
                    },
                  }}
                >
                  {(isDesign && selectedDesignCategory === "Design"
                    ? designFileTypes
                    : selectedDesignCategory === "Budget" ||
                      (!isDesign &&
                        (selectedProjectCategory === "Budget" ||
                          selectedProjectCategory === "Timeline"))
                    ? tableFileTypes
                    : []
                  ).map((type) => (
                    <MenuItem key={type} sx={menuItemStyles} value={type}>
                      <Typography variant="inherit">{type}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {errors?.fileType && <div className="error-text">{errors?.fileType}</div>}
          </>
        ) : (
          <></>
        )}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "var(--nav-card-modal)", margin: "10px" }}>
        {/* Download Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{
            background: "var(--gradientButton)", // Gradient background
            borderRadius: "20px", // Button border radius
            color: "var(--color-white)", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)", // Reverse gradient on hover
            },
          }}
        >
          Download
        </Button>

        {/* Cancel Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
          sx={{
            color: "var(--color-white)",
            border: "2px solid transparent",
            borderRadius: "20px",
            backgroundImage: "var(--lightGradient), var(--gradientButton)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            fontWeight: "bold",
            textTransform: "none",
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadModal;

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "var(--nav-card-modal)",
    color: "var(--color-white)",
    borderRadius: "12px",
    padding: 0,
    margin: 0,
    border: "none",
    overflow: "hidden",
  },
  "& .MuiList-root": {
    padding: 0,
  },
  "& .MuiMenuItem-root": {
    "&.Mui-selected": {
      backgroundColor: "transparent", // Custom background color for selected item
      "&:hover": {
        backgroundColor: "transparent", // Custom hover color for selected item
      },
    },
    "&:focus": {
      outline: "none",
      boxShadow: "none", // Remove blue outline effect
    },
  },
}));

const formControlStyles = {
  m: 1,
  width: "80%",
  backgroundColor: "var(--nav-card-modal)",
  color: "var(--color-white)",
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
    color: "var(--nav-card-modal)",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownHover)",
  },
};
