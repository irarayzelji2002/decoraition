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
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Menu, styled } from "@mui/material";
import { formatDateDetailComma } from "../pages/Homepage/backend/HomepageActions";
import { fetchVersionDetails } from "../pages/DesignSpace/backend/DesignActions";
import { useSharedProps } from "../contexts/SharedPropsContext";
import { showToast } from "../functions/utils";
import { handleDownload } from "../functions/downloadHelpers";
import Version from "../pages/DesignSpace/Version";

const DownloadModal = ({ isOpen, onClose, isDesign, object }) => {
  // object is a design if isDesign is true else its a project object
  const { user, userBudgets, userPlanMaps, userTimelines, userProjectBudgets } = useSharedProps();
  const sharedProps = useSharedProps();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
  // Designs and Plan Map are only in PDF
  const [downloadOptions, setDownloadOptions] = useState([]);
  const [design, setDesign] = useState(null);
  const [project, setProject] = useState(null);
  const designCategoryOrder = [
    { order: 0, value: "Design" },
    { order: 1, value: "Budget" },
  ];
  const projectCategoryOrder = [
    { order: 0, value: "Designs" },
    { order: 1, value: "Timeline" },
    { order: 2, value: "Plan Map" },
    { order: 3, value: "Budget" },
  ];

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

  const handleSelect = (selectedId) => {
    setSelectedDesignVersionId(selectedId);
    // Find the matching version and set its formatted date
    if (selectedId) {
      const selectedVersion = versionDetails.find((version) => version.id === selectedId);
      if (selectedVersion) {
        setSelectedDesignVersionDate(formatDateDetailComma(selectedVersion.createdAt));
      }
    } else {
      setSelectedDesignVersionDate("");
    }
  };

  // Get Version Details for Design
  const getVersionDetails = async (design) => {
    if (design.history && design.history.length > 0) {
      const result = await fetchVersionDetails(design, user);
      if (!result.success) {
        console.error("Error:", result.message);
        setSelectedDesignVersionId("");
        setSelectedDesignVersionDate("");
        setVersionDetails([]);
        return;
      }
      let versionDetails = result.versionDetails;
      versionDetails = versionDetails.reverse();
      setVersionDetails(versionDetails);
      const latestVersion = versionDetails[0];
      if (latestVersion) {
        setSelectedDesignVersionId(latestVersion.id);
        setSelectedDesignVersionDate(formatDateDetailComma(latestVersion.createdAt));
      }
    }
  };

  // Sort download options based on order
  const sortDownloadOptions = (options, isDesign) => {
    const orderMap = isDesign
      ? designCategoryOrder.reduce((acc, item) => ({ ...acc, [item.value]: item.order }), {})
      : projectCategoryOrder.reduce((acc, item) => ({ ...acc, [item.value]: item.order }), {});

    return [...new Set(options)].sort((a, b) => orderMap[a] - orderMap[b]);
  };

  // First useEffect for Design/Designs options & Version options
  useEffect(() => {
    if (!object) return;

    let filteredOptions = [];

    if (isDesign) {
      const design = object;
      setDesign(design);
      // Design: has a design version
      if (design.history && design.history.length > 0) {
        getVersionDetails(design);
        if (!filteredOptions.includes("Design")) {
          filteredOptions.push("Design");
        }
      }
    } else {
      const project = object;
      setProject(project);
      // Designs: has related designs
      if (project.designs.length > 0) {
        if (!filteredOptions.includes("Designs")) {
          filteredOptions.push("Designs");
        }
      }
    }

    const sortedOptions = sortDownloadOptions(filteredOptions, isDesign);
    setDownloadOptions(sortedOptions);
  }, [object, isDesign, user]);

  // Budget useEffect
  useEffect(() => {
    if (!design?.budgetId || !userBudgets) return;

    const budgetId = design.budgetId;
    const fetchedBudget = userBudgets.find((budget) => budget.id === budgetId);
    if (!fetchedBudget) {
      console.error("Budget not found.");
    } else {
      if (fetchedBudget.budget?.amount > 0 || fetchedBudget.items?.length > 0) {
        setDownloadOptions((prev) => {
          const newOptions = [...prev];
          if (!newOptions.includes("Budget")) {
            newOptions.push("Budget");
          }
          return sortDownloadOptions(newOptions, true); // true for design
        });
      }
    }
  }, [design, userBudgets]);

  // Timeline useEffect
  useEffect(() => {
    if (!project?.timelineId || !userTimelines?.length) return;

    const timelineId = project.timelineId;
    const fetchedTimeline = userTimelines.find((timeline) => timeline.id === timelineId);
    if (!fetchedTimeline) {
      console.error("Timeline not found.");
    } else {
      if (fetchedTimeline.events.length > 0) {
        setDownloadOptions((prev) => {
          const newOptions = [...prev];
          if (!newOptions.includes("Timeline")) {
            newOptions.push("Timeline");
          }
          return sortDownloadOptions(newOptions, false); // false for project
        });
      }
    }
  }, [project, userTimelines]);

  // Plan Map useEffect
  useEffect(() => {
    if (!project?.planMapId || !userPlanMaps?.length) return;

    const planMapId = project.planMapId;
    const fetchedPlanMap = userPlanMaps.find((planMap) => planMap.id === planMapId);
    if (!fetchedPlanMap) {
      console.error("Plan Map not found.");
    } else {
      if (fetchedPlanMap.venuePlan) {
        setDownloadOptions((prev) => {
          const newOptions = [...prev];
          if (!newOptions.includes("Plan Map")) {
            newOptions.push("Plan Map");
          }
          return sortDownloadOptions(newOptions, false);
        });
      }
    }
  }, [project, userPlanMaps]);

  // Project Budget useEffect
  useEffect(() => {
    if (!project?.projectBudgetId || !userProjectBudgets?.length) return;

    const projectBudgetId = project.projectBudgetId;
    const fetchedProjectBudget = userProjectBudgets.find((budget) => budget.id === projectBudgetId);
    if (!fetchedProjectBudget) {
      console.error("Project Budget not found.");
    } else {
      if (fetchedProjectBudget.budgets?.length > 0 || fetchedProjectBudget.budget?.amount > 0) {
        setDownloadOptions((prev) => {
          const newOptions = [...prev];
          if (!newOptions.includes("Budget")) {
            newOptions.push("Budget");
          }
          return sortDownloadOptions(newOptions, false);
        });
      }
    }
  }, [project, userProjectBudgets]);

  useEffect(() => {
    setErrors({});
  }, [selectedDesignCategory, selectedProjectCategory]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    console.log("Download Options: ", downloadOptions);
    if (downloadOptions.length > 0) {
      const topCategory = downloadOptions[0];
      if (isDesign) {
        setSelectedDesignCategory(topCategory);
        setDesignFileType(
          selectedDesignCategory === "Design"
            ? "PDF"
            : selectedDesignCategory === "Budget"
            ? "XLSX"
            : ""
        );
      } else {
        setSelectedProjectCategory(topCategory);
        setProjectFileType(
          selectedProjectCategory === "Designs" || selectedProjectCategory === "Plan Map"
            ? "PDF"
            : selectedProjectCategory === "Timeline" || selectedProjectCategory === "Budget"
            ? "XLSX"
            : ""
        );
      }
    }
  }, [downloadOptions, isDesign]);

  return (
    <>
      <Version
        isDrawerOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        design={design}
        isHistory={false}
        handleSelect={handleSelect}
        title="Select a version to download"
      />
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
            borderBottom: "1px solid var(--inputBg)",
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
          {downloadOptions.length > 0 ? (
            <>
              <Typography variant="body1" sx={{ marginBottom: "10px" }}>
                Choose which to download
              </Typography>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <FormControl sx={formControlStyles}>
                  <Select
                    labelId="design-category-select-label"
                    id="design-category-select"
                    value={isDesign ? selectedDesignCategory : selectedProjectCategory}
                    onChange={(e) =>
                      isDesign
                        ? setSelectedDesignCategory(e.target.value)
                        : setSelectedProjectCategory(e.target.value)
                    }
                    MenuComponent={StyledMenu}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: "10px",
                          "& .MuiMenu-list": {
                            padding: 0,
                          },
                        },
                      },
                    }}
                    IconComponent={(props) => (
                      <KeyboardArrowDownRoundedIcon
                        sx={{ color: "var(--color-white) !important" }}
                      />
                    )}
                    sx={selectStyles}
                  >
                    {downloadOptions.map((category) => (
                      <MenuItem key={category} sx={menuItemStyles} value={category}>
                        <Typography variant="inherit">{category}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              {errors?.category && <div className="error-text">{errors?.category}</div>}
              {isDesign && selectedDesignCategory === "Design" && (
                <>
                  <Typography variant="body1" sx={{ marginBottom: "10px" }}>
                    Version
                    <IconButton onClick={() => setIsHistoryOpen(true)}>
                      <OpenInFullRoundedIcon
                        sx={{ color: "var(--color-white)", fontSize: "1.2rem", marginLeft: "20px" }}
                      />
                    </IconButton>
                  </Typography>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <FormControl sx={formControlStyles}>
                      <Select
                        labelId="date-modified-select-label"
                        id="date-modified-select"
                        value={selectedDesignVersionId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          handleSelect(selectedId);
                        }}
                        MenuComponent={StyledMenu}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: "10px",
                              "& .MuiMenu-list": {
                                padding: 0,
                              },
                            },
                          },
                        }}
                        IconComponent={(props) => (
                          <KeyboardArrowDownRoundedIcon
                            sx={{ color: "var(--color-white) !important" }}
                          />
                        )}
                        sx={selectStyles}
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
                              <img src={version.imagesLink[0]} alt="" />
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
                (selectedProjectCategory === "Timeline" ||
                  selectedProjectCategory === "Budget")) ? (
                <>
                  <Typography variant="body1" sx={{ marginBottom: "10px" }}>
                    File type
                  </Typography>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <FormControl sx={formControlStyles}>
                      <Select
                        labelId="file-type-select-label"
                        id="file-type-select"
                        value={isDesign ? designFileType : projectFileType}
                        onChange={(e) =>
                          isDesign
                            ? setDesignFileType(e.target.value)
                            : setProjectFileType(e.target.value)
                        }
                        MenuComponent={StyledMenu}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: "10px",
                              "& .MuiMenu-list": {
                                padding: 0,
                              },
                            },
                          },
                        }}
                        IconComponent={(props) => (
                          <KeyboardArrowDownRoundedIcon
                            sx={{ color: "var(--color-white) !important" }}
                          />
                        )}
                        sx={selectStyles}
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
            </>
          ) : (
            <div
              style={{
                margin: "20px",
                marginTop: "35px",
                display: "flex",
                color: "var(--noContent)",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src="/img/design-placeholder.png" alt="No designs yet" />
              <p style={{ color: "var(--noContent)", fontWeight: "500", marginBottom: 0 }}>
                Nothing to download.
              </p>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "var(--nav-card-modal)", margin: "10px" }}>
          {downloadOptions.length > 0 && (
            <>
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
            </>
          )}
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
            {downloadOptions.length > 0 ? "Cancel" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
  width: "100%",
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
  backgroundColor: "var(--dropdown)", //bgColor
  transition: "all 0.3s ease",
  display: "block",
  minHeight: "auto",
  "&:hover": {
    backgroundColor: "var(--dropdownHover) !important",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--dropdownSelected) !important",
    color: "var(--color-white)",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownSelectedHover) !important",
  },
};

// Styles for Select
const selectStyles = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white)",
    WebkitTextFillColor: "var(--color-white)",
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
    WebkitTextFillColor: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
};

const selectStylesDisabled = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white) !important",
    WebkitTextFillColor: "var(--color-white)",
    "&:focus": {
      color: "var(--color-white)",
    },
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "&.Mui-disabled": {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent",
    },
    "& .MuiSelect-icon": {
      color: "transparent",
    },
    "& .MuiSelect-select": {
      color: "var(--color-white)",
      WebkitTextFillColor: "var(--color-white)",
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
};
