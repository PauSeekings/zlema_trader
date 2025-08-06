import { createTheme } from '@mui/material/styles';

// Color palette
export const colors = {
  primary: '#888888',
  secondary: '#666666',
  background: {
    default: '#0a0a0a',
    paper: '#1a1a1a',
  },
  text: {
    primary: '#888888',
    secondary: '#666666',
  },
  success: '#4caf50',
  error: '#f44336',
  warning: '#ffff00',
  info: '#00ffff',
  accent: '#ff00ff',
};

// Typography configuration
export const typography = {
  fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  h6: {
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  body1: {
    fontSize: '0.75rem',
  },
  body2: {
    fontSize: '0.7rem',
  },
};

// Common component styles
export const componentStyles = {
  paper: {
    padding: '4px',
  },
  button: {
    fontSize: '0.7rem',
    padding: '2px 6px',
    minHeight: '24px',
    color: 'white',
  },
  select: {
    fontSize: '0.7rem',
    padding: '2px 6px !important',
    minHeight: '20px !important',
    lineHeight: '1.2 !important',
    display: 'flex !important',
    alignItems: 'center !important',
  },
  menuItem: {
    fontSize: '0.7rem',
    padding: '1px 6px !important',
    minHeight: '20px !important',
    lineHeight: '1.2 !important',
    display: 'flex !important',
    alignItems: 'center !important',
  },
  toolbar: {
    minHeight: '32px !important',
    padding: '2px 4px !important',
  },
  toggleButton: {
    fontSize: '0.65rem',
    padding: '1px 4px !important',
    minHeight: '20px !important',
  },
};

// Create the theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
    },
    secondary: {
      main: colors.secondary,
    },
    background: colors.background,
    text: colors.text,
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
  },
  typography,
  components: {
    MuiPaper: {
      styleOverrides: {
        root: componentStyles.paper,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: componentStyles.button,
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
        select: componentStyles.select,
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: componentStyles.menuItem,
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
        h6: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: componentStyles.toolbar,
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: componentStyles.toggleButton,
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
        },
        input: {
          padding: '2px 6px !important',
          display: 'flex !important',
          alignItems: 'center !important',
        },
      },
    },
  },
});

// Common sx styles for reuse
export const commonStyles = {
  // Layout
  fullHeight: { height: '100vh' },
  flexColumn: { display: 'flex', flexDirection: 'column' },
  flexCenter: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  
  // Spacing
  compactPadding: { p: 0.5 },
  tightSpacing: { gap: 0.25 },
  normalSpacing: { gap: 1 },
  
  // Colors
  successText: { color: colors.success },
  errorText: { color: colors.error },
  primaryText: { color: colors.primary },
  
  // Buttons
  buyButton: {
    backgroundColor: colors.success,
    minHeight: '20px',
    flex: 1,
    color: 'white',
    '&:hover': {
      backgroundColor: '#45a049',
    },
  },
  sellButton: {
    backgroundColor: colors.error,
    minHeight: '20px',
    flex: 1,
    color: 'white',
    '&:hover': {
      backgroundColor: '#d32f2f',
    },
  },
  
  // Chart colors
  chartColors: {
    support: '#00ff00',
    resistance: '#ff0000',
    volume: colors.warning,
    fibonacci: colors.info,
    pivots: colors.accent,
  },
};

export default darkTheme;