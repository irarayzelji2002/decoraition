import { createTheme } from "@mui/material/styles";

const defaultTheme = createTheme({
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
  components: {
    // Dialog and Modal Components
    MuiDialog: {
      styleOverrides: {
        paper: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    // App Bar and Toolbar Components
    MuiAppBar: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    // Drawer Components
    MuiDrawer: {
      styleOverrides: {
        paper: { fontFamily: '"Inter", sans-serif' },
      },
    },
    // Typography
    MuiTypography: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    // Buttons
    MuiButton: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    // Menus and Lists
    MuiSelect: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { fontFamily: '"Inter", sans-serif', backgroundColor: "var(--nav-card-modal)" },
      },
    },
    MuiList: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    // Avatar
    MuiAvatar: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif', fontWeight: "bold" },
      },
    },
    // Form-related components
    MuiFormHelperText: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    // Other potentially text-containing components
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiBadge: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif' },
      },
    },
  },
});

export default defaultTheme;
