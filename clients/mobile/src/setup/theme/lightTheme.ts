import type { Theme } from './index'
import { spacing, radius, lightElevation } from './tokens'
const lightTheme: Theme = {
  colors: {
    // Brand
    primary: '#FF4D4D',
    bloodRed: '#E32323',
    secondary: '#2ecc71',
    onPrimary: '#ffffff',
    // Accents
    goldenYellow: '#FFD64D',
    goldenSun: '#FFCC00',
    peachCream: '#FFF4D9',
    darkAmber: '#FF8C00',
    redFaded: '#FFA6A6',
    gradientBackground: '#fbeee6',
    // Surfaces
    background: '#F5F5F5',
    surface: '#ffffff',
    surfaceVariant: '#F0F0F0',
    // Text
    textPrimary: '#090A0A',
    textSecondary: '#616161',
    textTertiary: '#949494',
    // Lines & overlays
    border: '#E6E6E6',
    borderStrong: '#CCCCCC',
    backdrop: '#21212180',
    shadow: '#000000'
  },
  typography: {
    fontSize: 16,
    errorFontSize: 12,
    fontFamily: 'Roboto_400Regular'
  },
  spacing,
  radius,
  elevation: lightElevation
}

export default lightTheme
