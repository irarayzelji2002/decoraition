import "../../css/project.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ExportIcon from "./svg/ExportIcon";
import {
  fetchProjectDesigns,
  fetchProjectBudget,
  updateProjectBudget,
} from "./backend/ProjectDetails";
import { showToast } from "../../functions/utils";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { fetchVersionDetails, getDesignImage } from "../DesignSpace/backend/DesignActions";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import Loading from "../../components/Loading";
import deepEqual from "deep-equal";
import ProjectSpace from "./ProjectSpace";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "./Project";
import { IconButton } from "@mui/material";
import {
  AddIconGradient,
  EditIconSmallGradient,
  DeleteIconGradient,
} from "../../components/svg/DefaultMenuIcons";
import {
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  dialogActionsStyles,
  dialogContentStyles,
  dialogStyles,
  dialogTitleStyles,
} from "../../components/RenameModal";
import CurrencySelect from "../../components/CurrencySelect";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";
import { textFieldInputProps } from "../DesignSpace/DesignSettings";

const getPHCurrency = () => {
  let currency = {
    countryISO: "PH",
    currencyCode: "PHP",
    currencyName: "Philippines",
    currencySymbol: "₱",
    flagEmoji: "🇵🇭",
  };
  return currency;
};

function ProjBudget() {
  const { projectId } = useParams();
  const { isDarkMode, projects, userProjects } = useSharedProps();
  const navigate = useNavigate();
  const location = useLocation();
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");
  const [project, setProject] = useState({});

  const [designs, setDesigns] = useState([]);
  const {
    user,
    userDoc,
    userBudgets,
    items,
    userItems,
    budgets,
    userDesigns,
    designVersions,
    userDesignVersions,
  } = useSharedProps();
  const [designBudgetItems, setDesignBudgetItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [designImages, setDesignImages] = useState({});
  const [itemImages, setItemImages] = useState({});
  const [loadingProject, setLoadingProject] = useState(true);
  const formatNumber = (num) => (typeof num === "number" ? num.toFixed(2) : "0.00");

  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [formattedTotalCost, setFormattedTotalCost] = useState("0.00");
  const [menuOpen, setMenuOpen] = useState(false);

  const [projectBudget, setProjectBudget] = useState(0);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRemoveBudgetModalOpen, setIsRemoveBudgetModalOpen] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState(getPHCurrency());
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [budgetCurrencyForInput, setBudgetCurrencyForInput] = useState(getPHCurrency());
  const [budgetAmountForInput, setBudgetAmountForInput] = useState("");
  const [isBudgetButtonDisabled, setIsBudgetButtonDisabled] = useState(false);
  const [isConfirmRemoveBudgetBtnDisabled, setIsConfirmRemoveBudgetBtnDisabled] = useState(false);
  const [error, setError] = useState("");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [currencyDetails, setCurrencyDetails] = useState([]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleBudgetModal = (opening, editing) => {
    setMenuOpen(false);
    if (opening && editing) setIsEditingBudget(true);
    else setIsEditingBudget(false);
    if (!opening) {
      setBudgetAmountForInput(budgetAmount);
      setBudgetCurrencyForInput(budgetCurrency);
    }
    setIsBudgetModalOpen(!isBudgetModalOpen);
  };

  // Get project
  useEffect(() => {
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
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
      showToast("error", "You don't have access to this project");
      navigate("/");
      return;
    }
    // If they have access, proceed with setting roles
    setIsManager(isManagerProject(project, userDoc.id));
    setIsManagerContentManager(isManagerContentManagerProject(project, userDoc.id));
    setIsManagerContentManagerContributor(
      isManagerContentManagerContributorProject(project, userDoc.id)
    );
    setIsCollaborator(isCollaboratorProject(project, userDoc.id));
  }, [project, userDoc]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          console.log(`Fetching designs for budget: ${projectId}`); // Debug log
          await fetchProjectDesigns(projectId, setDesigns);
        } catch (error) {
          showToast("error", `Error fetching project designs: ${error.message}`);
        }
      }
    };

    fetchData();
  }, [user, projectId]);

  useEffect(() => {
    const fetchBudgetData = async () => {
      const budgetItems = {};
      try {
        for (const design of designs) {
          const result = await fetchVersionDetails(design, user);
          if (result.success) {
            const latestVersion = result.versionDetails[0];
            const budgetId = latestVersion?.budgetId;
            if (budgetId) {
              const fetchedBudget =
                userBudgets.find((b) => b.id === budgetId) ||
                budgets.find((b) => b.id === budgetId);
              if (fetchedBudget) {
                const fetchedItems = await Promise.all(
                  fetchedBudget.items.map(async (itemId) => {
                    const item =
                      userItems.find((i) => i.id === itemId) || items.find((i) => i.id === itemId);
                    return item || null;
                  })
                );
                budgetItems[design.id] = fetchedItems.filter((item) => item !== null);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching budget data:", error);
      }
      setDesignBudgetItems(budgetItems);
      setLoading(false);
    };

    if (designs.length > 0) {
      fetchBudgetData();
    } else {
      setLoading(false);
    }
  }, [designs, user, userBudgets, items, userItems, budgets]);

  const fetchDesignImage = (designId) => {
    if (!designId) {
      console.log("No design ID provided");
      return "";
    }

    const fetchedDesign =
      userDesigns.find((design) => design.id === designId) ||
      designs.find((design) => design.id === designId);
    if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
      return "";
    }

    const latestDesignVersionId = fetchedDesign.history[fetchedDesign.history.length - 1];
    if (!latestDesignVersionId) {
      return "";
    }
    const fetchedLatestDesignVersion =
      userDesignVersions.find((designVer) => designVer.id === latestDesignVersionId) ||
      designVersions.find((designVer) => designVer.id === latestDesignVersionId);
    if (!fetchedLatestDesignVersion?.images?.length) {
      return "";
    }

    return fetchedLatestDesignVersion.images[0].link || "";
  };

  useEffect(() => {
    const fetchDesignImages = async () => {
      const images = {};
      for (const design of designs) {
        const image = fetchDesignImage(design.id);
        images[design.id] = image;
      }
      setDesignImages(images);
    };

    const fetchItemImages = async () => {
      const images = {};
      for (const design of designs) {
        for (const item of designBudgetItems[design.id] || []) {
          const image = item.image || "/img/transparent-image.png";
          images[item.id] = image;
        }
      }
      setItemImages(images);
    };

    if (designs.length > 0) {
      fetchDesignImages();
      fetchItemImages();
    }
  }, [designs, designBudgetItems]);

  const totalProjectBudget = designs.reduce((total, design) => {
    const totalCost = designBudgetItems[design.id]?.reduce(
      (sum, item) => sum + parseFloat(item.cost.amount || 0) * (item.quantity || 1),
      0
    );
    return total + (totalCost || 0);
  }, 0);

  const handleValidation = (budgetAmount) => {
    let error = "";
    if (!budgetAmount || budgetAmount === 0) {
      error = "Budget is required";
    } else {
      const budgetAmountNum = parseFloat(budgetAmount);
      if (isNaN(budgetAmountNum)) {
        error = "Budget must be a number";
      } else if (budgetAmountNum <= 0) {
        error = "Budget must be greater than 0";
      } else if (budgetAmountNum > 999999999) {
        error = "Budget is too high";
      }
    }
    return error;
  };

  const handleUpdateBudget = async (budgetAmount, budgetCurrency) => {
    setIsBudgetButtonDisabled(true);
    setIsConfirmRemoveBudgetBtnDisabled(true);
    const error = handleValidation(budgetAmount);
    if (error !== "") {
      setError(error);
      setIsBudgetButtonDisabled(false);
      setIsConfirmRemoveBudgetBtnDisabled(false);
      return;
    } else {
      setError("");
    }

    try {
      const response = await updateProjectBudget(
        projectId,
        { amount: parseFloat(budgetAmount), currency: budgetCurrency },
        user
      );
      if (response.success) {
        showToast("success", "Budget added successfully");
        setIsBudgetModalOpen(false);
        setProjectBudget({ amount: parseFloat(budgetAmount), currency: budgetCurrency });
      } else {
        throw new Error("Error adding budget");
      }
    } catch (error) {
      console.error("Error adding budget:", error);
      showToast("error", "Failed to add budget");
    }
    setIsBudgetButtonDisabled(false);
    setIsConfirmRemoveBudgetBtnDisabled(false);
  };

  const handleRemoveBudget = async (budgetCurrency) => {
    setBudgetAmount(0);
    try {
      const response = await updateProjectBudget(
        projectId,
        { amount: 0, currency: budgetCurrency },
        user
      );
      if (response.success) {
        showToast("success", "Budget deleted successfully");
        setIsRemoveBudgetModalOpen(false);
        setProjectBudget({ amount: 0, currency: budgetCurrency });
      } else {
        throw new Error("Error deleting budget");
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      showToast("error", "Failed to delete budget");
    }
  };

  useEffect(() => {
    const fetchProjectBudgetData = async () => {
      try {
        await fetchProjectBudget(projectId, setProjectBudget);
      } catch (error) {
        console.error("Error fetching project budget:", error);
      }
    };

    if (projectId) {
      fetchProjectBudgetData();
    }
  }, [projectId]);

  return (
    <ProjectSpace
      project={project}
      projectId={projectId}
      inDesign={false}
      inPlanMap={false}
      inTimeline={false}
      inBudget={true}
      changeMode={changeMode}
      setChangeMode={setChangeMode}
    >
      <div className="budgetHolder">
        <span
          className="priceSum"
          style={{
            backgroundColor: "#397438",
            marginBottom: "20px",
          }}
        >
          {(() => {
            if (formattedTotalCost === "0.00" && projectBudget.amount === 0) {
              return <>No cost and added budget</>;
            } else if (formattedTotalCost === "0.00") {
              return (
                <>
                  No cost, Budget:{" "}
                  <strong>
                    {projectBudget.currency?.currencyCode} {formatNumber(projectBudget.amount)}
                  </strong>
                </>
              );
            } else if (projectBudget.amount === 0) {
              return (
                <>
                  Total Cost: <strong>{formattedTotalCost}</strong>, No added budget
                </>
              );
            } else {
              return (
                <>
                  Total Cost: <strong>{formattedTotalCost}</strong>, Budget:{" "}
                  <strong>
                    {projectBudget.currency?.currencyCode} {formatNumber(projectBudget.amount)}
                  </strong>
                </>
              );
            }
          })()}
        </span>

        <div style={{ display: "flex", gap: "5px" }}>
          {projectBudget.amount > 0 ? (
            <>
              <IconButton onClick={() => toggleBudgetModal(true, true)} sx={iconButtonStyles}>
                <EditIconSmallGradient />
              </IconButton>
              <IconButton
                onClick={() => {
                  setIsRemoveBudgetModalOpen(true);
                  setMenuOpen(false);
                }}
                sx={iconButtonStyles}
              >
                <DeleteIconGradient />
              </IconButton>
            </>
          ) : (
            <IconButton onClick={() => toggleBudgetModal(true, false)} sx={iconButtonStyles}>
              <AddIconGradient />
            </IconButton>
          )}
        </div>

        <div style={{ marginBottom: "10%" }}>
          {loading ? (
            <Loading />
          ) : designs.length > 0 ? (
            designs.map((design) => {
              const totalCost = designBudgetItems[design.id]?.reduce(
                (sum, item) => sum + parseFloat(item.cost.amount || 0) * (item.quantity || 1),
                0
              );

              return (
                <div className="sectionBudget" key={design.id}>
                  <div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="SubtitleBudget" style={{ fontSize: "30px" }}>
                        {design.designName}
                      </span>
                      <span className="SubtitlePrice">Total Cost: Php {totalCost?.toFixed(2)}</span>
                    </div>

                    <div className="image-frame-project">
                      {/* the design image goes here */}
                      <img
                        src={designImages[design.id] || "../../img/logoWhitebg.png"}
                        alt={`design preview `}
                        className="image-preview"
                        style={{ marginRight: "10px" }}
                      />
                    </div>
                  </div>
                  <div className="itemList">
                    {designBudgetItems[design.id]?.map((item) => (
                      <div className="item" key={item.id}>
                        {/* the item image goes here */}
                        <img
                          src={itemImages[item.id] || "../../img/logoWhitebg.png"}
                          alt={`item preview `}
                          style={{ width: "80px", height: "80px" }}
                        />
                        <div
                          style={{
                            marginLeft: "12px",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span className="SubtitleBudget">{item.itemName}</span>
                          <span
                            className="SubtitlePrice"
                            style={{ backgroundColor: "transparent" }}
                          >
                            Php {item.cost.amount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: "100%", marginLeft: "10px" }}>
                    <div
                      onClick={() =>
                        navigate(`/budget/${design.id}`, {
                          state: { designId: design.id },
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <ExportIcon />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-content" style={{ height: "80vh" }}>
              <img
                src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                alt="No designs yet"
              />
              <p>No designs yet. Start creating.</p>
            </div>
          )}
        </div>
      </div>
      {isBudgetModalOpen && (
        <Dialog
          open={isBudgetModalOpen}
          onClose={() => toggleBudgetModal(false, isEditingBudget)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          sx={dialogStyles}
        >
          <DialogTitle sx={dialogTitleStyles}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1.15rem",
                flexGrow: 1,
                maxWidth: "80%",
                whiteSpace: "normal",
              }}
            >
              {isEditingBudget ? "Edit the budget" : "Add a Budget"}
            </Typography>
            <IconButton
              onClick={() => toggleBudgetModal(false, isEditingBudget)}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <div style={{ wrap: "nowrap" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="input-group budget" style={{ marginTop: "12px", margin: "18px" }}>
                <div style={{ flexWrap: "nowrap", display: "flex" }}>
                  <CurrencySelect
                    selectedCurrency={budgetCurrencyForInput}
                    setSelectedCurrency={setBudgetCurrencyForInput}
                    currencyDetails={currencyDetails}
                  />
                  <TextField
                    id="item-price"
                    type="text"
                    placeholder="Enter item price"
                    value={budgetAmountForInput}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        if (/^\d+$/.test(value)) {
                          value = value.replace(/^0+/, "");
                        }
                        setBudgetAmountForInput(value);
                      }
                    }}
                    sx={priceTextFieldStyles}
                    inputProps={{ ...textFieldInputProps, maxLength: 22 }}
                  />
                </div>
              </div>
              {error !== "" && (
                <div className="error-text" style={{ marginLeft: "20px" }}>
                  {error}
                </div>
              )}
            </div>
          </div>
          <DialogActions sx={{ ...dialogActionsStyles, marginTop: "0 !important" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleUpdateBudget(budgetAmountForInput, budgetCurrencyForInput)}
              sx={{
                ...gradientButtonStyles,
                opacity: isBudgetButtonDisabled ? "0.5" : "1",
                cursor: isBudgetButtonDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isBudgetButtonDisabled && "var(--gradientButton)",
                },
              }}
              disabled={isBudgetButtonDisabled}
            >
              {isEditingBudget ? "Edit budget" : "Add Budget"}
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => toggleBudgetModal(false, isEditingBudget)}
              sx={outlinedButtonStyles}
              onMouseOver={(e) =>
                (e.target.style.backgroundImage =
                  "var(--lightGradient), var(--gradientButtonHover)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
              }
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {isRemoveBudgetModalOpen && (
        <Dialog
          open={isRemoveBudgetModalOpen}
          onClose={() => setIsRemoveBudgetModalOpen(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          sx={dialogStyles}
        >
          <DialogTitle sx={dialogTitleStyles}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1.15rem",
                flexGrow: 1,
                maxWidth: "80%",
                whiteSpace: "normal",
              }}
            >
              Confirm budget removal
            </Typography>
            <IconButton
              onClick={() => setIsRemoveBudgetModalOpen(false)}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ ...dialogContentStyles, marginTop: "0 !important" }}>
            <span style={{ textAlign: "center", margin: "18px" }}>
              Are you sure you want to remove the budget?
            </span>
          </DialogContent>
          <DialogActions sx={{ ...dialogActionsStyles, marginTop: "0 !important" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleRemoveBudget(budgetCurrency)}
              sx={{
                ...gradientButtonStyles,
                opacity: isConfirmRemoveBudgetBtnDisabled ? "0.5" : "1",
                cursor: isConfirmRemoveBudgetBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isConfirmRemoveBudgetBtnDisabled && "var(--gradientButton)",
                },
              }}
              disabled={isConfirmRemoveBudgetBtnDisabled}
            >
              Yes
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setIsRemoveBudgetModalOpen(false)}
              sx={outlinedButtonStyles}
              onMouseOver={(e) =>
                (e.target.style.backgroundImage =
                  "var(--lightGradient), var(--gradientButtonHover)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
              }
            >
              No
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <div className="bottom-filler" />
    </ProjectSpace>
  );
}

export default ProjBudget;

const priceTextFieldStyles = {
  input: { color: "var(--color-white)" },
  height: "fit-content",
  borderRadius: "10px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: 2, // border thickness
  },
  "& .MuiOutlinedInput-root": {
    borderColor: "transparent",
    borderRadius: "10px",
    backgroundColor: "var(--nav-card-modal)",
    "& fieldset": {
      borderColor: "transparent",
      borderRadius: "10px",
    },
    "&:hover fieldset": {
      borderColor: "transparent",
    },
    "&.Mui-focused fieldset": {
      borderColor: "transparent",
    },
  },
  "& input": {
    color: "var(--color-white)",
    padding: "15px 16px 15px 10px",
  },
  "& .MuiFormHelperText-root": {
    color: "var(--color-quaternary)",
    textAlign: "left",
    marginLeft: 0,
    marginTop: "5px",
  },
};
