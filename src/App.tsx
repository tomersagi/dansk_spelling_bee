import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Game } from './components/Game';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ffd700', // Gold color for the center letter
    },
    secondary: {
      main: '#ffffff', // White for outer letters
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5', // Light gray background for buttons
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Game />
    </ThemeProvider>
  );
}

export default App; 