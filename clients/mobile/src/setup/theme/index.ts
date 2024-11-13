import lightTheme from './lightTheme'
import darkTheme from './darkTheme'

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    white: string;
    textPrimary: string;
    textSecondary: string;
    grey: string;
    extraLightGray: string;
    lightGrey: string;
    darkGrey: string;
    charcoalGray: string;
    black: string;
    greyBG: string;
    redFaded: string;
  };
  typography: {
    fontSize: number;
    errorFontSize: number;
    fontFamily: string;
  };
}

export { lightTheme, darkTheme, type Theme }
