import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import Loader from './loaders/loader'
import { Theme } from '../setup/theme'

interface StateAwareRendererProps {
  loading?: boolean;
  errorMessage: string | null;
  showEmptyMessageForEmptyArray?: boolean;
  data: unknown;
  LoadingComponent?: React.ReactElement;
  ErrorComponent?: React.ReactElement;
  EmptyComponent?: React.ReactElement;
  ViewComponent: () => React.ReactNode;
}

const StateAwareRenderer: React.FC<StateAwareRendererProps> = ({
  loading,
  errorMessage,
  data,
  LoadingComponent,
  ErrorComponent,
  EmptyComponent,
  ViewComponent,
  showEmptyMessageForEmptyArray = false
}) => {
  const styles = createStyles(useTheme())

  if (loading !== undefined && loading) {
    return LoadingComponent ?? <Loader />
  }

  if (errorMessage !== null || ErrorComponent !== undefined) {
    return ErrorComponent ?? <Text style={[styles.messageText, styles.errorMessage]}>{errorMessage}</Text>
  }

  const isEmpty = (data: unknown): boolean => {
    if (data === null || data === undefined) return true
    if (typeof data === 'string') return data.trim() === ''
    if (Array.isArray(data)) return data.length === 0
    if (typeof data === 'object') return Object.keys(data).length === 0
    return false
  }

  if (isEmpty(data) && (showEmptyMessageForEmptyArray || !Array.isArray(data))) {
    return EmptyComponent ?? <Text style={styles.messageText}>No items found.</Text>
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

export default StateAwareRenderer
