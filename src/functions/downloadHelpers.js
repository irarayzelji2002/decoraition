import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx-js-style";
import JSZip from "jszip";
import { showToast, capitalizeFirstLowerRest } from "./utils";

// Main download handler
export const handleDownload = async (object, category, versionId, fileType, sharedProps) => {
  try {
    if ("designName" in object) {
      // Handle design downloads
      await handleDesignDownload(object, category, versionId, fileType, sharedProps);
      return {
        success: true,
        message: `${category} downloaded successfully`,
      };
    } else if ("projectName" in object) {
      // Handle project downloads
      await handleProjectDownload(object, category, fileType, sharedProps);
      return {
        success: true,
        message: `${capitalizeFirstLowerRest(category)} downloaded successfully`,
      };
    } else {
      throw new Error("Invalid object type");
    }
  } catch (error) {
    console.error("Download error:", error);
    showToast("error", `Failed to download ${category.toLowerCase()}`);
    return {
      success: false,
      message: `Failed to download ${category.toLowerCase()}`,
    };
  }
};

// Design handlers
const handleDesignDownload = async (design, category, versionId, fileType, sharedProps) => {
  const { userDesignVersions, userBudgets, userItems } = sharedProps;

  if (category === "Design") {
    const version = userDesignVersions.find((v) => v.id === versionId);
    if (!version) throw new Error("Design version not found");

    if (["PNG", "JPG"].includes(fileType)) {
      await handleImageDownload(version, fileType);
    } else if (fileType === "PDF") {
      await handleDesignPDF(design, version);
    }
  } else if (category === "Budget") {
    const budget = userBudgets.find((b) => b.designId === design.id);
    const budgetItems = userItems.filter((item) => budget.items.includes(item.id));

    if (["XLSX", "CSV"].includes(fileType)) {
      await handleBudgetSpreadsheet(design, budget, budgetItems, fileType);
    } else if (fileType === "PDF") {
      await handleBudgetPDF(design, budget, budgetItems);
    }
  }
};

// Image download handler (PNG/JPG)
const handleImageDownload = async (version, fileType) => {
  const zip = new JSZip();

  await Promise.all(
    version.images.map(async (img, index) => {
      const response = await fetch(img.link);
      const blob = await response.blob();

      if (fileType === "JPG" && blob.type === "image/png") {
        // Convert PNG to JPG
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const image = new Image();

        await new Promise((resolve) => {
          image.onload = resolve;
          image.src = URL.createObjectURL(blob);
        });

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const jpgBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
        zip.file(`image_${index + 1}.jpg`, jpgBlob);
      } else {
        zip.file(`image_${index + 1}.${fileType.toLowerCase()}`, blob);
      }
    })
  );

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, `images.zip`);
};

// Design PDF handler
const handleDesignPDF = async (design, version) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  // Add header
  doc.setFontSize(16);
  doc.text("DESIGN", 20, 20);
  doc.text(design.designName, 20, 30);

  let yOffset = 50;
  for (const img of version.images) {
    const imgData = await getImageDataUrl(img.link);
    const imgProps = doc.getImageProperties(imgData);
    const pageWidth = doc.internal.pageSize.getWidth() - 40;
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

    if (yOffset + imgHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yOffset = 20;
    }

    doc.addImage(imgData, "JPEG", 20, yOffset, pageWidth, imgHeight);
    yOffset += imgHeight + 10;
    await addPDFPages(doc, design.designName, 0);
  }

  downloadBlob(doc.output("blob"), `${design.designName}.pdf`);
};

