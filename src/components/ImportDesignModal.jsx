import React from "react";
import { Modal, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";

const ImportDesignModal = ({
  open,
  onClose,
  userDesignsWithoutProject,
  selectedDesignId,
  setSelectedDesignId,
  handleConfirmImport,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="modalContent" style={{ padding: "20px", textAlign: "center" }}>
        <h2>Import a Design</h2>
        <FormControl fullWidth style={{ marginBottom: "20px" }}>
          <InputLabel id="select-design-label">Select Design</InputLabel>
          <Select
            labelId="select-design-label"
            value={selectedDesignId}
            onChange={(e) => setSelectedDesignId(e.target.value)}
          >
            {userDesignsWithoutProject.map((design) => (
              <MenuItem key={design.id} value={design.id}>
                {design.designName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirmImport}
          disabled={!selectedDesignId}
          style={{ marginRight: "10px" }}
        >
          Confirm
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default ImportDesignModal;
