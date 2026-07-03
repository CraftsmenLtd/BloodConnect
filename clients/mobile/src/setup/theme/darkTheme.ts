import type { Theme } from './index'
const darkTheme: Theme = {
  colors: {
    // Brand
    primary: '#FF4D4D',
    bloodRed: '#FF5A5A',
    secondary: '#2ecc71',
    onPrimary: '#ffffff',
    // Accents
    goldenYellow: '#FFD64D',
    goldenSun: '#FFB300',
    peachCream: '#3A2C2C',
    darkAmber: '#FF6A00',
    redFaded: '#B25050',
    gradientBackground: '#2A2320',
    // Surfaces
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    // Text
    textPrimary: '#F5F5F5',
    textSecondary: '#B0B0B0',
    textTertiary: '#9A9A9A',
    // Lines & overlays
    border: '#3A3A3A',
    borderStrong: '#4A4A4A',
    backdrop: '#000000B3',
    shadow: '#000000'
  },
  typography: {
    fontSize: 16,
    errorFontSize: 12,
    fontFamily: 'Roboto_400Regular'
  }
}

export default darkTheme
