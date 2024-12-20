import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import Loader from './loaders/loader'
import { Theme } from '../setup/theme'

interface StateAwareContainerProps {
  loading: boolean;
  errorMessage: string | null;
  data: unknown;
  loadingComponent?: React.ReactElement;
  errorComponent?: (message: string) => React.ReactElement;
  emptyComponent?: React.ReactElement;
  ViewComponent: () => React.ReactNode;
}

const StateAwareContainer: React.FC<StateAwareContainerProps> = ({
  loading,
  errorMessage,
  data,
  loadingComponent,
  errorComponent,
  emptyComponent,
  ViewComponent
}) => {
  const styles = createStyles(useTheme())

  if (loading) {
    return loadingComponent ?? <Loader />
  }

  if (errorMessage !== null) {
    return (
      errorComponent !== undefined
        ? errorComponent(errorMessage)
        : <Text style={[styles.messageText, styles.errorMessage]}>{errorMessage}</Text>
    )
  }

  const isEmpty = (data: any): boolean => {
    if (data === null || data === undefined) return true
    if (typeof data === 'string') return data.trim() === ''
    if (Array.isArray(data)) return false
    if (typeof data === 'object') return Object.keys(data).length === 0
    return false
  }

  if (isEmpty(data)) {
    return emptyComponent ?? <Text style={styles.messageText}>No items found.</Text>
  }

  return <ViewComponent />
}

const createStyles = (theme: Theme) => StyleSheet.create({
  messageText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: theme.colors.textSecondary
  },
  errorMessage: {
    color: theme.colors.primary
  }
})

export default StateAwareContainer
