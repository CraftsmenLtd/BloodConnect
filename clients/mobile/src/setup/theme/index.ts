import lightTheme from './lightTheme'
import darkTheme from './darkTheme'

type ThemeMode = 'system' | 'light' | 'dark'

type Theme = {
  colors: {
    // Brand
    primary: string;
    bloodRed: string;
    secondary: string;
    onPrimary: string;
    // Accents
    goldenYellow: string;
    goldenSun: string;
    peachCream: string;
    darkAmber: string;
    redFaded: string;
    gradientBackground: string;
    // Surfaces
    background: string;
    surface: string;
    surfaceVariant: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    // Lines & overlays
    border: string;
    borderStrong: string;
    backdrop: string;
    shadow: string;
  };
  typography: {
    fontSize: number;
    errorFontSize: number;
    fontFamily: string;
  };
}

export { lightTheme, darkTheme, type Theme, type ThemeMode }