// Budget handlers
const handleBudgetSpreadsheet = (design, budget, items, fileType) => {
  const data = [
    ["DESIGN", design.designName],
    ["BUDGET", `${budget.budget.currency} ${budget.budget.amount}`],
    [],
    ["ITEMS"],
    ["Image", "Item Name", "Description", "", "Cost", "Quantity"],
  ];

  const totalCost = items.reduce((sum, item) => sum + item.cost.amount * item.quantity, 0);

  items.forEach((item) => {
    data.push([
      item.image,
      item.itemName,
      item.description,
      item.cost.currency,
      item.cost.amount,
      item.quantity,
    ]);
  });

  data.push(["", "", "", "Total Cost", budget.budget.currency, totalCost]);

  if (fileType === "XLSX") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Add styles
    ws["A1"].s = { font: { bold: true } };
    ws["A4"].s = { font: { bold: true } };

    XLSX.utils.book_append_sheet(wb, ws, "Budget");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([buffer]), `${design.designName}_budget.xlsx`);
  } else {
    const csv = data.map((row) => row.join(",")).join("\n");
    downloadBlob(new Blob([csv]), `${design.designName}_budget.csv`);
  }
};

const handleBudgetPDF = (design, budget, items) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  doc.setFontSize(16);
  doc.text("DESIGN", 20, 20);
  doc.text(design.designName, 20, 30);
  doc.text(`BUDGET: ${budget.budget.currency} ${budget.budget.amount}`, 20, 40);

  const tableData = items.map((item) => [
    item.image,
    item.itemName,
    item.description,
    item.cost.currency,
    item.cost.amount.toString(),
    item.quantity.toString(),
  ]);

  const totalCost = items.reduce((sum, item) => sum + item.cost.amount * item.quantity, 0);

  tableData.push(["", "", "", "Total Cost", budget.budget.currency, totalCost.toString()]);

  doc.autoTable({
    startY: 50,
    head: [["Image", "Item Name", "Description", "", "Cost", "Quantity"]],
    body: tableData,
    theme: "grid",
  });

  addPDFPages(doc, design.designName, 0);

  downloadBlob(doc.output("blob"), `${design.designName}_budget.pdf`);
};

// Project handlers
const handleProjectDownload = async (project, category, fileType, sharedProps) => {
  const {
    userDesigns,
    userDesignVersions,
    userProjectBudgets,
    userBudgets,
    userItems,
    userPlanMaps,
    userPins,
    userTimelines,
    userEvents,
  } = sharedProps;

  if (category === "Designs") {
    await handleProjectDesignsPDF(project, userDesigns, userDesignVersions);
  } else if (category === "Plan Map") {
    await handlePlanMapPDF(project, userPlanMaps, userPins);
  } else if (category === "Budget") {
    await handleProjectBudget(
      project,
      userProjectBudgets,
      userBudgets,
      userItems,
      fileType,
      userDesigns
    );
  } else if (category === "Timeline") {
    await handleTimeline(project, userTimelines, userEvents, fileType);
  }
};

// Project specific handlers
const handleProjectDesignsPDF = async (project, designs, designVersions) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  doc.setFontSize(16);
  doc.text("PROJECT", 20, 20);
  doc.text(project.projectName, 20, 30);

  let yOffset = 50;

  for (const designRef of project.designs) {
    const design = designs.find((d) => d.id === designRef.designId);
    if (!design) continue;

    const version = designVersions.find((v) => v.id === design.history[0]);
    if (!version) continue;

    doc.setFontSize(14);
    doc.text(design.designName, 20, yOffset);
    yOffset += 20;

    for (const img of version.images) {
      const imgData = await getImageDataUrl(img.link);
      const imgProps = doc.getImageProperties(imgData);
      const pageWidth = doc.internal.pageSize.getWidth() - 40;
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      if (yOffset + imgHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yOffset = 20;
      }

      doc.addImage(imgData, "JPEG", 20, yOffset, pageWidth, imgHeight);
      yOffset += imgHeight + 10;
    }

    await addPDFPages(doc, project.projectName, 0);
  }

  downloadBlob(doc.output("blob"), `${project.projectName}_designs.pdf`);
};

