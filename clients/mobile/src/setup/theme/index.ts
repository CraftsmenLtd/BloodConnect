import lightTheme from './lightTheme'
import darkTheme from './darkTheme'

type Theme = {
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
    blackFaded: string;
    greyBG: string;
    redFaded: string;
    goldenYellow: string;
    goldenSun: string;
    peachCream: string;
    darkAmber: string;
    gradientBackground: string;
    bloodRed: string;
  };
  typography: {
    fontSize: number;
    errorFontSize: number;
    fontFamily: string;
  };
}

export { lightTheme, darkTheme, type Theme }
