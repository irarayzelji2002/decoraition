import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HomepageOptions from "./HomepageOptions";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import { visuallyHidden } from "@mui/utils";
import { getUsername } from "./backend/HomepageActions";
import "../../css/homepage.css";
import { projectId } from "../../../server/firebaseConfig";

function EnhancedTableHead(props) {
  const {
    headCells,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    sortOrders,
  } = props;
  const createSortHandler = (property) => (event) => {
    event.stopPropagation();
    event.preventDefault();
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map(
          (headCell) =>
            !headCell.hidden && (
              <TableCell
                key={headCell.id}
                align={headCell.align}
                padding={headCell.disablePadding ? "none" : "normal"}
                sortDirection={orderBy === headCell.id ? sortOrders[headCell.id] : false}
                sx={{
                  paddingTop: "5px",
                  paddingBottom: "5px",
                  backgroundColor: "var(--bgMain)",
                  color: "var(--color-white)",
                  borderBottom: "1px solid var(--table-stroke)",
                  textTransform: "none", // Add this line to remove all caps
                }}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={sortOrders[headCell.id]}
                  onClick={createSortHandler(headCell.id)}
                  sx={{
                    backgroundColor: "var(--bgMain)",
                    color: "var(--color-white)",
                    "&:hover": {
                      color: "var(--color-white)",
                      backgroundColor: "var(--bgMain)",
                    },
                    "&.Mui-active": {
                      color: "var(--color-white)",
                    },
                    "&.Mui-active .MuiTableSortLabel-icon": {
                      color: "var(--color-white) !important",
                    },
                  }}
                >
                  {headCell.label}
                  {orderBy === headCell.id ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc" ? "sorted descending" : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            )
        )}
        <TableCell
          sx={{
            paddingTop: "5px",
            paddingBottom: "5px",
            width: "34px",
            backgroundColor: "var(--bgMain)",
            color: "var(--color-white)",
            borderBottom: "1px solid var(--table-stroke)",
            "&:hover": {
              backgroundColor: "var(--bgMain)",
              color: "var(--color-white)",
            },
          }}
        >
          <IconButton aria-label="expand row" size="small" sx={{ visibility: "hidden" }}>
            <MoreVertIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  sortOrders: PropTypes.object.isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

function EnhancedTable({
  rows,
  headCells,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  order,
  orderBy,
  onRequestSort,
  isDesign,
  sortOrders,
  optionsState,
  setOptionsState,
}) {
  const navigate = useNavigate();

  const [selected, setSelected] = useState([]);
  //   const [page, setPage] = useState(0);
  //   const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id, isDesign, navigate) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);

    if (isDesign) {
      navigate(`/design/${id}`, {
        state: { designId: id },
      });
    } else {
      navigate(`/project/${id}`, {
        state: { projectId: id },
      });
    }
  };

  //     const handleChangePage = (event, newPage) => {
  //       setPage(newPage);
  //     };

  //   const handleChangeRowsPerPage = (event) => {
  //     setRowsPerPage(parseInt(event.target.value, 10));
  //     setPage(0);
  //   };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;
  const visibleRows = rows;

  const [clickedId, setClickedId] = useState("");

  const toggleOptions = (id) => {
    setOptionsState((prev) => {
      if (prev.selectedId === id) {
        // If the same ID is clicked, close the options menu
        return { showOptions: false, selectedId: null };
      } else {
        // Open options for the new ID
        return { showOptions: true, selectedId: id };
      }
    });
  };

  useEffect(() => {
    toggleOptions(clickedId);
  }, [clickedId]);

  const handleOptionsClick = (id, event) => {
    event.stopPropagation();
    event.preventDefault();
    setClickedId(id);
    if (clickedId === id) {
      setClickedId(null);
    }
  };

  useEffect(() => {
    console.log("showOptions:", optionsState.showOptions, "; selectedId:", optionsState.selectedId);
  }, [optionsState]);

  return (
    <Box sx={{ width: "100%", background: "var(--bgMain)" }}>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer
          sx={{
            overflowY: "visible",
            background: "var(--bgMain)",
            paddingBottom: "100px",
            height: "fit-content",
          }}
        >
          <Table sx={{ minWidth: 320, width: "100%" }} stickyHeader aria-label="sticky table">
            <EnhancedTableHead
              headCells={headCells}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={onRequestSort}
              rowCount={rows.length}
              sortOrders={sortOrders}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = selected?.includes(row.id);

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{
                      cursor: "pointer",
                      "&MuiTableRow-hover": {
                        backgroundColor: "var(--table-rows-hover) !important",
                      },
                    }}
                  >
                    {headCells.map((column) => {
                      const value = row[column.id];
                      return (
                        !column.hidden && (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            sx={{
                              paddingTop: "5px",
                              paddingBottom: "5px",
                              borderBottom: "1px solid var(--table-stroke)",
                              color: "var(--color-white)",
                              backgroundColor: "var(--table-rows)",
                              //   "&:hover": {
                              //     color: "var(--color-white)",
                              //     backgroundColor: "var(--table-rows-hover)",
                              //   },
                            }}
                            onClick={(event) => handleClick(event, row.id, isDesign, navigate)}
                          >
                            {column.format && !column.hidden ? column.format(value) : value}
                          </TableCell>
                        )
                      );
                    })}
                    <TableCell
                      sx={{
                        paddingTop: "5px",
                        paddingBottom: "5px",
                        width: "34px",
                        borderBottom: "1px solid var(--table-stroke)",
                        color: "var(--color-white)",
                        backgroundColor: "var(--table-rows)",
                        "&:hover": {
                          color: "var(--color-white)",
                          backgroundColor: "var(--table-rows-hover)",
                        },
                      }}
                    >
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={(event) => handleOptionsClick(row.id, event)}
                        sx={{ color: "var(--color-white)" }}
                      >
                        <MoreVertIcon />
                      </IconButton>

                      {optionsState.showOptions && optionsState.selectedId === row.id && (
                        <div style={{ position: "relative" }}>
                          <HomepageOptions
                            isDesign={isDesign}
                            isTable={true}
                            id={row.id}
                            onOpen={(event) => handleClick(event, row.id, isDesign, navigate)}
                            optionsState={optionsState}
                            setOptionsState={setOptionsState}
                            object={row}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box /> {/* Add extra space beneath the table */}
        {/* <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        /> */}
      </Paper>
    </Box>
  );
}

export default function HomepageTable({
  isDesign = true,
  data = [],
  isHomepage = true,
  page = 1,
  handleChangePage = () => {},
  handleChangeRowsPerPage = () => {},
  numToShowMore = 0,
  handleOpenMenu = () => {},
  optionsState = {},
  setOptionsState = () => {},
}) {
  const columns = [
    {
      id: isDesign ? "designName" : "projectName",
      numeric: false,
      disablePadding: false,
      label: "Name",
      minWidth: 170,
      align: "left",
      hidden: false,
    },
    {
      id: isDesign ? "owner" : "managers",
      numeric: false,
      disablePadding: false,
      label: isDesign ? "Owner" : "Managers",
      minWidth: 170,
      align: "left",
      hidden: false,
      format: (value) => (Array.isArray(value) ? value.join(", ") : value),
    },
    {
      id: "formattedCreatedAt",
      label: "Created",
      minWidth: 170,
      align: "left",
      format: (value) => value,
      sortKey: "createdAtTimestamp", // Used for sorting
      hidden: false,
    },
    {
      id: "formattedModifiedAt",
      label: "Modified",
      minWidth: 170,
      align: "left",
      format: (value) => value,
      sortKey: "modifiedAtTimestamp", // Used for sorting
      hidden: false,
    },
    // Hidden columns for sorting
    {
      id: "createdAtTimestamp",
      hidden: true,
      align: "left",
    },
    {
      id: "modifiedAtTimestamp",
      hidden: true,
    },
  ];

  //   const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("formattedModifiedAt");
  const [sortOrders, setSortOrders] = useState({
    designName: "asc",
    projectName: "asc",
    owner: "asc",
    managers: "asc",
    formattedCreatedAt: "desc",
    formattedModifiedAt: "desc",
    createdAtTimestamp: "desc",
    modifiedAtTimestamp: "desc",
  });

  const handleRequestSort = (event, property) => {
    // const isAsc = orderBy === property && order === "asc";
    // setOrder(isAsc ? "desc" : "asc");
    // setOrderBy(property);

    setOrderBy(property); // Set the clicked column as active
    setSortOrders((prevSortOrders) => {
      const currentOrder = prevSortOrders[property];
      // If the column is already active, reverse the order
      const newOrder =
        orderBy === property ? (currentOrder === "asc" ? "desc" : "asc") : currentOrder;
      return {
        ...prevSortOrders,
        [property]: newOrder, // Update the sort direction for the clicked column
      };
    });
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const ascendingComparator = (a, b, orderBy) => {
    if (a[orderBy] < b[orderBy]) {
      return -1;
    }
    if (a[orderBy] > b[orderBy]) {
      return 1;
    }
    return 0;
  };

  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const sortedRows = useMemo(() => {
    console.log("sortOrders", sortOrders);
    console.log("orderBy", orderBy);

    return stableSort(data, (a, b) => {
      const column = columns.find((col) => col.id === orderBy || col.sortKey === orderBy);
      const key = column?.sortKey || orderBy;

      // Use sortOrders to determine the current sort direction
      const currentOrder = sortOrders[orderBy];

      if (currentOrder === "desc") {
        return descendingComparator(a, b, key);
      } else {
        return ascendingComparator(a, b, key);
      }
    });
  }, [data, sortOrders, orderBy]); // Update dependencies to include sortOrders

  return (
    <EnhancedTable
      rows={sortedRows}
      headCells={columns}
      page={page - 1}
      rowsPerPage={isHomepage ? 10 + numToShowMore : 25}
      // 10 + numToShowMore so that it will render in one page, and not apply pagination
      handleChangePage={handleChangePage}
      handleChangeRowsPerPage={handleChangeRowsPerPage}
      // order={order}
      orderBy={orderBy}
      onRequestSort={handleRequestSort}
      handleOpenMenu={handleOpenMenu}
      isDesign={isDesign}
      sortOrders={sortOrders}
      optionsState={optionsState}
      setOptionsState={setOptionsState}
    />
  );
}