const handlePlanMapPDF = async (project, planMaps, pins) => {
  const planMap = planMaps.find((p) => p.id === project.planMapId);
  if (!planMap) throw new Error("Plan map not found");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  doc.setFontSize(16);
  doc.text("PROJECT", 20, 20);
  doc.text(project.projectName, 20, 30);

  const imgData = await getImageDataUrl(planMap.link);
  const imgProps = doc.getImageProperties(imgData);
  const pageWidth = doc.internal.pageSize.getWidth() - 40;
  const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

  doc.addImage(imgData, "JPEG", 20, 50, pageWidth, imgHeight);

  // Add pins
  doc.setFillColor(255, 0, 0);
  planMap.pins.forEach((pinId) => {
    const pin = pins.find((p) => p.id === pinId);
    if (pin) {
      const x = 20 + (pageWidth * pin.location.x) / 100;
      const y = 50 + (imgHeight * pin.location.y) / 100;
      doc.circle(x, y, 2, "F");
    }
  });

  await addPDFPages(doc, project.projectName, 0);
  downloadBlob(doc.output("blob"), `${project.projectName}_plan_map.pdf`);
};

// Helper functions
const getImageDataUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handleProjectBudget = async (project, projectBudgets, budgets, items, fileType, designs) => {
  const projectBudget = projectBudgets.find((pb) => pb.id === project.projectBudgetId);
  if (!projectBudget) throw new Error("Project budget not found");

  const allBudgets = projectBudget.budgets
    .map((budgetId) => budgets.find((b) => b.id === budgetId))
    .filter(Boolean);

  const totalCost = allBudgets.reduce((sum, budget) => {
    const budgetItems = items.filter((item) => budget.items.includes(item.id));
    const budgetTotal = budgetItems.reduce(
      (bSum, item) => bSum + item.cost.amount * item.quantity,
      0
    );
    return sum + budgetTotal;
  }, 0);

  if (["XLSX", "CSV"].includes(fileType)) {
    const data = [
      ["PROJECT", project.projectName],
      ["TOTAL BUDGET", `${projectBudget.budget.currency} ${projectBudget.budget.amount}`],
      ["TOTAL COST", `${projectBudget.budget.currency} ${totalCost}`],
      [],
      [],
    ];

    for (const budget of allBudgets) {
      const design = designs.find((d) => d.id === budget.designId);
      const budgetItems = items.filter((item) => budget.items.includes(item.id));
      const budgetTotal = budgetItems.reduce(
        (sum, item) => sum + item.cost.amount * item.quantity,
        0
      );

      data.push(
        ["DESIGN", design.designName],
        ["BUDGET", `${budget.budget.currency} ${budget.budget.amount}`],
        [],
        ["ITEMS"],
        ["Image", "Item Name", "Description", "", "Cost", "Quantity"]
      );

      budgetItems.forEach((item) => {
        data.push([
          item.image,
          item.itemName,
          item.description,
          item.cost.currency,
          item.cost.amount,
          item.quantity,
        ]);
      });

      data.push(["", "", "", "Total Cost", budget.budget.currency, budgetTotal], [], []);
    }

    if (fileType === "XLSX") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Add styles
      ws["A1"].s = { font: { bold: true } };
      ws["A2"].s = { font: { bold: true } };
      ws["A3"].s = { font: { bold: true } };

      XLSX.utils.book_append_sheet(wb, ws, "Project Budget");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      downloadBlob(new Blob([buffer]), `${project.projectName}_budget.xlsx`);
    } else {
      const csv = data.map((row) => row.join(",")).join("\n");
      downloadBlob(new Blob([csv]), `${project.projectName}_budget.csv`);
    }
  } else if (fileType === "PDF") {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    doc.setFontSize(16);
    doc.text("PROJECT", 20, 20);
    doc.text(project.projectName, 20, 30);
    doc.text(
      `TOTAL BUDGET: ${projectBudget.budget.currency} ${projectBudget.budget.amount}`,
      20,
      40
    );
    doc.text(`TOTAL COST: ${projectBudget.budget.currency} ${totalCost}`, 20, 50);

    let yOffset = 80;

    for (const budget of allBudgets) {
      const design = designs.find((d) => d.id === budget.designId);
      const budgetItems = items.filter((item) => budget.items.includes(item.id));
      const budgetTotal = budgetItems.reduce(
        (sum, item) => sum + item.cost.amount * item.quantity,
        0
      );

      if (yOffset > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(14);
      doc.text(`DESIGN: ${design.designName}`, 20, yOffset);
      doc.text(`BUDGET: ${budget.budget.currency} ${budget.budget.amount}`, 20, yOffset + 10);

      const tableData = budgetItems.map((item) => [
        item.image,
        item.itemName,
        item.description,
        item.cost.currency,
        item.cost.amount.toString(),
        item.quantity.toString(),
      ]);

      tableData.push(["", "", "", "Total Cost", budget.budget.currency, budgetTotal.toString()]);

      doc.autoTable({
        startY: yOffset + 20,
        head: [["Image", "Item Name", "Description", "", "Cost", "Quantity"]],
        body: tableData,
        theme: "grid",
      });

      yOffset = doc.lastAutoTable.finalY + 40;
      await addPDFPages(doc, project.projectName, 0);
    }

    downloadBlob(doc.output("blob"), `${project.projectName}_budget.pdf`);
  }
};

