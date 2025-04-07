import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { loaderHOC } from './loaderHOC'

type LoaderProps = {
  size?: 'small' | 'large';
  color?: string;
  theme?: unknown;
}

const Loader: React.FC<LoaderProps> = ({ size = 'large', color, theme }) => {
  const loaderColor = color ?? theme.colors.primary

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={loaderColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default loaderHOC(Loader)
