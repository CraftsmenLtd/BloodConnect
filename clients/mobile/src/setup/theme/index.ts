import lightTheme from './lightTheme'
import darkTheme from './darkTheme'
import type { spacing, radius, Elevation } from './tokens'

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
    // States
    focus: string;
  };
  typography: {
    fontSize: number;
    errorFontSize: number;
    fontFamily: string;
  };
  spacing: typeof spacing;
  radius: typeof radius;
  elevation: Elevation;
}

export { lightTheme, darkTheme, type Theme, type ThemeMode }