const handleTimeline = async (project, timelines, events, fileType) => {
  const timeline = timelines.find((t) => t.id === project.timelineId);
  if (!timeline) throw new Error("Timeline not found");

  const timelineEvents = timeline.events
    .map((eventId) => events.find((e) => e.id === eventId))
    .filter(Boolean)
    .sort((a, b) => a.dateRange.start - b.dateRange.start);

  const data = [
    ["PROJECT", project.projectName],
    [],
    ["EVENTS"],
    ["Event Name", "Start Date", "End Date", "Repeating", "Repeat Every", "Description"],
  ];

  timelineEvents.forEach((event) => {
    const repeatEveryMap = {
      0: "",
      1: "Day",
      2: "Week",
      3: "Month",
      4: "Year",
    };

    data.push([
      event.eventName,
      formatDate(event.dateRange.start),
      formatDate(event.dateRange.end),
      event.repeating ? "Yes" : "No",
      repeatEveryMap[event.repeatEvery],
      event.description || "",
    ]);
  });

  if (["XLSX", "CSV"].includes(fileType)) {
    if (fileType === "XLSX") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Add styles
      ws["A1"].s = { font: { bold: true } };
      ws["A3"].s = { font: { bold: true } };
      ws["A4"].s = { font: { bold: true } };

      XLSX.utils.book_append_sheet(wb, ws, "Timeline");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      downloadBlob(new Blob([buffer]), `${project.projectName}_timeline.xlsx`);
    } else {
      const csv = data.map((row) => row.join(",")).join("\n");
      downloadBlob(new Blob([csv]), `${project.projectName}_timeline.csv`);
    }
  } else if (fileType === "PDF") {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    doc.setFontSize(16);
    doc.text("PROJECT", 20, 20);
    doc.text(project.projectName, 20, 30);

    doc.autoTable({
      startY: 50,
      head: [["Event Name", "Start Date", "End Date", "Repeating", "Repeat Every", "Description"]],
      body: timelineEvents.map((event) => [
        event.eventName,
        formatDate(event.dateRange.start),
        formatDate(event.dateRange.end),
        event.repeating ? "Yes" : "No",
        {
          0: "",
          1: "Day",
          2: "Week",
          3: "Month",
          4: "Year",
        }[event.repeatEvery],
        event.description || "",
      ]),
      theme: "grid",
    });

    await addPDFPages(doc, project.projectName, 0);
    downloadBlob(doc.output("blob"), `${project.projectName}_timeline.pdf`);
  }
};

const addPDFPages = async (doc, docTitle, yPos = 0) => {
  for (let pageNumber = 1; pageNumber <= doc.internal.getNumberOfPages(); pageNumber++) {
    doc.setPage(pageNumber);
    let pdfPageNum = pageNumber - 1;
    let pdfPageNumString = pdfPageNum.toString();

    doc.setFontSize(8);
    doc.setTextColor(127, 127, 127); //#7f7f7f (grey)
    if (pageNumber > 1) {
      doc.text(`${docTitle}`, 15, doc.internal.pageSize.getHeight() - 10, { align: "left" });
      doc.text(
        pdfPageNumString,
        doc.internal.pageSize.getWidth() - 15,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    }
  }
};
