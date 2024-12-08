import "../../css/project.css";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ExportIcon from "./svg/ExportIcon";
import { showToast } from "../../functions/utils";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import axios from "axios";
import deepEqual from "deep-equal";
import { getAllISOCodes, getAllInfoByISO } from "iso-country-currency";
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
  AddIcon,
  DeleteIconWhite,
  EditIconWhite,
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
import {
  CloseRounded as CloseRoundedIcon,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";
import {
  dialogActionsStyles,
  dialogContentStyles,
  dialogStyles,
  dialogTitleStyles,
} from "../../components/RenameModal";
import CurrencySelect from "../../components/CurrencySelect";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";
import { textFieldInputProps } from "../DesignSpace/DesignSettings";
import { AddBudget } from "../DesignSpace/svg/AddImage";
import Loading from "../../components/Loading";
import LoadingPage from "../../components/LoadingPage";
import TooltipWithClickAway from "../../components/TooltipWithClickAway";
import { DescriptionTooltip } from "../DesignSpace/Design";

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
  const {
    user,
    userDoc,
    projects,
    userProjects,
    projectBudgets,
    userProjectBudgets,
    designs,
    userDesigns,
    designVersions,
    userDesignVersions,
    budgets,
    userBudgets,
    items,
    userItems,
    isDarkMode,
  } = useSharedProps();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);

  // Project Budget States
  const [project, setProject] = useState(null);
  const [projectBudget, setProjectBudget] = useState(null);
  const [projectDesigns, setProjectDesigns] = useState([]);
  const [designBudgets, setDesignBudgets] = useState({}); // all design's budgets
  const [designItems, setDesignItems] = useState({}); // all design's items
  const [totalCosts, setTotalCosts] = useState({});
  const [formattedTotalCost, setFormattedTotalCost] = useState("0.00");
  const [designImages, setDesignImages] = useState({});
  const [itemImages, setItemImages] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  // Budget Modal States
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRemoveBudgetModalOpen, setIsRemoveBudgetModalOpen] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [budgetCurrencyForInput, setBudgetCurrencyForInput] = useState(null);
  const [defaultBudgetCurrency, setDefaultBudgetCurrency] = useState({});
  const [budgetAmountForInput, setBudgetAmountForInput] = useState("");
  const [error, setError] = useState("");
  const [isBudgetButtonDisabled, setIsBudgetButtonDisabled] = useState(false);
  const [isConfirmRemoveBudgetBtnDisabled, setIsConfirmRemoveBudgetBtnDisabled] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [currencyDetails, setCurrencyDetails] = useState([]);

  // Access Control States
  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");

  // Tooltip States
  const [showGuide, setShowGuide] = useState(false);
  const [showGuideLocked, setShowGuideLocked] = useState(false);

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

  // Currency Functions
  const isoToFlagEmoji = (isoCode) => {
    return isoCode
      .toUpperCase() // Ensure uppercase
      .replace(
        /./g,
        (char) => String.fromCodePoint(127397 + char.charCodeAt(0)) // Offset to flag Unicode range
      );
  };

  const getCurrencyData = () => {
    const allISO = getAllISOCodes(); // Returns an array of objects, not just ISO codes

    const currencyDetails = allISO.map((country) => {
      const countryInfo = getAllInfoByISO(country.iso); // Pass the ISO code string
      const currencyCode = countryInfo?.currency || country.currency;
      const currencyName = countryInfo?.countryName || currencyCode;
      const currencySymbol = countryInfo?.symbol || currencyCode;
      return {
        currencyCode,
        flagEmoji: isoToFlagEmoji(country.iso), // Alpha-2 ISO code for FlagIcon
        currencyName,
        currencySymbol,
        countryISO: country.iso,
      };
    });

    // Filter to only include USD and PHP
    const filteredCurrencies = currencyDetails.filter(
      (currency) => currency.currencyCode === "PHP" || currency.currencyCode === "USD"
    );
    return filteredCurrencies;
  };

  const getValidCurrency = (budgetCurrency) => {
    // First check if currencyDetails is populated
    if (!currencyDetails || currencyDetails.length === 0) {
      return budgetCurrency ?? getPHCurrency();
    }
    // Then check if the budget currency is valid
    const isValidCurrency = currencyDetails.some(
      (currency) => currency.currencyCode === budgetCurrency?.currencyCode
    );
    return isValidCurrency ? budgetCurrency : getPHCurrency();
  };

  useEffect(() => {
    const currencyArray = getCurrencyData();
    setCurrencyDetails(currencyArray);
    const phCurrency = currencyArray.find((currency) => currency.countryISO === "PH");
    setDefaultBudgetCurrency(phCurrency);
  }, []);

  // Initialize project budget data
  // Get project
  useEffect(() => {
    if (projectId && (userProjects.length > 0 || projects.length > 0)) {
      const fetchedProject =
        userProjects.find((p) => p.id === projectId) || projects.find((p) => p.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found");
      } else {
        // Check if user has access
        const hasAccess = isCollaboratorProject(fetchedProject, userDoc?.id);
        if (!hasAccess) {
          console.error("No access to project");
          setLoading(false);
          showToast("error", "You don't have access to this project");
          navigate("/homepage");
          return;
        }
        if (!project || Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
          setProject(fetchedProject);
          console.log("proj budget - current project:", fetchedProject);
        }
      }
    }
  }, [projectId, projects, userProjects, isCollaborator]);

  // Get project budget
  useEffect(() => {
    if (project?.id) {
      const fetchedProjectBudget =
        userProjectBudgets.find((pb) => pb.projectId === project.id) ||
        projectBudgets.find((pb) => pb.projectId === project.id);

      if (!fetchedProjectBudget) {
        console.error("Project budget not found");
      } else if (
        !projectBudget ||
        Object.keys(projectBudget).length === 0 ||
        !deepEqual(projectBudget, fetchedProjectBudget)
      ) {
        setProjectBudget(fetchedProjectBudget);
        setBudgetAmount(fetchedProjectBudget.budget?.amount ?? 0);
        setBudgetAmountForInput(fetchedProjectBudget.budget?.amount ?? 0);
        setBudgetCurrency(fetchedProjectBudget.budget?.currency ?? getPHCurrency());
        setBudgetCurrencyForInput(fetchedProjectBudget.budget?.currency ?? getPHCurrency());
        console.log("proj budget - current project budget:", fetchedProjectBudget);
      }
    }
    setLoading(false);
  }, [project, projectBudgets, userProjectBudgets, getPHCurrency]);

  useEffect(() => {
    if (projectBudget && projectBudget?.budget?.currency)
      setBudgetCurrencyForInput(getValidCurrency(projectBudget.budget?.currency));
  }, [projectBudget, currencyDetails]);

  // Get project designs and their latest versions
  useEffect(() => {
    if (project?.designs?.length > 0 && userDesigns?.length > 0) {
      // Get all designs that belong to this project
      const projectDesigns = project.designs
        .map(
          (designId) =>
            userDesigns.find((design) => design.id === designId) ||
            designs.find((design) => design.id === designId)
        )
        .filter((design) => design); // Filter out any undefined values
      let designsByLatest = [];
      if (projectDesigns.length > 0) {
        // Sort designs by latest modified
        designsByLatest = [...projectDesigns].sort(
          (a, b) => b.modifiedAt?.toMillis() - a.modifiedAt?.toMillis()
        );
      }
      console.log("proj budget - fetched project designs", designsByLatest);
      if (projectDesigns.length === 0 || !deepEqual(projectDesigns, designsByLatest)) {
        setProjectDesigns(designsByLatest);
      }
    }
  }, [project, designs, userDesigns]);

  // Get design budgets and items
  useEffect(() => {
    let mounted = true;

    const fetchDesignBudgetsAndItems = async () => {
      if (!mounted) return;
      try {
        const budgetsMap = {};
        const itemsMap = {};
        const designImagesMap = {};
        const itemImagesMap = {};

        for (const design of projectDesigns) {
          // Get latest version
          const latestVersionId = design.history[design.history.length - 1];
          const latestVersion =
            userDesignVersions.find((v) => v.id === latestVersionId) ||
            designVersions.find((v) => v.id === latestVersionId);

          if (latestVersion) {
            // Get budget
            const designBudget =
              userBudgets.find((b) => b.designVersionId === latestVersion.id) ||
              budgets.find((b) => b.designVersionId === latestVersion.id);

            if (designBudget) {
              budgetsMap[design.id] = designBudget;

              // Get items
              const budgetItems =
                designBudget.items
                  ?.map(
                    (itemId) =>
                      userItems.find((i) => i.id === itemId) || items.find((i) => i.id === itemId)
                  )
                  .filter((itemId) => itemId) || [];

              itemsMap[design.id] = budgetItems;

              // Store item images
              budgetItems.forEach((item) => {
                if (item.image) {
                  itemImagesMap[item.id] = item.image;
                }
              });
            }

            // Store design preview image
            if (latestVersion.images?.[0]?.link) {
              designImagesMap[design.id] = latestVersion.images[0].link;
            }
          }
        }

        if (designBudgets.length === 0 || !deepEqual(designBudgets, budgetsMap)) {
          setDesignBudgets(budgetsMap);
          console.log("proj budget - design budgets:", budgetsMap);
        }
        if (designItems.length === 0 || !deepEqual(designItems, itemsMap)) {
          setDesignItems(itemsMap);
          console.log("proj budget - design items:", itemsMap);
        }
        if (designImages.length === 0 || !deepEqual(designImages, designImagesMap)) {
          setDesignImages(designImagesMap);
          console.log("proj budget - design images:", designImagesMap);
        }
        if (itemImages.length === 0 || !deepEqual(itemImages, itemImagesMap)) {
          setItemImages(itemImagesMap);
          console.log("proj budget - item images:", itemImagesMap);
        }
      } catch (err) {
        console.error("Error fetching design budgets and items:", err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchDesignBudgetsAndItems();

    return () => {
      mounted = false;
    };
  }, [projectDesigns, budgets, userBudgets, items, userItems, designVersions, userDesignVersions]);

  // Compute total costs using useMemo
  const { costs, totalCostSum } = useMemo(() => {
    if (!projectDesigns || !designItems) return { costs: {}, totalCostSum: 0 };

    const costs = {};
    let totalCostSum = 0;

    for (const design of projectDesigns) {
      const items = designItems[design.id] || [];
      const designTotal = items.reduce((sum, item) => {
        if (item.includedInTotal !== false) {
          return sum + parseFloat(item.cost?.amount || 0) * (item.quantity || 1);
        }
        return sum;
      }, 0);

      costs[design.id] = designTotal.toFixed(2);
      totalCostSum += designTotal;
    }

    return { costs, totalCostSum };
  }, [projectDesigns, designItems]);

  // Use the memoized values in an effect
  useEffect(() => {
    if (!deepEqual(totalCosts, costs)) {
      setTotalCosts(costs);
      console.log("proj budget - total costs:", costs);
    }
    setFormattedTotalCost(totalCostSum.toFixed(2));
    console.log("proj budget - formatted total cost:", totalCostSum.toFixed(2));
  }, [costs, totalCostSum]);

  // Update budget amount and currency when project budget changes
  useEffect(() => {
    setBudgetAmount(projectBudget?.budget?.amount ?? 0);
    setBudgetCurrency(projectBudget?.budget?.currency ?? getPHCurrency());
  }, [projectBudget]);

  // Budget validation
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

  // Add/Edit budget handler
  const handleUpdateBudget = async (budgetAmount, budgetCurrency) => {
    setIsBudgetButtonDisabled(true);
    setIsConfirmRemoveBudgetBtnDisabled(true);

    // Validation for adding/editing
    if (!isRemoveBudgetModalOpen) {
      const error = handleValidation(budgetAmount);
      if (error !== "") {
        setError(error);
        setIsBudgetButtonDisabled(false);
        return;
      } else {
        setError("");
      }
    }

    try {
      const response = await axios.put(
        `/api/project/${projectBudget.id}/update-budget`,
        {
          amount: parseFloat(budgetAmount),
          currency: budgetCurrency,
        },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      console.log("proj budget - response", response);
      if (response.status === 200) {
        if (isRemoveBudgetModalOpen) {
          // deleting budget
          setIsRemoveBudgetModalOpen(false);
          showToast("success", "Budget deleted successfully");
        } else {
          // adding/editing
          setIsBudgetModalOpen(false);
          showToast(
            "success",
            isEditingBudget ? "Budget updated successfully" : "Budget added successfully"
          );
        }
      }
    } catch (error) {
      console.error("Error updating budget:", error);
      showToast("error", "Failed to update budget");
    } finally {
      setIsBudgetButtonDisabled(false);
      setIsConfirmRemoveBudgetBtnDisabled(false);
    }
  };

  // other budget functions
  const formatNumber = (num) => (typeof num === "number" ? num.toFixed(2) : "0.00");

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleBudgetModal = (opening, editing) => {
    setMenuOpen(false);
    if (opening) {
      setIsEditingBudget(editing);
      // Set input values when opening the modal
      setBudgetAmountForInput(budgetAmountForInput || budgetAmount);
      setBudgetCurrencyForInput(budgetCurrencyForInput || getValidCurrency(budgetCurrency));
    } else {
      setIsEditingBudget(false);
    }
    setIsBudgetModalOpen(opening);
  };

  const getBudgetColor = (budgetAmount, totalCost, isDarkMode) => {
    if (budgetAmount === 0) {
      return isDarkMode ? "var(--inputBg)" : "var(--bright-grey)"; // no budget
    } else if (totalCost <= budgetAmount) {
      return "var(--green)"; // within budget
    } else {
      return "var(--red)"; // over budget
    }
  };

  // Loading, items + images not included
  if (loading) {
    return <LoadingPage />;
  }

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
        <div className="previewBudgetCont" style={{ marginBottom: "20px" }}>
          <span
            className="priceSum budget"
            style={{
              backgroundColor: getBudgetColor(
                budgetAmount,
                parseFloat(formattedTotalCost),
                isDarkMode
              ),
            }}
          >
            {(() => {
              if (formattedTotalCost === "0.00" && budgetAmount === 0) {
                return <>No cost and added budget</>;
              } else if (formattedTotalCost === "0.00") {
                return (
                  <>
                    Total Cost:{" "}
                    <strong>
                      {budgetCurrency?.currencyCode} {formattedTotalCost}
                    </strong>
                    , Budget:{" "}
                    <strong>
                      {budgetCurrency?.currencyCode} {formatNumber(budgetAmount)}
                    </strong>
                  </>
                );
              } else if (budgetAmount === 0) {
                return (
                  <>
                    Total Cost:{" "}
                    <strong>
                      {budgetCurrency?.currencyCode} {formattedTotalCost}
                    </strong>
                    , No added budget
                  </>
                );
              } else {
                return (
                  <>
                    Total Cost:{" "}
                    <strong>
                      {budgetCurrency?.currencyCode} {formattedTotalCost}
                    </strong>
                    , Budget:{" "}
                    <strong>
                      {budgetCurrency?.currencyCode} {formatNumber(budgetAmount)}
                    </strong>
                  </>
                );
              }
            })()}
          </span>

          {isManagerContentManagerContributor &&
            (changeMode === "Managing Content" ||
              changeMode === "Managing" ||
              changeMode === "Contributing") && (
              <div style={{ display: "flex", gap: "5px" }}>
                {budgetAmount > 0 ? (
                  <>
                    <IconButton onClick={() => toggleBudgetModal(true, true)} sx={iconButtonStyles}>
                      <EditIconSmallGradient />
                    </IconButton>

                    {isManagerContentManager &&
                      (changeMode === "Managing Content" || changeMode === "Managing") && (
                        <IconButton
                          onClick={() => {
                            setIsRemoveBudgetModalOpen(true);
                            setMenuOpen(false);
                          }}
                          sx={iconButtonStyles}
                        >
                          <DeleteIconGradient />
                        </IconButton>
                      )}
                  </>
                ) : (
                  <IconButton onClick={() => toggleBudgetModal(true, false)} sx={iconButtonStyles}>
                    <AddIconGradient />
                  </IconButton>
                )}
                <TooltipWithClickAway
                  open={showGuide}
                  setOpen={setShowGuide}
                  tooltipClickLocked={showGuideLocked}
                  setTooltipClickLocked={setShowGuideLocked}
                  title={
                    <DescriptionTooltip description="This page is where you can see the individual budgets of the project's designs. You can also set an overall budget for the project." />
                  }
                  className="helpTooltip inBudget"
                >
                  <div style={{ display: "flex" }}>
                    <HelpOutlineIcon sx={{ color: "var(--iconDark)", transform: "scale(0.9)" }} />
                  </div>
                </TooltipWithClickAway>
              </div>
            )}
        </div>

        <div className="allBudgetsCont">
          {loadingItems ? (
            <Loading />
          ) : projectDesigns.length > 0 ? (
            projectDesigns.map((design) => (
              <div className="sectionBudget" key={design.id} style={{ flexDirection: "column" }}>
                <div className="indivBudgetHeader">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="SubtitleBudget" style={{ fontSize: "1.4rem" }}>
                      {design.designName}
                    </span>
                    {(() => {
                      const designBudget = designBudgets[design.id];
                      const designTotalCost = totalCosts[design.id] || "0.00";
                      const designBudgetAmount = designBudget?.budget?.amount || 0;
                      const designBudgetCurrency =
                        designBudget?.budget?.currency?.currencyCode || "PHP";
                      return (
                        <span
                          className="SubtitlePrice"
                          style={{
                            backgroundColor: getBudgetColor(
                              designBudgetAmount,
                              parseFloat(designTotalCost),
                              isDarkMode
                            ),
                          }}
                        >
                          {(() => {
                            if (designTotalCost === "0.00" && designBudgetAmount === 0) {
                              return <>No cost and added budget</>;
                            } else if (designTotalCost === "0.00") {
                              return (
                                <>
                                  Total Cost:{" "}
                                  <strong>
                                    {designBudgetCurrency} {designTotalCost}
                                  </strong>
                                  , Budget:{" "}
                                  <strong>
                                    {designBudgetCurrency} {formatNumber(designBudgetAmount)}
                                  </strong>
                                </>
                              );
                            } else if (designBudgetAmount === 0) {
                              return (
                                <>
                                  Total Cost:{" "}
                                  <strong>
                                    {designBudgetCurrency} {designTotalCost}
                                  </strong>
                                  , No added budget
                                </>
                              );
                            } else {
                              return (
                                <>
                                  Total Cost:{" "}
                                  <strong>
                                    {designBudgetCurrency} {designTotalCost}
                                  </strong>
                                  , Budget:{" "}
                                  <strong>
                                    {designBudgetCurrency} {formatNumber(designBudgetAmount)}
                                  </strong>
                                </>
                              );
                            }
                          })()}
                        </span>
                      );
                    })()}
                  </div>
                  <IconButton
                    onClick={() => window.open(`/budget/${design.id}`, "_blank")}
                    sx={{
                      ...iconButtonStyles,
                      height: "45px",
                      width: "45px",
                      padding: "10px 4px 10px 10px",
                      marginTop: "-6px",
                    }}
                  >
                    <ExportIcon />
                  </IconButton>
                </div>
                <div className="imageAndItems">
                  <div className="image-frame-project">
                    <img
                      src={designImages[design.id] || "/img/transparent-image.png"}
                      alt=""
                      className="image-preview"
                      style={{ marginRight: "10px" }}
                    />
                  </div>
                  <div className="itemList">
                    {designItems[design.id]?.length > 0 ? (
                      designItems[design.id].map((item, index) => (
                        <React.Fragment key={item.id}>
                          <div className="item">
                            <div className="item-frame-project">
                              <img
                                src={itemImages[item.id] || "/img/transparent-image.png"}
                                alt=""
                                style={{ width: "80px", height: "80px" }}
                              />
                            </div>
                            <div
                              style={{
                                marginLeft: "12px",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <span className="SubtitleBudget">
                                {item.quantity + " " + item.itemName}
                              </span>
                              <span
                                className="SubtitlePrice inItemList"
                                style={{ backgroundColor: "transparent" }}
                              >
                                {item.cost?.currency?.currencyCode}{" "}
                                {(
                                  parseFloat(item.cost?.amount || 0) * (item.quantity || 1)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {index < designItems[design.id].length - 1 && (
                            <div className="separator" style={{ margin: "5px 0px" }}></div>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <div className="placeholderDiv" style={{ margin: "10px 0px 20px 0px" }}>
                        <img
                          src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                          style={{ width: "100px" }}
                          alt=""
                        />
                        <p className="grey-text center">No items added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-content" style={{ height: "80vh" }}>
              <img
                src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                alt="No designs yet"
              />
              <p>No designs' budget yet.</p>
            </div>
          )}
        </div>
      </div>

      {isManagerContentManagerContributor &&
        (changeMode === "Managing Content" ||
          changeMode === "Managing" ||
          changeMode === "Contributing") && (
          <div className="circle-button-container">
            {menuOpen && (
              <div className="small-buttons">
                {projectBudget?.budget?.amount > 0 &&
                  isManagerContentManager &&
                  (changeMode === "Managing Content" || changeMode === "Managing") && (
                    <div
                      className="small-button-container budget"
                      onClick={() => {
                        setIsRemoveBudgetModalOpen(true);
                        setMenuOpen(false);
                      }}
                    >
                      <span className="small-button-text">Delete Budget</span>
                      <div className="small-circle-button">
                        <DeleteIconWhite />
                      </div>
                    </div>
                  )}
                <div
                  className="small-button-container budget"
                  onClick={() => toggleBudgetModal(true, projectBudget?.budget?.amount > 0)}
                >
                  <span className="small-button-text">
                    {projectBudget?.budget?.amount > 0 ? "Edit the budget" : "Add a Budget"}
                  </span>
                  <div className="small-circle-button">
                    {projectBudget?.budget?.amount > 0 ? <EditIconWhite /> : <AddBudget />}
                  </div>
                </div>
              </div>
            )}
            <div className={`circle-button ${menuOpen ? "rotate" : ""} add`} onClick={toggleMenu}>
              {menuOpen ? <AddIcon /> : <AddIcon />}
            </div>
          </div>
        )}

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
                    InputProps={textFieldInputProps}
                    inputProps={{ maxLength: 22 }}
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
              onClick={() => handleUpdateBudget("0", budgetCurrencyForInput)}
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
